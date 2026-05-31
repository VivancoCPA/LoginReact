# Feature Specification: Main Layout

**Feature Branch**: `005-main-layout`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "Nueva spec llamada Main Layout: Crear la interfaz principal de la aplicación autenticada para el sistema de gestión médica. La aplicación requiere una página principal a la que los usuarios accedan inmediatamente después de iniciar sesión. Esta página servirá como contenedor de navegación principal para todos los módulos autenticados de la plataforma. El diseño debe ofrecer una experiencia administrativa médica profesional optimizada para usuarios de computadoras de escritorio, sin dejar de ser adaptable para tabletas y dispositivos más pequeños."

---

## Clarifications

### Session 2026-05-28

- Q: Should we install and configure Material UI or leverage Tailwind CSS v4 to build the layout components? → A: Use Tailwind CSS v4 exclusively to build clean, lightweight custom Sidebar, Topbar, and Drawers.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Centralized Workspace Layout (Priority: P1) 🎯 MVP

As an authenticated medical platform user, I want to land on a secure main workspace immediately after login that provides a left-hand navigation menu, a top dashboard header, and a responsive central content panel, so that I can manage medical modules efficiently.

**Why this priority**: Core architectural frame. This workspace serves as the navigation shell and container for all authenticated features of the medical system.

**Independent Test**: Authenticate successfully and verify that the application immediately mounts the primary workspace shell featuring a collapsible sidebar navigation, a top header displaying the connected user's avatar, and a central content panel showing the default Dashboard.

**Acceptance Scenarios**:

1. **Given** a user who has just authenticated, **When** they access the system, **Then** they are immediately directed to the primary workspace layout shell.
2. **Given** a user inside the workspace on a desktop screen, **When** they click the collapse icon on the left sidebar, **Then** the sidebar collapses to a narrow icon-only state, expanding the central content panel workspace.
3. **Given** a user inside the workspace on a mobile screen, **When** they view the page, **Then** the sidebar is collapsed out of view by default, and can be toggled open as an overlay via a header menu button.

---

### User Story 2 - Nested Medical Navigation & Active States (Priority: P2)

As a medical administrator, I want a structured left navigation sidebar that organizes medical modules (Patients, Medical Care) and features a collapsible Administration submenu, showing clear active selection states, so that I can browse modules intuitively.

**Why this priority**: Provides clear classification and navigation pathways across the medical platform's broad feature set.

**Independent Test**: Interact with the left sidebar navigation items, expanding/collapsing the Administration section, and verify that selecting any route updates the active visual indicator in the menu and loads the corresponding panel in the main content area.

**Acceptance Scenarios**:

1. **Given** an authenticated user in the workspace, **When** they view the sidebar, **Then** they see organized sections:
   * **Dashboard**
   * **Pacientes** (containing nested *Grupo Familiar*)
   * **Atención Médica** (containing *Consultas*, *Historial Médico*, *Exámenes*, *Pruebas complementarias*, and *Citas*)
2. **Given** an authenticated user in the workspace, **When** they click the **Administración** menu item, **Then** it smoothly expands to reveal nested submodules (*Centros Médicos*, *Tipos de Centro*, *Aseguradoras*, *Médicos*, *Especialidades*, *Usuarios*, and *Roles*). Clicking it again collapses it.
3. **Given** a user navigating the sidebar, **When** they click on any menu item, **Then** the menu item is visually highlighted to indicate it is the active page, and all other items return to their default styling.

---

### User Story 3 - User Account Controls & Profile Customization (Priority: P3)

As an authenticated user, I want a profile dropdown menu in the top navigation bar showing my active avatar and name, with options to modify my profile details inside a sliding panel or log out, so that I can manage my session and credentials securely.

**Why this priority**: Enables essential session management, logout flows, and user profile self-service.

