# Quickstart: Medical Specialties Verification Guide

Follow these steps to manually test the newly implemented Medical Specialties Maintenance CRUD screen:

## Prerequisites
1. Ensure the backend C# API server is running and accessible (e.g. at `http://localhost:5000` or equivalent local configuration).
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```

## Verification Steps

### Step 1: Navigation
1. Log in to the application using administrative credentials.
2. In the sidebar, expand **Administración** and click **Especialidades**.
3. Confirm that the page routes to `/admin/specialties` and renders the list of specialties.

### Step 2: Layout Selection Persistence
1. Change the visual mode to **Tarjetas** (Card Grid layout).
2. Reload the page. Verify the layout stays in Card Grid mode.
3. Change the layout back to **Tabla** (Table layout).
4. Reload the page. Verify the layout stays in Table mode.

### Step 3: Paging and Sorting
1. Verify that the footer shows pagination (e.g., "Página 1 de X") and matches the total items.
2. Click the **Nombre** header to sort specialties alphabetically. Click it again to invert sorting.
3. Type a query in the search bar. Verify the list filters after a 300ms debounce.

### Step 4: Creation and Updates
1. Click the `+ Nueva Especialidad` button.
2. Attempt to click **Crear Especialidad** with an empty name. Verify that an inline validation error appears: *"El nombre de la especialidad es obligatorio."*
3. Type a name shorter than 3 characters (e.g. "Ca"). Confirm that the warning changes to: *"El nombre de la especialidad debe tener al menos 3 caracteres."*
4. Type a valid name (e.g. "Cardiología Intervencionista") and submit. Verify that the drawer closes, a success toast notification appears, and the new item is listed.
5. Click the edit icon next to the specialty, rename it, and submit. Verify that the changes save and are visible in the list.

### Step 5: Logical Deactivation Warning
1. Click the deactivation icon (x or toggle status button).
2. Verify that a warning confirm dialog pops up, displaying:
   `Esta especialidad ya no estará disponible para nuevos médicos. ¿Desea continuar?`
3. Click **Cancelar**. Confirm status has not changed.
4. Click deactivation icon again, and click **Desactivar**. Confirm that the status badge updates to **Inactiva**.
5. Click activation icon to reactivate. Confirm status restores to **Activa**.
