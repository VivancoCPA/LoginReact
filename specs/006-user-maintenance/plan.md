# Implementation Plan: User Maintenance (Gestión de Usuarios)

**Branch**: `006-user-maintenance` | **Date**: 2026-05-31 | **Spec**: [specs/006-user-maintenance/spec.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/006-user-maintenance/spec.md)

---

## Summary

This plan outlines the design and development of the **User Maintenance (Gestión de Usuarios)** CRUD module inside our authenticated medical platform shell. The module is styled with **Tailwind CSS v4** and supports seamless Light & Dark theme adjustments.

All data queries and mutations are routed to the ASP.NET Core API via our centralized `apiClient` Axios singleton. The UI leverages a compact table layout for data density on desktop viewports, responsive profile grids for cards viewports, and handles CRUD details through sliding right overlays (Drawers) and popup confirmations.

---

## Technical Context

**Language/Version**: React 19, TypeScript 5.0+, Vite

**Primary Dependencies**: Axios (HTTP client), React Router DOM (routing guards), React Hot Toast (success/error alerts), Lucide React (premium UI icons)

**Storage**: `sessionStorage` (for persisting Table $\leftrightarrow$ Cards layout selection across reloads during the session), `localStorage` (for token auth keys)

**Testing**: None (specifically excluded by constraints, focusing entirely on clean production source structures)

**Target Platform**: Desktop, Tablet, and Mobile web browsers (fully responsive layout)

**Project Type**: React Web Application Frontend

**Performance Goals**: Layout mode transitions and filtering updates execute in under 150 milliseconds. Paged database results load and mount in under 1.5 seconds.

**Constraints**:
*   **Max Upload size**: User profile photo file size MUST NOT exceed **2MB**.
*   **Slide-over drawers**: All administrative forms (View, Create, Edit User details) MUST be aligned inside right slide-over panels (**Drawers**).
*   **Row spacing density**: Table row elements must use narrow vertical padding (`py-2`) to maximize information display density.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

*   **I. Token-Based Authentication (JWT Bearer)**: ✅ Yes. Handled via `<ProtectedRoute>` boundaries. Network requests automatically inject tokens.
*   **II. Centralized Axios & Error Handling**: ✅ Yes. Uses `apiClient` singleton. Handles duplicate email conflicts (409 Conflict) and bad requests (400 Bad Request) cleanly in catching blocks.
*   **III. Centralized State (React Context)**: ✅ Yes. Exposes user profiles dynamically, and updates local context caches on successful modifications.
*   **IV. Enterprise Aesthetics (Tailwind CSS v4 & Dark Mode)**: ✅ Yes. Employs collapsible Sidebars, Topbars, and slide-over side Drawers overlapping active views.
*   **V. Decoupled Forms & Validations**: ✅ Yes. Form components inside drawers validate name, surname, and emails in real-time, displaying line error hints.
*   **VI. Identity & Access Management (IAM CRUD)**: ✅ Yes. Fully implements user gov administrative dashboards.

---

## Project Structure

### Documentation (this feature)

```text
specs/006-user-maintenance/
├── spec.md              # Feature specification defining user stories and acceptance rules
├── plan.md              # Technical design plan (this file)
├── research.md          # Phase 0 document detailing API contracts and choices
├── data-model.md        # Phase 1 document detailing state shapes and entity fields
├── quickstart.md        # Phase 1 quickstart guide for launching and validating the module
└── contracts/
    └── users.md         # Documented API bindings and contracts
```

### Source Code Structure

```text
LoginApp/src/
├── types/
│   └── user.ts             # Type definitions for PagedUserItem and PaginatedUsersResult
├── services/
│   ├── apiClient.ts        # Centralized Axios interceptors client
│   └── userService.ts      # Endpoint bindings for GET /auth/users/paged, POST, PUT, and status toggles
├── components/
│   ├── UserDrawer.tsx      # Slide-over Drawer supporting read-only View, validated Edit, and empty Create
│   └── ConfirmDialog.tsx   # destrucive overlay modal prompting for lockout/activation toggles
├── pages/
│   ├── UserMaintenance.tsx # Main dashboard page with search bars, filters, compact table rows, and grids
│   └── Dashboard.tsx
└── App.tsx                 # Mapped protected route `/admin/users` inside MainLayout
```

**Structure Decision**: Standard single project integration. React source code will reside in `LoginApp/src/` with API routing and state services decoupled into their respective directories.

---

## Proposed Changes

### 1. Unified API Services & Schemas

#### [NEW] [user.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/types/user.ts)
*   Expose explicit TypeScript interfaces for paged users and response schemas. Includes `insurances` structure if returned.

#### [NEW] [userService.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/services/userService.ts)
*   Bind endpoint integrations for `/auth/users/paged` (listing, search, sorting), `/users` (extracting groups), `/auth/users` (creating), `/auth/users/{id}` (updating), and `/users/{userId}/toggle-status` (blocking/unblocking).

---

### 2. Main Dashboard & Filters

#### [NEW] [UserMaintenance.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/pages/UserMaintenance.tsx)
*   **Layout switcher**: persistent layout state ('table' vs 'cards') inside `sessionStorage`.
*   **Search bar**: free-text search debounced for 300ms, updating `search` in the paginated API query.
*   **Dynamic Filters**:
    *   *Family Group*: Multi-select selector. Loads from `GET /api/family-groups` on mount. Filters for active groups (`isActive === true`).
    *   *Status*: Isolates Active (not locked out), Inactive (locked out), or All.
*   **Compact Data Table**:
    *   Row elements styled with compact padding (`py-2`) to maximize screen room.
    *   Initials fallback avatar picker.
    *   Sortable column headers for "Nombre" and "Apellido".
*   **Pagination footer**: Displays totals and prev/next page buttons.

---

### 3. Drawer & Avatar Picker Form Elements

#### [NEW] [UserDrawer.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/UserDrawer.tsx)
*   Slide-over panel on the right overlapping views.
*   **Mode Switcher**: Supports `'view' | 'create' | 'edit'` states dynamically.
*   **Avatar Image Picker**:
    *   File select element styled inside a premium image circle container at the top.
    *   Validates image file size: rejects uploads immediately if size exceeds **2MB**.
    *   Initials generator fallback if no URL/file is uploaded.
*   **Family Group Select**: Populates a dynamic select from `GET /api/family-groups` (only active ones), locked as read-only during edit and creation as configured.
*   **Edit Locks**: Email field is locked to read-only during edit mode. Roles and claims are displayed as read-only badges during view mode.

#### [NEW] [ConfirmDialog.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/ConfirmDialog.tsx)
*   Destination modal for deactivation/reactivation toggles.

---

## Verification Plan

### Automated Verification
*   Execute production bundling with `npm run build` inside `LoginApp/` to verify compiler success and type safety.

### Manual Verification
*   Run the development server and verify the following flows:
    1.  **System Theme Check**: Validate light/dark switches.
    2.  **Visual Persistent Layout**: Toggle table $\leftrightarrow$ cards view, reload page, check persistence.
    3.  **Dynamic Family Groups Query**: Verify `/api/family-groups` is queried and only `isActive === true` groups are populated.
    4.  **Row Spacing Check**: Confirm vertical space is maximized.
    5.  **Validation & Upload Restrictions**: Try to pick a >2MB photo; verify the immediate rejection alert. Upload a <2MB photo and verify preview at the top.
    6.  **Administrative Actions**: View read-only data, edit details, lock/unlock and verify statuses.
