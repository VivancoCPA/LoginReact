# Research Report: Technical Architecture for JWT Authentication in React & Tailwind CSS v4

This document captures the research, technology decisions, and architectural rationale for implementing a secure enterprise login system using React, TypeScript, Tailwind CSS v4, and Axios.

---

## 1. Core Technology Decisions

### 1.1 Styling & UI Library
* **Decision**: **Tailwind CSS v4** + Custom CSS modules for custom animations.
* **Rationale**: Tailwind CSS v4 integrates natively with Vite using the `@tailwindcss/vite` plugin. It compiles extremely quickly and uses a CSS-first configuration, which aligns with our core principles of sleek, minimal, and premium corporate aesthetics.
* **Alternatives Considered**: 
  - *Vanilla CSS Modules*: Rejected because utility classes in Tailwind v4 speed up responsive development while retaining full style control via custom CSS directives.
  - *Chakra UI / Material UI*: Rejected due to bundle bloat and generic UI aesthetics that do not feel custom or premium.

### 1.2 Toast Notifications & Error Display
* **Decision**: **react-hot-toast**
* **Rationale**: The user explicitly requested displaying input and server-side errors in a **toast**. `react-hot-toast` is lightweight, highly customizable, supports TypeScript, and easily integrates with Tailwind CSS styling to render premium corporate toast notifications (success, error, loading).
* **Alternatives Considered**:
  - *Custom Toast Component*: Rejected to avoid re-inventing basic alert animations; `react-hot-toast` satisfies the requirement out of the box with premium minimalist styles.
  - *React-Toastify*: Rejected because it is heavier and has more complex styling layers compared to the lightweight hooks provided by `react-hot-toast`.

### 1.3 State Management & Auth Session
* **Decision**: **React Context API** (`AuthContext`) + `localStorage` persistence.
* **Rationale**: Authentication state (user credentials, token) is consumed globally across routing guards and pages. React Context is the standard, zero-dependency mechanism for global state in a React SPA. The token will be stored in `localStorage` and automatically expire or clear after 60 minutes based on client-side timestamp checks or API responses.
* **Alternatives Considered**:
  - *Redux Toolkit*: Rejected due to unnecessary boilerplate for a simple authentication state.
  - *Zustand*: Highly viable, but React Context is standard and satisfies the "standard React" requirement perfectly.

---

## 2. Security & Token Architecture

### 2.1 JWT Bearer Token Injection
An Axios client (`apiClient.ts`) will act as the single point of communication with `http://localhost:5043/api/`. 
* An request interceptor will pull the token from `localStorage` and inject it in the `Authorization` header as `Bearer <token>`.
* A response interceptor will listen for `401 Unauthorized` responses. If a 401 occurs, it will automatically trigger the logout method in the `AuthContext` to clear all local sessions and redirect the user to `/login`.

### 2.2 60-Minute Expiration Verification
The user requested a **60-minute token expiration**.
* **Client-Side Expiry Guard**: When a token is saved during login, the system will record an `auth_login_timestamp` (in milliseconds) in `localStorage`. 
* Before any API call or page routing guard evaluates session validity, the system will calculate if `Date.now() - auth_login_timestamp > 3600000` (60 minutes).
* If expired, the system will automatically log the user out and show a toast warning: *"Su sesión ha expirado. Por favor inicie sesión nuevamente."*

---

## 3. Password Validation Schema

The password rules are highly specific: **(8+ characters, uppercase, lowercase, digit, special character)**.
* **Client-Side Regex**: We will validate inputs in real-time using the following regular expression:
  ```regex
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  ```
* If the user attempts to enter a password that does not comply with these rules, we will show a Toast detailing the missing requirements (e.g., *"El password debe tener al menos 8 caracteres, una mayúscula, una minúscula, un dígito y un carácter especial."*).
