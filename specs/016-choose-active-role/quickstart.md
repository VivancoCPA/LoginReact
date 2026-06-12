# Quickstart: Active Role Selection Validation

This guide outlines manual verification flows to test the active role selection.

## Prerequisites
- Local servers running (frontend on `http://localhost:5173`, backend on `http://localhost:5043`).
- Access to two users in the database:
  1. A user with exactly **one** role (e.g. `User`).
  2. A user with **multiple** roles (e.g. `Admin` and `User`).

## Verification Scenarios

### 1. Single Role Auto-Bypass
1. Log in with the single-role user.
2. Verify that they are redirected directly to `/dashboard`.
3. Check that the `/choose-role` screen is bypassed entirely.
4. Verify the topbar displays the correct role name.

### 2. Multi-Role Selection Screen Redirect
1. Log in with the multi-role user.
2. Verify that they are redirected to `/choose-role` instead of `/dashboard`.
3. Check that the layout (sidebar/topbar) is NOT rendered on `/choose-role`.
4. Observe the list of roles. Click on one of them (e.g., `Admin`).
5. Verify that you are redirected to `/dashboard` and the topbar badge displays "Admin".
6. Check that the sidebar only displays menu links authorized for the `Admin` role.

### 3. Routing Guard Restriction
1. Log in with a multi-role user.
2. When redirected to `/choose-role`, type `http://localhost:5173/admin/users` directly in the browser address bar and press Enter.
3. Verify that you are intercepted and redirected back to `/choose-role` because no active role is set.

### 4. Session Persistence
1. Perform the multi-role login and select a role (e.g., `User`).
2. Refresh the browser.
3. Verify that you remain on the `/dashboard` or previous page and do not see the `/choose-role` screen again.

### 5. Logout Flow from Selection Screen
1. Log in with a multi-role user.
2. On `/choose-role` screen, click the "Cerrar Sesión" (Logout) button.
3. Verify that the session is cleared and you are returned to `/login`.
