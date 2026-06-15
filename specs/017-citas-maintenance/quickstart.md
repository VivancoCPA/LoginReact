# Quickstart: Appointments Maintenance Validation

This guide outlines manual verification scenarios to test the Appointments Maintenance layout once built.

---

## 1. Navigation Flow
1. Log in to the application.
2. Select a role and enter the main dashboard.
3. Open the sidebar navigation menu and click on **Citas** (or navigate directly to `/patients/appointments`).
4. Verify that the main collapsible sidebar and Topbar page title are loaded correctly, showing **Citas de Paciente**.

---

## 2. Table Grid & Sorting
1. Inspect the columns of the table grid: **Fecha**, **Especialidad**, **Doctor**, **Centro Médico**, **Estado**, **Acciones**.
2. Click on the **Especialidad** column header to trigger sorting. Verify that sorting icon changes and rows sort alphabetically.
3. Click a second time to sort in descending order.

---

## 3. Top Actions & Filters
1. Locate the status dropdown filter showing "Todos" by default.
2. Select **Confirmada** and verify that only appointments with status badge `Confirmada` (Blue/Indigo) are displayed in the list.
3. Open the calendar picker and select a date where appointments exist. Verify the grid refreshes and filters only that day's scheduled sessions.
4. Set the date picker to a future date with no appointments. Verify the empty state message and illustrations are rendered correctly.
5. Check that the `+ Nueva Cita` button is visible but shows a tooltip indicating "No disponible en esta etapa" or similar, without breaking navigation.

---

## 4. Next Confirmed Appointment Display
1. Verify that the card on the right of the action bar displays details of the single confirmed appointment closest to the current time.
2. Verify details shown: Date/Time, Doctor, Specialty, and Facility name.
3. Log in with a user possessing no future confirmed appointments and check that the card renders "Sin citas próximas" as a fallback state.

---

## 5. Map Route Navigation
1. In the table row, click on any medical center name link (e.g. "Centro Médico Las Lomas").
2. Verify you are redirected to the route `/patients/appointments/map` or a map container overlay.
3. Check that the page renders a clean mock interactive map, showing a target crosshair plotted at the coordinates (latitude, longitude) of that medical facility and displaying an address info card.
4. Click "Volver" to return back to the list page.
