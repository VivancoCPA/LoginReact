# API Contract: Token Refresh Endpoint

This document specifies the communication interfaces between the React Frontend and the ASP.NET Core Backend located at `http://localhost:5043/api/` for token renewal.

---

## 1. Refresh Token Endpoint

Renews an expired access token using a body payload containing the expired access token and the current refresh token (Refresh Token Rotation).

* **Path**: `/auth/refresh`
* **Method**: `POST`
* **Content-Type**: `application/json`

### 1.1 Request Payload
```json
{
  "token": "expired_access_token_string",
  "refreshToken": "refresh_token_string"
}
```

### 1.2 Success Response (HTTP 200 OK)
Returns the new active JWT access token along with the newly rotated refresh token.
```json
{
  "token": "new_access_token_string",
  "refreshToken": "new_refresh_token_string"
}
```

### 1.3 Error Responses

#### HTTP 400 Bad Request
Occurs if the Access Token or the Refresh Token are null or empty, if the Access Token is invalid, if the Refresh Token does not match in the database, or if the Refresh Token has expired.
```json
{
  "message": "Token de refresco inválido o expirado."
}
```

#### HTTP 500 Internal Server Error
Occurs on backend database issues.
```json
{
  "message": "Ha ocurrido un error interno en el servidor."
}
```
