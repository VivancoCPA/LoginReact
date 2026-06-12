# Quickstart: Unscoped Users Association Validation

This guide outlines the steps to verify that the drawer lists unscoped users and associates them correctly.

## Prerequisites
- Frontend local environment running on `http://localhost:5173`.
- Backend local server running on `http://localhost:5043`.
- Have at least one user in the database who does not belong to any administrator's scope (i.e. has no records in the `user_scope` table).

## Verification Steps

### 1. Verification of the Unscoped List Populating
1. Log in to the application as a standard `Admin`.
2. Go to the User Maintenance page.
3. Click on the **"Asociar Scope"** button next to the "Nuevo Usuario" button.
4. Observe that the drawer opens, showing a loading spinner, and then displays the list of users without a scope.
5. Verify that the displayed users fallback to their initials dynamically since `photoUrl` is not provided in this endpoint's payload.

### 2. Verification of the Search Input
1. In the search box at the top of the drawer, type part of the name or email of one of the listed users.
2. Verify that the list filters in real-time, matching only the search term.
3. Clear the search box and verify that the full list is restored.

### 3. Verification of User Association
1. Find an unscoped user in the list and click the **"Asociar"** button in their row.
2. Verify that a success toast appears: *"Usuario asociado correctamente al scope."*
3. Verify that the associated user is removed from the drawer's list immediately.
4. Close the drawer or observe the background grid: the newly associated user should now appear in the main User Maintenance table.
