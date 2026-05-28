# Feature Specification: Force Password Change on First Login

**Feature Branch**: `003-force-password-change`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "Nuevo_Usuario: Permitir que cuando un nuevo usuario sea creado por el Administrador del sistema el sea obligado a cambiar su password al ser el primer ingreso. Reglas: El administrador creara el nuevo usuario con un la información minima de email, nombre y se le generara una password random temporal. Cuando el usuario ingrese por primera vez al sistema este detectara que es su primera vez y lo mandara a una ventana de New password. Una vez creado en nuevo passwords lo enviara de regreso a la pantalla de Login. EL usuario podrá ingresar al sistema usando su nuevo password."

---

## Clarifications

### Session 2026-05-27

- **Q**: Should the user be required to enter their current temporary password again on the `/force-password-change` screen, or is it unnecessary since they already submitted it to log in?
  **A**: Unnecessary. The user does not need to enter their temporary password again. However, the change password window must require a double-entry of the new password ("Nueva Contraseña" and "Confirmar Nueva Contraseña") as a mechanism of confirmation.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Force Password Change on First Login (Priority: P1) 🎯 MVP

As a newly registered user who has been created by a system administrator with a temporary password, I want to be forced to change my temporary password upon my first login, so that my account is immediately secured with a permanent password only I know.

**Why this priority**: Core security requirement. A new account created with a random temporary password must be secured immediately before any access to system resources is granted.

**Independent Test**: Log in with a newly created user's temporary password, verify that the system detects it is the first login, intercepts the login flow, redirects the user to the "New Password" screen, blocks access to the Dashboard, enforces password complexity, and prompts the user to enter a new password.

**Acceptance Scenarios**:

1. **Given** a user who has just been created by the Administrator with a temporary password, **When** they submit their temporary credentials on the Login screen, **Then** they are redirected immediately to the "New Password" screen (`/force-password-change`) with a message explaining they must update their password to secure their account.
2. **Given** a user redirected to the "New Password" screen, **When** they try to manually navigate to the `/dashboard` route in their browser, **Then** the route guard blocks the access and redirects them back to `/force-password-change`.
3. **Given** a user on the "New Password" screen, **When** they input a new password, **Then** they see real-time complexity validation checks (8+ characters, uppercase, lowercase, digit, special character).
4. **Given** a user on the "New Password" screen, **When** they submit a password that does not satisfy all validation rules, **Then** submission is blocked and they see error highlights.
5. **Given** a user on the "New Password" screen, **When** they successfully submit a valid new password, **Then** the backend updates the password, clears the "first login" flag, invalidates the temporary token, redirects the user back to `/login`, and displays a success toast notification.

---

### User Story 2 - Login with New Permanent Password (Priority: P2)

As a user who has successfully updated my temporary password, I want to be able to log in to the system using my new permanent password, so that I can access my dashboard and use the system normally.

**Why this priority**: Confirms completion of the user journey, verifying that the new password is now active and the temporary password has been successfully invalidated.

**Independent Test**: Submit the newly created permanent password on the Login screen, verify that login succeeds, and the user is redirected to the `/dashboard` directly without any password change prompt.

**Acceptance Scenarios**:

1. **Given** a user who has successfully updated their temporary password, **When** they log in using their new permanent password, **Then** they are successfully authenticated and redirected straight to `/dashboard`.
2. **Given** a user who has updated their password, **When** they attempt to log in using the old temporary password, **Then** authentication fails with an invalid credentials error message.

---

### Edge Cases

- **Session Expiration during Password Change**: If the temporary session or token expires while the user is idle on the `/force-password-change` screen, any form submission MUST fail gracefully, redirecting the user back to the Login screen with an alert: *"La sesión de cambio de contraseña ha expirado. Por favor, intente iniciar sesión nuevamente."*
- **Direct Access to /force-password-change**: If an unauthenticated user or an already fully-authenticated user tries to directly navigate to `/force-password-change`, they MUST be redirected to `/login` or `/dashboard` respectively.
- **Weak Password Complexity**: When the user enters a password that fails the complexity validation, the submit button remains disabled and visual indicators stay in an unfulfilled (red/gray) state.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST detect if an authenticating user requires a password change upon submission to `POST /api/auth/login`.
- **FR-002**: If a password change is required, the login API MUST return a response payload including a flag `mustChangePassword: true` and a temporary change token (or standard HTTP 200 payload containing the flag).
- **FR-003**: The client application MUST intercept this flag and redirect the user immediately to the `/force-password-change` screen.
- **FR-004**: The client application MUST block all standard authenticated dashboard routes (`/dashboard`) if the user has a pending password change status.
- **FR-005**: The `/force-password-change` page MUST NOT require the user to enter their current temporary password again. It MUST present exactly two fields: "Nueva Contraseña" and "Confirmar Nueva Contraseña" as a double-entry confirmation mechanism.
- **FR-006**: The `/force-password-change` page MUST implement real-time validation checks for password complexity (minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character).
- **FR-007**: The system MUST allow the user to submit their new password via a secure change endpoint (e.g. `POST /api/auth/change-temp-password` or equivalent), sending the user's email, temporary token, and new password.
- **FR-008**: Upon successful password change, the system MUST invalidate the temporary credentials, clear the forced change state, and redirect the user to `/login` displaying a success toast: *"Contraseña actualizada con éxito. Inicie sesión con sus nuevas credenciales."*

### Key Entities

- **TemporaryAuthState**: Represents the temporary, restricted authentication state on the client. It holds the user's basic profile (email, name) and the temporary change token, but does not grant access to secure dashboards.
- **ForcedChangeStatus**: Represents the database-backed attribute on the User entity indicating whether a password change is required (usually set to true upon administrative user creation).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Newly created users are forced to update their temporary credentials upon their very first login, with 100% of unauthorized pages blocked.
- **SC-002**: Users can complete the password change process and return to the Login screen in under 60 seconds.
- **SC-003**: Dynamic validation of password complexity occurs in real time with zero lag (< 50ms rendering latency) on input keystrokes.
- **SC-004**: Invalid or weak password change requests are blocked client-side, reducing failed backend roundtrips by 100%.

---

## Assumptions

- **Admin Portal Scope**: The administrative portal or command-line process used by the system administrator to create the new user is out of scope for this feature specification.
- **Random Password Generation**: The temporary password generated for the new user is randomly generated on the backend and communicated securely to the user (e.g. via email or direct copy), which is out of scope.
- **API Availability**: The backend API will support standard password updates via a dedicated REST endpoint, accepting a temporary token to authorize the modification.
