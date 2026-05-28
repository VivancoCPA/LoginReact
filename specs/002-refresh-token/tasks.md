# Tasks: Token Refresh Mechanism

**Input**: Design documents from `specs/002-refresh-token/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Excluded per feature specification (FR-008: Testing is explicitly excluded from this specification; no unit/integration tests required for this code).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- All paths are relative to the repository root, under the `LoginApp` react project subdirectory (e.g., `LoginApp/src/services/apiClient.ts`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project environmental variable initialization

- [ ] T001 Verify and update environment configuration variables `VITE_API_BASE_URL` and `VITE_TOKEN_EXPIRY_MINUTES` in `LoginApp/.env.local`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model interfaces and refresh service creation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 [P] Create and export `RefreshResponse` interface in `LoginApp/src/types/auth.ts`
- [ ] T003 [P] Create and export `FailedQueueItem` interface in `LoginApp/src/types/auth.ts`
- [ ] T004 Implement `refreshToken` request service in `LoginApp/src/services/authService.ts` to dispatch `POST /auth/refresh` sending cookies

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Silent Token Refresh on Expiration (Priority: P1) 🎯 MVP

**Goal**: Automatically renew expired access tokens in the background to ensure session continuity without interruption

**Independent Test**: Expire the token timestamp in DevTools Application storage, perform an action or navigation, and verify exactly one background `POST /api/auth/refresh` is dispatched, and subsequent requests resolve properly with the new token.

### Implementation for User Story 1

- [ ] T005 [US1] Implement token expiration pre-check interceptor inside request interceptor in `LoginApp/src/services/apiClient.ts`
- [ ] T006 [US1] Implement `401 Unauthorized` status response interceptor in `LoginApp/src/services/apiClient.ts`
- [ ] T007 [US1] Implement Axios request promise queue mechanisms (`failedQueue` array and `isRefreshing` lock flag) in `LoginApp/src/services/apiClient.ts`
- [ ] T008 [US1] Add queue processing and request retry triggers upon successful token refresh in `LoginApp/src/services/apiClient.ts`
- [ ] T009 [US1] Ensure `withCredentials: true` is included on silent refresh Axios requests in `LoginApp/src/services/apiClient.ts`
- [ ] T010 [US1] Dispatch `auth:unauthorized` custom event on background refresh failure in `LoginApp/src/services/apiClient.ts`
- [ ] T011 [US1] Update `logout` and event listeners in `LoginApp/src/context/AuthContext.tsx` to handle `auth:unauthorized` and toast-display session expiration error messages

**Checkpoint**: At this point, User Story 1 is fully functional and silently renews expired sessions in the background.

---

## Phase 4: User Story 2 - Configurable Token Duration (Priority: P2)

**Goal**: Load token and session duration limits dynamically from environment files instead of hardcoding values

**Independent Test**: Set `VITE_TOKEN_EXPIRY_MINUTES` to 5 in `LoginApp/.env.local`, log in, and verify that the Dashboard countdown timer starts at 5 minutes and works correctly.

### Implementation for User Story 2

- [ ] T012 [US2] Refactor `checkTokenExpiry` and expiry calculations in `LoginApp/src/context/AuthContext.tsx` to dynamically reference `import.meta.env.VITE_TOKEN_EXPIRY_MINUTES`
- [ ] T013 [US2] Update `Dashboard.tsx` countdown timer calculation in `LoginApp/src/pages/Dashboard.tsx` to dynamically query and scale with `VITE_TOKEN_EXPIRY_MINUTES`

**Checkpoint**: At this point, both User Stories 1 and 2 are functional, and session durations adapt dynamically to environment settings.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Bundle size checks, zero TypeScript warnings, and manual verification

- [ ] T014 [P] Execute Vite production compilation with `npm run build` in `LoginApp` to guarantee zero build-time warnings or TypeScript errors
- [ ] T015 Run quickstart manual verification scenarios in `specs/002-refresh-token/quickstart.md` to confirm correct flow and interceptor behavior

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Configures timer limits; integrates with US1 timer calculation

---

## Parallel Example: User Story 1

```bash
# Launch all models and interfaces for User Story 1 / Foundational together:
Task: "Create and export RefreshResponse interface in LoginApp/src/types/auth.ts"
Task: "Create and export FailedQueueItem interface in LoginApp/src/types/auth.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently in browser using DevTools
5. Proceed to User Story 2 when validated

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test silently in background -> Deploy/Demo (MVP!)
3. Add User Story 2 -> Dynamic configs -> Deploy/Demo
