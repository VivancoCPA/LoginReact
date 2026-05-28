# API Contract: Change Password Endpoint

This document maps the communication interfaces between the React Frontend and the ASP.NET Core Backend located at `http://localhost:5043/api/` for updating credentials.

---

## 1. Change Password Endpoint

Modifies the user's password. Used to update the temporary password assigned by the Administrator.

* **Path**: `/auth/change-password`
* **Method**: `POST`
* **Content-Type**: `application/json`

### 1.1 Request Payload
```json
{
  "email": "juan.perez@example.com",
  "currentPassword": "RandomTemporaryPassword123!",
  "newPassword": "NewSecurePermanentPassword123!"
}
```

### 1.2 Success Response (HTTP 200 OK)
```json
{
  "email": "juan.perez@example.com",
  "message": "Contraseña cambiada exitosamente."
}
```

### 1.3 Error Responses

#### HTTP 400 Bad Request
Occurs if the current password is incorrect, if the email does not exist, or if the new password does not meet complexity requirements.
```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "La nueva contraseña debe cumplir con los requisitos mínimos de seguridad."
}
```
*(Validation errors are mapped dynamically to Toast alerts by the Axios extractor).*
