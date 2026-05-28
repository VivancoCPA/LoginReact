# Tasks: Forgot Password Recovery (004-forgot-password)

**Input**: Design documents from `/specs/004-forgot-password/`

**Prerequisites**: plan.md (required), spec.md (required)

**Tests**: Tests are excluded from this specification as requested by the user.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Confirm active workspace path and setup features branch `004-forgot-password`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core API and helper functions that must be verified before implementing the recovery view

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Verify endpoint schemas and implement `checkEmailExists` method in `LoginApp/src/services/authService.ts` using anonymous lookups

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Request Password Recovery (Priority: P1) 🎯 MVP

**Goal**: Allow unauthenticated users to request a new temporary password by entering their registered email on a premium glassmorphic recovery screen, and returning to `/login` on success.

**Independent Test**: Navigate to `/forgot-password`, input a registered email, click submit, and verify that the system dispatches the API request, shows a success toast, and redirects back to `/login`.

### Implementation for User Story 1

- [x] T003 [US1] Update the "¿Olvidó su contraseña?" link inside `LoginApp/src/pages/Login.tsx` to pass the entered email value via React Router location state.
- [x] T004 [P] [US1] Create the complete visual structure of the recovery screen with a premium glassmorphic card inside `LoginApp/src/pages/RecoverPassword.tsx`.
- [x] T005 [P] [US1] Implement the pre-filled read-only email layout and clear/manual-change option inside `LoginApp/src/pages/RecoverPassword.tsx`.
- [x] T006 [US1] Integrate real-time email format validation and error state inside `LoginApp/src/pages/RecoverPassword.tsx`.
- [x] T007 [US1] Implement the form submit loader, API connection call to `authService.forgotPassword`, success toast feedback, and redirect action inside `LoginApp/src/pages/RecoverPassword.tsx`.
- [x] T008 [US1] Integrate `checkEmailExists` validation before forgotPassword submit, intercepting unregistered emails with the toast warning: "El correo electrónico no existe. Contacte al Administrador." inside `LoginApp/src/pages/RecoverPassword.tsx`.
- [x] T009 [US1] Add a secondary navigation action to safely return back to the login screen inside `LoginApp/src/pages/RecoverPassword.tsx`.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Complete Recovery Flow via Force Change (Priority: P2)

**Goal**: Ensure that a user who has completed password recovery can log in with their temporary credentials and is immediately intercepted and routed to the forced password update page.

**Independent Test**: Authenticate on `/login` using the temporary credentials, and verify immediate interception and redirection to `/force-password-change`.

### Implementation for User Story 2

- [x] T010 [US2] Verify that route guards in `LoginApp/src/App.tsx` and in-memory credential storage in `LoginApp/src/context/AuthContext.tsx` intercept a `passwordConfirmed = false` user state and force redirection to `/force-password-change`

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Compile check and manual browser validation

- [x] T011 [P] Execute Vite production compilation with `npm run build` in `LoginApp` to guarantee zero build-time warnings or TS compiler errors
- [x] T012 Verify all manual walkthrough scenarios from `spec.md` in the browser

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User Story 1 (P1) is the MVP and must be completed first.
  - User Story 2 (P2) depends on the temporary credentials generated in User Story 1.
- **Polish (Final Phase)**: Depends on all user stories being complete.
