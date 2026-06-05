# Implementation Plan: Doctors Maintenance (Mantenimiento de Médicos)

**Branch**: `012-doctors-maintenance` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/012-doctors-maintenance/spec.md`

---

## Summary

This plan details the implementation of the **Doctors Maintenance (Mantenimiento de Médicos / Cuerpo Médico)** module.
The module will provide:
- A responsive page displaying doctors in Table and Cards layout with fixed viewport height layout (`h-full overflow-hidden flex flex-col`), preventing browser-level window scrolling.
- Real-time search, filters (active/inactive state), and pagination.
- A Slide-Over Drawer panel opening on the right side of the screen for Detail View, Creation, and Edition.
- Tabbed navigation inside the drawer separating "Información General" (Name, Lastname, email, register, specialty, phone, isVet toggle, photo file input) from "Sedes Asociadas" (unlimited medical centers affiliations adding dropdowns, office numbers, and schedules).
- Logical activation/deactivation toggles secured via confirmation dialog overlays, displaying inactive items as dimmed (`opacity-60`) rows or cards.

---

## Technical Context

- **Language/Version**: React 19 + TypeScript + Vite.
- **Primary Dependencies**: Axios + Tailwind CSS v4.
- **Storage**: Centralized REST API endpoints (`/api/doctors`).
- **Testing**: Vite production compilation checks (`npm run build`).
- **Target Platform**: Responsive Web browsers (optimizing layout transitions on desktop, tablet, and mobile).
- **Project Type**: Single-page Web Application.
- **Performance Goals**: Under 1-second load times, debounced search queries (300ms), lightweight page structures.
- **Constraints**: No page-level browser scrollbars, profile photo size limit validation <= 2MB, form updates via FormData (`multipart/form-data`) avoiding base64 conversions.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Token-Based Authentication**: Reuses global authorization interceptors in `apiClient`.
- **Centralized Axios**: Routes endpoints through `apiClient` with proper FormData headers configuration.
- **React Context**: Consumes Auth details via the custom `useAuth()` hook.
- **Enterprise Aesthetics (Tailwind CSS v4 & Dark Mode)**: Uses Slate/Indigo harmonious palettes, support for Dark/Light theme values, slide-over drawer forms, and compact list density.
- **Decoupled Validations**: Inputs validated before dispatching requests, showing inline error messages.

---

## Project Structure

### Documentation (this feature)

```text
specs/012-doctors-maintenance/
├── spec.md              # Functional specification
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Leaflet & lookup API research notes
├── data-model.md        # Data models and validation schemas
└── checklists/
    └── requirements.md  # Spec checklist
```

### Source Code (repository root)

```text
LoginApp/
└── src/
    ├── types/
    │   └── doctor.ts              # [NEW] TypeScript Data Interfaces
    ├── services/
    │   └── doctorService.ts       # [NEW] Axios Service Calls
    ├── components/
    │   └── DoctorDrawer.tsx       # [NEW] Slide-Over Drawer containing Tabbed Form Details
    ├── pages/
    │   └── DoctorMaintenance.tsx  # [NEW] Main Layout Dashboard (fixed height page)
    ├── App.tsx                    # [MODIFY] Register route `/admin/doctors`
    └── components/
        └── Topbar.tsx             # [MODIFY] Register breadcrumb name map
```

**Structure Decision**: Code lives within standard React paths (`src/types`, `src/services`, `src/components`, `src/pages`), mirroring preexisting maintenance dashboard structures.

---

## Verification Plan

### Automated Tests
- Verify TypeScript and Vite bundle production compilation succeeds with no warnings:
  ```bash
  npm run build
  ```

### Manual Verification
1. **Sidebar Navigation**: Click "Médicos" under Administration sidebar, verifying navigation to `/admin/doctors`.
2. **Layout Persist**: Check that switching Table vs Cards persistence functions correctly across session refreshes.
3. **Internal Scroll Check**: Verify that resizing the browser window never introduces full-window browser scrollbars, and that list viewports and drawer sub-sections scroll independently.
4. **Form Validations**: Try submitting a doctor with name < 2 chars, invalid email format, or photo size > 2MB. Verify inline error feedbacks.
5. **Photo File Upload**: Upload a profile picture, submit, and confirm that the image displays correctly at the top of the details drawer (using `getPhotoFullUrl`).
6. **Centers Association Tabs**: Open drawer in creation mode. Navigate to the "Sedes Asociadas" tab, add multiple affiliations, fill office numbers and schedules, save, and confirm that the details are updated.
7. **Toggle Logical Status**: Deactivate a doctor; verify deactivation confirmation modal prompts. Verify that the row appears dimmed (`opacity-60`) and displays a `Desactivado` badge.
