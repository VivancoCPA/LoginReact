# Quickstart: 003-force-password-change

This document explains how to verify the **Force Password Change on First Login** flow.

---

## 1. Setup & Installation

Ensure `LoginApp/.env.local` is configured:
```env
VITE_API_BASE_URL=http://localhost:5043/api
VITE_TOKEN_EXPIRY_MINUTES=60
```

1. Start the backend ASP.NET Core API at `http://localhost:5043`.
2. Start the local Vite development server:
   ```bash
   cd LoginApp
   npm run dev
   ```

---

## 2. Verification Instructions

### 2.1 Initiating the Forced Redirection
1. Visit `http://localhost:5173/login`.
2. Input the credentials of a new user created by the Admin (whose `passwordConfirmed` is set to `false`).
3. Click **Ingresar**.
4. Verify that you are redirected instantly to `http://localhost:5173/force-password-change`.
5. Verify that a warning toast displays: *"Debe cambiar su contraseña antes de continuar."*

### 2.2 Verifying Route Blocking
1. While on `/force-password-change`, type `http://localhost:5173/dashboard` in the browser address bar and press Enter.
2. Verify that the routing guard intercepts the request, blocks access, and redirects you back to `http://localhost:5173/force-password-change` successfully.

### 2.3 Verifying Password Inputs & Show/Hide Mechanics
1. Verify that the User's Email and Name are correctly populated and rendered as read-only.
2. In the *"Nueva Contraseña"* input, type a weak password (e.g. `123`).
3. Verify that the complexity list remains unfulfilled.
4. Click the eye icon next to *"Nueva Contraseña"*. Verify that the text becomes visible.
5. Click it again. Verify that the text is hidden.
6. Verify that the *"Confirmar Nueva Contraseña"* field also implements identical eye-toggle visibility.

### 2.4 Completing the Password Update
1. Input a strong compliant password in *"Nueva Contraseña"* (e.g. `SecurePass123!`).
2. Input the same password in *"Confirmar Nueva Contraseña"*.
3. Click **Establecer Contraseña**.
4. Verify:
   * A success Toast displays: *"Contraseña actualizada con éxito. Inicie sesión con sus nuevas credenciales."*
   * You are immediately logged out (localStorage cleared) and redirected back to `/login`.
5. Authenticate again at `/login` using your **new** permanent password. Verify that you are successfully redirected to `/dashboard` directly without any prompts.
