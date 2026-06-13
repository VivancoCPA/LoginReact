export interface UserRole {
  name: string;
  description: string;
}

export interface User {
  id?: string;
  email: string;
  name: string;
  lastName?: string;
  passwordConfirmed?: boolean;
  photoUrl?: string;
  roles?: UserRole[];
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  name: string;
  lastName: string;
  passwordConfirmed?: boolean;
  roles?: UserRole[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: string | null;
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

