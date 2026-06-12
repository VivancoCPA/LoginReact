# Feature Specification: Active Role Selection (Selección de Rol Activo)

**Feature Branch**: `016-choose-active-role`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "Nueva Spec Multi Rol: Al poder asociarse mas de un Rol por usuario, luego de loguerse se Debra presentar una pantalla donde el usuario pueda elegir con que rol continuara en la Aplicación. Si el usuario solo tiene un rol esta pantalla ya no seria necesaria."

## Clarifications

### Session 2026-06-12
- Q: Once a user has selected a role and enters the application, should they be able to switch their active role dynamically from the header profile dropdown, or is role selection strictly limited to the post-login screen (requiring a logout/login to switch roles)? → A: Option A (Selection only on login). Role selection occurs only after logging in. To switch roles, the user must log out and log back in.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Bypass for Single Role Users (Priority: P1)

As a user with a single assigned role, when I log in, I want to bypass the role selection screen and go directly to the application dashboard so that I do not experience unnecessary steps in my login flow.

**Why this priority**: Bypassing the screen for single-role users is the default behavior and keeps the login process simple for the majority of users.

**Independent Test**: Can be tested by logging in with a user who has only one role (e.g., `User`), verifying that they are redirected directly to the home/dashboard screen, and checking that the active role is correctly set in the session context.

**Acceptance Scenarios**:

1. **Given** a user with exactly one role (e.g. `Admin`) logs in successfully, **When** they complete login, **Then** they are redirected directly to the application layout (bypassing `/choose-role`).
2. **Given** a logged-in user with one role, **When** they load the application, **Then** their sole role is automatically designated as the active session role.

---

### User Story 2 - Role Selection for Multi-Role Users (Priority: P2)

As a user with multiple assigned roles, when I complete the login process, I want to be redirected to a screen where I can see and select which role I want to use for my current session so that I can operate with the correct set of permissions.

**Why this priority**: Enables multi-role support on login, allowing the user to select their desired context.

**Independent Test**: Can be tested by logging in with a user who has multiple roles (e.g., both `Admin` and `User`), verifying that they are redirected to a dedicated `/choose-role` view showing the available options, and verifying that selecting one sets it as active and redirects them to the main layout.

**Acceptance Scenarios**:

1. **Given** a user with multiple roles (e.g. `Admin`, `User`) logs in, **When** they complete credentials submission, **Then** they are redirected to the `/choose-role` view.
2. **Given** the `/choose-role` view is mounted, **When** the user clicks on one of their assigned roles, **Then** that role is stored as the active session role, and the user is redirected to the main application view.
3. **Given** a multi-role user has not yet selected a role, **When** they try to manually navigate to any other application path, **Then** the routing guard redirects them back to `/choose-role`.

---

### Edge Cases

- **No Roles Assigned**: If a user has zero roles assigned, the system MUST redirect them to `/choose-role` and display a message stating they have no assigned roles and should contact an administrator.
- **Session Restoration**: When a user refreshes the browser, the active role selection must be persisted (e.g., in `localStorage` or `sessionStorage`) so they do not have to select their role again unless their token expires or they log out.
- **Switching Roles**: Users cannot switch their active role in the middle of a session. If they wish to change roles, they must log out and log in again.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: After successful login or session restoration, the application MUST check the number of roles assigned to the user.
- **FR-002**: If the user has exactly **one** assigned role, the system MUST automatically set it as the active session role and redirect the user directly to the application.
- **FR-003**: If the user has **two or more** assigned roles, or has **zero** assigned roles, the system MUST redirect the user to the `/choose-role` page.
- **FR-004**: The `/choose-role` page MUST render a visual card interface listing all the user's assigned roles, showing the role name and description.
- **FR-005**: Choosing a role on the `/choose-role` page MUST save the selection in the application's AuthContext as `activeRole` and persist it in local/session storage.
- **FR-006**: The routing guards (`src/App.tsx` or layout controls) MUST enforce that a user who has logged in but has not selected an `activeRole` is restricted to the `/choose-role` view (except when they have zero roles, in which case they remain blocked on `/choose-role`).
- **FR-007**: When displaying the role in the header (`Topbar.tsx`) and checking sidebar permissions, the system MUST use the selected `activeRole` instead of the first role in the array.
- **FR-008**: If the user has zero assigned roles, the `/choose-role` page MUST display the message: "No tiene Rol asignado. Por favor, comuníquese con el Administrador." instead of a role cards list, and prevent navigation to dashboard views.

### Key Entities

- **Session Context**: Holds the authenticated user, the token, the full list of assigned roles, and the selected `activeRole` for the current session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Single-role users bypass the role selection page and load the dashboard in under 500ms after authentication.
- **SC-002**: The `/choose-role` screen mounts and renders available roles in under 200ms after redirect.
- **SC-003**: Selecting a role completes the redirect to the dashboard in under 150ms.

## Assumptions

- User roles are retrieved during login (present in the JWT token or loaded as part of the initial user profile request).
- The routing configuration will support a clean redirect path `/choose-role` that does not render the primary layout sidebar/topbar.
