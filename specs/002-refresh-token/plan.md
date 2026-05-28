# Implementation Plan: Token Refresh Mechanism

**Branch**: `002-refresh-token` | **Date**: 2026-05-26 | **Spec**: [specs/002-refresh-token/spec.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/002-refresh-token/spec.md)

**Input**: Feature specification from `specs/002-refresh-token/spec.md` and ASP.NET Core API documentation from `UsersEndpoints.md`.

---

## Summary

This plan outlines the technical design for a secure background token refresh mechanism. We will implement a silent Axios request interceptor that detects expired access tokens and dispatches a single background request to `/api/auth/refresh` using cookies (`withCredentials: true`). While the refresh request is in flight, subsequent API requests are queued and resolved together once the new token is acquired. The token expiration minutes will be loaded dynamically from configuration files (`.env.local` via `VITE_TOKEN_EXPIRY_MINUTES`).

---

## Technical Context

**Language/Version**: TypeScript 5.x, React 18+ (latest stable)

**Primary Dependencies**: 
* `axios` (HTTP communication)
* `react-hot-toast` (session toasts)

**Storage**: `localStorage` (persists `auth_token`, `auth_user`, and `auth_timestamp` for expiration)

**Testing**: None (explicitly excluded per user instructions)

**Target Platform**: Modern web browsers

**Project Type**: React Frontend SPA (Vite template)

**Constraints**:
* Base API URL must be `http://localhost:5043` and loaded from configuration
* The backend API `/auth/refresh` requires HTTP-only cookie credentials (`withCredentials: true`)
* Subsequent requests must be queued to avoid redundant refresh calls

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

* **I. Token-Based Authentication (JWT Bearer)**: ✅ Yes. The silent refresh renews the JWT access token in the background, keeping Bearer headers valid.
* **II. Centralized Axios & Error Handling**: ✅ Yes. The Axios client (`apiClient.ts`) will incorporate the promise queue and refresh logic within its response interceptors.
* **III. Centralized State (React Context)**: ✅ Yes. Authenticated state details are updated globally inside `AuthContext.tsx` upon successful renewal.
* **IV. Enterprise Aesthetics (TypeScript & Tailwind CSS v4)**: ✅ Yes. Enforces strict type safety and supports real-time countdown updates in the Dashboard view.
* **V. Decoupled Forms & Validations**: ✅ Yes. Fully decoupled from forms.

---

## Project Structure

This feature modifies existing source code files to integrate the background queue:

```text
LoginApp/src/
├── context/
│   └── AuthContext.tsx     # [MODIFY] Dynamic VITE_TOKEN_EXPIRY_MINUTES calculation
├── services/
│   ├── apiClient.ts        # [MODIFY] Axios response interceptor queue implementation
│   └── authService.ts      # [MODIFY] Added authService.refreshToken() method
└── types/
    └── auth.ts             # [MODIFY] Added RefreshResponse interface
```

---

## Implementation Details

### 1. VITE_TOKEN_EXPIRY_MINUTES Configuration
In `LoginApp/.env.local`, the value represents the access token lifetime in minutes:
```env
VITE_TOKEN_EXPIRY_MINUTES=60
```
In `AuthContext.tsx`, we calculate:
`const diff = Date.now() - timestamp;`
`const expiryLimit = Number(import.meta.env.VITE_TOKEN_EXPIRY_MINUTES || 60) * 60 * 1000;`
If `diff >= expiryLimit`, the client-side expiration countdown triggers.

### 2. Request Queue in Axios Interceptor (`apiClient.ts`)
We will rewrite `apiClient.ts` to implement a robust, type-safe failed queue:
1. `isRefreshing: boolean`
2. `failedQueue: FailedQueueItem[]`
3. Axios Response Interceptor catches 401:
   * If `_retry` is set: reject.
   * If `isRefreshing` is true: return a new `Promise` adding `{ resolve, reject }` to `failedQueue`, and then retry.
   * Set `isRefreshing = true` and call `/auth/refresh`.
   * Upon success: save new token, call `processQueue(null, token)` to resolve all queued promises, and retry the original request.
   * Upon failure: call `processQueue(err, null)`, dispatch `auth:unauthorized`, and reject.
