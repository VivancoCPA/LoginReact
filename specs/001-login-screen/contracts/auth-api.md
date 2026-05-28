# API Contract: Authentication Endpoints

This document specifies the communication interfaces between the React Frontend and the ASP.NET Core Backend located at `http://localhost:5043/api/`.

---

## 1. Login Endpoint

Authenticates a user and retrieves a JWT Bearer token.

* **Path**: `/auth/login` (or `/login` depending on backend configuration)
* **Method**: `POST`
* **Content-Type**: `application/json`

### 1.1 Request Payload
```json
{
  "email": "user@enterprise.com",
  "password": "SecurePassword123!"
}
```

### 1.2 Success Response (HTTP 200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@enterprise.com",
    "name": "John Doe",
    "role": "Administrator"
  }
}
```

### 1.3 Error Responses

#### HTTP 400 Bad Request (Validation Errors)
Occurs when input formatting does not meet requirements on the backend.
```json
{
  "errors": {
    "Email": ["El formato del correo electrónico no es válido."],
    "Password": ["La contraseña debe incluir al menos un carácter especial."]
  }
}
```

#### HTTP 401 Unauthorized (Invalid Credentials)
Occurs when email or password do not match registered credentials.
```json
{
  "message": "Correo electrónico o contraseña incorrectos."
}
```

#### HTTP 500 Internal Server Error
Occurs on database offline or server-side failure.
```json
{
  "message": "Ha ocurrido un error interno en el servidor."
}
```
