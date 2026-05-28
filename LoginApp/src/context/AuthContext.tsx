import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthResponse, AuthState } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: (message?: string) => void;
  checkTokenExpiry: () => boolean;
  tempPassword: string | null;
  changeTempPassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check if token has expired using VITE_TOKEN_EXPIRY_MINUTES configuration
  const checkTokenExpiry = (): boolean => {
    const timestampStr = localStorage.getItem('auth_timestamp');
    const token = localStorage.getItem('auth_token');

    if (!token || !timestampStr) return false;

    const timestamp = Number(timestampStr);
    const diff = Date.now() - timestamp;
    const expiryLimit = Number(import.meta.env.VITE_TOKEN_EXPIRY_MINUTES || 60) * 60 * 1000;

    if (diff >= expiryLimit) {
      return true; // Token has expired
    }
    return false;
  };

  // Perform initial session restoration from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userJson = localStorage.getItem('auth_user');

        if (token && userJson) {
          const isExpired = checkTokenExpiry();
          if (isExpired) {
            // Expiry occurred, do a silent logout
            logoutClean();
          } else {
            const user = JSON.parse(userJson) as User;
            setState({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          }
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch {
        logoutClean();
      }
    };

    initializeAuth();

    // Listen to Axios central interceptor for 401 Unauthorized
    const handleUnauthorized = () => {
      logout("Su sesión ha expirado. Por favor, inicie sesión nuevamente.");
    };

    // Listen to Axios silent refresh events to update internal state
    const handleTokenRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const newToken = customEvent.detail;
      setState((prev) => ({
        ...prev,
        token: newToken,
      }));
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:token:refreshed', handleTokenRefreshed);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:token:refreshed', handleTokenRefreshed);
    };
  }, []);

  const logoutClean = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_timestamp');
    setTempPassword(null); // Clear transient memory
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const logout = (message?: string) => {
    logoutClean();
    if (message) {
      // Dispatches event for pages to trigger toast alerts
      window.dispatchEvent(new CustomEvent('auth:toast:error', { detail: message }));
    } else {
      window.dispatchEvent(new CustomEvent('auth:toast:success', { detail: "Sesión cerrada correctamente." }));
    }
  };

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await authService.login(email, password);
      
      const user: User = {
        email: data.email,
        name: data.name,
        lastName: data.lastName,
        passwordConfirmed: data.passwordConfirmed !== false,
      };

      if (data.passwordConfirmed === false) {
        setTempPassword(password); // transiently capture currentPassword in-memory
      }

      // Save token, user and timestamp in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_refresh_token', data.refreshToken);
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_timestamp', Date.now().toString());

      setState({
        user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return data;
    } catch (err: any) {
      let errMsg = "Credenciales incorrectas o problema de conexión.";
      
      if (err.response && err.response.data) {
        const data = err.response.data;
        
        // 1. Extract validation errors array returned by ASP.NET Core ValidationProblemDetails
        if (data.errors && typeof data.errors === 'object') {
          const validationErrors = data.errors as Record<string, string[]>;
          const messages = Object.keys(validationErrors).map((key) => {
            const fieldErrors = validationErrors[key];
            return `${key}: ${fieldErrors.join(', ')}`;
          });
          errMsg = messages.join('\n');
        } 
        // 2. Extract standard RFC 7807 / RFC 9110 Problem Details 'detail' or 'title'
        else if (data.detail) {
          errMsg = data.detail;
        } else if (data.title) {
          errMsg = data.title;
        }
        // 3. Extract direct message property
        else if (data.message) {
          errMsg = data.message;
        }
      } 
      
      if (errMsg === "Credenciales incorrectas o problema de conexión." && err.response && err.response.status === 400) {
        errMsg = "Credenciales de inicio de sesión erróneas o cuenta inexistente.";
      }

      setState((prev) => ({ ...prev, isLoading: false, error: errMsg }));
      throw new Error(errMsg);
    }
  };

  const changeTempPassword = async (newPassword: string): Promise<void> => {
    if (!state.user?.email || !tempPassword) {
      throw new Error("No hay una sesión temporal activa para cambiar la contraseña.");
    }
    
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.changePassword(state.user.email, tempPassword, newPassword);
      setTempPassword(null); // Clear memory
      logout("Contraseña actualizada con éxito. Inicie sesión con sus nuevas credenciales.");
    } catch (err: any) {
      let errMsg = "No se pudo actualizar la contraseña temporal.";
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.detail) {
          errMsg = data.detail;
        } else if (data.title) {
          errMsg = data.title;
        } else if (data.message) {
          errMsg = data.message;
        }
      }
      setState((prev) => ({ ...prev, isLoading: false, error: errMsg }));
      throw new Error(errMsg);
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, checkTokenExpiry, tempPassword, changeTempPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
