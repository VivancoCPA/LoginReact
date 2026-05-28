<!--
Sync Impact Report:
- Version change: 1.0.0 -> 1.1.0
- List of modified principles:
  - IV. Enterprise Aesthetics (Clean & Minimal Vanilla CSS) -> IV. Enterprise Aesthetics (TypeScript & Tailwind CSS v4)
  - V. Decoupled Forms & Validations (updated to require TypeScript types/interfaces)
- Added sections: None
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated)
  - .specify/templates/spec-template.md (✅ updated)
  - .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs: None
-->

# Login JWT System Constitution

## Core Principles

### I. Token-Based Authentication (JWT Bearer)
Authentication MUST use standard JWT Bearer tokens. Tokens received upon successful login or registration MUST be stored securely in localStorage or sessionStorage. All subsequent API calls to external services MUST attach this token in the `Authorization` header as `Bearer <token>`. Upon detecting a 401 Unauthorized response or token expiration, the application MUST clear all authentication state, remove the token from storage, and redirect the user to the login screen.

### II. Centralized Axios & Error Handling
HTTP communications MUST be routed through a centralized Axios client written in TypeScript. This client MUST implement unified interceptors for: (a) injecting the JWT Bearer token into outgoing requests, and (b) intercepting incoming error responses. All network or API errors (e.g., 400 Bad Request, 401 Unauthorized, 403 Forbidden, 500 Internal Server Error) MUST be processed globally, translating technical error payloads into structured, type-safe error objects and user-friendly notifications while preventing unhandled promise rejections.

### III. Centralized State (React Context)
The global authentication state—including the current `user` object, the JWT `token`, `isAuthenticated` flag, and `isLoading` indicator—MUST be managed using React Context. This state must be exposed through a custom, type-safe hook (e.g., `useAuth()`). Page components and routing guards MUST consume this context to make access control decisions (e.g., preventing unauthenticated users from accessing protected views). All user profiles and token representations MUST have explicit TypeScript interfaces.

### IV. Enterprise Aesthetics (TypeScript & Tailwind CSS v4)
The user interface MUST be professional, minimal, and visually stunning. We MUST utilize Tailwind CSS v4 for clean, highly responsive utility styling, leveraging modern CSS-first configurations. The layout MUST use a curated enterprise palette (slate/indigo/gray tones, glassmorphism panels, soft gradients), standard professional typography, and modern interactive transitions. All React components MUST be written in TypeScript, ensuring robust type safety for props, states, and event handlers.

### V. Decoupled Forms & Validations
All inputs in user forms (Login, Registration, Password Recovery) MUST undergo strict client-side validation before dispatching API requests. Form validation rules (e.g., email syntax, password complexity, required fields) MUST be clearly declared in type-safe validation schemas or hooks. Form components must separate UI layout from validation logic and display real-time, helpful error messages. Any server-side validation errors returned by the API MUST be mapped back and displayed on the corresponding form fields.

## Security and Performance Constraints
1. **Token Security**: Tokens MUST NOT be logged or exposed to third-party scripts.
2. **Environment Variable Configuration**: The API base URL (`http://localhost:5043/api/`) and other environment settings MUST be loaded dynamically from environment variables (`.env`).
3. **Lazy Loading**: Authentication routes and dashboards SHOULD be split and loaded lazily using `React.lazy` and `Suspense` to optimize initial bundle sizes.

## Development Workflow & Coding Standards
1. **Folder Organization**: Code must be neatly separated into `src/components`, `src/pages`, `src/services`, `src/context`, `src/types`, and `src/styles`.
2. **File Naming**: Component files must use PascalCase and `.tsx` extension (e.g., `LoginForm.tsx`), while helper scripts, services, and hooks use camelCase and `.ts`/`.tsx` extension (e.g., `apiClient.ts`, `useAuth.tsx`).
3. **Linting & TypeScript Strictness**: Follow strict TypeScript configuration (`tsconfig.json`), modern ECMAScript standards (ES6+), functional components with hooks, and maintain detailed inline documentation for complex logic.

## Governance
All pull requests, modifications, and features developed in this repository MUST comply with these Core Principles. Any deviation requires formal review, update of this Constitution file, and increment of the version number.

**Version**: 1.1.0 | **Ratified**: 2026-05-26 | **Last Amended**: 2026-05-26
