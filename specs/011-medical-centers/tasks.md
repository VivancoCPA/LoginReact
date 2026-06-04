# Tasks: Medical Centers Maintenance (Mantenimiento de Centros Médicos)

**Input**: Design documents from `/specs/011-medical-centers/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create TypeScript types file at LoginApp/src/types/medicalCenter.ts
- [x] T002 [P] Create service file at LoginApp/src/services/medicalCenterService.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T003 Register route path `/admin/medical-centers` in LoginApp/src/App.tsx
- [x] T004 Add header breadcrumb mapping for `/admin/medical-centers` in LoginApp/src/components/Topbar.tsx

---

## Phase 3: User Story 1 - Medical Center CRUD and Right-Drawer Forms (Priority: P1) 🎯 MVP

**Goal**: Enable creation, reading, and updating of medical centers with interactive map coordinates.

**Independent Test**: Create a medical center with name, address, and coordinates, and confirm it is saved successfully.

### Implementation for User Story 1

- [x] T005 [P] [US1] Define TypeScript types in LoginApp/src/types/medicalCenter.ts
- [x] T006 [US1] Implement Axios HTTP clients in LoginApp/src/services/medicalCenterService.ts
- [x] T007 [US1] Implement right-side drawer component LoginApp/src/components/MedicalCenterDrawer.tsx
- [x] T008 [US1] Embed interactive coordinates Leaflet Map and geocoding Nominatim query in LoginApp/src/components/MedicalCenterDrawer.tsx
- [x] T009 [US1] Implement form inputs client validations and error states in LoginApp/src/components/MedicalCenterDrawer.tsx

---

## Phase 4: User Story 2 - Paginated Listing with Table/Cards Layouts (Priority: P2)

**Goal**: Browse medical centers in tabular or responsive cards formats in a split-screen dashboard view.

**Independent Test**: Verify layout toggling displays centers in cards or high-density rows, and persists layout preferences.

### Implementation for User Story 2

- [x] T010 [US2] Implement split dashboard UI page container LoginApp/src/pages/MedicalCenterMaintenance.tsx
- [x] T011 [US2] Build compact high-density table and cards layouts in LoginApp/src/pages/MedicalCenterMaintenance.tsx
- [x] T012 [US2] Add layout mode view persistence in sessionStorage under key `medicalCentersLayoutSelection` in LoginApp/src/pages/MedicalCenterMaintenance.tsx
- [x] T013 [US2] Add column header sort actions for Name, Address, and Type in LoginApp/src/pages/MedicalCenterMaintenance.tsx

---

## Phase 5: User Story 3 - Debounced Search and Accumulative Filtering (Priority: P2)

**Goal**: Filter centers list dynamically using debounced search and active/inactive status tabs.

**Independent Test**: Search for specific clinics and verify only matching active or inactive centers are returned.

### Implementation for User Story 3

- [x] T014 [US3] Implement search input debouncing (300ms) in LoginApp/src/pages/MedicalCenterMaintenance.tsx
- [x] T015 [US3] Implement cumulative (AND) status tab filters in LoginApp/src/pages/MedicalCenterMaintenance.tsx

---

## Phase 6: User Story 4 - Logical Deactivation with Safety Warning (Priority: P3)

**Goal**: Support logical deactivation checks using safety confirm modal dialog overlays.

**Independent Test**: Deactivate a center and verify it updates status to inactive after confirmation.

### Implementation for User Story 4

- [x] T016 [US4] Integrate deactivation warning modal dialog overlay in LoginApp/src/pages/MedicalCenterMaintenance.tsx
- [x] T017 [US4] Implement status reactivation switches in listings and drawer states in LoginApp/src/pages/MedicalCenterMaintenance.tsx

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, production compiling checks, and manual validations

- [x] T018 Run production compiler build command `npm run build` from LoginApp/
- [x] T019 Perform manual verification walkthrough checklist tasks in specs/011-medical-centers/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion.
- **User Stories (Phases 3-6)**: Depend on Foundational completion.
- **Polish (Phase 7)**: Depends on all user stories completion.

### Within Each User Story
- Models before services.
- Services before endpoints/drawer elements.
- UI elements before layout integration.
