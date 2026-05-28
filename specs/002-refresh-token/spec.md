# Feature Specification: Token Refresh Mechanism

**Feature Branch**: `002-refresh-token`

**Created**: 2026-05-26

**Status**: Draft

**Input**: User description: "Refresh Token: en esta nueva Se debe tener la opcion de refrescar el token una vez que este haya caducado y no cerrar la session, puedes ver detalles de los APis en UsersEndpoints.md. Ademas el numero de minutos de duracion del token se debe tomar de los archivos de configuracion."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Silent Token Refresh on Expiration (Priority: P1)

As an authenticated user, I want the system to automatically and silently refresh my session token in the background when it expires, so that my active actions are not interrupted and I am not forced to log in again.

**Why this priority**: Core requirement of the feature to provide session continuity and prevent forced logout upon access token expiration.

**Independent Test**: Can be fully tested by making an API request with an expired access token, verifying that the Axios client intercepts the request, calls `POST /api/auth/refresh` in the background, updates local storage with the new token, and retries the original request successfully without user intervention.

**Acceptance Scenarios**:

1. **Given** an authenticated user whose access token has expired, **When** they navigate or trigger an API request, **Then** the Axios client intercepts the request, silently dispatches a `POST /api/auth/refresh` request, updates the token and timestamp in `localStorage`, and retries the original request seamlessly.
2. **Given** an authenticated user whose refresh session has also expired or been revoked on the server, **When** the background refresh request fails with a `401 Unauthorized`, **Then** the system logs the user out, clears `localStorage`, redirects to `/login`, and displays a Toast: *"Su sesión ha expirado. Por favor, inicie sesión nuevamente."*

---

### User Story 2 - Configurable Token Duration (Priority: P2)

As a developer/administrator, I want the token duration in minutes to be loaded dynamically from configuration files, so that I can easily configure and test different session lifetimes.

**Why this priority**: Essential to satisfy the user's requirement to maintain variables in configuration files, facilitating environment-specific tuning.

**Independent Test**: Can be tested by changing `VITE_TOKEN_EXPIRY_MINUTES` to `5` in `.env.local` and verifying that the client-side expiration timer starts at 5 minutes and triggers a refresh or logout appropriately after that period.

**Acceptance Scenarios**:

1. **Given** a modified `VITE_TOKEN_EXPIRY_MINUTES` value in `.env.local`, **When** the application starts up, **Then** the AuthContext loads this configuration value and enforces it for the client-side countdown and expiration validations.

---

### Edge Cases

- **Concurrent Request Spam**: When a token expires and the user has multiple API requests firing in parallel, the system MUST queue subsequent requests, dispatch exactly **one** refresh API call, and resolve all pending queued requests with the newly retrieved token once it completes.
- **Offline Network during Refresh**: If the background refresh request fails due to network disconnection, the system MUST preserve the local session state (so the user doesn't lose local form drafts) and alert the user via Toast ("Error de conexión al renovar sesión. Reintentando...").
- **Server Session Revocation**: If the administrator revokes the user's session on the backend, the next background refresh MUST fail with `401 Unauthorized`, triggering a clean, immediate logout and redirect.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST implement a silent token refresh mechanism using a centralized Axios interceptor.
- **FR-002**: The Axios client MUST intercept any outgoing request if the access token has expired (according to config), or catch a `401 Unauthorized` response to attempt a token renewal.
- **FR-003**: The background refresh request MUST be dispatched to `POST http://localhost:5043/api/auth/refresh` sending cookies/credentials securely (`withCredentials: true`).
- **FR-004**: While a refresh request is in flight, any subsequent API requests MUST be queued, and once the new token is obtained, they MUST be dispatched with the new `Authorization` Bearer header.
- **FR-005**: On successful refresh response, the system MUST save the new JWT token and update the session timestamp in `localStorage`.
- **FR-006**: On failed refresh response, the system MUST trigger the logout flow, clear `localStorage`, and redirect the user to `/login` with an expiration warning.
- **FR-007**: The token expiration duration in minutes MUST be loaded dynamically from configuration files (`.env.local` via `VITE_TOKEN_EXPIRY_MINUTES`).
- **FR-008**: Testing is explicitly excluded from this specification (no unit/integration tests required for this code), per the user's request.

### Key Entities

- **RefreshTokenSession**: Represents the server-managed refresh session (usually kept in secure HTTP-only cookies on the backend).
- **TokenExpiryConfig**: Represents the configuration schema loading `VITE_TOKEN_EXPIRY_MINUTES` from environment files.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Expired access tokens are silently renewed in under 500ms (excluding network latency) without any page reload or UI flicker.
- **SC-002**: Concurrent API requests (up to 10 simultaneously) trigger exactly **one** refresh request, and all complete successfully.
- **SC-003**: Environment configuration changes to `VITE_TOKEN_EXPIRY_MINUTES` are reflected immediately upon application reload.

## Assumptions

- The backend ASP.NET Core API supports standard silent refresh via `POST /api/auth/refresh` (using secure HTTP-only cookies or standard credentials).
- No tests are required or specified for this feature, per the user's explicit request.
