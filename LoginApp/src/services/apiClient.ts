import axios from 'axios';
import type { FailedQueueItem, RefreshResponse } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5043/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const checkIsTokenExpired = (): boolean => {
  const token = localStorage.getItem('auth_token');
  const timestampStr = localStorage.getItem('auth_timestamp');
  if (!token || !timestampStr) return false;

  const timestamp = Number(timestampStr);
  const diff = Date.now() - timestamp;
  const expiryLimit = Number(import.meta.env.VITE_TOKEN_EXPIRY_MINUTES || 60) * 60 * 1000;

  return diff >= expiryLimit;
};

const handleTokenRefresh = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const token = localStorage.getItem('auth_token') || '';
    const refreshToken = localStorage.getItem('auth_refresh_token') || '';

    const response = await axios.post<RefreshResponse>(
      `${API_BASE_URL}/auth/refresh`,
      {
        token,
        refreshToken,
      }
    );
    
    const newToken = response.data.token;
    const newRefreshToken = response.data.refreshToken;

    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_refresh_token', newRefreshToken);
    localStorage.setItem('auth_timestamp', Date.now().toString());

    // Dispatch custom event if other components need to know
    window.dispatchEvent(new CustomEvent('auth:token:refreshed', { detail: newToken }));

    processQueue(null, newToken);
    return newToken;
  } catch (err: any) {
    processQueue(err, null);
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw err;
  } finally {
    isRefreshing = false;
  }
};

// Request Interceptor: Inject JWT token if available, pre-checking expiration
apiClient.interceptors.request.use(
  async (config) => {
    const isAuthRequest = config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh');

    if (!isAuthRequest && checkIsTokenExpired()) {
      try {
        const newToken = await handleTokenRefresh();
        if (config.headers) {
          config.headers.Authorization = `Bearer ${newToken}`;
        }
      } catch (error) {
        return Promise.reject(error);
      }
    } else {
      const token = localStorage.getItem('auth_token');
      if (token && config.headers && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Automatically remove Content-Type for FormData uploads so the browser can attach the correct boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch global API issues and 401s for retries
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      try {
        const newToken = await handleTokenRefresh();
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

