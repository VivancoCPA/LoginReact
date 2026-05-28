# Implementation Plan: Forgot Password Recovery

**Branch**: `004-forgot-password` | **Date**: 2026-05-28 | **Spec**: [specs/004-forgot-password/spec.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/004-forgot-password/spec.md)

---

## Summary

This plan details the technical design and implementation of the **Forgot Password Recovery** flow inside the `LoginApp` frontend. 

When a user forgets their password, they can click the "¿Olvidó su contraseña?" link on the login screen to access a secure recovery screen. If they already typed their email, it will be pre-filled and displayed in read-only mode to prevent re-entry. If not, they can type it in manually. Upon submitting their email, the frontend queries the `/api/auth/forgot-password` endpoint. If successful, the backend sets `passwordConfirmed = false`, generates a temporary password, dispatches it to their email, and the frontend redirects the user back to the login screen with a success toast. If the email is not registered, the system catches the failure and displays a specific warning toast.

---

## User Review Required

> [!IMPORTANT]
> **Email Not Found Interception**:
> The vertical slice documentation specifies that the `/auth/forgot-password` endpoint always returns `200 OK` with a generic message to prevent user enumeration attacks. However, the user requirements state:
> *"Si el correo no existe se avisara que el correo no existe y se contacte con el administrador."*
> To comply with this requirement, we will implement robust, multi-layered error catching. If the API returns a `404 Not Found` or a `400 Bad Request` containing unregistered email indicators (e.g. "not found", "inexistente", "no existe", "unregistered"), we will display the exact required toast message: **"El correo electrónico no existe. Contacte al Administrador."**
>
> Please confirm if this approach fits your expected backend response behavior.

---

## Proposed Changes

We will modify the login page navigation and implement the complete password recovery screen under the `LoginApp` Vite template.

### 1. Navigation Flow & State Passing

#### [MODIFY] [Login.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/pages/Login.tsx)
* Update the "¿Olvidó su contraseña?" link to pass the current `email` state dynamically through React Router navigation state:
  ```tsx
  <Link
    to="/forgot-password"
    state={{ email }}
    className="text-slate-400 hover:text-indigo-400 hover:underline transition-colors duration-200"
  >
    ¿Olvidó su contraseña?
  </Link>
  ```

---

### 2. Recovery Page Implementation

#### [MODIFY] [RecoverPassword.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/pages/RecoverPassword.tsx)
* Replace the current placeholder code with a premium glassmorphic screen matching the corporate design tokens.
* Extract the pre-filled `email` from `location.state` using React Router's `useLocation()`.
* **Read-Only / Manual Entry Rules**:
  * If `email` was passed from the Login screen, display it as a read-only input field. 
  * Display a subtle secondary link/button: *"Ingresar otro correo"* or *"Cambiar correo"*. Clicking this will clear the read-only state and allow the user to type an email manually.
  * If no email was passed, render a standard editable email input field.
* Enforce real-time email formatting validation (`validateEmail(email)`).
* Implement a robust submit handler with standard loader state (`isSubmitting`):
  * Call `authService.forgotPassword(email)` inside a `try-catch` block.
  * **On Success (`200 OK`)**: Show a custom toast alert: *"Se ha enviado un nuevo password temporal a su correo. Inicie sesión con sus nuevas credenciales."* and navigate back to `/login`.
  * **On Error**: Check the error payload and status. If the status is `404`, or a `400` with text matching unregistered indicators, display the exact toast: **"El correo electrónico no existe. Contacte al Administrador."** Otherwise, display the generic error message or a connection failure fallback.
* Include a clean secondary button *"Volver al Login"* that safely navigates back to `/login`.

---

## Verification Plan

### Automated Tests
* Execute Vite production compilation with `npm run build` in `LoginApp` to guarantee zero build-time warnings or TS compiler errors.

### Manual Verification
* Run dev server using `npm run dev`.
* Perform manual walkthrough checks matching the scenarios in `specs/004-forgot-password/spec.md`:
  1. **Flow Transition**: Open `/login`, enter `test@company.com`, click "¿Olvidó su contraseña?". Verify you are redirected to `/forgot-password` and the email is pre-filled and read-only.
  2. **Clear Pre-filled Option**: On the read-only view, click *"Cambiar correo"*. Verify that the input field is cleared, unlocked, and allows manual text entry.
  3. **Real-time Validation**: Clear the email, enter an invalid pattern (e.g., `invalid-email`), and verify the validation warning is rendered and the submit button is disabled.
  4. **Successful Recovery**: Enter a valid, registered email address and click "Enviar". Verify the loader animation, success toast message, and automatic redirection to `/login`.
  5. **Unregistered Email Handling**: Enter an unregistered email, click "Enviar", and verify the exact toast: *"El correo electrónico no existe. Contacte al Administrador."* is displayed.
