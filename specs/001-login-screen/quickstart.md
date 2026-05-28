# Quickstart: 001-login-screen

This document explains how to set up, run, and verify the `001-login-screen` feature.

---

## 1. Setup & Installation

### 1.1 Prerequisites
* Node.js (v18 or higher recommended)
* ASP.NET Core Backend running at `http://localhost:5043/api/` (documented in `UsersEndpoints.md`)

### 1.2 Installation Commands
Once the project skeleton is initialized (handled in the implementation tasks):
1. Navigate to the repository root:
   ```bash
   cd c:\Users\ANTONIO\source\repos\agy-sdd\LoginAPi
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables file:
   Create a `.env.local` file with the following variables:
   ```env
   VITE_API_BASE_URL=http://localhost:5043/api
   VITE_TOKEN_EXPIRY_MINUTES=60
   ```

---

## 2. Running the Application

Start the local development server:
```bash
npm run dev
```
The application will launch on your local host (usually `http://localhost:5173`).

---

## 3. Verification Instructions

### 3.1 Initial View
* Open the browser and visit `http://localhost:5173/login`.
* Verify the beautiful split-screen layout on desktop:
  * Left: Corporate title, branding message, and logo.
  * Right: Clean minimalist login form.
* Shrink the viewport to tablet (<1024px) or mobile (<768px) and verify that the left branding column collapses and the login form centers gracefully.

### 3.2 Real-time Form Validation
1. Leave the **Correo Electrónico** field empty and enter a password. Verify that a validation toast or inline indicator alerts you.
2. Enter a malformed email (e.g., `user@test`). Verify that a validation alert is displayed.
3. Enter a weak password (e.g., `pass123`). Verify that the password does not pass complexity validation. Password rules:
   * 8+ characters
   * At least one uppercase letter
   * At least one lowercase letter
   * At least one digit
   * At least one special character
4. Clear all inputs and verify that the Login button is disabled or triggers validation toasts indicating required fields.

### 3.3 API Connection & Success Path
* Ensure the ASP.NET Core backend is running at `http://localhost:5043`.
* Enter correct user credentials.
* Click **Login**.
* Verify:
  * A loading spinner appears on the button.
  * A success Toast notifies: *"¡Bienvenido de vuelta, [Nombre]!"*
  * The application redirects you to `/dashboard`.
  * The Dashboard shows the user's full name: *"Bienvenido, [Nombre] [Apellido]"*.
  * A menu contains a **Logout** option.
  * Session persistence: Reload the page; verify you remain on `/dashboard`.

### 3.4 API Error & Offline Path
* Shut down the backend or enter incorrect credentials.
* Attempt to log in.
* Verify:
  * A loading indicator is shown.
  * The error is handled cleanly by Axios interceptors.
  * The error message is displayed directly in a **Toast** notification (e.g., *"Credenciales de inicio de sesión erróneas o cuenta inexistente."*).
  * You remain on the login page and input values are preserved.

### 3.5 Expiration & Logout Path
1. Click **Logout** at the top menu. Verify that you are immediately redirected to `/login` and a Toast displays *"Sesión cerrada correctamente."*
2. To test the 60-minute expiration:
   * The client records `auth_timestamp` in `localStorage`.
   * Manually edit `auth_timestamp` in your Browser DevTools Application storage to be `Date.now() - 3700000` (approx 61 minutes ago).
   * Refresh or interact with the page.
   * Verify that the system automatically logs you out, redirects to `/login`, and displays a Toast: *"Su sesión ha expirado. Por favor, inicie sesión nuevamente."*
