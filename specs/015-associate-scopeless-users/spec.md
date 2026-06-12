# Feature Specification: Unscoped Users Association (Asociación de Usuarios sin Scope)

**Feature Branch**: `015-associate-scopeless-users`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "Nueva Spec de Fuera de Scope: Sobre el CRUD de usuarios ya existente necesitamos agregar funcionalidad. Funciones: sobre el botón de asociar Scope llamar al listado de Usuarios sin Scope para poder asociarlos. Actualmente la lista se muestra vacia. se hara la búsqueda y se podrá incluir el o los usuarios al scope Actual"

## Clarifications

### Session 2026-06-12
- Q: Should the drawer allow associating multiple users at once (bulk association with checkboxes), or is associating them one by one (current single button behavior) sufficient? → A: Option A (Single Association). Users are associated one by one by clicking an "Asociar" button next to each user.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - List and Search Unscoped Users (Priority: P1)

As an Admin, when I open the Scope Association drawer, I want to see a list of all users in the system who do not have any active administrator scope, and I want to be able to search them by name or email so that I can easily locate specific individuals.

**Why this priority**: Displaying the correct list of unscoped users is the primary foundation needed to perform any association. Without it, the feature is non-functional.

**Independent Test**: Can be tested by logging in as an Admin, opening the "Asociar Scope" drawer, checking that the list is populated with users who have no active scope, typing a search term in the search box, and verifying that the list filters dynamically.

**Acceptance Scenarios**:

1. **Given** an Admin is logged in and opens the Scope Association drawer, **When** there are users in the system without any administrator scope, **Then** the drawer displays those users using their name, email, and avatar (or initials).
2. **Given** the Scope Association drawer is open, **When** the Admin enters a search term (name or email) in the search input, **Then** the list filters in real-time showing only matching users.
3. **Given** the Scope Association drawer is open, **When** no users in the system are unscoped, **Then** the drawer displays an appropriate empty state indicating all users have scopes.

---

### User Story 2 - Associate Unscoped Users (Priority: P2)

As an Admin, I want to associate unscoped users from the list individually to my current scope so that they are added to my list of managed users.

**Why this priority**: This completes the integration flow, allowing the admin to claim ownership of previously scopeless users.

**Independent Test**: Can be tested by opening the drawer, finding an unscoped user, clicking the "Asociar" button, verifying that a success message is displayed, that the user is removed from the drawer's list, and that they now appear in the main User Maintenance list.

**Acceptance Scenarios**:

1. **Given** the Scope Association drawer is open, **When** the Admin clicks "Asociar" on a user, **Then** the system sends the association request to the backend and shows a success notification.
2. **Given** a successful association, **When** the drawer list updates, **Then** the associated user is removed from the drawer list and added immediately to the main User Maintenance grid.

---

### Edge Cases

- **Concurrent Association**: If another admin associates a user while their name is still open in our drawer, clicking "Asociar" should show a clear conflict error message from the backend and refresh the list.
- **Empty Scope List**: If the backend returns no unscoped users, the drawer must show a friendly empty state rather than remaining in a loading state or displaying blank spaces.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST add a client service function `getUnscopedUsers` to fetch the list of unscoped users from `GET /api/users/unscoped`.
- **FR-002**: In `UserScopeDrawer.tsx`, the system MUST call `userService.getUnscopedUsers` instead of `userService.getAllUsers` to retrieve available users.
- **FR-003**: The user interface MUST display a loading spinner while retrieving the list of unscoped users from the backend.
- **FR-004**: The system MUST support client-side filtering of the retrieved unscoped users list by matching the search input against the user's full name or email.
- **FR-005**: When the "Asociar" button next to a user is clicked, the system MUST call `userService.associateUserToScope(adminId, userId)` using the logged-in administrator's ID.
- **FR-006**: Upon successful association, the UI MUST show a success toast notification, remove the user from the local drawer state, and trigger a refresh of the main User Maintenance table.

### Key Entities

- **User**: Represents a system user (id, name, lastName, email, photoUrl).
- **UserScope**: Represents the association between an administrator and a user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Scope Association list displays all unscoped users returned by the backend within 1 second of opening the drawer.
- **SC-002**: Client-side filtering updates the list in under 100 milliseconds upon typing in the search input.
- **SC-003**: Associating a user completes and updates the UI (removing them from the drawer and updating the main grid) in under 1.5 seconds.

## Assumptions

- The backend endpoint `GET /api/users/unscoped` is fully functional and requires proper authentication (Admin or SuperAdmin role).
- The existing `POST /api/users/{adminId}/scope/{userId}` endpoint accepts the association correctly.
