# UI Contracts: Unscoped Users Drawer

This document maps the exact API communication between the React drawer component and the backend endpoints.

## 1. Fetching Unscoped Users
- **Action**: Load drawer
- **HTTP Method**: `GET`
- **Route**: `/api/users/unscoped` (mapped as `/users/unscoped` in `userService.ts`)
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response Format**:
```typescript
Array<{
  id: string;
  email: string;
  name: string;
  lastName: string;
  fullName: string;
}>
```

## 2. Associating a User
- **Action**: Click "Asociar" on a user row
- **HTTP Method**: `POST`
- **Route**: `/api/users/{adminId}/scope/{userId}` (mapped as `/users/{adminId}/scope/{userId}` in `userService.ts`)
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response Format**:
```typescript
{
  id: number;
  userIdAdmin: string;
  userId: string;
}
```
