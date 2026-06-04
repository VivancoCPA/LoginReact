# Quickstart Guide: Medical Centers Maintenance Integration

This document guides developers and testers through verification flows for the **Medical Centers Maintenance (Mantenimiento de Centros Médicos)** CRUD module.

## Prerequisites

1. Ensure the C# backend API server is running on `http://localhost:5043` (or the configured base URL).
2. The user must be authenticated under the "Administrador" role.

---

## Manual Verification Scenarios

### Scenario 1: Accessing the Dashboard & Split Layout
1. Navigate to `/admin/medical-centers` from the sidebar menu: **Administración -> Centros Médicos**.
2. Verify that the screen is split into:
   * **Left Panel**: Scrollable listing (compact view with search inputs and status tabs).
   * **Right Panel**: Full interactive map container showing pins/markers for all medical centers returned by the paginated list.

### Scenario 2: Creating a Medical Center via Map Coordinates
1. Click the `+ Nuevo Centro` primary button in the left toolbar.
2. Observe the right-slide drawer opening with width `max-w-xl`.
3. In the location form, fill in the Name, Address, and select a Center Type.
4. Use the Drawer Form Map:
   * **Address Search**: Type a search location (e.g. "Lima") in the geocoding input inside the drawer and click Search. Observe Nominatim querying and placing the marker at the coordinates, auto-filling the Latitude and Longitude fields.
   * **Map Click**: Click any location directly on the mini-map. The marker moves, and the coordinates are dynamically updated in the form.
5. Click **Crear Centro**. Verify that:
   * A success notification toast is displayed.
   * The drawer closes automatically.
   * The new center is added to the left list and its marker appears on the main map.

### Scenario 3: Real-Time Debounced Search & Sorting
1. Type a name or address query (e.g., "Jesús María") into the search input.
2. Confirm that the API request is debounced by 300ms.
3. In Table view mode:
   * Click the column header "Nombre" or "Tipo". Verify that the list sorts in ascending or descending order.
   * Confirm the markers displayed on the right main map update to reflect only the centers returned in the active list.

### Scenario 4: Logical Deactivation Warning Check
1. Locate an active center in either the table row or cards list.
2. Click the **Desactivar** button/icon.
3. Confirm that a modal dialog overlay displays: *"¿Estás seguro de que deseas desactivar a [Nombre]?"*.
4. Click **Desactivar** in the confirmation dialog. Confirm that:
   * The status changes to inactive (red badge).
   * The center remains visible if the filter is set to "Todos" or "Inactivos", but disappears if set to "Activos".
