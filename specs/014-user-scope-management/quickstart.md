# Quickstart: User Scope Management

## 1. Running the Development Server

Navigate to the `LoginApp` workspace directory and run:

```bash
cd LoginApp
npm run dev
```

The application will run locally, usually on `http://localhost:5173/`.

## 2. Verifying Feature Actions

### 2.1 Own Profile Avatar Upload
- Log in with any user.
- Click on the initials avatar at the top right and select "Modificar Perfil".
- Select a new photo (<= 2MB, JPEG/PNG).
- Save changes. Confirm that the topbar header avatar updates immediately.

### 2.2 Admin User Scope Association
- Log in with a user possessing the `Admin` role.
- Navigate to the "Control de Usuarios" page.
- Click on the new "Asociar Scope" button next to "Nuevo Usuario".
- In the slide-over drawer, view the list of scopeless users and click "Asociar" to incorporate them.
- Confirm they appear in the main user grid and disappear from the drawer list.

### 2.3 SuperAdmin Restriction check
- Log in with a user possessing the `SuperAdmin` role.
- Confirm that the "Asociar Scope" view is hidden from the sidebar.
- Verify that standard administrative actions remain accessible, but no scope association/removal actions are present.

## 3. Production Build Validation

To verify code correctness and formatting, run the build compiler:

```bash
npm run build
```
