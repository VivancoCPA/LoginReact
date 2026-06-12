import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthResponse, AuthState } from '../types/auth';
import { authService } from '../services/authService';
import { apiClient } from '../services/apiClient';

const parseJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: (message?: string) => void;
  checkTokenExpiry: () => boolean;
  tempPassword: string | null;
  changeTempPassword: (newPassword: string) => Promise<void>;
  updateUserSession: (updatedUser: Partial<User>) => void;
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
    const fetchFreshProfile = async (currentUser: User, currentToken: string) => {
      try {
        const claims = parseJwt(currentToken);
        const userId = claims?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || claims?.sub;
        if (userId) {
          const response = await apiClient.get(`/users/${userId}`, {
            headers: { Authorization: `Bearer ${currentToken}` }
          });
          const freshUser = response.data;
          const updatedUser: User = {
            ...currentUser,
            id: freshUser.id,
            name: freshUser.name || currentUser.name,
            lastName: freshUser.lastName || currentUser.lastName,
            photoUrl: freshUser.photoUrl || '',
            roles: freshUser.roles || [],
          };
          setState((prev) => {
            if (!prev.isAuthenticated) return prev;
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            return { ...prev, user: updatedUser };
          });
        }
      } catch (err) {
        console.error("Failed to fetch fresh user profile in background:", err);
      }
    };

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
            // Fetch fresh profile details asynchronously in the background
            fetchFreshProfile(user, token);
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
      
      const claims = parseJwt(data.token);
      const userId = claims?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || claims?.sub;
      let freshRoles: string[] = [];
      let photoUrl = "";
      
      if (userId) {
        try {
          const response = await apiClient.get(`/users/${userId}`, {
            headers: { Authorization: `Bearer ${data.token}` }
          });
          freshRoles = response.data.roles || [];
          photoUrl = response.data.photoUrl || "";
        } catch (err) {
          console.error("Failed to fetch user profile details on login:", err);
        }
      }

      const user: User = {
        id: userId,
        email: data.email,
        name: data.name,
        lastName: data.lastName,
        passwordConfirmed: data.passwordConfirmed !== false,
        photoUrl,
        roles: freshRoles,
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

  const updateUserSession = (updatedUser: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const newUser = { ...prev.user, ...updatedUser };
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      return { ...prev, user: newUser };
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, checkTokenExpiry, tempPassword, changeTempPassword, updateUserSession }}>
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
