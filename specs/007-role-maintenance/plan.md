# Implementation Plan: Role Maintenance (Mantenimiento de Roles)

**Branch**: `007-role-maintenance` | **Date**: 2026-06-02 | **Spec**: [specs/007-role-maintenance/spec.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/007-role-maintenance/spec.md)

**Input**: Feature specification from `/specs/007-role-maintenance/spec.md`

---

## Summary

This plan details the technical architecture and frontend implementation for the **Role Maintenance (Mantenimiento de Roles)** CRUD console. 

The console will be built on our Vite-React-TypeScript foundation using **Tailwind CSS v4** utilities, fully supporting Light/Dark theme responsiveness. All state bindings, layout toggles (Table vs Cards Grid), and active query filters are managed locally. Role creation and updates will slide over inside standard right Drawers (`RoleDrawer.tsx`) rather than redirecting, maintaining precise design system symmetry with `UserDrawer.tsx`.

---

## Technical Context

**Language/Version**: React 19, TypeScript 5.0+, Vite

**Primary Dependencies**: Axios (HTTP client), React Router DOM (routing context), React Hot Toast (visual alerts), Lucide React (vector icons)

**Storage**: `sessionStorage` (for persisting Table $\leftrightarrow$ Cards layout preference `rolesLayoutSelection` across reloads during the session)

**Testing**: None (manually validated via production compilation checks)

**Target Platform**: Responsive Web (Desktop, Tablet, Mobile)

**Project Type**: React Web Frontend Single Page Application (SPA)

**Performance Goals**: Search/filter results update in <150ms. Page layout flips in <100ms.

**Constraints**:
*   **Slide-Over Drawers**: Creation and Edit forms MUST overlap the active view in a right-aligned sliding Drawer.
*   **Deletion Restriction**: Deletion of a role MUST be blocked or restricted if `assignedUsersCount > 0` or if the role is a core protected system role (`isSystemRole === true`).

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

*   **I. Token-Based Authentication (JWT Bearer)**: ✅ Yes. The route `/admin/roles` is nested inside `<ProtectedRoute>` which automatically attaches Bearer tokens in Axios headers.
*   **II. Centralized Axios & Error Handling**: ✅ Yes. All API interactions are routed through `apiClient` in `roleService.ts`, capturing 409 duplicate conflicts or bad requests gracefully.
*   **III. Centralized State (React Context)**: ✅ Yes. Hooks into authorization claims from `AuthContext` to secure administrative routes.
*   **IV. Enterprise Aesthetics & Responsive Layout (Tailwind CSS v4 & Dark Mode)**: ✅ Yes. Incorporates sidebars, slide-over panels, grid layouts, HSL palettes, and theme toggling.
*   **V. Decoupled Forms & Validations**: ✅ Yes. `RoleDrawer` isolates layout from required validation constraints, checking minimum length and displaying inline fields warning tags.
*   **VI. Identity & Access Management (IAM CRUD)**: ✅ Yes. Directly implements core Role Administration CRUD.

---

## Project Structure

### Documentation (this feature)

