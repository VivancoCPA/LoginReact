# Quickstart Guide: Doctors Maintenance (Mantenimiento de Médicos)

This guide outlines the integration check steps and manual test scenarios to verify the module.

---

## 1. Local Development Setup

1. Check that the Vite development server is running.
2. Log into the application using administrator credentials.
3. Access the menu: **Administración -> Médicos** (routes to `/admin/doctors`).

---

## 2. Manual Verification Checklist

### Scenario A: Layout Heights & Responsiveness
1. Resize the browser window vertically.
2. Confirm that **no scrollbars appear on the global window or main layout body**.
3. Verify that the left panel (the list of doctors) scrolls independently when there are more than 10 rows.
4. Verify that the pagination footer remains docked at the bottom of the left list panel.
5. Swap layouts using the Toggle icon. Confirm the cards view renders a grid responsive to the viewport (3 cols on desktop, 2 cols on tablet, 1 on mobile).

### Scenario B: Creation and Dynamic Affiliation
1. Click `+ Nuevo Médico`. The right Slide-Over Drawer opens.
2. In the first tab (**Información General**), type in the doctor's details:
   - Name: `Juan`
   - LastName: `Pérez`
   - Email: `juan.perez@medical.com`
   - Register: `CMP778899`
   - Phone: `999888777`
   - Photo: Select an image file (under 2MB). Confirm the preview displays.
3. Click the second tab (**Sedes Asociadas**).
4. Click `+ Agregar Sede`. Select a Medical Center (e.g. "Policlinico Chincha"), type office `Piso 3, Of. 302`, schedule `Lun-Vie 9-13`.
5. Click `Crear Médico`.
6. Confirm a success toast is shown, the drawer closes, and the list updates.
7. Click the new doctor in the list to view the details tab, verifying the name, photo, and center affiliations display correctly.

### Scenario C: Edit & Image Upload Changes
1. Open the drawer for an existing doctor and click `Editar`.
2. Modify the phone, toggles, or specialty.
3. Choose a different profile image.
4. Click `Guardar cambios` and verify the data, including the new photo, updates properly.

### Scenario D: Deactivation Alerts
1. Click the `Desactivar` button (trash/block icon) on an active doctor row/card.
2. Verify that a warning dialog modal pops up: `¿Estás seguro de que deseas desactivar a [Nombre]?`.
3. Click `Cancelar`. The doctor remains active.
4. Click `Desactivar` again and click `Desactivar` on the modal.
5. Verify:
   - A success toast is displayed.
   - The item in the list becomes visually dimmed (`opacity-60`).
   - The status badge displays `Desactivado` instead of `Activo`.
   - The name displays a soft strike-through (`line-through`).
