# Feature Specification: Medical Center Maintenance (Mantenimiento de Centros Médicos)

**Feature Branch**: `011-medical-centers`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Crear mantenimiento de para Tipos de Centro Medico para ser asignado a los Centros Medicos desde su propio Mantenimiento. Proveer una interfaz completa para listar, buscar, filtrar, visualizar, editar y crear con soporte de dos modos de visualización: tabla y tarjetas."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Medical Center CRUD and Right-Drawer Forms (Priority: P1)

Administrators need to create, view details of, and edit medical centers. They must select the medical center type from a dropdown lookup of active center types.

**Why this priority**: Core CRUD functionality is required to manage medical centers in the platform.

**Independent Test**: Verify that a user can create a medical center with name, address, active center type, and coordinates, view its details, and modify its attributes.

**Acceptance Scenarios**:

1. **Given** the creation drawer is open, **When** the user fills in valid details (Name: "Centro Médico Central", Address: "Av. Principal 123", Center Type: "Clínica", Lat/Long: -12.04637, -77.04279) and clicks "Crear Centro", **Then** the center is saved, a success notification appears, the list is reloaded, and the drawer closes.
2. **Given** the user is viewing a center's detail panel, **When** they click "Editar", **Then** the form becomes editable.
3. **Given** the editing form is open, **When** the user submits invalid fields (empty name or address < 2 characters), **Then** inline validation errors are displayed immediately, preventing form submission.

---

### User Story 2 - Paginated Listing with Table/Cards Layouts (Priority: P2)

Administrators need to browse medical centers in either a compact tabular format or a responsive cards layout, persisting their layout preference across sessions.

**Why this priority**: Ensures optimal visibility on various devices and improves browsing experience for datasets of different sizes.

**Independent Test**: Verify that toggling between Table and Cards views persists the selection after refreshing the page and preserves search/filtering parameters.

**Acceptance Scenarios**:

1. **Given** the list of medical centers is displayed, **When** the user switches to Cards layout, **Then** the UI renders a responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile).
2. **Given** the user has switched layout to Cards, **When** they refresh the browser, **Then** the layout remains in Cards mode.
3. **Given** the Table layout, **When** the user clicks header columns for Name, Address, or Type, **Then** the list sorts accordingly.

---

### User Story 3 - Debounced Search and Accumulative Filtering (Priority: P2)

Administrators need to search for medical centers by name or type and apply cumulative (AND) status filters (All, Active, Inactive).

**Why this priority**: Essential for quickly finding specific centers once the database grows.

**Independent Test**: Search and verify filters return correct intersections.

**Acceptance Scenarios**:

1. **Given** the search input, **When** the user types "Clínica", **Then** a server-side search is triggered after a 300ms debounce delay.
2. **Given** the search query is set, **When** the user toggles the status filter to "Inactivos", **Then** the results display only inactive medical centers matching the search query.

---

### User Story 4 - Logical Deactivation with Safety Warning (Priority: P3)

Administrators want to logically deactivate medical centers without removing them permanently from the system, receiving a safety confirmation warning first.

**Why this priority**: Prevents accidental deletions and protects historical assignments.

**Independent Test**: Deactivate a medical center and confirm it is filtered out of active lists but remains in the inactive dataset.

**Acceptance Scenarios**:

1. **Given** a medical center is active, **When** the user clicks "Desactivar", **Then** a confirmation dialog asks: "¿Estás seguro de que deseas desactivar a [Nombre]?"
2. **Given** the confirmation dialog is open, **When** the user confirms the action, **Then** the center's status changes to inactive and a success toast notification appears.

---

### Edge Cases

- **Unavailable Center Types**: What happens if a medical center's assigned Type is deactivated?
  * *Resolution*: The center retains its historical Type. However, when editing the center, the deactivated Type cannot be selected for new changes.
- **Coordinates Format Validation**: What happens if a user inputs malformed Latitude or Longitude coordinates?
  * *Resolution*: Form validation rejects inputs that are not valid decimal numbers within standard coordinate ranges (Latitude: -90 to 90; Longitude: -180 to 180).
- **Network Conflicts**: What happens when two users attempt to update the same medical center concurrently?
  * *Resolution*: The system returns a concurrency error notification, instructing the user to refresh the dataset.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST fetch active center types dynamically from `/api/center-types/lookup` to populate the "Tipo de Centro" selection dropdown.
- **FR-002**: The listing view MUST support two layouts: a tabular high-density layout and a responsive cards grid.
- **FR-003**: The selected layout preference MUST be saved in `sessionStorage` under the key `medicalCentersLayoutSelection`.
- **FR-05.5**: In Table mode, columns for Name, Address, and Type MUST be sortable in ascending and descending order.
- **FR-005**: The search input MUST support text filtering over the Name and Type, triggering requests with a debounced delay of 300ms.
- **FR-006**: A Slide-over Right Panel Drawer component MUST handle Detail View, Creation, and Editing states.
- **FR-007**: When in Creation or Editing states, the form MUST validate:
  * Name: Non-empty, minimum 2 characters.
  * Address: Non-empty, minimum 2 characters.
  * Center Type: Selected.
  * Latitude: Decimal number between -90 and 90.
  * Longitude: Decimal number between -180 and 180.
- **FR-008**: Logical deactivation actions MUST trigger a confirmation dialog overlay before execution.
- **FR-009**: The Detail View and Cards layout MUST display a mock map box indicating the center's location coordinates.
- **FR-010**: All backend communications MUST use standard JSON payloads.

---

### Key Entities

- **MedicalCenter**:
  * `id` (integer, unique identifier)
  * `name` (string, required, min 2 characters)
  * `address` (string, required, min 2 characters)
  * `centerTypeId` (integer, foreign key referencing CenterType)
  * `centerTypeName` (string, read-only lookup name)
  * `latitude` (decimal, required for map location)
  * `longitude` (decimal, required for map location)
  * `isActive` (boolean, logical deletion flag)
  * `createdAt` (datetime)
  * `updatedAt` (datetime)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Page loads and displays the initial paginated list in under 1 second under normal network conditions.
- **SC-002**: 100% of validation errors are caught inline in the client application without triggering unhandled server exceptions.
- **SC-003**: Search queries only trigger server API requests 300ms after the user stops typing, preventing API overload.
- **SC-004**: Swapping layout preferences retains the user's setting across browser reloads without layout shifts.

---

## Assumptions

- **Map Component**: Since integrating full Google Maps/Leaflet APIs requires setup keys and specific external packages, we will render a stylized, custom interactive Leaflet Map component using open-source, non-authenticated map tile layers (e.g., OpenStreetMap) which allows marker placements and searches without requiring any API keys.
- **API Mappings**: The backend endpoints will align with:
  * `GET /api/medical-centers/paged`
  * `GET /api/medical-centers/{id}`
  * `POST /api/medical-centers`
  * `PUT /api/medical-centers/{id}`
  * `PATCH /api/medical-centers/{id}/toggle-status`
- **Authentication**: Access to this module requires authentication under the "Administrador" role role-checks already in place.
