# Tasks: User Maintenance (Gestión de Usuarios)

**Input**: Design documents from `specs/006-user-maintenance/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT requested in the spec or user rules, so test tasks are excluded to focus solely on clean production code.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

- [x] T001 Confirm active workspace path and check out `006-user-maintenance` branch

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Create the type-safe interfaces in `LoginApp/src/types/user.ts` (including `PagedUserItem`, `PaginatedUsersResult`, `FamilyGroup`)
- [x] T003 [P] Create the reusable confirmation popup modal in `LoginApp/src/components/ConfirmDialog.tsx`
- [x] T004 Create the central API service methods in `LoginApp/src/services/userService.ts` (including list, family groups, create, edit, roles, claims, and status toggle requests)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Dual View User Listing (Priority: P1) 🎯 MVP

**Goal**: Enable administrators to view all registered users with their core details (avatar, name, email, phone, family group, status) using either a compact table or card grid, with visual persistence across reloads in the same session.

**Independent Test**:
- Open the application and navigate to `/admin/users` (once route is registered).
- Confirm that the loading state triggers and the listing mounts showing user rows.
- Verify that clicking the Table/Cards visual buttons toggles between grid and table representations.
- Reload the browser page and verify the layout selection is preserved in the active viewport (persisted via `sessionStorage` key `'user_maintenance_view_mode'`).

### Implementation for User Story 1

- [x] T005 [P] [US1] Create the base main listing page shell in `LoginApp/src/pages/UserMaintenance.tsx` with dynamic visual layout switching controls
- [x] T006 [US1] Implement the ultra-compact Table View grid layout in `LoginApp/src/pages/UserMaintenance.tsx` using tight row spacing (`py-1.5` or `py-2`) to maximize information density
- [x] T007 [P] [US1] Implement the responsive Profile Cards View grid layout in `LoginApp/src/pages/UserMaintenance.tsx` mapping items to three-column containers
- [x] T008 [US1] Build the dynamic circular Avatar image initials generator fallback logic inside `LoginApp/src/pages/UserMaintenance.tsx` to handle accounts missing custom photo URLs
- [x] T009 [US1] Integrate client-side pagination footer selectors in `LoginApp/src/pages/UserMaintenance.tsx` displaying current limits and total counts
- [x] T010 [US1] Register `/admin/users` inside the authenticated main shell route map in `LoginApp/src/App.tsx`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Searching, Sorting, and Multi-filtering (Priority: P2)

**Goal**: Empower administrators to search in real-time, sort columns in the table, and apply cumulative multi-select filters for Family Groups and active status to isolate accounts.

**Independent Test**:
- Type a search query in the search bar and verify that paged results reload in the table/cards matching partial names/emails.
- Click column headers for "Nombre" or "Apellido" in Table mode to verify ascending and descending order updates.
- Check family groups dropdown, select multiple items, toggle status selection, and verify cumulative results.

### Implementation for User Story 2

- [x] T011 [US2] Implement server-side search input debouncing (300ms) inside `LoginApp/src/pages/UserMaintenance.tsx` triggering backend page reloads
- [x] T012 [US2] Bind header columns sorting indicators to Table view headers in `LoginApp/src/pages/UserMaintenance.tsx` mapping Name and LastName sort params
- [x] T013 [US2] Implement active family groups selector dropdown inside `LoginApp/src/pages/UserMaintenance.tsx` by querying `GET /api/family-groups` and filtering client-side for `isActive === true`
- [x] T014 [US2] Integrate the state checkbox controls in `LoginApp/src/pages/UserMaintenance.tsx` supporting Status (Todos, Activos, Inactivos) filtering

**Checkpoint**: User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Administrative User CRUD Controls (Priority: P3)

**Goal**: Support administrative user governance through detail inspections, secure editing with field locking constraints, new profile registration, dynamic avatar uploads within 2MB limits, and activation state overrides.

**Independent Test**:
- Click "+ Nuevo usuario", verify form fields, pick a >2MB photo, and verify immediate size rejection toast. Pick a <2MB file, see preview at the top, and create the user.
- Click Eye icon, inspect all read-only fields including claims/roles badges in the right-side slide-over drawer.
- Click Edit, modify editable fields (Name, Surname, DOB, Phone, Address), confirm that Email and Family Group fields are disabled, and save successfully.
- Click lock icon, verify the `ConfirmDialog` warning popup, select deactivate/reactivate, and see the status badge toggle color instantly.

### Implementation for User Story 3

- [x] T015 [US3] Create the right-side absolute sliding drawer overlay shell in `LoginApp/src/components/UserDrawer.tsx`
- [x] T016 [US3] Build the top Avatar image picker file upload input inside `LoginApp/src/components/UserDrawer.tsx` validating file size boundaries ($\le 2$MB) and displaying instant local preview URI strings
- [x] T017 [US3] Implement the read-only detail view mode in `LoginApp/src/components/UserDrawer.tsx` querying roles/claims endpoints and rendering badges
- [x] T018 [US3] Implement Create user form mode in `LoginApp/src/components/UserDrawer.tsx` validating Name/Surname $\ge 2$ characters and displaying validation errors
- [x] T019 [US3] Implement Edit user form mode in `LoginApp/src/components/UserDrawer.tsx` locking Email and Family Group inputs to read-only
- [x] T020 [US3] Integrate deactivation/reactivation triggers inside the main page listing in `LoginApp/src/pages/UserMaintenance.tsx` wrapping status actions in the `ConfirmDialog` popup modal
- [x] T021 [US3] Map the drawer controls and action triggers to lists and card items inside `LoginApp/src/pages/UserMaintenance.tsx`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [x] T022 Document client-side structures and schemas in `LoginApp/src/types/user.ts`
- [x] T023 Verify responsive design transitions across mobile, tablet, and desktop viewports
- [x] T024 Perform build compilation check with `npm run build` in `LoginApp` to guarantee zero compilation or typing warnings
