# Technical Research: Unscoped Users Association

## Decisions & Architecture

### 1. Endpoint for Fetching Unscoped Users
- **Decision**: Invoke `GET /api/users/unscoped` to retrieve the list of users currently not associated with any administrator scope.
- **Rationale**: 
  - The previous approach called `GET /api/users` (`userService.getAllUsers()`). Under the hood, for standard Admins, the backend Dapper query filters the result to only include users within their current scope. Thus, subtracting already scoped users dynamically on the client resulted in an empty array.
  - `GET /api/users/unscoped` is specifically designed to query the database for users that do not have records in the `user_scope` table, returning the complete set of assignable users.
- **Alternatives Considered**: 
  - Passing a query parameter like `GET /api/users?unscoped=true` (rejected because the backend already exposes a clean, dedicated `/api/users/unscoped` endpoint).

### 2. Backend Contract Mapping
Based on [UsersEndpoints.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/UsersEndpoints.md#L926-L950), the endpoint `/api/users/unscoped` returns a list of objects with the following schema:
```json
[
  {
    "id": "string",
    "email": "usuario@example.com",
    "name": "Nombre",
    "lastName": "Apellido",
    "fullName": "Nombre Apellido"
  }
]
```
Note that `photoUrl` is not present in the returned model. As a result, the frontend will fallback to generating initials dynamically for these users.

### 3. FrontEnd Integration in UserScopeDrawer
- **Decision**: Update `UserScopeDrawer.tsx` to call `userService.getUnscopedUsers()`.
- **Flow**:
  1. Open drawer → calls `userService.getUnscopedUsers()`.
  2. Renders loading state.
  3. Displays list of unscoped users with search input filtering by `fullName` / `email` in real-time.
  4. Clicking "Asociar" triggers `userService.associateUserToScope(adminId, userId)`.
  5. Upon success, removes the user from the local list and updates parent user maintenance grid.
