# Feature Specification: Forgot Password Recovery

**Feature Branch**: `004-forgot-password`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "cuando el usuario da click en Olvide Password se abrirá una ventana de solicitud de new password. Crear esta ventana siguiendo las mismas reglas del diseño actuales. Aca se debe confirmar el correo a donde se respondera con un nuevo password temporal. Si el correo no existe se avisara que el correo no existe y se contacte con el administrador. El BackEnd seteara el passwordConfirmed = false y se seguirá el mismo flujo de Nuevo Usuario. La información de los API de ForgotPassword a usar se encuentran en UsersEndpoints.md ."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Request Password Recovery (Priority: P1) 🎯 MVP

As an unauthenticated user who has forgotten my password, I want to be able to request a new temporary password by entering my registered email on the "Olvide Password" screen, so that a new temporary credentials payload is securely dispatched.

**Why this priority**: Core recovery flow trigger. This screen allows the user to verify their registered status and trigger the backend-managed password reset sequence.

**Independent Test**: Navigate to `/forgot-password`, input a registered email, click submit, and verify that the system dispatches `POST /api/auth/forgot-password` successfully, displays a success toast, and redirects back to `/login`.

**Acceptance Scenarios**:

1. **Given** a guest user on the Login page, **When** they click the "¿Olvidó su contraseña?" link, **Then** they are navigated to the `/forgot-password` recovery screen.
2. **Given** a user on the `/forgot-password` screen, **When** they submit a registered email address and click "Enviar", **Then** the backend dispatches a new random temporary password to their email, sets `passwordConfirmed = false`, and dispatches a success toast: *"Se ha enviado un nuevo password temporal a su correo. Inicie sesión con sus nuevas credenciales."*
3. **Given** a user on the `/forgot-password` screen, **When** they submit an email that does not exist in the database, **Then** the system displays a clear warning toast: *"El correo electrónico no existe. Contacte al Administrador."*

---

### User Story 2 - Complete Recovery Flow via Force Change (Priority: P2)

As a user who has received a new temporary password after recovery, I want to log in using these temporary credentials so that the system immediately forces me to define my new permanent password, keeping my account secure.

**Why this priority**: Leverages and validates the existing `003-force-password-change` vertical slice, ensuring end-to-end credential updates work seamlessly.

**Independent Test**: On `/login`, submit the newly received temporary password. Verify that the routing guards intercept the authentication state and redirect you straight to `/force-password-change`, forcing a double-entry update.

**Acceptance Scenarios**:

1. **Given** a user who received their temporary password, **When** they log in, **Then** they are successfully redirected to `/force-password-change`.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow users to navigate to `/forgot-password` from the login screen.
- **FR-002**: The `/forgot-password` page MUST feature a clean, minimal design using the same dark glassmorphic palette.
- **FR-003**: The `/forgot-password` page MUST validate email formatting in real-time.
- **FR-004**: The system MUST dispatch a request containing the email to `POST /api/auth/forgot-password` to trigger a temporary password reset.
- **FR-005**: If the API dispatches a validation error indicating the email is unregistered, the system MUST display the exact warning Toast: *"El correo electrónico no existe. Contacte al Administrador."*
- **FR-006**: Upon successful recovery request submission, the system MUST redirect the user back to the `/login` screen with a success Toast.

### Key Entities

- **RecoveryRequestPayload**: Represents the body schema sending email context to the backend.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can request a new temporary password and return to the Login screen in under 45 seconds.
- **SC-002**: Invalid or unregistered emails are immediately flagged with a helpful corporate Toast message, preventing blind backend calls.
- **SC-003**: Direct logins with the newly generated temporary password are 100% intercepted and redirected to `/force-password-change`.
