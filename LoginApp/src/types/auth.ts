export interface User {
  id?: string;
  email: string;
  name: string;
  lastName?: string;
  passwordConfirmed?: boolean;
  photoUrl?: string;
  roles?: string[];
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  name: string;
  lastName: string;
  passwordConfirmed?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface RefreshResponse {
  token: string;
  refreshToken: string;
}

export interface FailedQueueItem {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}

