# Tasks: Unscoped Users Association

**Input**: Design documents from `/specs/015-associate-scopeless-users/`

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

- [x] T001 Verify active git branch `015-associate-scopeless-users` is checked out

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Implement `getUnscopedUsers` method in `LoginApp/src/services/userService.ts` to call `GET /users/unscoped`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - List and Search Unscoped Users (Priority: P1) 🎯 MVP

**Goal**: Fetch unscoped users from the backend and display them in the drawer with real-time search filtering.

**Independent Test**: Open the "Asociar Scope" drawer as an Admin, verify the loading spinner displays, then check that the list is populated with unscoped users, and verify typing in the search box filters the list in real-time.

### Implementation for User Story 1

- [x] T003 [P] [US1] Update `fetchScopelessUsers` in `LoginApp/src/components/UserScopeDrawer.tsx` to invoke `userService.getUnscopedUsers` and remove the client-side subtraction logic
- [x] T004 [US1] Ensure `UserScopeDrawer.tsx` handles fallback initials correctly for the returned users (since `photoUrl` is not provided in `ListUnscopedUsersResponse` payload)

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Associate Unscoped Users (Priority: P2)

**Goal**: Click "Asociar" next to any unscoped user to associate them with the admin's scope and refresh the parent user maintenance grid.

**Independent Test**: Click "Asociar" next to an unscoped user in the list, verify a success notification toast is displayed, that the user is removed from the drawer, and that closing the drawer shows the user in the main maintenance grid.

### Implementation for User Story 2

- [x] T005 [US2] Update `handleAssociate` in `LoginApp/src/components/UserScopeDrawer.tsx` to verify standard Admin association via `POST /api/users/{adminId}/scope/{userId}` and trigger the `onSaveSuccess` callback to update the parent view

**Checkpoint**: User Story 2 is fully functional and integrated.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: General verification, code cleanup, and production compilation validation.

- [x] T006 [P] Verify Vite production compilation succeeds by running `npm run build` from `LoginApp/`
- [x] T007 Run `specs/015-associate-scopeless-users/quickstart.md` validation checklist to verify final UX and accessibility details

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) is the MVP and must be completed first
  - User Story 2 (P2) depends on User Story 1 (listing and displaying users in the drawer)
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
3. Add User Story 2 → Test association works and parent grid updates
4. Run final build and verification
