# Feature Specification: Specialties Maintenance (Mantenimiento de Especialidades Médicas)

**Feature Branch**: `009-specialties-maintenance`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Crear mantenimiento de Especialidades Medicas para ser asignado a los Medicos desde su propio Mantenimiento. Proveer una interfaz completa para listar, buscar, filtrar, visualizar, editar y crear con soporte de dos modos de visualización: tabla y tarjetas."

## Clarifications

### Session 2026-06-04

- **Q**: ¿Cómo debe manejar el frontend la advertencia al desactivar una especialidad dado que el API no retorna el conteo de médicos? → **A**: Mostrar una advertencia general (ej. *"Esta especialidad ya no estará disponible para nuevos médicos. ¿Desea continuar?"*) antes de proceder.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - List and Search Specialties (Priority: P1)

Administrators need to view all medical specialties in a high-density listing, perform real-time name searches, and toggle their preferred view mode.

**Why this priority**: It is the primary entry point and foundational view. Without the ability to list and view specialties, administrators cannot oversee the specialty registry.

**Independent Test**: Load the specialties console, verify that existing specialties are rendered, search for a specialty by name, and switch layouts (Table vs Cards), verifying that the selected layout persists in `sessionStorage` (`specialtiesLayoutSelection`).

**Acceptance Scenarios**:

1. **Given** the specialties page is loaded, **When** the administrator types a query in the search input, **Then** the list filters in real-time, showing only matching specialties by name.
2. **Given** the specialties list, **When** the administrator toggles the layout button, **Then** the view swaps between a compact Table layout and a Card Grid layout, and the selection is saved in `sessionStorage` (`specialtiesLayoutSelection`).
3. **Given** a search query with no matches, **When** the list is loaded, **Then** an illustrative empty state message is shown to the user.

---

### User Story 2 - Create and Edit Medical Specialties (Priority: P2)

Administrators need to register new medical specialties and update existing ones using a side-over drawer panel or modal.

**Why this priority**: Enables content management. Once the list is available, the ability to populate and edit records is necessary for a functional registry.

**Independent Test**: Click `+ Nueva Especialidad`, fill out the name field, and click Save. Edit an existing specialty, modify its name, save, and verify that the list updates and a success toast notification appears.

**Acceptance Scenarios**:

1. **Given** the creation form is open, **When** the administrator enters a blank name or a name shorter than 3 characters, **Then** inline validation warnings are displayed next to the field, blocking form submission.
2. **Given** an existing specialty, **When** the administrator changes its name and clicks "Guardar cambios", **Then** the details are updated, the drawer closes, and a success notification toast is displayed.

---

### User Story 3 - Activate and Deactivate Specialties (Priority: P3)

Administrators need to toggle the availability of specialties (active/inactive) without deleting them, to control which ones can be associated with doctors.

**Why this priority**: Allows logical deletion and deactivation to keep the list clean while preserving historical relations in the database.

**Independent Test**: Locate a specialty in either Table or Cards view, trigger the deactivate/activate action, and confirm that the status badge changes immediately.

**Acceptance Scenarios**:

1. **Given** an active specialty, **When** the administrator selects "Desactivar" from the action menu, **Then** the status changes to "Inactivo" and its badge updates.
2. **Given** an inactive specialty, **When** the administrator selects "Activar" from the action menu, **Then** the status changes back to "Activo".

### Edge Cases

- **Specialty Name Collision**: If an administrator attempts to create or rename a specialty using a name that already exists in the system, the form must display a conflict warning (e.g., "El nombre de la especialidad ya está registrado") and prevent submission.
- **Deactivating Specialties**: Since the Specialties API does not return a count of assigned doctors, deactivating a specialty will prompt a general warning dialog indicating that the specialty will become unavailable for new doctor assignments, rather than showing a specific count.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST fetch and display medical specialties in a paginated list from the backend using the endpoint `GET /api/specialties/paged`, supporting page navigation and configurable page sizes.
- **FR-002**: The search bar MUST filter specialties by name server-side, with a debounced input trigger (300ms delay) to limit API requests.
- **FR-003**: The system MUST support two view modes: a high-density Table view and a Cards Grid view, persisting the selection in `sessionStorage` (`specialtiesLayoutSelection`).
- **FR-004**: The Table view MUST include sortable columns for the name and status fields.
- **FR-005**: The Cards Grid view MUST display the specialty name and active/inactive status badge, and feature a triple-dot actions dropdown menu (⋮) on each card.
- **FR-006**: The system MUST use a slide-over drawer panel or modal for viewing details, creating, and editing specialties.
- **FR-007**: The specialty fields MUST include: Name (string, required, unique, max 100 characters) and Status (boolean active/inactive, defaults to active).
- **FR-008**: The system MUST perform inline validation: Name cannot be empty and must be at least 3 characters long.
- **FR-009**: The system MUST display a success toast notification upon successful creation or modification of a specialty.
- **FR-010**: All API communication for creation (`POST /api/specialties`) and modification (`PUT /api/specialties/{id}`) MUST use standard JSON payloads.
- **FR-011**: The deactivation action MUST prompt a general confirmation dialog warning the user that the specialty will become unavailable for new doctor assignments before calling the toggle-status API.

### Key Entities

- **Specialty (Especialidad)**:
  - Represents a medical specialty (e.g., Cardiología, Pediatría).
  - Attributes: ID (Integer, correlativo), Name (String, unique), IsActive (Boolean), CreatedAt (DateTime).
  - Relationships: Has a many-to-many relationship with Doctors (assigned in the Doctors module).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can search and filter the list of specialties in under 1 second.
- **SC-002**: Real-time search inputs are debounced by 300ms to avoid overloading the API server.
- **SC-003**: Layout selection changes are applied instantly and persist accurately across browser page reloads.
- **SC-004**: All forms (creation and editing) display immediate inline error messages upon losing focus on invalid fields.

## Assumptions

- **Scope Boundary (Doctors Assignment)**: The actual interface to assign specialties to doctors is out of scope for this feature and will be implemented within the Doctors Maintenance module.
- **Logical Deactivation**: Deactivating a specialty does not delete the record from the database but flags it as inactive, preventing new doctor assignments to this specialty.
- **Default Page Size**: The default page size for pagination is set to 10 items.
