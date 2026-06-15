# Research Log: Appointments Maintenance (Mantenimiento de Citas)

**Branch**: `017-citas-maintenance` | **Date**: 2026-06-15

This log consolidates research findings, design choices, and backend API mappings for the Appointments Maintenance module.

---

## 1. Backend API Endpoint Mapping

The vertical slice authentication and appointments system exposes the following endpoints (documented in `AppointmentsEndpoints.md` and `AppointmentStatusesEndpoints.md`):

- **List All Statuses**: `GET /api/appointment-statuses`
  - Returns `id` (e.g. `"PENDIENTE"`) and `label` (e.g. `"Pendiente"`).
  - Used to populate the status filter dropdown dynamically.
- **List Paged Appointments**: `GET /api/appointments/paged`
  - Accepts query parameters: `page`, `pageSize`, `statusId`, `date`.
  - Filters by the authenticated user's token claims.
  - Used for the primary table grid with pagination.
- **List All Appointments**: `GET /api/appointments`
  - Accepts query parameters: `statusId`, `date`.
  - Returns the full list of appointments for the authenticated user.
  - Used to search/filter client-side or determine the next confirmed appointment.

---

## 2. Next Confirmed Appointment Logic

To calculate and display the **Next Confirmed Appointment** card adjacent to the filter controls:
- **API Query**: Fetch all active appointments with `statusId=CONFIRMADA` using `GET /api/appointments`.
- **Client Processing**:
  - Filter out appointments whose `appointmentDate` is in the past (expired: `new Date(item.appointmentDate) < new Date()`).
  - Sort the remaining future appointments by `appointmentDate` in ascending order.
  - Select the first element in the sorted list as the next confirmed appointment.
  - Render its Date, Time, Doctor Name, Specialty, and Medical Center in the highlight card. If none exist, display a "Sin citas próximas" state.

---

## 3. Date Formatting and Handling

The specification mandates displaying dates in the format `dd/mm/yyyy` with times on a second line in a smaller font size.
- **Display Formatting**:
  - Date: Parse ISO 8601 string (e.g. `"2026-06-20T14:30:00Z"`) and format using locale formatting: `DD/MM/YYYY`.
  - Time: Format as `HH:mm` or `hh:mm A` (e.g. `14:30` or `02:30 PM`).
- **Date Filter Parameter**:
  - The calendar input picker stores date values in `YYYY-MM-DD` format.
  - When querying the API, we pass the date formatted as `YYYY-MM-DD` (e.g. `GET /api/appointments/paged?date=2026-06-20`) to match the backend date comparison logic.

---

## 4. Geographic Map Integration

Clicking a Medical Center name link will route to a dedicated page `/admin/medical-centers/map` or `/appointments/map` passing coordinates and name:
- **Navigation Payload**: Coordinates (`centerLatitude`, `centerLongitude`) and Name (`centerName`).
- **Interactive Component**: We will implement a mock interactive map layout styled with glassmorphism matching the corporate brand. It will show a visual grid layout representing a map, showing crosshairs at the specific coordinates, and displaying details of the Medical Center (Name, Address, Coordinates) in an informational card. This bypasses the need for external API keys (Google Maps/Mapbox) while keeping the visual layout premium and fully responsive.
