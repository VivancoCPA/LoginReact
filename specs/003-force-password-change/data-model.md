# Data Model: Force Password Change Interfaces

This document outlines the data model modifications and React routing state transitions.

---

## 1. Type Interfaces

### 1.1 Extended User Model
Matches the profile properties returned upon authentication.

```typescript
export interface User {
  id?: string;
  email: string;
  name: string;
  lastName?: string;
  passwordConfirmed?: boolean; // Indicates if first password change has been executed
}
```

### 1.2 Extended AuthResponse
Includes the new flag in the API response.

```typescript
export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  name: string;
  lastName: string;
  passwordConfirmed?: boolean;
}
```

---

## 2. Page Navigation & Route Guard Transitions

The route guard intercepts user route transitions based on the following flow:

```mermaid
stateDiagram-v2
    [*] --> LoginScreen : User Submits Credentials
    LoginScreen --> CheckStatus : POST /api/auth/login Response
    
    CheckStatus --> DashboardRoute : passwordConfirmed is True
    CheckStatus --> ForceChangeRoute : passwordConfirmed is False (Store tempPassword in-memory)
    
    DashboardRoute --> [*] : Allow normal operation
    
    ForceChangeRoute --> RouteBlocked : User manually tries to access /dashboard
    RouteBlocked --> ForceChangeRoute : Redirect to /force-password-change
    
    ForceChangeRoute --> SubmitNewPassword : User submits Nueva & Confirmar passwords
    SubmitNewPassword --> ClearState : POST /api/auth/change-password Success
    ClearState --> LoginScreen : Clear tempPassword & Logout -> Redirect to /login
```
