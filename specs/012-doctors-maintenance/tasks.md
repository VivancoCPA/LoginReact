# Tasks: Doctors Maintenance (Mantenimiento de Médicos)

**Input**: Design documents from `/specs/012-doctors-maintenance/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Contains exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 [P] Define TypeScript interfaces in `LoginApp/src/types/doctor.ts`
- [ ] T002 Register doctor routes in Topbar breadcrumbs mapping in `LoginApp/src/components/Topbar.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core client service layer that MUST be complete before ANY user story can be implemented

- [ ] T003 Create Axios endpoint bindings in `LoginApp/src/services/doctorService.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Doctor Listing and Filtering (Priority: P1) 🎯 MVP

**Goal**: Display lists of doctors (table and cards) with debounced search, active/inactive filters, and pagination.

**Independent Test**: Navigate to `/admin/doctors`, verify page fits inside viewport, test layout toggle (persists on session reload), type search text, select filters, and confirm the list filters correctly.

### Implementation for User Story 1

- [ ] T004 [P] [US1] Register route `/admin/doctors` in `LoginApp/src/App.tsx` pointing to `<DoctorMaintenance />` page
- [ ] T005 [US1] Create the fixed-height page layout skeleton in `LoginApp/src/pages/DoctorMaintenance.tsx`
- [ ] T006 [US1] Implement Search bar and Status filter tabs in `LoginApp/src/pages/DoctorMaintenance.tsx`
- [ ] T007 [US1] Implement Table view rendering with circular avatar, name, last name, specialty, and register columns in `LoginApp/src/pages/DoctorMaintenance.tsx`
- [ ] T008 [US1] Implement Card grid view rendering displaying detailed contact info, register details, isVet indicator, and status badge in `LoginApp/src/pages/DoctorMaintenance.tsx`
- [ ] T009 [US1] Implement pagination footer control and hook state bindings in `LoginApp/src/pages/DoctorMaintenance.tsx`
- [ ] T010 [US1] Integrate `sessionStorage` layout persistence key `doctorsLayoutSelection` in `LoginApp/src/pages/DoctorMaintenance.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (MVP ready)

---

## Phase 4: User Story 2 - Register Doctor with Photo and Affiliations (Priority: P2)

**Goal**: Onboard new doctors or edit existing records including profile image uploads and managing multiple medical center affiliations inside a tabbed drawer.

**Independent Test**: Open creation drawer, type details, upload photo (verifying preview), navigate to affiliations tab to link multiple medical centers (with office numbers and schedules), click save, and verify that the doctor shows up with their avatar and associated centers.

### Implementation for User Story 2

- [ ] T011 [P] [US2] Setup `DoctorDrawer.tsx` form state and layout structure using `max-w-2xl` drawer in `LoginApp/src/components/DoctorDrawer.tsx`
- [ ] T012 [US2] Implement Tabbed navigation inside `DoctorDrawer.tsx` containing "Información General" and "Sedes Asociadas" tabs
- [ ] T013 [US2] Implement avatar image picker, size limit validation (<= 2MB), preview circular thumbnail, and base fallback initials generator in `LoginApp/src/components/DoctorDrawer.tsx`
- [ ] T014 [US2] Implement general info inputs (Name, Lastname, email, register, phone, isVet toggle, isActive) with inline validation schemas in `LoginApp/src/components/DoctorDrawer.tsx`
- [ ] T015 [US2] Implement affiliated medical centers sub-form in `DoctorDrawer.tsx`, loading center options from `medicalCenterService.getMedicalCentersLookup()` and allowing adding/removing dynamic rows with office numbers and schedules
- [ ] T016 [US2] Implement Create (POST) payload packaging using `FormData` with binary photo and nested array indices (`centers[i].id`) in `LoginApp/src/components/DoctorDrawer.tsx`
- [ ] T017 [US2] Implement Update (PUT) payload packaging using `FormData` in `LoginApp/src/components/DoctorDrawer.tsx`
- [ ] T018 [US2] Bind view details mode and drawer open triggers inside `LoginApp/src/pages/DoctorMaintenance.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work together

---

## Phase 5: User Story 3 - Toggle Doctor Logical Status (Priority: P2)

**Goal**: Deactivate or activate a doctor logically, showing confirmation overlays and styling deactivated list items as dimmed (opacity-60) with strike-through names and a "Desactivado" status badge.

**Independent Test**: Deactivate a doctor, verify that the Confirmation Dialog modal pops up, confirm the action, and verify that the row/card becomes dimmed with a "Desactivado" badge and strike-through name.

### Implementation for User Story 3

- [ ] T019 [US3] Add logical deactivation/activation trigger bindings using the `ConfirmDialog` component in `LoginApp/src/pages/DoctorMaintenance.tsx`
- [ ] T020 [US3] Implement dynamic CSS class bindings to dim list rows and cards and apply strike-through name fonts for deactivated records in `LoginApp/src/pages/DoctorMaintenance.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanups, build validations, and handbook verification.

- [ ] T021 [P] Run `npm run build` from `LoginApp/` to verify production compilation with zero errors
- [ ] T022 Validate manual quickstart guide scenarios in `specs/012-doctors-maintenance/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User Story 1 (P1) is the MVP and should be completed first.
  - User Story 2 (P2) can start after US1 is functional.
  - User Story 3 (P2) can start after US1 is functional.
- **Polish (Phase 6)**: Depends on all user stories being complete.

---

## Parallel Opportunities

- T001 and T002 can run in parallel.
- T011 and T004 can run in parallel.
- T021 and T022 can run in parallel.
