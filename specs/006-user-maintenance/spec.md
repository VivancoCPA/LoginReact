# Feature Specification: User Maintenance (Gestión de Usuarios)

**Feature Branch**: `006-user-maintenance`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Crear el mantenimiento de usuarios con accesos a la aplicación siguiendo el diseño empresarial de la aplicación. Proveer una interfaz completa para listar, buscar, filtrar, visualizar, editar, crear y desactivar usuarios, con soporte de dos modos de visualización: tabla y tarjetas."

---

## User Scenarios & Testing

### User Story 1 - Dual View User Listing (Priority: P1) 🎯 MVP
As an authenticated administrator, I want to view a list of all registered users with their details (avatar, name, email, phone, family group, status), with the option to switch between table and card layouts and page through results, so that I can browse accounts easily.

**Independent Test**: Load the user management interface, verify that the list mounts showing initial user rows, page through results using pagination controls, click the visual layout switcher to toggle between Table and Cards view, and verify that the layout choice is persisted across page reloads in the same session.

**Acceptance Scenarios**:
1. **Given** a logged-in administrator on the User Maintenance page, **When** they view the page, **Then** they see a primary action bar with a free-text search, filters, a "+ Nuevo usuario" button, and table/card toggle buttons.
2. **Given** the user listing, **When** they click the card view icon, **Then** the page transitions immediately to a responsive cards grid layout (3 columns on desktop, 2 on tablet, 1 on mobile) representing each user as a premium profile card.
3. **Given** the user listing, **When** they click the table view icon, **Then** the page transitions back to a clean data table showing columns: Avatar, Nombre, Apellido, Email, Teléfono, Grupo Familiar, Estado, and Acciones.

---

### User Story 2 - Searching, Sorting, and Multi-filtering (Priority: P2)
As an administrator, I want to search in real-time, filter by Family Group and active status, and sort columns in the table, so that I can isolate specific user groups or statuses quickly.

**Independent Test**: Enter part of a user's name or email in the search field, select one or more family groups in the multi-select filter, toggle the active/inactive status switches, and confirm the list filters cumulative matches (AND) instantly. Click column headers (Name, Surname) and verify sorting changes ascending/descending.

**Acceptance Scenarios**:
1. **Given** a list of 50 users, **When** the administrator types a search string (e.g., "Juan"), **Then** the results are instantly filtered in real-time to match partial matches on name, lastName, or email.
2. **Given** search filters, **When** the administrator selects one or more Family Groups and toggles the active/inactive status filter, **Then** the filters accumulate using `AND` logic, displaying only users matching all active criteria.
3. **Given** the table view layout, **When** the administrator clicks the column headers for "Nombre" or "Apellido", **Then** the dataset sorts accordingly, showing a chevron indicator for sorting direction.

---

### User Story 3 - Administrative User CRUD Controls (Priority: P3)
As an administrator, I want to create new users, inspect read-only details of existing users, modify editable profile fields, and toggle active states (deactivate/activate), so that I can govern application access securely.

**Independent Test**:
- Click "+ Nuevo usuario", fill the form with valid details (mandatory email, required name/surname), click "Crear usuario", and verify creation with a success toast.
- Click the "Ver" action on a user row, inspect all read-only fields (e.g. created date, last access, email) in the detail modal/panel.
- Click "Editar", modify fields (name, phone, address), verify email and Family Group are not editable, click "Guardar", and verify updates.
- Click "Desactivar", confirm in the destructive dialog, and verify the user status transitions to Inactivo (Locked Out in backend) with options to reactivate.

**Acceptance Scenarios**:
1. **Given** a request to add a user, **When** the admin submits the "+ Nuevo usuario" form, **Then** the email is validated for proper format, name/surname are verified to be $\ge 2$ characters, and the Family Group remains non-editable (set via external options).
2. **Given** an active user, **When** the admin clicks "Desactivar" and confirms, **Then** the backend `PATCH /api/users/{id}/toggle-status` is dispatched, locking the user and rendering their status badge as a grey "Inactivo" chip.
3. **Given** an inactive user, **When** the admin views their details or filters by inactives, **Then** a "Reactivar" action is available that unlocks the user.

---

## Requirements

### Functional Requirements
*   **FR-001**: The system MUST fetch paged and filtered users from the backend using the `GET /api/auth/users/paged` endpoint, mapping sorting (`sortBy`, `sortDesc`) and search parameters correctly.
*   **FR-002**: The layout MUST support both Table and Cards visual modes, saving the chosen layout mode in `sessionStorage` or local memory to persist it across reloads.
*   **FR-003**: The table columns MUST include: Avatar (initials fallback), Name (sortable), Surname (sortable), Email, Phone, Family Group (as a badge), Status (green badge for Active, grey for Inactivo), and inline action buttons (View, Edit, Toggle Status).
*   **FR-004**: The free-text search bar MUST filter results in real-time, matching name, lastName, or email.
*   **FR-005**: The filters MUST support cumulative multi-select filtering by Family Group and toggle filtering by status (Active / Inactive).
*   **FR-006**: The "Nuevo usuario" form MUST validate inputs (Email format and unique check, Name and Surname required with $\ge 2$ characters). Family Group field MUST not be administrative editable.
*   **FR-007**: The "Ver" detail view MUST present full user profile records (including creation dates, last access, address, date of birth) in a clean read-only side drawer or modal.
*   **FR-008**: The "Editar" form MUST pre-fill all details, locking the Email and Family Group fields from modifications while allowing other fields (Name, LastName, DOB, Phone, Address) to be modified.
*   **FR-009**: The "Desactivar" action MUST display a confirmation dialog before calling `PATCH /api/users/{userId}/toggle-status` to block the user. For inactive users, a "Reactivar" option MUST be offered.

---

## Success Criteria

### Measurable Outcomes
*   **SC-001**: Users list rendering and switching layout modes (Table $\leftrightarrow$ Cards) operates fluidly under 150 milliseconds.
*   **SC-002**: Filter parameters and free-text searches process and update the rendered dataset in under 100 milliseconds.
*   **SC-003**: Dynamic inputs, validations, and custom tooltips are reactive and provide immediate visual feedback.
