# Implementation Plan: Appointments Maintenance (Mantenimiento de Citas)

**Branch**: `017-citas-maintenance` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/017-citas-maintenance/spec.md`, `AppointmentsEndpoints.md`, and `AppointmentStatusesEndpoints.md`

---

## Summary

This plan details the implementation of the **Appointments Maintenance (Mantenimiento de Citas)** module, exposing a dashboard for users to review, search, filter, and page their appointments schedule.
1. **API Integration**: Create Axios client handlers for listing, paging, and managing appointment statuses.
2. **Dashboard Layout**: Build a responsive dashboard matching the corporate light/dark glassmorphic aesthetic using Tailwind CSS v4.
3. **Next Confirmed Appointment Highlight**: Fetch confirmed appointments and calculate the nearest upcoming meeting dynamically.
4. **Geographic Map Route**: Create a secondary screen depicting facility location coordinates on a mock map layout.
5. **Route Registration**: Mount paths `/patients/appointments` and `/patients/appointments/map` inside routing configurations.

---

## Technical Context

- **Language/Version**: React 19 + TypeScript + Vite.
- **Primary Dependencies**: React Router Dom + Axios + Tailwind CSS v4 + Lucide Icons (or custom SVGs).
- **Storage**: Backend endpoints via `apiClient`.
- **Testing**: Vite production compilation checks (`npm run build`).
- **Target Platform**: Desktop & Mobile Web browsers.
- **Project Type**: Web Application.
- **Performance Goals**: Table filtering response time < 500ms; map coordinates loading < 1 second.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Token-Based Authentication**: Attaches JWT Bearer header automatically via `apiClient`.
- **Centralized Axios Interceptor**: Integrates error handler structures for failed endpoints mapping.
- **React Context State**: Authenticated user claims determine routing.
- **Enterprise Aesthetics (Tailwind CSS v4 & Dark Mode)**: Uses slate/indigo palettes, glassmorphism card panels, standard table structures, and responsive layouts.
- **Decoupled Validations**: Client filters are fully controlled inputs.

---

## Project Structure

### Documentation (this feature)

```text
specs/017-citas-maintenance/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
LoginApp/
└── src/
    ├── types/
    │   └── appointment.ts               # [NEW] Types for Appointment and Statuses
    ├── services/
    │   └── appointmentService.ts        # [NEW] Endpoints calls and data fetching
    ├── pages/
    │   ├── AppointmentsMaintenance.tsx  # [NEW] Appointments table dashboard page
    │   └── AppointmentsMap.tsx          # [NEW] Visual coordinates map view page
    └── App.tsx                          # [MODIFY] Register routing paths
```

**Structure Decision**: Code changes are fully modularized and encapsulated within the existing front-end directory structure (`types`, `services`, `pages`).

---

## Proposed Changes

### 1. Type Definitions

#### [NEW] [appointment.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/types/appointment.ts)
- Define `AppointmentStatus`, `AppointmentItem`, and `PagedAppointmentResult` interfaces as specified in `data-model.md`.

### 2. Service Layer

#### [NEW] [appointmentService.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/services/appointmentService.ts)
- Implement endpoint calls mapping the backend appointments API slice:
  - `getStatuses()`: Call `GET /api/appointment-statuses`.
  - `getPagedAppointments(params)`: Call `GET /api/appointments/paged` passing page, size, status, and date.
  - `getAllAppointments(params)`: Call `GET /api/appointments` for unfiltered status arrays.

### 3. Navigation & Routing

#### [MODIFY] [App.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/App.tsx)
- Register route `/patients/appointments` mapping to `AppointmentsMaintenance`.
- Register route `/patients/appointments/map` mapping to `AppointmentsMap`.
- Ensure routes are protected by `<ProtectedRoute>`.

#### [MODIFY] [menuConfig.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/navigation/menuConfig.ts)
- Update "Citas" submenu path from `/medical/appointments` to `/patients/appointments` to link the new screen to the sidebar navigation.

#### [MODIFY] [Topbar.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/Topbar.tsx)
- Map path `/patients/appointments` to header title `"Agenda de Citas"` and path `/patients/appointments/map` to header title `"Geolocalización de Centro"`.

### 4. UI Components & Pages

#### [NEW] [AppointmentsMaintenance.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/pages/AppointmentsMaintenance.tsx)
- **Header Section**: Render page title, `+ Nueva Cita` primary button, and **Next Confirmed Appointment** summary card (which displays upcoming meeting metadata, or fallback text).
- **Filter Action Bar**: 
  - Dynamic status dropdown selector loaded from `appointmentService.getStatuses()`.
  - Calendar date selector filtering list by the chosen date.
- **Table Grid**:
  - Show list of columns: Date (formatted `dd/mm/yyyy` with small time on second line), Specialty (sortable), Doctor (with photo or initials fallback), Medical Center (interactive link), Status (color-coded badges), and Action Icons (non-functional).
  - Implement client-side sorting on click of Specialty header column.
  - Render an illustration empty state when filters return no records.
  - Append a responsive pagination control footer.

#### [NEW] [AppointmentsMap.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/pages/AppointmentsMap.tsx)
- Create a visual location page that reads coordinate parameters (`latitude`, `longitude`, `name`) from router location state or query params.
- Display a clean corporate map grid illustration, crosshair cursor centered on coordinates, and facility info panel (Address, Latitude, Longitude, and Center Name).
- Provide a navigation button to return to the list view.

---

## Verification Plan

### Automated Tests
- Validate TypeScript and bundle compilation succeeds by running:
  ```bash
  npm run build
  ```

### Manual Verification
1. **Sidebar Navigation**: Navigating to `/patients/appointments` loads appointments page skeleton.
2. **Filters & Dropdowns**: Changing status filters updates the table records. Selecting dates on the calendar picker updates lists accordingly.
3. **Column Rendering & Sorting**: Dates display in `dd/mm/yyyy` format. Specialties sort alphabetically on click. Doctors show initials or pictures correctly.
4. **Interactive Map Link**: Clicking a facility link navigates to `/patients/appointments/map`, centering coordinates, showing correct crosshairs, and returning on "Volver" click.
5. **Next Appointment Summary**: Confirmed future meeting displays correctly in the highlight card.
6. **Empty State**: Banners and illustrations render correctly when searches return zero rows.
