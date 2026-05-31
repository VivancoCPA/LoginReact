<!--
Sync Impact Report:
- Version change: 1.1.0 -> 1.2.0
- List of modified principles:
  - IV. Enterprise Aesthetics (TypeScript & Tailwind CSS v4) -> IV. Enterprise Aesthetics & Responsive Layout (Tailwind CSS v4 & Dark Mode)
- Added sections:
  - VI. Identity & Access Management (IAM CRUD)
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ aligned)
  - .specify/templates/spec-template.md (✅ aligned)
  - .specify/templates/tasks-template.md (✅ aligned)
- Follow-up TODOs: None
-->

# Identity & Access Management (IAM) System Constitution

## Core Principles

### I. Token-Based Authentication (JWT Bearer)

Authentication MUST use standard JWT Bearer tokens. Tokens received upon successful login or registration MUST be stored securely in localStorage or sessionStorage. All subsequent API calls to external services MUST attach this token in the `Authorization` header as `Bearer <token>`. Upon detecting a 401 Unauthorized response or token expiration, the application MUST clear all authentication state, remove the token from storage, and redirect the user to the login screen.

### II. Centralized Axios & Error Handling

HTTP communications MUST be routed through a centralized Axios client written in TypeScript. This client MUST implement unified interceptors for: (a) injecting the JWT Bearer token into outgoing requests, and (b) intercepting incoming error responses. All network or API errors (e.g., 400 Bad Request, 401 Unauthorized, 403 Forbidden, 500 Internal Server Error) MUST be processed globally, translating technical error payloads into structured, type-safe error objects and user-friendly notifications while preventing unhandled promise rejections.

### III. Centralized State (React Context)

The global authentication state—including the current `user` object, the JWT `token`, `isAuthenticated` flag, and `isLoading` indicator—MUST be managed using React Context. This state must be exposed through a custom, type-safe hook (e.g., `useAuth()`). Page components and routing guards MUST consume this context to make access control decisions (e.g., preventing unauthenticated users from accessing protected views). All user profiles and token representations MUST have explicit TypeScript interfaces.

### IV. Enterprise Aesthetics & Responsive Layout (Tailwind CSS v4 & Dark Mode)

The user interface MUST be professional, clean, minimal, and visually stunning. We MUST utilize Tailwind CSS v4 for clean, highly responsive utility styling, leveraging modern CSS-first configurations. The layout MUST support both **Dark and Light modes** out-of-the-box on all components, maintaining a harmonious, premium color palette (slate/indigo/gray tones, glassmorphism panels, soft gradients), and modern interactive transitions.

All UI components MUST be written in modern, clean React and TypeScript, ensuring robust type safety and excellent legibility for future manual maintenance. Primary application layout MUST implement a **collapsible Sidebar Layout** for main navigation. Creation and editing of database entities (e.g., users) inside dense maintenance tables MUST NOT redirect to separate pages; instead, they MUST utilize sliding slide-over side panels (**Drawers**) overlapping the active table view to optimize screen workspace.

### V. Decoupled Forms & Validations

All inputs in user forms (Login, Registration, Password Recovery, Create/Edit User Drawers) MUST undergo strict client-side validation before dispatching API requests. Form validation rules (e.g., email syntax, password complexity, required fields) MUST be clearly declared in type-safe validation schemas or hooks. Form components must separate UI layout from validation logic and display real-time, helpful error messages. Any server-side validation errors returned by the API MUST be mapped back and displayed on the corresponding form fields.

### VI. Identity & Access Management (IAM CRUD)

The scope of the project is a complete **Identity & Access Management (IAM) Module**. The system MUST include a comprehensive User Management dashboard supporting full Create, Read, Update, and Delete/Toggle-Status (CRUD) operations, managed dynamically via **Roles and Permissions**. Access to the IAM administration views or individual operations MUST be strictly governed by role-based access control (RBAC), verifying that the current authenticated session possesses appropriate claims before executing API queries or mounting specific UI modules.

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

**Version**: 1.2.0 | **Ratified**: 2026-05-26 | **Last Amended**: 2026-05-28
