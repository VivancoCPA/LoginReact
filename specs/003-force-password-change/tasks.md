# Tasks: Force Password Change on First Login

**Input**: Design documents from `specs/003-force-password-change/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Excluded per feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- All paths are relative to the repository root, under the `LoginApp` react project subdirectory (e.g., `LoginApp/src/pages/ForcePasswordChange.tsx`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Environmental configuration verification

- [ ] T001 Verify and update environment configuration variables `VITE_API_BASE_URL` in `LoginApp/.env.local`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Basic type extensions and API service integration

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 [P] Add `passwordConfirmed` property to `User` interface in `LoginApp/src/types/auth.ts`
- [ ] T003 [P] Add `passwordConfirmed` property to `AuthResponse` interface in `LoginApp/src/types/auth.ts`
- [ ] T004 Implement `changePassword` request method in `LoginApp/src/services/authService.ts` to dispatch `POST /auth/change-password`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Force Password Change on First Login (Priority: P1) 🎯 MVP

**Goal**: Force new users with temporary passwords to update their credentials upon their very first login

**Independent Test**: Log in with a user whose flag is false, verify immediate redirect to `/force-password-change`, block manual `/dashboard` routes, check real-time validations, submit a strong matching password, and verify redirection to `/login`.

### Implementation for User Story 1

- [ ] T005 [US1] Add transient `tempPassword` in-memory state inside `AuthProvider` in `LoginApp/src/context/AuthContext.tsx`
- [ ] T006 [US1] Update `login` method in `LoginApp/src/context/AuthContext.tsx` to inspect `data.passwordConfirmed` and store transient password in `tempPassword` if false
- [ ] T007 [US1] Implement `changeTempPassword` method in `LoginApp/src/context/AuthContext.tsx` to call API, show success toasts, and trigger clean logout
- [ ] T008 [US1] Create page layout and read-only user detail displays in `LoginApp/src/pages/ForcePasswordChange.tsx`
- [ ] T009 [US1] Implement two password input fields with dynamic show/hide eye-icon buttons in `LoginApp/src/pages/ForcePasswordChange.tsx`
- [ ] T010 [US1] Integrate real-time password complexity indicators and mismatch checks in `LoginApp/src/pages/ForcePasswordChange.tsx`
- [ ] T011 [US1] Implement submit button loading state and API trigger in `LoginApp/src/pages/ForcePasswordChange.tsx`
- [ ] T012 [US1] Configure `/force-password-change` route mapping in `LoginApp/src/App.tsx`
- [ ] T013 [US1] Refactor `ProtectedRoute` guard in `LoginApp/src/App.tsx` to check `passwordConfirmed` status and block dashboard access
- [ ] T014 [US1] Configure safety redirect inside `PublicRoute` guard in `LoginApp/src/App.tsx` to prevent direct navigation by unauthenticated users

**Checkpoint**: At this point, User Story 1 is fully functional and forces newly created users to update their credentials securely.

---

## Phase 4: User Story 2 - Login with New Permanent Password (Priority: P2)

**Goal**: Allow users to log in normally and access their dashboard once their permanent password has been updated

**Independent Test**: Submit new credentials on `/login`, verify successful login, and ensure user lands directly on `/dashboard` with no password update prompts.

### Implementation for User Story 2

- [ ] T015 [US2] Verify routing guards and token persistence for fully confirmed users in `LoginApp/src/App.tsx` and `LoginApp/src/context/AuthContext.tsx`

**Checkpoint**: At this point, the entire administrative first-login credential update flow is complete.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Visual polish, type safety checks, and bundle validation

- [ ] T016 [P] Execute Vite production compilation with `npm run build` in `LoginApp` to guarantee zero warnings or TS compiler errors
- [ ] T017 Run quickstart manual verification scenarios in `specs/003-force-password-change/quickstart.md` to confirm end-to-end security guards

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all user stories being complete

---

## Parallel Example: User Story 1

```bash
# Launch all model extensions for Foundational phase together:
Task: "Add passwordConfirmed property to User interface in LoginApp/src/types/auth.ts"
Task: "Add passwordConfirmed property to AuthResponse interface in LoginApp/src/types/auth.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (T005 to T014)
4. **STOP and VALIDATE**: Verify forced change and redirection in browser
5. Proceed to User Story 2 when validated

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Redirection and Update -> Test MVP!
3. Add User Story 2 -> Subsequent logins -> Complete Flow!
