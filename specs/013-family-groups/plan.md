# Implementation Plan: Family Groups (Grupos Familiares)

**Branch**: `013-family-groups` | **Date**: 2026-06-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/013-family-groups/spec.md`

---

## Summary

This plan details the implementation of the **Family Groups (Grupos Familiares)** module.
The module will provide:
- A responsive page displaying family groups in a Card Grid layout with a fixed viewport height layout (`h-full overflow-hidden flex flex-col`), preventing browser-level window scrolling.
- A split layout: 3/4 width for Family Groups dashboard and 1/4 width for the latest Incidents panel (toggled via "Ver Incidentes", persisted in session).
- Direct query logic:
  - Groups created by the logged-in user (Parent/Creator) loaded from `/api/family-groups/paged` and filtered or retrieved directly.
  - Groups where the user is only a member loaded from `/api/family-groups/my`, rendered in a distinct **light green** theme.
  - Real-time search, filters (active/inactive state), and pagination applied across the entire dataset.
- A Slide-Over Drawer panel opening on the right side of the screen for Detail View, Creation, and Edition:
  - **Tab 1: Información General** (Group Name, Avatar file input, logical status toggle).
  - **Tab 2: Miembros (Usuarios del Sistema)** (Search and assign registered system users with a selected relationship and Admin toggle, enforcing a limit of only 1 Parent/Admin per group).
  - **Tab 3: Miembros Extras** (Manage non-system profiles: name, ID document type, description, and profile picture).
- Photo upload using standard `FormData` under the key **`Photo`** as an `IFormFile`, avoiding base64 conversions.
- Logical activation/deactivation confirmation dialog overlays. Inactive groups, members, and extra members are displayed as dimmed (`opacity-60`) and struck-through (`line-through`).

---

## Technical Context

- **Language/Version**: React 19 + TypeScript + Vite.
- **Primary Dependencies**: Axios + Tailwind CSS v4 + React Hot Toast.
- **Storage**: Centralized REST API endpoints:
  - `/api/family-groups` (CRUD + status toggle + members & extra members list)
  - `/api/relationships` (lookup for family relationships)
  - `/api/users` / `/api/auth/users/paged` (lookup for assigning members)
- **Testing**: Vite production compilation checks (`npm run build`).
- **Target Platform**: Responsive Web browsers.
- **Performance Goals**: Page load under 1-second, debounced search (300ms), no global browser scrollbars.
- **Constraints**: 
  - Photos must be sent via `FormData` using `Photo` as the file key. No local base64 representations in `logoUrl` or `photoUrl` JSON properties.
  - Non-creators (regular members) can only view the group details and cannot create, edit, toggle group status, or manage members.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Token-Based Authentication**: Reuses global authorization interceptors in `apiClient` to request endpoints.
- **Centralized Axios**: Routes endpoints through `apiClient` with proper FormData headers configuration.
- **React Context**: Consumes Auth details via the custom `useAuth()` hook.
- **Enterprise Aesthetics (Tailwind CSS v4 & Dark Mode)**: Uses Slate/Indigo/Emerald harmonious palettes, support for Dark/Light theme values, slide-over drawer forms, and compact list density.
- **Decoupled Validations**: Inputs validated before dispatching requests, showing inline error messages.

---

## Project Structure

### Documentation (this feature)

```text
specs/013-family-groups/
├── spec.md              # Functional specification
├── plan.md              # This file
├── research.md          # Endpoints mapping and authorization analysis
├── data-model.md        # TypeScript interfaces and form schemas
└── checklists/
    └── requirements.md  # Spec checklist
```

### Source Code (repository root)

```text
LoginApp/
└── src/
    ├── types/
    │   └── familyGroup.ts          # [NEW] TypeScript Data Interfaces
    ├── services/
    │   └── familyGroupService.ts   # [NEW] Axios Service Calls (Groups, Members, Extras)
    ├── components/
    │   └── FamilyGroupDrawer.tsx   # [NEW] Slide-Over Drawer containing Tabbed Form Sections
    ├── pages/
    │   └── FamilyGroupMaintenance.tsx # [NEW] Main Layout Dashboard (fixed height split page)
    ├── App.tsx                     # [MODIFY] Register route `/patients/family-group`
    └── navigation/
        └── menuConfig.ts           # [MODIFY] Reference correct icons and paths (already registered)
```

**Structure Decision**: Code lives within standard React paths (`src/types`, `src/services`, `src/components`, `src/pages`), matching existing CRUD modules.

---

## Verification Plan

### Automated Tests
- Verify TypeScript and Vite bundle production compilation succeeds with no warnings:
  ```bash
  npm run build
  ```

### Manual Verification
1. **Sidebar Navigation**: Click "Grupo Familiar" under Pacientes sidebar, verifying navigation to `/patients/family-group`.
2. **Dashboard Layout Split**: Check that the screen displays the groups grid on the left (3/4) and the incidents panel on the right (1/4) if enabled. Toggle "Ver Incidentes" and confirm it persists on reload.
3. **Internal Scroll Check**: Verify that resizing the browser window never introduces full-window browser scrollbars, and that list viewports and drawer sub-sections scroll independently.
4. **Member Card Styling**: Confirm that groups where the user is only a member are rendered with a light green background.
5. **Form Validations**: Try submitting a group with name < 2 chars, or assigning multiple Parents in the members tab. Verify inline validation error feedback.
6. **Photo File Upload**: Upload a profile picture for the group or an extra member, submit, and confirm that the image displays correctly (using `getPhotoFullUrl`) and is sent as `Photo` via `FormData`.
7. **Toggle Logical Status**: Deactivate a group or extra member; verify deactivation confirmation modal prompts. Verify that the deactivated card/row appears dimmed (`opacity-60`) and displays a struck-through title.
8. **Permissions Check**: Log in as a member (non-creator) of a group. Verify that "+ Nuevo Grupo", "Editar", "Desactivar" and membership editing controls are hidden/disabled, and only "Ver Detalles" is available.
