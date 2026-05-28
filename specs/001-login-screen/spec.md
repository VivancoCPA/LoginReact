# Feature Specification: Login Screen

**Feature Branch**: `001-login-screen`

**Created**: 2026-05-26

**Status**: Draft

**Input**: User description: "PantallaLogin: para crear la pantalla inicial de Login se debe tener un diseño moderno y empresarial, la parte izquierda de la pantalla iría el Log e información de la empresa mientras que en la parte derecha el form del Login. Datos a ingresar y validar: Correo y Password. se debe crear un link a Registrar nuevo usuario, esta opción se implementara en otra especificación. Se debe crear un link para Reset Password, esta opción se implementará en otra especificación. No incluir Test."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Enterprise Login (Priority: P1)

As a user, I want to access the login page to securely log into my account, so that I can access my protected workspace and dashboard.

**Why this priority**: This is the core MVP functionality of the application to access protected views and verify the Bearer token authorization flow.

**Independent Test**: Can be fully tested by submitting valid credentials in the form, verifying that a correct token is obtained and the page redirects to `/dashboard`, showing the authenticated user context.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user on the login screen, **When** they enter a valid email and correct password, and click the Login button, **Then** the system requests authentication from the external API, stores the JWT token securely, and redirects them to the protected Dashboard.
2. **Given** an unauthenticated user on the login screen, **When** they enter an invalid email or incorrect password, and click the Login button, **Then** the system shows a clear, user-friendly error message, and does not redirect.
3. **Given** an unauthenticated user on the login screen, **When** they try to submit the form with empty email or password, **Then** the system displays real-time validation errors immediately under the respective field, and prevents the API call.

---

### User Story 2 - Modern Split-Screen Interface (Priority: P2)

As a user, I want a beautiful, clean split-screen layout that displays corporate branding on the left and the login form on the right, so that the authentication experience feels professional and premium.

**Why this priority**: Meets the design requirement of a premium corporate layout, aligning with our enterprise aesthetic principles.

**Independent Test**: Can be fully tested by opening the login page on various viewport sizes, verifying that on desktop it displays a split-screen (branding on the left, form on the right) and collapses gracefully to a single focused form on mobile.

**Acceptance Scenarios**:

1. **Given** a user viewing the login page on a desktop screen, **When** the page loads, **Then** the screen is split into a left section showing the company logo, tagline, and corporate branding background, and a right section containing the login form.
2. **Given** a user viewing the login page on a mobile screen, **When** the page loads, **Then** the layout collapses responsively, hiding or scaling down the left branding block and centering the login form for optimal tap targets.

---

### User Story 3 - Navigation to Other Auth Flows (Priority: P3)

As a user, I want to easily navigate to the Registration and Password Recovery flows from the login page, so that I can manage my account access.

**Why this priority**: Essential UX mapping to allow users to sign up or recover passwords easily.

**Independent Test**: Can be fully tested by clicking the "Registrar nuevo usuario" or "Reset Password" links and verifying that they successfully redirect to `/register` and `/recover-password` respectively.

**Acceptance Scenarios**:

1. **Given** a user on the login screen, **When** they click the "Registrar nuevo usuario" link, **Then** they are redirected to the Registration view (`/register`).
2. **Given** a user on the login screen, **When** they click the "Reset Password" link, **Then** they are redirected to the Password Recovery view (`/recover-password`).

---

### Edge Cases

- **Slow Network / Offline API**: When a user submits credentials and the API is slow or offline, the Login button MUST show a loading spinner, disable all inputs, and display a helpful connection error ("Error de red. Verifique su conexión y vuelva a intentarlo") upon timeout.
- **Client-Side Invalid Formats**: When a user inputs an invalid email string, the system MUST show an inline validation message immediately upon change/blur and disable the submit button until fixed.
- **Token Expiration Recovery**: If a user is redirected back to `/login` from `/dashboard` due to an expired token, the system MUST clear all local storage credentials and display a friendly session notification ("Su sesión ha expirado. Por favor, inicie sesión nuevamente").
- **Standard RFC 7807/9110 Problem Details (Backend blockages)**: When the Backend API returns standard error responses representing blocked accounts (e.g. 403 Forbidden with details) or validation detail errors, the frontend MUST capture and display these specific detail strings dynamically.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render a modern split-screen layout on desktop viewports: company branding and logo on the left, login form on the right.
- **FR-002**: The login form MUST contain inputs for Email and Password.
- **FR-003**: The system MUST perform real-time client-side validation: Email must be non-empty and match standard email syntax; Password must be non-empty.
- **FR-004**: The system MUST dispatch a `POST` request to `http://localhost:5043/api/auth/login` containing the `email` and `password` in JSON format.
- **FR-005**: On successful API response, the system MUST save the received JWT token in `localStorage` as `Bearer <token>` and redirect the user to the protected dashboard (`/dashboard`).
- **FR-006**: On failed API response, the system MUST handle errors cleanly, extracting error details (supporting standard RFC 7807 / RFC 9110 Problem Details structures such as `detail` and `title` and Validation Details dictionary objects) and displaying them in a centralized error alert banner or Toast.
- **FR-007**: The login screen MUST include a link to the registration flow (`/register`) and a link to the password recovery flow (`/recover-password`).
- **FR-008**: Testing is explicitly excluded from this specification (no unit/integration tests required for the login screen code), per the user's request.

### Key Entities

- **UserCredentials**: Represents the payload for authentication, containing attributes: `email` (string, unique, format-validated) and `password` (string).
- **SessionToken**: Represents the JWT token received from the external API, containing attributes: `token` (string, bearer token) and metadata (`exp`, `email`, etc.).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desktop users see a beautiful 50/50 split-screen layout with smooth fade-in transitions.
- **SC-002**: Real-time form validations trigger within 100ms of input change and display clean inline error messages.
- **SC-003**: Users with correct credentials successfully log in and are redirected to `/dashboard` in under 1 second (excluding network/API response latency).
- **SC-004**: Fully responsive layout: the screen is 100% usable on mobile viewports (<768px), collapsing to a single-column layout with optimal tap targets.

## Assumptions

- Standard JWT Bearer token authentication is supported by the external API at `http://localhost:5043/api/auth/login`.
- No tests are required or specified for this feature, per the user's explicit request.

## Clarifications

### Session 2026-05-26

- Q: How does the application present custom access blockages and detailed errors returned by the Backend API? → A: By extracting standard RFC 7807 / RFC 9110 properties (specifically 'detail' and 'title') and presenting them dynamically in Toast alerts.
