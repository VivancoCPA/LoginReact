# Implementation Plan: User Scope Management

**Branch**: `014-user-scope-management` | **Date**: 2026-06-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-user-scope-management/spec.md`

---

## Summary

This plan details the implementation of **User Scope Management (Gestión de Scope de Usuarios)** features:
1. **Header Profile Updates**: Show user profile picture (avatar) and primary role name in `Topbar.tsx` and its dropdown menu.
2. **Profile Avatar Uploads**: Update `ProfileDrawer.tsx` to support avatar uploading (<= 2MB, JPG/PNG, FormData) matching the user creation drawer rules.
3. **Admin User Scope Association**: Add a slide-over drawer `UserScopeDrawer.tsx` accessible only by users with the `Admin` role to select and associate users who do not have an active administrator scope.
4. **Scope Disassociation**: Add disassociation actions in the User Maintenance dashboard (for `Admin` role only), calling `DELETE /api/users/{adminId}/scope/{userId}` after a confirmation dialog overlay.
5. **Access Control (RBAC)**: Ensure that `SuperAdmin` and `Admin` permissions are strictly checked and enforced.

---

## Technical Context

- **Language/Version**: React 19 + TypeScript + Vite.
- **Primary Dependencies**: Axios + Tailwind CSS v4 + React Hot Toast.
- **Storage**: Centralized REST API endpoints:
  - `POST /api/users/{adminId}/scope/{userId}` (scope association)
  - `DELETE /api/users/{adminId}/scope/{userId}` (scope disassociation)
  - `GET /api/users/{adminId}/scopes` (list administrator's scoped users)
  - `GET /api/users` (list users for matching scopeless)
  - `GET /api/users/{userId}` (get user details for own profile data)
- **Testing**: Vite production compilation checks (`npm run build`).
- **Target Platform**: Responsive Web browsers.
- **Constraints**: 
  - Photos must be sent via `FormData` using `photo` as the file key. Max file size 2MB.
  - SuperAdmin cannot access Scope Association or Scope Disassociation (operates globally).
  - Admin cannot disassociate themselves from their own scope.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Token-Based Authentication**: Reuses global authorization token in `apiClient` to request endpoints.
- **Centralized Axios**: Routes endpoints through `apiClient`.
- **React Context**: Consumes and updates Auth details via `AuthContext` (exposed via `useAuth()`). User session holds `photoUrl` and `roles`.
- **Enterprise Aesthetics (Tailwind CSS v4 & Dark Mode)**: Uses sliding drawer (`UserScopeDrawer.tsx`) to manage scopeless user association. Displays circular avatar images or falls back to initials with dynamic background colors.
- **Decoupled Validations**: Inputs validated before dispatching requests, showing inline error messages.
- **RBAC**: Enforces role checks in `Topbar.tsx`, `UserMaintenance.tsx`, and sidebar layout visibility.

---

## Project Structure

### Documentation (this feature)

```text
specs/014-user-scope-management/
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
    │   └── auth.ts                 # [MODIFY] Add photoUrl and roles to User type
    ├── context/
    │   └── AuthContext.tsx         # [MODIFY] Background fetch profile details on init / login
    ├── components/
    │   ├── Topbar.tsx              # [MODIFY] Render own avatar image and role name
    │   ├── ProfileDrawer.tsx       # [MODIFY] Add avatar image selector & upload logic
    │   └── UserScopeDrawer.tsx     # [NEW] Slide-over drawer to search & associate scopeless users
    └── pages/
        └── UserMaintenance.tsx     # [MODIFY] Render disassociate actions, confirmation, and drawer trigger
```

**Structure Decision**: Code changes are encapsulated within the standard frontend architecture directories (`types`, `context`, `components`, `pages`).

---

## Verification Plan

### Automated Tests
- Verify TypeScript and Vite bundle production compilation succeeds with no warnings:
  ```bash
  npm run build
  ```

### Manual Verification
1. **Header Details**: Log in, verify that the Topbar displays user avatar (or fallback initials) and role. Open dropdown, verify name, email, and role badge.
2. **Profile Avatar Upload**: Open "Modificar Perfil", choose photo, save, and verify that the topbar photo updates immediately. Test file size validator (>2MB) to verify validation works.
3. **Scope Association drawer**: Log in as `Admin`, click "Asociar Usuarios al Scope", verify the drawer lists users without any scope, select a user, associate them, and verify that they are added to the list.
4. **Scope Disassociation action**: Log in as `Admin`, find a user in the maintenance grid, click "Desasociar", confirm the modal, and verify the user is removed from the grid.
5. **SuperAdmin Permission Checks**: Log in as `SuperAdmin`, verify that no scope association button or disassociation actions are visible, and check that global CRUD options (Create, Edit, Roles) remain functional.
