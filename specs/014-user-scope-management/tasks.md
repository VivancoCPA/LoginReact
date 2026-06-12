# Tasks: User Scope Management

**Input**: Design documents from `/specs/014-user-scope-management/`

**Prerequisites**: plan.md (required), spec.md (required)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify active git branch `014-user-scope-management` is checked out

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Extend `User` interface in `LoginApp/src/types/auth.ts` to include `photoUrl?: string` and `roles?: string[]`
- [x] T003 [P] Implement `parseJwt` helper in `LoginApp/src/context/AuthContext.tsx` to decode nameidentifier (userId) and email from JWT Bearer tokens
- [x] T004 Update `AuthContext.tsx` initialization to query `/api/users/{userId}` asynchronously after restoring token, and update the session user object (including `photoUrl` and `roles`) in state and `localStorage`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Header Profile & Own Avatar Management (Priority: P1) 🎯 MVP

**Goal**: Show avatar & role in header, and allow user to upload/modify their own profile avatar.

**Independent Test**: Log in, confirm header displays initials/avatar and role, modify profile photo, and verify that the header avatar updates immediately.

### Implementation for User Story 1

- [x] T005 [P] [US1] Update `Topbar.tsx` to conditionally render the avatar image (using `getPhotoFullUrl`) or initials fallback, and display the primary role name in both the header bar and dropdown header
- [x] T006 [P] [US1] Update `ProfileDrawer.tsx` to render a circular photo selector (matching the style in `UserDrawer.tsx`), limit selected file size to 2MB, validate image formats (JPG/PNG), and store the file in `photoFile` state
- [x] T007 [US1] Integrate photo upload in `ProfileDrawer.tsx` form submit, invoking `authService.updateUser` with `photoFile` and updating the session using `updateUserSession`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Admin Scope Association (Priority: P2)

**Goal**: Admin can view and associate users who do not have an active administrator scope.

**Independent Test**: Log in as Admin, navigate to "Asociar Scope", select a scopeless user, associate them, and verify they disappear from the list and appear in the main user list.

### Implementation for User Story 2

- [x] T008 [P] [US2] Create a new slide-over drawer component `UserScopeDrawer.tsx` under `LoginApp/src/components/` that fetches scopeless users (by comparing `/api/users` with the Admin's scope or query results)
- [x] T009 [US2] Implement the association action in `UserScopeDrawer.tsx` which calls `POST /api/users/{adminId}/scope/{userId}` when the Admin clicks "Asociar"
- [x] T010 [US2] Add the "Asociar Scope" button in `UserMaintenance.tsx` next to the "Nuevo Usuario" button, restricting its visibility exclusively to users with the `Admin` role

**Checkpoint**: User Story 2 is fully functional and testable independently.

---

## Phase 5: User Story 3 - Admin Scope Disassociation (Priority: P3)

**Goal**: Admin can remove users from their scope with a confirmation dialog.

**Independent Test**: Log in as Admin, find a user in the list, click "Desasociar", confirm the dialog, and verify they are removed from the Admin's list.

### Implementation for User Story 3

- [x] T011 [P] [US3] Add the "Desasociar del Scope" button to the User actions in `UserMaintenance.tsx`, visible only for the `Admin` role
- [x] T012 [US3] Add the disassociation confirmation modal `ConfirmDialog` in `UserMaintenance.tsx` before calling `DELETE /api/users/{adminId}/scope/{userId}`

**Checkpoint**: User Story 3 is fully functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Styling improvements, general verification, and production build checks

- [x] T013 [P] Verify Vite production compilation succeeds by running `npm run build`
- [x] T014 Run quickstart.md validation checklist to verify final UX and accessibility details
- [x] T015 Verify dark mode styling compatibility across all newly added panels and modals
- [x] T016 Perform a final code cleanup, removing any commented-out code or unused debug statements

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories.
- **User Stories (Phase 3+)**: Depend on Foundational completion.
  - User Story 1 (P1) is the MVP and should be completed first.
  - User Story 2 and 3 can proceed in parallel once Foundation is complete.
- **Polish (Phase 6)**: Depends on all user stories being completed.

---

## Parallel Opportunities

- Foundational tasks `T002` and `T003` can be worked on in parallel.
- User Story 1 tasks `T005` and `T006` can be worked on in parallel.
- Once Foundation is complete, User Story 1 (avatar display/profile update) and User Story 2/3 (scope association/disassociation) can be implemented in parallel by different developers.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: Verify initials/avatar display and profile update dynamically.

### Incremental Delivery

1. Setup + Foundation ready.
2. Add User Story 1 (avatar/role display & settings). Deploy/demo as MVP.
3. Add User Story 2 (scope association view for Admin).
4. Add User Story 3 (scope disassociation action).
5. Run final build and verification.
