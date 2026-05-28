# Implementation Plan: Force Password Change on First Login

**Branch**: `003-force-password-change` | **Date**: 2026-05-27 | **Spec**: [specs/003-force-password-change/spec.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/003-force-password-change/spec.md)

**Input**: Feature specification from `specs/003-force-password-change/spec.md` and `UsersEndpoints.md`.

---

## Summary

This plan details the technical implementation of the forced password change flow for new users. When a user authenticates, the API returns a flag `passwordConfirmed`. If `passwordConfirmed === false`, the system intercepts the session, restricts dashboard access via custom route guards, and redirects the user to the `/force-password-change` screen. The user's name and email are rendered in read-only mode, and the user must set a new compliant password (verifying via double entry). To satisfy the `/api/auth/change-password` contract without requiring the user to retype their current temporary password, the system transiently stores the user's password in the `AuthProvider` context in-memory only during login. Upon successful change, the user is logged out and sent back to `/login` to authenticate with their new credentials.

---

## Technical Context

**Language/Version**: TypeScript 5.x, React 18+ (latest stable)

**Primary Dependencies**: 
* `axios` (HTTP client)
* `react-router-dom` (routing and route guards)
* `react-hot-toast` (success/error alerts)

**Storage**: `localStorage` (transient credentials, persistent profile data, dynamic timestamps)

**Testing**: None (explicitly excluded per user instructions)

**Target Platform**: Modern web browsers

**Project Type**: React Frontend SPA (Vite template)

**Constraints**:
* Must strictly use Tailwind CSS v4 for clean, highly responsive enterprise styling
* Secure transient in-memory capture of the temporary password during login to satisfy the backend `currentPassword` contract
* Strict route guards preventing dashboard access if `passwordConfirmed` is false

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

* **I. Token-Based Authentication (JWT Bearer)**: ✅ Yes. Full redirection and route blocking are enforced client-side, with temporary sessions safely discarded on logout.
* **II. Centralized Axios & Error Handling**: ✅ Yes. Intercepts `/auth/change-password` responses, handling standard validation problems or expired session failures gracefully via Toasts.
* **III. Centralized State (React Context)**: ✅ Yes. The authentication state inside `AuthContext.tsx` is extended to support `passwordConfirmed` and `tempPassword` (in-memory only).
* **IV. Enterprise Aesthetics (TypeScript & Tailwind CSS v4)**: ✅ Yes. The new screen reuses the sleek, dark glassmorphism layout, standard professional typography, and responsive animations.
* **V. Decoupled Forms & Validations**: ✅ Yes. Input fields utilize the same validation rules and real-time complexity indicators as the registration forms.

---

## Project Structure

This feature modifies existing source code and adds the password change screen:

```text
specs/003-force-password-change/
├── plan.md              # This file
├── research.md          # Research findings
├── data-model.md        # Extended user interfaces and models
├── quickstart.md        # Verification details
└── contracts/
    └── change-api.md    # API contract mappings
```

### Source Code

```text
LoginApp/src/
├── types/
│   └── auth.ts             # [MODIFY] Add passwordConfirmed property to User and AuthResponse
├── services/
│   └── authService.ts      # [MODIFY] Implement changePassword API endpoint POST /auth/change-password
├── context/
│   └── AuthContext.tsx     # [MODIFY] Store transient tempPassword in-memory, add changeTempPassword method
├── App.tsx                 # [MODIFY] Add /force-password-change route and route guard validations
└── pages/
    ├── Dashboard.tsx       # [MODIFY] Ensure route safety checks are in place
    └── ForcePasswordChange.tsx # [NEW] Create the premium double-entry password change page
```

---

## Complexity Tracking

*No gates violated. Architecture remains simple, minimal, and secure.*
