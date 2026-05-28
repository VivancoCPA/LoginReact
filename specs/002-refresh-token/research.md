# Research Report: Token Refresh Mechanism and Request Queuing

This document outlines the technical design decisions and research for implementing a secure, background-based token refresh mechanism in the React application, preventing user session terminations upon access token expirations.

---

## 1. Refresh Mechanism & API Integration

### 1.1 Silent Refresh via Cookies
* **Decision**: Communicate with `POST /auth/refresh` on the ASP.NET Core API with `withCredentials: true`.
* **Rationale**: Security best practices dictate that the Refresh Token itself is kept inside a secure, HTTP-only, SameSite cookie managed by the backend. The frontend does not need to read the refresh token string directly. By sending `withCredentials: true` on the Axios refresh request, the browser automatically attaches this secure cookie to the `/auth/refresh` API request. The API then returns a fresh access token in JSON format: `{ "accessToken": "..." }` or `{ "token": "..." }`.
* **Alternatives Considered**:
  - *Storing Refresh Token in localStorage*: Rejected. Storing refresh tokens in localStorage exposes them to XSS attacks, compromising long-term user session security.

---

## 2. Axios Request Queuing (Preventing Refresh Spam)

### 2.1 The Concurrent Request Challenge
When an access token expires, if the user has multiple API calls running concurrently (e.g., loading multiple widgets on a dashboard), all of these requests will fail with `401 Unauthorized` at roughly the same time. If not controlled, the application would dispatch multiple parallel `/auth/refresh` API calls, resulting in database query redundancy and potentially invalidating previous refresh tokens.

### 2.2 Promise-Based Queuing Design
We will implement an interceptor-level queuing solution:
1. Maintain a global `isRefreshing` flag and a `failedQueue` array containing objects with `{ resolve, reject }` promise handlers.
2. Maintain a `refreshTokenPromise` reference. If a refresh is already in flight, reuse the exact same promise for all other intercepted requests instead of dispatching another HTTP request.
3. Once the promise resolves, iterate over `failedQueue`, calling `resolve(token)` for each pending request, injecting the new Bearer token, and retrying.
4. If it fails, clear all state, call the global `logout()` event, and reject all queued items.

```typescript
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};
```

---

## 3. Dynamic Configuration Parameters

The token duration must be completely configurable via variables:
* **Configuration Variable**: `VITE_TOKEN_EXPIRY_MINUTES`
* **Default Value**: `60` minutes.
* **Mechanism**: On Context initialization, this value is converted to milliseconds and subtracted from the saved timestamp in local storage to dynamically gauge validity before dispatching requests.
