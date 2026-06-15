# Feature Specification: Citas (Appointments Maintenance)

**Feature Branch**: `017-citas-maintenance`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "Citas: Crear la vista principal del mantenimiento de Citas de usuarios con acceso autorizado a la aplicación siguiendo el diseño empresarial de la aplicación. Objetivo: Proveer una interfaz completa para listar, buscar, filtrar, visualizar, editar, crear y cambiar estados de las citas."

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Interactive Search & Filters on Table Grid (Priority: P1) 🎯 MVP

As an authenticated user, I want to view, search, and filter my medical appointments in a table layout, so that I can easily locate and review my schedule.

**Why this priority**: Core value of the feature; provides immediate visibility into the user's appointments schedule.

**Independent Test**: Can be fully verified by logging in, navigating to the appointments tab, and verifying that the page renders a structured table of appointments matching search keywords, selected statuses, or date filters, with clean pagination.

**Acceptance Scenarios**:

1. **Given** that I am on the appointments view, **When** I search for a specific doctor's name or medical center, **Then** the list updates dynamically to only show matching appointments.
2. **Given** that I select a status filter from the action bar (e.g., "Confirmada"), **When** the page refreshes/updates, **Then** only appointments with the selected status are displayed.
3. **Given** that I select a specific date from the calendar picker, **When** I apply the filter, **Then** only appointments scheduled on that date are shown.
4. **Given** that no appointments match the current active search or filter criteria, **When** the table rendering completes, **Then** a friendly, empty state banner is displayed instead of an empty grid.

---

### User Story 2 - Next Confirmed Appointment Highlight (Priority: P2)

As a patient or user, I want to see a dedicated card highlighting my next confirmed, non-expired appointment on the dashboard header, so that I don't forget my most immediate medical visit.

**Why this priority**: High-value UX addition that summarizes critical temporal data for the user at a glance.

**Independent Test**: Log in with a user who has multiple future appointments and confirm that a prominent header card on the top right displays details (Date, Doctor, Specialty, Center) of the single closest confirmed appointment in the future.

**Acceptance Scenarios**:

1. **Given** that I have future confirmed appointments, **When** the view loads, **Then** the card on the right of the actions bar displays the details (Date, Specialty, Doctor, and Center Name) of the nearest future confirmed appointment.
2. **Given** that I have no future confirmed appointments (all are cancelled, finished, or in the past), **When** the view loads, **Then** the highlight card shows a placeholder indicating "Sin citas próximas".

---

### User Story 3 - Medical Center Location Viewer (Priority: P3)

As a user, I want to click on a medical center's name in the table grid, so that I am navigated to a map view showing where that center is located.

**Why this priority**: Enhances usability by integrating geographic awareness into the appointments checklist.

**Independent Test**: Click on a medical center name in the table, verify it transitions to a map view or external maps page containing the geographic coordinate details of that center.

**Acceptance Scenarios**:

1. **Given** that I am viewing the appointments table, **When** I click on the name of a Medical Center, **Then** a detail page or overlay opens displaying a map showing the physical location of the center based on its coordinates.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a main dashboard layout displaying appointments in a structured table format.
- **FR-002**: System MUST render the following columns in the table:
  - **Fecha**: Date (formatted as dd/mm/yyyy with a calendar icon) and time (rendered on a second line in a smaller font size).
  - **Especialidad**: Medical specialty name (sortable).
  - **Doctor**: Doctor's full name, rendered alongside their profile picture/avatar. If no picture is available, fallback initials MUST be displayed in a circular badge.
  - **Centro Médico**: Name of the medical center (rendered as an interactive clickable link).
  - **Estado**: A status badge colored according to the appointment state:
    - _Pendiente_: Gray/Yellow.
    - _Confirmada_: Blue/Indigo.
    - _Inasistencia_: Charcoal/Dark Gray.
    - _Cancelada_: Orange/Red.
    - _Reprogramada_: Purple.
    - _EnConsulta_: Teal.
    - _Finalizada_: Green.
  - **Acciones**: Action icons to View Details, Edit, and Change Status (rendered as non-functional links/placeholders in this milestone).
- **FR-003**: System MUST offer sorting capabilities on the **Especialidad** column.
- **FR-004**: System MUST present a top actions bar containing:
  - A status dropdown filter containing: "Todos", "Pendiente", "Confirmada", "Inasistencia", "Cancelada", "Reprogramada", "EnConsulta", "Finalizada".
  - A date-range or single-date filter using a calendar selector interface.
  - A primary action button labeled `+ Nueva Cita` (which remains non-functional in this milestone).
- **FR-005**: System MUST render a highlighted summary card on the right-hand side of the actions bar displaying the nearest confirmed future appointment.
- **FR-006**: Clicking on a Medical Center link in the table MUST navigate the user to a route or view displaying the center's location coordinates plotted on a visual map interface.
- **FR-007**: System MUST provide pagination controls at the foot of the table supporting page transition actions.
- **FR-008**: System MUST render a user-friendly empty state illustration and descriptive text when the active filter configuration matches no records.

### Key Entities _(include if feature involves data)_

- **Appointment (Cita)**:
  - `id` (unique identifier)
  - `date` (date and time of the appointment)
  - `specialty` (associated medical specialty)
  - `doctorName` / `doctorLastName` (doctor details)
  - `doctorPhotoUrl` (optional avatar image)
  - `medicalCenter` (name of the facility)
  - `latitude` / `longitude` (geographic coordinates of the facility)
  - `status` (one of the enum states: Pendiente, Confirmada, Inasistencia, Cancelada, Reprogramada, EnConsulta, Finalizada)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can filter the appointments table by status or date and see updated results in less than 500 milliseconds.
- **SC-002**: The appointments table renders pagination footers and changes pages instantly upon click.
- **SC-003**: Inactive controls (`+ Nueva Cita`, Edit, View, and Change Status icons) display clear hover tooltips or styles indicating they are non-functional in this stage.
- **SC-004**: Map loading transitions are smooth, loading coordinates within 1 second of clicking a facility link.

## Assumptions

- **A-001**: Standard corporate dark/light glassmorphic UI styles will be reused for rendering layouts, dropdowns, and table components.
- **A-002**: Mock data will be used to populate the initial table grid, next confirmed appointment highlight, and coordinates.
- **A-003**: Mid-session role transitions are out of scope for this layout.
- **A-004**: The map component can render a static coordinate placeholder or simple OpenStreetMap/iframe container since no specific map API keys are provided.

## Clarifications

### Session 2026-06-15

- Q: ¿Cómo debe comportarse la visualización de citas con la columna Apellido? → A: Retirar la columna Apellido de la especificación de la tabla principal de citas.
