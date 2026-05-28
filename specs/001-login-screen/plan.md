# Implementation Plan: Login Screen with JWT Bearer Authentication

**Branch**: `001-login-screen` | **Date**: 2026-05-26 | **Spec**: [specs/001-login-screen/spec.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/001-login-screen/spec.md)

**Input**: Feature specification from `specs/001-login-screen/spec.md` and ASP.NET Core API documentation from `UsersEndpoints.md`.

---

## Summary

This plan details the technical implementation of a secure enterprise login screen built using **React (latest stable)**, **TypeScript**, and **Tailwind CSS v4**. The application will authenticate users via a `POST` request to `/api/auth/login` on an external ASP.NET Core API at `http://localhost:5043/api/`, using JWT tokens (`Bearer <token>`). Errors will be captured globally and displayed cleanly using premium toast alerts. A 60-minute token expiration check is handled client-side. Successful login redirects to a protected dashboard showing the user's name, with a menu-level Logout action.

---

## Technical Context

**Language/Version**: TypeScript 5.x, React 18+ (latest stable)

**Primary Dependencies**: 
* `axios` (HTTP communication)
* `react-router-dom` (routing and route-level guards)
* `react-hot-toast` (premium minimalist toast messages)
* `jwt-decode` (optional, for parsing claims, though login response directly contains user details)

**Storage**: `localStorage` (persists `auth_token`, stringified `auth_user`, and `auth_timestamp` for expiration)

**Testing**: None (explicitly excluded per user instructions)

**Target Platform**: Modern web browsers (Chrome, Edge, Firefox, Safari)

**Project Type**: React Frontend SPA (Vite template)

**Performance Goals**:
* Interactive form loading < 300ms
* Validation feedback response < 100ms
* Fast initial compilation and CSS build using Tailwind v4 native compiler

**Constraints**:
* Base API URL must be `http://localhost:5043` and stored in config files (`.env.local`)
* Tokens expire and must be cleared precisely after 60 minutes
* Password rules: min 8 characters, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character
* Visual errors displayed solely in Toast alerts

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

* **I. Token-Based Authentication (JWT Bearer)**: ✅ Yes. Token stored in localStorage, injected as Bearer token in Axios, and cleared after 60 minutes or on 401.
* **II. Centralized Axios & Error Handling**: ✅ Yes. Centralized Axios client (`apiClient.ts`) intercepts requests and responses, processing 401s and mapping errors to Toast alerts.
* **III. Centralized State (React Context)**: ✅ Yes. Global state (`user`, `token`, `isAuthenticated`, `isLoading`) managed inside `AuthContext.tsx` with a type-safe `useAuth` hook.
* **IV. Enterprise Aesthetics (TypeScript & Tailwind CSS v4)**: ✅ Yes. Fully configured with React TypeScript (`.tsx`) and Tailwind CSS v4 split-screen responsive layout.
* **V. Decoupled Forms & Validations**: ✅ Yes. Decoupled inputs, strict client-side validation logic for email format and password complexity rules before API dispatches.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-login-screen/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Technology choice details
├── data-model.md        # Entity definitions & state machines
├── quickstart.md        # Running and verifying guide
└── contracts/
    └── auth-api.md      # API endpoint schemas and payload examples
```

### Source Code Structure (to be created)

```text
c:\Users\ANTONIO\source\repos\agy-sdd\LoginAPi/
├── .env.local                  # Environment variables config
├── index.html                  # HTML entry template
├── package.json                # Dependencies and build scripts
├── tsconfig.json               # TypeScript rules
├── vite.config.ts              # Vite + Tailwind v4 build settings
├── src/
│   ├── main.tsx                # App entry
│   ├── index.css               # Tailwind CSS imports & global root layout
│   ├── App.tsx                 # Core Router mapping
│   ├── components/
│   │   └── FormInput.tsx       # Reusable styled text inputs
│   ├── context/
│   │   └── AuthContext.tsx     # Session management Context & custom hooks
│   ├── pages/
│   │   ├── Login.tsx           # Split screen login layout (Tailwind v4)
│   │   └── Dashboard.tsx       # Protected profile view with Menu & Logout
│   ├── services/
│   │   ├── apiClient.ts        # Axios singleton client with interceptors
│   │   └── authService.ts      # Authentication service wrappers
│   ├── types/
│   │   └── auth.ts             # TypeScript interface schemas
│   └── utils/
│       └── validation.ts       # Regex validation for passwords and emails
```

**Structure Decision**: React + TypeScript single-project SPA using Vite. Neatly structured folders under `src/` to separate concerns (Context, Components, Services, Pages, Types, Styles) in compliance with the constitution.

---

## Implementation Details

### 1. Variables Config File (`.env.local`)
Create `.env.local` to define dynamic backend targets:
```env
VITE_API_BASE_URL=http://localhost:5043/api
VITE_TOKEN_EXPIRY_MINUTES=60
```

### 2. Password Strength Validation (Regex Rules)
Implement strict checks before letting users submit:
* Regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$`
* Toast is triggered if rules are violated, avoiding unformatted server crashes.

### 3. Expiration Tracking (60 minutes)
In `AuthContext.tsx`:
* Record `auth_timestamp` in `localStorage` on login success.
* When executing routing actions or API requests, check:
  `Date.now() - timestamp > 60 * 60 * 1000`
* If true, perform clean logout: call `logout()`, clear localStorage, show Toast *"Sesión expirada"*, and redirect.

### 4. Backend Access Error Presentation (Added 2026-05-26)
* **Backend Error Authority**: Access and credential validation failures are managed by the Backend API (ASP.NET Core Backend, as documented in `UsersEndpoints.md`).
* **Toast Presentation**: The Axios interceptor and login dispatch flow must capture and display the exact error messages returned by the Backend API on `400 Bad Request` or validation failures. These messages must be displayed in real-time in toast alerts via `react-hot-toast` to provide accurate operational feedback.
