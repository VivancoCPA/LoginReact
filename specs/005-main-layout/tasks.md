# Tasks: Main Layout Application Shell (005-main-layout)

**Input**: Design documents from `/specs/005-main-layout/`

**Prerequisites**: plan.md (required), spec.md (required)

**Tests**: Tests are excluded from this specification as requested by the user.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure verification

- [ ] T001 Confirm active workspace path and verify setup branch `005-main-layout`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model types and navigation configurations that block UI rendering

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Create the type-safe `NavigationItem` interface in `LoginApp/src/types/navigation.ts` defining dynamic routing properties
- [ ] T003 Create the centralized menu configuration array in `LoginApp/src/navigation/menuConfig.ts` with all medical submodules and administration links

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Centralized Workspace Layout (Priority: P1) 🎯 MVP

**Goal**: Provide a secure main workspace layout shell immediately after login containing a left navigation sidebar, top glassmorphic toolbar, and dynamic main content `<Outlet />`.

**Independent Test**: Authenticate successfully and verify that the application immediately mounts the primary workspace layout shell displaying the default Dashboard.

### Implementation for User Story 1

- [ ] T004 [P] [US1] Create the core authenticated layout shell container in `LoginApp/src/layouts/MainLayout.tsx` supporting standard dynamic Outlet rendering
- [ ] T005 [P] [US1] Wrap `MainLayout` with custom theme toggling logic (applying the `dark` class dynamically to the document root element) to support Tailwind CSS v4 Dark Mode
- [ ] T006 [US1] Wrap dynamic child pages inside protected `MainLayout` routing shells in `LoginApp/src/App.tsx`
- [ ] T007 [US1] Refactor existing page components (e.g. `LoginApp/src/pages/Dashboard.tsx`) to cleanly render inside the dynamic layout box

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Nested Medical Navigation & Active States (Priority: P2)

**Goal**: Render organized left-side navigation links for medical modules and collapsible submenus for admin options, with visual active path indicators.

**Independent Test**: Click sidebar links to navigate, verifying highlight changes and submenus expand/collapse.

### Implementation for User Story 2

- [ ] T008 [P] [US2] Implement the collapsible left menu using pure Tailwind CSS flex-layout transitions in `LoginApp/src/components/Sidebar.tsx` with dynamic responsive dimensions (`w-64` expanded, `w-18` collapsed)
- [ ] T009 [US2] Configure the sidebar list layout to dynamically map `menuConfig.ts` items, using Tailwind transitions for nested Administration submenus
- [ ] T010 [US2] Integrate current location path detection using `useLocation()` to apply high-contrast secondary active highlighting (indigo accents) to selected routes in `LoginApp/src/components/Sidebar.tsx`

**Checkpoint**: At this point, User Stories 1 and 2 should both work independently.

---

## Phase 5: User Story 3 - User Account Controls & Profile Customization (Priority: P3)

**Goal**: Build a top navbar header with connected user avatar dropdown controls, a theme toggler, and a sliding drawer to update user details.

**Independent Test**: Open profile dropdown, click "Modificar Perfil", and verify right-side Drawer loads.

### Implementation for User Story 3

- [ ] T011 [P] [US3] Create the glassmorphic header Topbar with hamburger toggle triggers, dynamic section titles, and light/dark mode toggler selectors in `LoginApp/src/components/Topbar.tsx` using Tailwind CSS v4 styling
- [ ] T012 [P] [US3] Implement the account menu dropdown in `Topbar.tsx` using custom React dropdown states and Tailwind CSS flex containers, displaying connected user name/email, Logout triggers, and a profile modifier action link
- [ ] T013 [US3] Implement the right-side sliding profile modification drawer in `LoginApp/src/components/ProfileDrawer.tsx` utilizing Tailwind absolute sliding overlays (`fixed inset-y-0 right-0 transform translate-x-full`)

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Compile check and manual browser validation

- [ ] T014 [P] Execute Vite production compilation with `npm run build` in `LoginApp` to guarantee zero build-time warnings or TS compiler errors
- [ ] T015 Verify all manual walkthrough scenarios from `spec.md` in the browser

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User Story 1 (P1) is the MVP and must be completed first.
  - User Story 2 (P2) depends on the layout shell generated in User Story 1.
  - User Story 3 (P3) depends on the layouts and nav elements.
- **Polish (Final Phase)**: Depends on all user stories being complete.
