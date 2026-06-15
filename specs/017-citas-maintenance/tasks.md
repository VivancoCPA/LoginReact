# Tasks: Citas (Appointments Maintenance)

**Input**: Design documents from `/specs/017-citas-maintenance/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - none requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `LoginApp/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create TypeScript types for appointments and statuses in `LoginApp/src/types/appointment.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Implement Axios services in `LoginApp/src/services/appointmentService.ts` mapping the GET endpoints `/api/appointment-statuses`, `/api/appointments/paged`, and `/api/appointments`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Interactive Search & Filters on Table Grid (Priority: P1) 🎯 MVP

**Goal**: Users can search, filter, and page through their appointments table grid.

**Independent Test**: Navigate to `/patients/appointments` and verify the table loads, sorts, filters, and pages dynamically.

### Implementation for User Story 1

- [x] T003 [US1] Register route `/patients/appointments` in `LoginApp/src/App.tsx` mapping to `AppointmentsMaintenance`
- [x] T003b [US1] Link "Citas" sidebar item to `/patients/appointments` in `LoginApp/src/navigation/menuConfig.ts` and map titles in `LoginApp/src/components/Topbar.tsx`
- [x] T004 [US1] Create page layout and actions bar filter inputs in `LoginApp/src/pages/AppointmentsMaintenance.tsx` (Status select and date calendar picker)
- [x] T005 [US1] Implement appointments table rendering in `LoginApp/src/pages/AppointmentsMaintenance.tsx` showing Fecha, Especialidad, Doctor, Centro Médico, and Estado badge
- [x] T006 [US1] Implement pagination controls and empty-state messaging in `LoginApp/src/pages/AppointmentsMaintenance.tsx` when no results return
- [x] T007 [US1] Implement client-side sorting on click of Especialidad column header in `LoginApp/src/pages/AppointmentsMaintenance.tsx`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Next Confirmed Appointment Highlight (Priority: P2)

**Goal**: Show a highlight card on the header actions bar summarizing details of the single confirmed appointment closest to the current time.

**Independent Test**: Confirm the highlight card displays the closest future confirmed appointment or shows "Sin citas próximas" if none exist.

### Implementation for User Story 2

- [x] T008 [US2] Implement next confirmed appointment selector query and render it as a highlighted summary card on the actions bar header in `LoginApp/src/pages/AppointmentsMaintenance.tsx`

**Checkpoint**: User Stories 1 AND 2 are fully functional and integrated.

---

## Phase 5: User Story 3 - Medical Center Location Viewer (Priority: P3)

**Goal**: View facility geographic coordinates on a visual map layout screen when clicking a medical center link.

**Independent Test**: Click on a medical center name, verify it redirects to `/patients/appointments/map` showing correct coordinates and info detail panel.

### Implementation for User Story 3

- [x] T009 [P] [US3] Register `/patients/appointments/map` route in `LoginApp/src/App.tsx` mapping to `AppointmentsMap`
- [x] T010 [P] [US3] Create visual map coordinate center component with address info details in `LoginApp/src/pages/AppointmentsMap.tsx`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: General verification, code cleanup, and production compilation validation.

- [x] T011 [P] Verify Vite production compilation succeeds by running `npm run build` from `LoginApp/`
- [x] T012 Run `specs/017-citas-maintenance/quickstart.md` validation checklist to verify final UX and accessibility details

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) is the MVP and must be completed first
  - User Story 2 (P2) depends on User Story 1 (incorporating filter layouts)
  - User Story 3 (P3) depends on User Story 1 (triggers from center links)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently (MVP!)
3. Add User Story 2 → Test next appointment highlight
4. Add User Story 3 → Test coordinates map view
5. Run final build and validation
