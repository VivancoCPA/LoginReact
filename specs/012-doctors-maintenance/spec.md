# Feature Specification: Doctors Maintenance (Mantenimiento de Médicos)

**Feature Branch**: `012-doctors-maintenance`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Crear el mantenimiento de Medicos con acceso autorizado a la aplicación siguiendo el diseño empresarial de la aplicación. Proveer una interfaz completa para listar, buscar, filtrar, visualizar, editar, crear y desactivar Medicos, con soporte de dos modos de visualización: tabla y tarjetas."

## Clarifications

### Session 2026-06-05

- Q: How should associated Medical Centers be managed inside the creation/edition form? → A: Tabbed Layout (A tabbed structure in the drawer with "Información General" and "Sedes Asociadas" tabs to separate general fields from association management).
- Q: Is there a maximum number of medical centers a doctor can be associated with? → A: Unlimited (no arbitrary limit).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Doctor Listing and Filtering (Priority: P1)

As an Administrator, I want to see a list of doctors in both table and cards formats so that I can quickly browse through the medical staff.

**Why this priority**: Core functionality needed to view medical staff records.
**Independent Test**: Can be tested independently by navigating to the doctors maintenance page and seeing the default listing load.

**Acceptance Scenarios**:
1. **Given** the administrator is logged in and navigates to "/admin/doctors", **When** the page loads, **Then** the system displays a scrollable split pane with a loading state, followed by a list of active and inactive doctors (P1, P2) and the paginator footer docked at the bottom of the list.
2. **Given** the doctors list is loaded, **When** the administrator toggles the view selector, **Then** the list layout switches between Table and Cards view, and the choice persists in the session.
3. **Given** the table view is active, **When** the administrator clicks column headers for Name, LastName, Specialty, or Register, **Then** the list sorts accordingly in ascending or descending order.
4. **Given** the search input is focused, **When** the administrator types a term (matching name, lastName, or specialty), **Then** the system debounces for 300ms and filters the list in real-time.

---

### User Story 2 - Register Doctor with Photo and Affiliations (Priority: P2)

As an Administrator, I want to add a new doctor record, upload their profile photo, and assign their specialties and medical centers so they can operate.

**Why this priority**: Crucial for onboarding new medical staff.
**Independent Test**: Can be tested by filling out the creation form and saving, verifying the record appears in the list.

**Acceptance Scenarios**:
1. **Given** the creation drawer is open, **When** the administrator fills in the required Name (>= 2 chars), Lastname (>= 2 chars), unique Email, and selects a Specialty, and clicks "Crear Médico", **Then** the system registers the doctor, displays a success toast, and refreshes the list.
2. **Given** the creation drawer is open, **When** the administrator adds center associations by selecting a Medical Center, typing a office number and schedule, **Then** these associations are stored under the doctor's record.
3. **Given** the creation form is open, **When** the user uploads a photo larger than 2MB, **Then** the system displays an inline validation error and prevents submission.

---

### User Story 3 - Toggle Doctor Logical Status (Priority: P2)

As an Administrator, I want to deactivate a doctor logically so they are flagged as inactive without deleting their historical records.

**Why this priority**: Needed for staff offboarding while maintaining data integrity.
**Independent Test**: Toggling the status of an active doctor asks for confirmation and updates the badge.

**Acceptance Scenarios**:
1. **Given** the doctor list is displayed, **When** the administrator clicks the deactivate icon for an active doctor, **Then** the system prompts a Confirmation Dialog asking "¿Estás seguro de que deseas desactivar a [Nombre]?".
2. **Given** the confirmation dialog is open, **When** the administrator confirms, **Then** the system calls the API, logically sets the doctor as inactive, dims their row/card (opacity-60), and displays the "Desactivado" status badge.

---

### Edge Cases

- **Concurrent Email Registration**: How does the system handle an attempt to create or update a doctor with an email that already exists? The server returns a `400 Bad Request`, and the UI displays an inline validation error pointing to the email field.
- **Null Specialties**: What happens if a doctor does not have any specialty assigned? The system displays a fallback "Tipo no asignado" or "—" badge in the lists.
- **Deleting Associations**: How does editing a doctor handle removing all centers? The system allows saving with zero associations (clearing them in database).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support a dual-layout representation of doctors: a high-density Table layout and a Card grid layout.
- **FR-002**: Layout selection MUST persist throughout the session using `sessionStorage` key `doctorsLayoutSelection`.
- **FR-003**: The search bar MUST debounce text input for 300ms and search by Name, LastName, Register, Email, and Specialty name.
- **FR-004**: System MUST allow selecting the doctor's profile photo and sending it as a file using `multipart/form-data` payloads.
- **FR-005**: Names and LastNames MUST be validated inline to require at least 2 characters.
- **FR-006**: Emails MUST be validated to match standard email structures and be unique.
- **FR-007**: System MUST load Specialty list lookup options from `specialtyService.getSpecialtiesLookup()`.
- **FR-008**: System MUST load Medical Centers lookup options from `medicalCenterService.getMedicalCentersLookup()`.
- **FR-009**: System MUST allow adding multiple Medical Center affiliations, capturing `officeNumber` and `workSchedule` for each.
- **FR-010**: Deactivating a doctor MUST prompt a `ConfirmDialog` warning overlay.
- **FR-011**: Inactive doctor records MUST be visually dimmed in the lists using `opacity-60` and show a `Desactivado` badge.
- **FR-012**: The Create/Edit form MUST use a Tabbed Layout in the drawer separating "Información General" from "Sedes Asociadas" to avoid visual clutter.
- **FR-013**: System MUST support an unlimited number of medical center associations per doctor.

### Key Entities

- **Doctor**: Represents a medical practitioner. Attributes: ID (UUID), Name, LastName, Specialty ID, Register, Phone, Email, PhotoUrl, IsVet, IsActive.
- **DoctorCenterAssociation**: Represents the association between a Doctor and a Medical Center. Attributes: Medical Center ID, Medical Center Name, OfficeNumber, WorkSchedule.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Page loads and displays results in under 1 second under normal network conditions.
- **SC-002**: Page layout is fully responsive, displaying 3 columns on desktop, 2 on tablet, and 1 on mobile screen sizes.
- **SC-003**: The entire page fits inside the viewport without triggering browser-level window scrollbars, keeping the list layout and map/drawer scrollable internally.

---

## Assumptions

- Specialties and Medical Centers lookup lists will be populated via preexisting services.
- Avatars will have placeholder initials rendered when no photo is uploaded.
- The `isVet` field determines if a doctor is a veterinarian and will be represented by a premium toggle switch.
