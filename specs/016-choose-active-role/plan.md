# Implementation Plan: Active Role Selection

**Branch**: `016-choose-active-role` | **Date**: 2026-06-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/016-choose-active-role/spec.md` and [UsersEndpoints.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/UsersEndpoints.md)

---

## Summary

This plan details the implementation of **Active Role Selection (Selección de Rol Activo)**:
1. **Context & Types**: Extend `User` and `AuthState` structures in `types/auth.ts` and `AuthContext.tsx` to handle `activeRole` state and its local persistence.
2. **Routing & Guards**: Update `App.tsx` routing layout to register a standalone `/choose-role` route and enforce selection using a path interceptor guard on authenticated users (blocking entry for multi-role users with unset active role, and users with zero roles).
3. **Selection Interface**: Implement a beautiful, standalone card interface screen `ChooseRole.tsx` where users can select an active role.
4. **Layout Filtering**: Refine `Topbar.tsx` to display the active role name and `Sidebar.tsx` to filter menu links based on the session's active role.

---

## Technical Context

- **Language/Version**: React 19 + TypeScript + Vite.
- **Primary Dependencies**: React Router Dom + Tailwind CSS v4 + Lucide React (or SVG icons).
- **Storage**: Browser `localStorage` (`auth_active_role`) for persistence across sessions.
- **Testing**: Vite production compilation checks (`npm run build`).
- **Target Platform**: Responsive Web browsers.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Token-Based Authentication**: Reuses global authorization token in `apiClient`.
- **Centralized State (React Context)**: Exposes `activeRole` and `setActiveRole` via the `useAuth()` hook.
- **Enterprise Aesthetics (Tailwind CSS v4 & Dark Mode)**: Implement the `/choose-role` screen with glassmorphism layout card panels matching the existing login screen layout.
- **RBAC**: Controls system capabilities dynamically based on the current selected active role.

---

## Project Structure

### Documentation (this feature)

```text
specs/016-choose-active-role/
├── spec.md              # Functional specification
├── plan.md              # This file
├── research.md          # Endpoints mapping and authorization analysis
├── data-model.md        # TypeScript interfaces and form schemas
├── quickstart.md        # Feature validation quickstart guide
└── contracts/
    └── ui-contracts.md  # UI component parameters and actions layout
```

### Source Code (repository root)

```text
LoginApp/
└── src/
    ├── types/
    │   └── auth.ts                 # [MODIFY] Add activeRole to AuthState
    ├── context/
    │   └── AuthContext.tsx         # [MODIFY] Expose activeRole & handle persistence/auto-assignment
    ├── components/
    │   ├── Topbar.tsx              # [MODIFY] Render active role name instead of roles[0]
    │   └── Sidebar.tsx             # [MODIFY] Filter menu items exclusively by activeRole
    ├── pages/
    │   └── ChooseRole.tsx          # [NEW] Active role selection view card screen
    └── App.tsx                     # [MODIFY] Add choose-role route and secure via ProtectedRoute
```

**Structure Decision**: Code changes are encapsulated within standard frontend structures (`types`, `context`, `components`, `pages`).

---

## Proposed Changes

### Types

#### [MODIFY] [auth.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/types/auth.ts)
- Extend `AuthState` to include `activeRole: string | null`.

### Context

#### [MODIFY] [AuthContext.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/context/AuthContext.tsx)
- Expose `activeRole` and `setActiveRole` in `AuthContextType`.
- Initialize `activeRole` state on restoration from `localStorage.getItem('auth_active_role')`.
- On login/init restoration, if the user only has **one** role, set `activeRole` automatically to that role.
- Provide `setActiveRole` method that updates state and sets `localStorage.setItem('auth_active_role', role)`.
- On logout, clean `localStorage.removeItem('auth_active_role')`.

### Routing

#### [MODIFY] [App.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/App.tsx)
- Mount `ChooseRole` page as a route: `<Route path="/choose-role" element={<ProtectedRoute><ChooseRole /></ProtectedRoute>} />`.
- Update `ProtectedRoute`:
  - If user is authenticated, password is confirmed, and has either multiple roles (with `activeRole` null) or zero roles: redirect to `/choose-role`.
  - If user attempts to access `/choose-role` but has already chosen their active role (or has exactly one role), redirect to `/dashboard`.

### Layouts & Components

#### [MODIFY] [Topbar.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/Topbar.tsx)
- Destructure `activeRole` from `useAuth()`.
- Replace `user.roles[0]` reference with `activeRole` (fall back to `'Usuario'`).

#### [MODIFY] [Sidebar.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/Sidebar.tsx)
- Filter `menuConfig` item visibility strictly by matching `item.roles.includes(activeRole)` rather than any of the user's role list.

### Pages

#### [NEW] [ChooseRole.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/pages/ChooseRole.tsx)
- Renders a clean card list of roles (Admin, SuperAdmin, User, etc.) with custom description strings or badges.
- When clicked, saves the selected role via `setActiveRole` and redirects to `/dashboard`.
- If the user has zero roles, display the error card: "No tiene Rol asignado. Por favor, comuníquese con el Administrador." and disable the selection card items.
- Renders a Logout button linking to the Auth context's `logout()` method.

---

## Verification Plan

### Automated Tests
- Verify TypeScript and Vite bundle production compilation succeeds:
  ```bash
  npm run build
  ```

### Manual Verification
1. **Single-Role Flow**: Log in with a single-role user, verify they bypass the selection screen and enter the app directly.
2. **Multi-Role Flow**: Log in with a multi-role user, verify redirect to `/choose-role`.
3. **Zero-Role Flow**: Log in with a user who has no roles, verify they are redirected to `/choose-role` and see the message: "No tiene Rol asignado. Por favor, comuníquese con el Administrador."
3. **Guards Verification**: Manually typing other dashboard URLs while active role is unset forces redirect back to `/choose-role`.
4. **Role Selection**: Select a role, check the Topbar role badge matches, and verify sidebar menus filter matching links.
5. **Reload Persistence**: Refresh the browser and verify the chosen role persists.
6. **Logout**: Click Logout from the choose-role screen and confirm redirection to login.
