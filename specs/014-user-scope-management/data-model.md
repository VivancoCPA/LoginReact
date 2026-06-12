# Data Model: User Scope Management

## 1. Updated Authentication Session Models

In `LoginApp/src/types/auth.ts`, the `User` interface will be expanded to encompass the profile avatar (`photoUrl`) and assigned `roles` list:

```typescript
export interface User {
  id?: string;
  email: string;
  name: string;
  lastName?: string;
  passwordConfirmed?: boolean;
  photoUrl?: string;
  roles?: string[];
}
```

## 2. User Scope Association Entities

For scope association and disassociation requests, the following types will be utilized:

```typescript
export interface UserScopeItem {
  id: number;
  userIdAdmin: string;
  userId: string;
  userEmail?: string;
  userFullName?: string;
}

export interface AddUserScopeResponse {
  id: number;
  userIdAdmin: string;
  userId: string;
}

export interface RemoveUserScopeResponse {
  message: string;
}
```
