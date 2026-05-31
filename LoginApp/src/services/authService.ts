import { apiClient } from './apiClient';
import type { AuthResponse, RefreshResponse } from '../types/auth';

/**
 * Service to manage authentication requests with ASP.NET Core API
 */
export const authService = {
  /**
   * Dispatches login credentials to obtain a JWT Bearer token
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Dispatches password recovery request for Forgot Password
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  /**
   * Checks if an email is already registered in the system using anonymous endpoints
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await apiClient.get<Array<{ email: string }>>('/users');
      const users = response.data;
      return users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    } catch (error) {
      console.warn('Error listing users directly, trying paged fallback:', error);
      try {
        const response = await apiClient.get<{ items: Array<{ email: string }> }>('/auth/users/paged', {
          params: { search: email }
        });
        return response.data.items.some((u) => u.email.toLowerCase() === email.toLowerCase());
      } catch (innerError) {
        console.error('Error in paged email check fallback:', innerError);
        throw new Error('No se pudo verificar el registro del correo electrónico. Por favor, intente de nuevo.');
      }
    }
  },

  /**
   * Fetches the full profile details of a user by their email
   */
  async getUserByEmail(email: string): Promise<any> {
    const response = await apiClient.get<Array<any>>('/users');
    const users = response.data;
    const matched = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!matched) throw new Error('Usuario no encontrado en el sistema.');
    return matched;
  },

  /**
   * Updates a user profile in the backend
   */
  async updateUser(
    id: string,
    name: string,
    lastName: string,
    dateOfBirth?: string,
    phoneNumber?: string,
    photoUrl?: string,
    address?: string
  ): Promise<any> {
    const response = await apiClient.put(`/auth/users/${id}`, {
      name,
      lastName,
      dateOfBirth,
      phoneNumber,
      photoUrl,
      address,
    });
    return response.data;
  },

  /**
   * Dispatches silent refresh request using body payloads and saves rotated tokens
   */
  async refreshToken(): Promise<RefreshResponse> {
    const token = localStorage.getItem('auth_token') || '';
    const refreshToken = localStorage.getItem('auth_refresh_token') || '';

    const response = await apiClient.post<RefreshResponse>('/auth/refresh', {
      token,
      refreshToken,
    });

    const data = response.data;
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_refresh_token', data.refreshToken);
    localStorage.setItem('auth_timestamp', Date.now().toString());

    window.dispatchEvent(new CustomEvent('auth:token:refreshed', { detail: data.token }));

    return data;
  },

  /**
   * Dispatches request to change the user's password using current and new passwords.
   */
  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<{ email: string; message: string }> {
    const response = await apiClient.post<{ email: string; message: string }>('/auth/change-password', {
      email,
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