**Independent Test**: Click on the user profile button in the top navbar, verify that the dropdown panel mounts successfully, and verify that clicking "Modificar Perfil" opens a side slide-over drawer to update user details.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they click their avatar/profile area in the top navigation bar, **Then** a dropdown menu opens displaying their full name, active email, a "Modificar Perfil" option, and a "Cerrar Sesión" option.
2. **Given** a user with the profile dropdown open, **When** they click "Modificar Perfil", **Then** a slide-over panel (**Drawer**) slides out from the right side of the screen, permitting the user to update their name, lastName, dateOfBirth, and contact details without leaving the page.
3. **Given** a user with the profile dropdown open, **When** they click "Cerrar Sesión", **Then** their authentication session is securely destroyed and they are redirected back to the login page.

---

### Edge Cases

* **Expired Sessions during Navigation**: If the user's JWT session expires while they are navigating between sidebar modules, the system must immediately intercept the failed request, clear localStorage credentials, display a session-expired alert, and redirect the browser to the login screen.
* **Unauthorized Direct Routing**: If an unauthenticated user manually inputs a protected URL in the address bar (e.g. `/dashboard`), the system must intercept the route and redirect them immediately back to `/login`.

---

## Requirements *(mandatory)*

### Functional Requirements

* **FR-001**: The system MUST restrict layout access strictly to authenticated sessions, redirecting all unauthorized visitors back to the `/login` route.
* **FR-002**: The left navigation menu MUST be collapsible, supporting both an expanded state (text + icons) and a collapsed state (icons only) on desktop devices to optimize workspace room.
* **FR-003**: The navigation structure MUST strictly support the following module routing pathways:
  * **Dashboard**
  * **Pacientes** $\rightarrow$ *Grupo Familiar*
  * **Atención Médica** $\rightarrow$ *Consultas*, *Historial Médico*, *Exámenes*, *Pruebas complementarias*, *Citas*
  * **Administración (Collapsible)** $\rightarrow$ *Centros Médicos*, *Tipos de Centro*, *Aseguradoras*, *Médicos*, *Especialidades*, *Usuarios*, *Roles*
* **FR-004**: The sidebar menu MUST dynamically highlight the active route with high-contrast, premium accents to indicate the user's current location in the application hierarchy.
* **FR-005**: The top navigation bar MUST show the connected user's avatar placeholder, full name, and email.
* **FR-006**: The profile controls MUST include a logout button that destroys local tokens and returns the user to the login screen.
* **FR-007**: The profile controls MUST include a "Modificar Perfil" button that triggers a sliding right drawer (Drawer) containing a validated form to modify user details.
* **FR-008**: The sidebar navigation menu MUST support permission-based filtering. Menu items must accept access claims parameters to dynamically hide or show links based on the active user's roles and permissions, without requiring core layout refactoring.

---

### Key Entities

* **UserSession**: Represents the active authenticated user profile details (email, name, lastName, roles, claims) extracted from the JWT token and state.
* **NavigationItem**: Represents the schema defining a route path, display label, icon reference, nested children, and list of required roles/permissions to render.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

* **SC-001**: Authenticated users are directed to the main layout and default dashboard in under 1.5 seconds after a successful login.
* **SC-002**: Left sidebar collapse/expand transitions and slide-over Drawers render smoothly with responsive, micro-animated transitions in under 200 milliseconds.
* **SC-003**: Sidebars and main layouts adjust seamlessly to screen size resizing, hiding the sidebar into an overlay navigation menu on small tablet and mobile screens.
* **SC-004**: Navigation items can be dynamically filtered and hidden according to user roles and permissions in under 50 milliseconds during layout initialization.
* **SC-005**: All authenticated pages block unauthorized access, redirecting guest inputs to `/login` within 100 milliseconds of routing interception.

---

## Assumptions

* **Active JWT Claims**: The JWT token contains user identity claims (email, name, lastName) and role details that can be parsed client-side during session initialization.
* **Local Storage Integration**: Transient session states will continue to reside in secure localStorage, utilizing automated Axios interceptors for all backend API authentication checks.
* **Tailwind CSS v4 Strategy**: The main layout layout shell and all its child components (Sidebar, Topbar, sliding Drawers) will be implemented using Tailwind CSS v4 exclusively, maintaining perfect visual consistency and lightweight bundle performance.
