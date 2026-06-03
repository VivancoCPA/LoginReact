# Tasks: Role Maintenance (Mantenimiento de Roles)

**Input**: Design documents from `/specs/007-role-maintenance/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: None requested in spec (manually validated via compiler checks).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Includes exact file paths in descriptions.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

- [x] T001 Create TypeScript types definitions for Roles inside `LoginApp/src/types/role.ts`
- [x] T002 Create API bindings wrapper service client inside `LoginApp/src/services/roleService.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Verify central `apiClient` in `LoginApp/src/services/apiClient.ts` handles bearer authentication token injection and authorization interceptors correctly

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - List, Search, and Toggle View of Roles (Priority: P1) 🎯 MVP

**Goal**: Renders standard list dashboard using Table vs Cards layout with real-time text query filtering.

**Independent Test**: Navigate to `/admin/roles` route manually, toggle layout mode between Table and Cards, verify term filtering updates UI in <150ms.

### Implementation for User Story 1

- [x] T004 [US1] Implement Roles list service call `getRoles()` in `LoginApp/src/services/roleService.ts` to fetch `/api/roles`
- [x] T005 [P] [US1] Create main page wrapper structure and persistent layout states in `LoginApp/src/pages/RoleMaintenance.tsx`
- [x] T006 [US1] Build responsive HTML table component view in `LoginApp/src/pages/RoleMaintenance.tsx` with sortable headers for Name and Assigned Users
- [x] T007 [US1] Build responsive Cards Grid layout in `LoginApp/src/pages/RoleMaintenance.tsx` with adaptive columns and vertical dots ⋮ dropdown actions menu on card headers
- [x] T008 [US1] Integrate debounced live text search bar in `LoginApp/src/pages/RoleMaintenance.tsx` matching inputs to role names dynamically
- [x] T009 [US1] Setup empty search state and loading skeletons inside `LoginApp/src/pages/RoleMaintenance.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Create and Edit Roles (Priority: P2)

**Goal**: Opens standard Drawer panel to edit details or create new roles with client-side form validations.

**Independent Test**: Open the `+ Nuevo Rol` Drawer, verify inline warnings trigger for short inputs, save a valid role name, and confirm Toast alert pops up.

### Implementation for User Story 2

- [x] T010 [US2] Add mutating service bindings `createRole()`, `updateRole()`, and `deleteRole()` inside `LoginApp/src/services/roleService.ts`
- [x] T011 [P] [US2] Create right slide-over Drawer layout and input fields inside `LoginApp/src/components/RoleDrawer.tsx`
- [x] T012 [US2] Implement form validation logic and error feedback tags in `LoginApp/src/components/RoleDrawer.tsx` (Min 3 characters, max 250 characters)
- [x] T013 [US2] Wire save buttons, action loaders, and backend conflict `409` catchers inside `LoginApp/src/components/RoleDrawer.tsx`
- [x] T014 [US2] Integrate `RoleDrawer` triggers and edit state hooks in the dashboard lists inside `LoginApp/src/pages/RoleMaintenance.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Role Management and System Impact (Priority: P3)

**Goal**: Connects `/admin/roles` route to protected layouts and links roles lists to user maintenance selectors.

**Independent Test**: Log in as Admin, click Sidebar group "Administración -> Roles" and confirm route opens Roles page, and confirm User Maintenance picks up roles dynamically.

### Implementation for User Story 3

- [x] T015 [US3] Add protected `/admin/roles` route referencing `RoleMaintenance` component in `LoginApp/src/App.tsx`
- [x] T016 [US3] Verify dynamic roles checklist binding inside `LoginApp/src/components/UserRolesDialog.tsx` to pull options dynamically from `roleService.getRoles()`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [x] T017 Execute production compiler check and verify zero compilation errors in `LoginApp` via `npm run build`
- [x] T018 Perform full manual walkthrough checks using `specs/007-role-maintenance/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User stories can then proceed in parallel (if staffed).
  - Or sequentially in priority order (P1 $\rightarrow$ P2 $\rightarrow$ P3).
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

---

## Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T001, T002).
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows).
- Models within a story marked [P] can run in parallel.
- Different user stories can be worked on in parallel by different team members.

---

## Parallel Example: User Story 1

```bash
# Launch all models and types for Setup together:
Task: "Create TypeScript types definitions for Roles inside LoginApp/src/types/role.ts"
Task: "Create API bindings wrapper service client inside LoginApp/src/services/roleService.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (P1 - MVP)
4. **STOP and VALIDATE**: Test User Story 1 independently using layout and search checks
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational $\rightarrow$ Foundation ready
2. Add User Story 1 $\rightarrow$ Test independently $\rightarrow$ Deploy/Demo (MVP!)
3. Add User Story 2 $\rightarrow$ Test independently $\rightarrow$ Deploy/Demo
4. Add User Story 3 $\rightarrow$ Test independently $\rightarrow$ Deploy/Demo
5. Each story adds value without breaking previous stories.
