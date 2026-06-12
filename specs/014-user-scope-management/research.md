# Research: User Scope Management

## 1. Scope API Endpoints (from UsersEndpoints.md)

The vertical slice authentication system exposes endpoints to manage `user_scope` relationships. These endpoints require token authentication and are used by standard `Admin` and `SuperAdmin` roles:

- **Asociar Usuario a un Ámbito**: `POST /api/users/{adminId}/scope/{userId}`
  - *Authorization*: `SuperAdmin` for any adminId, or `Admin` for their own ID (`adminId == currentUserId`).
  - *Response*: `201 Created` returning the scope relationship ID.
  
- **Desasociar Usuario de un Ámbito**: `DELETE /api/users/{adminId}/scope/{userId}`
  - *Authorization*: `SuperAdmin` for any adminId, or `Admin` for their own ID (`adminId == currentUserId`).
  - *Response*: `200 OK` with confirmation message.

- **Listar Usuarios en el Ámbito de un Administrador**: `GET /api/users/{adminId}/scopes`
  - *Authorization*: `SuperAdmin` for any adminId, or `Admin` for their own ID (`adminId == currentUserId`).
  - *Response*: `200 OK` list of associated users.

- **Listar todos los Usuarios**: `GET /api/users`
  - *Authorization*: `SuperAdmin` or `Admin`.
  - *Response*: Lists all users in the system if `SuperAdmin`, or users only within the admin's scope if standard `Admin`.

## 2. Avatar Loading & Upload Reference

To modify own profile avatar, we follow the pattern implemented in user maintenance creation:
- **Client validation**: JPEG/PNG file, maximum size 2MB (`file.size <= 2 * 1024 * 1024`).
- **Data transfer**: Sent as a binary file via `multipart/form-data` with key `photo`.
- **API Target**: `PUT /api/auth/users/{id}` (reused by `authService.updateUser`).
- **Response Synchronization**: The server returns the updated user object containing the new `photoUrl`. The frontend updates `localStorage` and `AuthContext` state.

## 3. Permissions Matrix Implementation

| Operation / Action | SuperAdmin | Admin | Regular User |
| :--- | :--- | :--- | :--- |
| Create user (`POST /api/auth/users`) | Yes | Yes (scoped) | No |
| Assign Roles (`POST /api/users/...`) | Yes | Yes (scoped) | No |
| View user details (`GET /api/users/...`) | Yes | Yes (scoped) | No |
| Edit user details (`PUT /api/auth/users/...`)| Yes | Yes (scoped) | No |
| Toggle user status (`PATCH /api/users/...`) | Yes | Yes (scoped) | No |
| View own profile (`GET /api/users/{userId}`) | Yes | Yes | Yes |
| Edit own profile (`PUT /api/auth/users/...`) | Yes | Yes | Yes |
| Associate users to scope (`POST .../scope/...`)| No | Yes | No |
| Remove users from scope (`DELETE .../scope/...`)| No | Yes | No |
