# Data Model: Active Role Selection

## TypeScript Interfaces

### Extended Authentication State
We extend the existing interfaces in `LoginApp/src/types/auth.ts` to include session context parameters:

```typescript
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: string | null; // Selected role for the current session
  error: string | null;
}
```

### Extended Context Type
The context provider interface in `LoginApp/src/context/AuthContext.tsx` is updated to expose the state and setter:

```typescript
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: (message?: string) => void;
  checkTokenExpiry: () => boolean;
  tempPassword: string | null;
  changeTempPassword: (newPassword: string) => Promise<void>;
  updateUserSession: (updatedUser: Partial<User>) => void;
  setActiveRole: (role: string | null) => void; // Sets and persists the active role
}
```
