# Tasks: Complete JWT Authentication System in React, TS, and Tailwind CSS v4

**Input**: Design documents from `/specs/001-login-screen/`

**Prerequisites**: [plan.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/001-login-screen/plan.md) (required), [spec.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/001-login-screen/spec.md) (required for user stories), [research.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/001-login-screen/research.md), [data-model.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/001-login-screen/data-model.md)

**Tests**: Tests are explicitly excluded from this feature as per user request (no unit or integration test tasks included).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize React TypeScript Vite project structure under LoginApp folder
- [ ] T002 Configure Vite configuration file `LoginApp/vite.config.ts` to include Tailwind CSS v4 `@tailwindcss/vite` plugin
- [ ] T003 [P] Configure TypeScript compile options in `LoginApp/tsconfig.json` to support strict type safety
- [ ] T004 Install application dependencies `axios`, `react-router-dom`, `react-hot-toast` in `LoginApp/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create TypeScript types for authentication state and profiles in `LoginApp/src/types/auth.ts`
- [ ] T006 [P] Create helper functions for email validation and password complexity regex in `LoginApp/src/utils/validation.ts`
- [ ] T007 Create environment variables config template and files `LoginApp/.env.local` and `LoginApp/.env.example` in project root
- [ ] T008 Setup Axios central API client with token injection and 401 redirect interceptors in `LoginApp/src/services/apiClient.ts`
- [ ] T009 [P] Create Authentication Service methods in `LoginApp/src/services/authService.ts`
- [ ] T010 Create React Authentication Context provider and `useAuth` custom hook in `LoginApp/src/context/AuthContext.tsx`
- [ ] T011 [P] Configure Tailwind CSS v4 base imports and font configurations in `LoginApp/src/index.css`
- [ ] T012 Configure router guards for public/guest and private/protected paths in `LoginApp/src/App.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Secure Enterprise Login (Priority: P1) 🎯 MVP

**Goal**: Renders login page, validates fields, logs in via API, persists token, handles 60-min expiration, shows Toast alerts.

**Independent Test**: Enter correct credentials, verify login redirects to Dashboard showing user name. Change local storage timestamp to >60 mins ago, refresh, verify automatic logout and Toast warning.

### Implementation for User Story 1

- [ ] T013 [P] [US1] Create reusable styled FormInput component in `LoginApp/src/components/FormInput.tsx`
- [ ] T014 [US1] Implement Login component page state and API dispatch logic in `LoginApp/src/pages/Login.tsx`
- [ ] T015 [US1] Implement 60-minute client-side expiration checks in `LoginApp/src/context/AuthContext.tsx`
- [ ] T016 [US1] Implement protected Dashboard layout showing logged user profile details in `LoginApp/src/pages/Dashboard.tsx`
- [ ] T017 [US1] Connect global Toast notification provider wrapper in `LoginApp/src/main.tsx`
- [x] T017a [US1] Implement dynamic extraction and toast display of backend access error payloads (supporting standard RFC 7807/9110 Problem Details like detail/title) in `LoginApp/src/context/AuthContext.tsx` and `LoginApp/src/pages/Login.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (MVP complete).

---

## Phase 4: User Story 2 - Modern Split-Screen Interface (Priority: P2)

**Goal**: Renders elegant modern desktop split-screen grid, brand info on the left, login form on the right, responsive to mobile.

**Independent Test**: Open page on desktop and mobile, verify correct responsive layouts and hover/load transitions.

### Implementation for User Story 2

- [ ] T018 [US2] Implement split-screen Tailwind CSS layout in `LoginApp/src/pages/Login.tsx`
- [ ] T019 [US2] Create beautiful brand illustrations, slogans, and animations in the left-side section of `LoginApp/src/pages/Login.tsx`
- [ ] T020 [P] [US2] Add smooth hover effects and micro-interactions using Tailwind utility classes on inputs and buttons in `LoginApp/src/components/FormInput.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Navigation to Other Auth Flows (Priority: P3)

**Goal**: Maps links to Register and Forgot Password pages.

**Independent Test**: Click links, verify URL updates.

### Implementation for User Story 3

- [ ] T021 [US3] Create placeholder routes and minimal pages for Registration and Recovery in `LoginApp/src/pages/Register.tsx` and `LoginApp/src/pages/RecoverPassword.tsx`
- [ ] T022 [US3] Add navigation links with active routes to login screen `LoginApp/src/pages/Login.tsx`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T023 Run complete quickstart.md validation checklist and record outcomes
- [ ] T024 Perform final build check running npm run build and optimize bundles
- [ ] T025 Cleanup unused files, template icons, and default assets

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

---

## Notes
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
