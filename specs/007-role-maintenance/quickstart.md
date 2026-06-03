# Quickstart Guide: Role Maintenance (Mantenimiento de Roles)

This guide provides steps for running and manually validating the Role Maintenance features inside the application frontend.

---

## 🏃 Getting Started

### 1. Install Dependencies
Make sure you are in the Vite React application directory (`LoginApp`):
```bash
cd LoginApp
npm install
```

### 2. Start the Development Server
Launch the development server:
```bash
npm run dev
```
Open your browser and navigate to the application address (typically `http://localhost:5173`).

---

## 📋 Manual Verification Checklist

### 1. Navigation Flow
1. Login to the application as an authorized Administrator.
2. Observe the Left Sidebar menu.
3. Click on the **Administración** group, then click on the **Roles** submenu.
4. Confirm that the URL in the browser address bar changes to `/admin/roles` and the Roles dashboard page mounts successfully.

### 2. Layout & Views Toggle
1. By default, verify that the roles list renders as a high-density, clean **Table**.
2. Note the columns: **Nombre**, **Asignados**, and **Acciones** (Editar icon).
3. Click on the **Cards Toggle Icon** in the top bar.
4. Verify that the view flips immediately into a responsive **Cards Grid** (renders as a 3-column grid on desktop screens, 2 on tablet, and 1 on mobile).
5. Refresh the browser and verify that the preferred layout mode remains selected (sessionState persistence check).

### 3. Real-Time Search
1. In the search bar at the top, type `Auditor`.
2. Confirm that only matching roles remain in the list (Table or Cards) in real-time.
3. Clear the search input and verify that all system roles return to the view.
4. Type a dummy string (e.g. `XYSDFSDF`) and verify that a beautiful empty state mounts showing a "No se encontraron roles" message.

### 4. Create Role Form (Drawer)
1. Click the `+ Nuevo Rol` primary action button.
2. Confirm that a right slide-over **Drawer panel** emerges from the right side of the screen.
3. Leave the Name field blank, input a Description, and attempt to click "Guardar". Verify that the drawer blocks the action and highlights the name validation error.
4. Type a short name (e.g. `Ad`) and confirm the real-time line validation message ("El nombre del rol debe tener al menos 3 caracteres").
5. Input a valid name (e.g. `Coordinador`) and click "Guardar cambios".
6. Verify the success toast notification appears, the drawer slides shut, and the new role is instantly listed in the view.

### 5. Edit Role Form (Drawer)
1. Click on the **Editar** action icon (in Table view) or select **Editar** from the card's vertical dropdown menu (⋮ in Cards view) for any role.
2. Verify that the right slide-over Drawer panel emerges pre-filled with the role's current name and description.
3. Modify the description, click "Guardar cambios", and confirm the update toast and row updates.
4. Try editing a protected system role (e.g., `Admin`). Verify that editing names or deleting is blocked according to safety constraints.
