# Tasks: Active Role Selection

**Input**: Design documents from `/specs/016-choose-active-role/`

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

- [x] T001 Verify active git branch `016-choose-active-role` is checked out

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Extend `AuthState` interface in `LoginApp/src/types/auth.ts` to include `activeRole: string | null`
- [x] T003 Update `LoginApp/src/context/AuthContext.tsx` to support `activeRole` state and expose `setActiveRole(roleName: string | null)` in the context provider. Handle local storage persistence (`auth_active_role`) and clear it during logout.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Automatic Bypass for Single Role Users (Priority: P1) 🎯 MVP

**Goal**: Users with exactly one role bypass `/choose-role` entirely and have their active role auto-assigned.

**Independent Test**: Log in with a user who has only one role, verify they are redirected directly to `/dashboard`, and verify the topbar shows their correct role name.

### Implementation for User Story 1

- [x] T004 [US1] Implement automatic role detection and assignment in `LoginApp/src/context/AuthContext.tsx` during user login and session initialization (when roles list length equals 1)

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Role Selection for Multi-Role Users (Priority: P2)

**Goal**: Multi-role users are directed to `/choose-role` after logging in, and their navigation menu/badges render based on the chosen active role.

**Independent Test**: Log in with a user who has both `Admin` and `User` roles, verify they are redirected to `/choose-role`, select a role, and check that you enter `/dashboard` with the corresponding sidebar navigation links and header badges.

### Implementation for User Story 2

- [x] T005 [P] [US2] Create the `ChooseRole.tsx` page component under `LoginApp/src/pages/` displaying assigned roles as interactive glassmorphism card buttons (or displaying the error message "No tiene Rol asignado. Por favor, comuníquese con el Administrador." if the user has zero roles) and including a Logout action button
- [x] T006 [US2] Register `/choose-role` route and update the `ProtectedRoute` guard in `LoginApp/src/App.tsx` to redirect to `/choose-role` if `activeRole` is null (for multi-role users) or if the user has zero roles, preventing navigation to dashboard modules
- [x] T007 [P] [US2] Update `LoginApp/src/components/Topbar.tsx` to consume `activeRole` from `useAuth()` and render it in user details adjacent to the user name and inside the dropdown header
- [x] T008 [P] [US2] Update `LoginApp/src/components/Sidebar.tsx` to filter the menu configurations based on the `activeRole` using `item.roles.includes(activeRole)`

**Checkpoint**: User Story 2 is fully functional and integrated.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: General verification, code cleanup, and production compilation validation.

- [x] T009 [P] Verify Vite production compilation succeeds by running `npm run build` from `LoginApp/`
- [x] T010 Run `specs/016-choose-active-role/quickstart.md` validation checklist to verify final UX and accessibility details

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) is the MVP and must be completed first
  - User Story 2 (P2) depends on User Story 1 (incorporating state setters and hooks)
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
2. Add User Story 1 → Test auto-bypass (MVP!)
3. Add User Story 2 → Test card select redirect, layout rendering, and sidebar dynamic filters
4. Run final build and verification