```text
specs/007-role-maintenance/
├── spec.md              # Functional specification defining requirements & constraints
├── plan.md              # Technical design plan (this file)
├── research.md          # Technical analysis, API routes, and architectural decisions
├── data-model.md        # State shapes, typescript models, and validation rules
├── quickstart.md        # Step-by-step verification guide
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code

The new components and service bindings will be created directly within the existing React structure:

```text
LoginApp/src/
├── types/
│   └── role.ts             # [NEW] RoleItem and CRUD payloads interfaces
├── services/
│   └── roleService.ts      # [NEW] Global API requests for /api/roles
├── components/
│   └── RoleDrawer.tsx      # [NEW] Right slide-over Drawer for Role Creation & Edit
├── pages/
│   └── RoleMaintenance.tsx # [NEW] Roles dashboard console (Table / Grid, Search)
└── App.tsx                 # [MODIFY] Inject route /admin/roles inside MainLayout
```

**Structure Decision**: Integrated Single Project structure. All types, services, pages, and components decouple functionality clean and modular.

---

## Proposed Changes

### 1. Types & Services Layer

#### [MODIFY] [role.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/types/role.ts)
*   Define type interfaces for the Roles schema including status and timestamps:
    ```typescript
    export interface RoleItem {
      id: string;
      name: string;
      description?: string;
      isActive: boolean;
      createdAt?: string;
      assignedUsersCount: number;
      isSystemRole?: boolean;
    }
    export interface UpdateRolePayload {
      roleName: string;
      description: string;
      isActive: boolean;
    }
    ```

#### [MODIFY] [roleService.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/services/roleService.ts)
*   Implement Axios bindings hitting `/api/roles` endpoints:
    ```typescript
    import { apiClient } from './apiClient';
    import type { RoleItem, UpdateRolePayload } from '../types/role';

    export const roleService = {
      async getRoles(): Promise<RoleItem[]> {
        const response = await apiClient.get<RoleItem[]>('/roles');
        return response.data;
      },
      async updateRole(id: string, payload: UpdateRolePayload): Promise<RoleItem> {
        const response = await apiClient.put<RoleItem>(`/roles/${id}`, payload);
        return response.data;
      },
      async toggleRoleStatus(id: string): Promise<{ id: string; name: string; isActive: boolean; status: string }> {
        const response = await apiClient.patch<{ id: string; name: string; isActive: boolean; status: string }>(`/roles/${id}/toggle-status`);
        return response.data;
      }
    };
    ```

---

### 2. Layout, Drawer & Form Elements

#### [NEW] [RoleDrawer.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/RoleDrawer.tsx)
*   Right-aligned slide-over Drawer overlapping the view.
*   **Props**: `isOpen: boolean`, `onClose: () => void`, `mode: 'create' | 'edit'`, `role: RoleItem | null`, `onSaveSuccess: () => void`.
*   **Validations**:
    *   Name: Mandatory, minimum 3 characters.
    *   Description: Optional, maximum 250 characters.
*   **Protected states**: If `role.isSystemRole` is true, the Name input field is locked to read-only during edit mode to prevent critical renaming errors.

#### [NEW] [RoleMaintenance.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/pages/RoleMaintenance.tsx)
*   Main administrative console page.
*   **Header Section**: Search input bar, "+ Nuevo Rol" primary CTA, and layout selector icons (Table / Cards).
*   **Table View**:
    *   Responsive, high-density HTML table with ordered header buttons on "Nombre" and "Asignados".
    *   Includes an action column with an edit icon triggering `RoleDrawer` in `'edit'` mode.
*   **Cards Grid View**:
    *   Flex-grid layout adapting structure responsively (`1` to `3` columns).
    *   Displays Name, User count, and a vertical dots dropdown actions menu (⋮) containing the "Editar" option.
*   **Status Toggle Guards**: Includes an explicit safety lockout. The deactivation action (via toggle) is blocked or restricted if a role has active users or is a core protected system role.

---

### 3. Route Injection

#### [MODIFY] [App.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/App.tsx)
*   Import `RoleMaintenance` page component lazily or directly.
*   Map route path `/admin/roles` nested inside authenticated `MainLayout`:
    ```tsx
    <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin/users" element={<UserMaintenance />} />
      <Route path="/admin/roles" element={<RoleMaintenance />} />
    </Route>
    ```

---

## Verification Plan

### Automated Verification
*   Run Vite compiler check in the `LoginApp` directory to verify there are zero compilation errors:
    ```bash
    npm run build
    ```

### Manual Verification
Perform checks following [quickstart.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/007-role-maintenance/quickstart.md) instructions:
1.  **Sidebar Links**: Click Administration $\rightarrow$ Roles; verify route `/admin/roles` loads correctly.
2.  **View Toggle**: Flip layout Table $\leftrightarrow$ Cards; refresh page to confirm persistency.
3.  **Search Input**: Type name query; verify real-time list filtering.
4.  **Creation Validations**: Attempt to create roles with short names; confirm inline warnings.
5.  **Edit Guards**: Edit name of a protected role (e.g. `Admin`); confirm renaming is locked/read-only.
