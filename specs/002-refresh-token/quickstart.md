# Quickstart: 002-refresh-token

This document explains how to verify the `002-refresh-token` silent refresh mechanism.

---

## 1. Setup & Installation

Ensure `LoginApp/.env.local` contains the active configurations:
```env
VITE_API_BASE_URL=http://localhost:5043/api
VITE_TOKEN_EXPIRY_MINUTES=5
```
*(By setting this to 5 minutes, we can verify the silent refresh quickly without waiting a whole hour!).*

---

## 2. Verification Instructions

### 2.1 Setup & Initial Login
1. Start the backend ASP.NET Core API at `http://localhost:5043`.
2. Start the local Vite development server:
   ```bash
   cd LoginApp
   npm run dev
   ```
3. Visit `http://localhost:5173/login` in your browser.
4. Input valid email and password credentials, and click **Ingresar**.
5. You are redirected to `/dashboard`. Verify that the dashboard timer displays `"5 minutos restantes"`.

### 2.2 Verifying Silent Refresh
1. Open your browser's Developer Tools (F12) and select the **Network** tab.
2. Wait for the 5-minute expiry countdown to reach 0.
3. Once the countdown reaches 0, perform an action or trigger an API request (e.g. reload or browse).
4. Verify:
   * A background request `POST /api/auth/refresh` is dispatched automatically.
   * The request completes successfully with HTTP `200 OK`.
   * A new access token is returned and stored in `localStorage`.
   * The dashboard timer immediately resets back to `"5 minutos restantes"`.
   * The user **never** saw any login redirect, screen flicker, or alert, verifying a 100% silent refresh!

### 2.3 Verifying Concurrent Request Queuing
1. Artificially expire the token by editing `auth_timestamp` in your Browser DevTools Application storage to be `Date.now() - 310000` (approx 5.1 minutes ago).
2. Trigger multiple concurrent API requests simultaneously (e.g., refreshing multiple widgets or tabs).
3. Verify:
   * In the Network tab, exactly **one** `POST /api/auth/refresh` request is dispatched.
   * All other parallel API requests are temporarily paused/queued in the background.
   * Once the single refresh request resolves, all queued requests are executed together with the new token.
