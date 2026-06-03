# API Design Contracts: Role Maintenance (Mantenimiento de Roles)

This document formalizes the request-response payloads, error structures, HTTP methods, and status codes for the Roles CRUD endpoints, based on the backend reference specifications in `UsersEndpoints.md`.

---

## 1. List All System Roles (`GET /api/roles`)

- **Method**: `GET`
- **Path**: `/api/roles`
- **Authorization**: Public / Authenticated (used by frontend dashboard)
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "admin-role-uuid-1111",
      "name": "Admin",
      "description": "Acceso total de administración al sistema",
      "assignedUsersCount": 3,
      "isSystemRole": true
    },
    {
      "id": "user-role-uuid-2222",
      "name": "User",
      "description": "Acceso estándar para interactuar con la plataforma",
      "assignedUsersCount": 42,
      "isSystemRole": true
    }
  ]
  ```

---

## 2. Create Global Role (`POST /api/roles`)

- **Method**: `POST`
- **Path**: `/api/roles`
- **Authorization**: Bearer JWT (Admin only)
- **Request Body**:
  ```json
  {
    "name": "Auditor",
    "description": "Lectura y auditoría pasiva de registros e informes",
    "IsActive": "Indicador de Actividad/Inactividad"
  }
  ```
- **Response (`201 Created` / `200 OK`)**:
  ```json
  {
    "id": "auditor-role-uuid-3333",
    "name": "Auditor",
    "description": "Lectura y auditoría pasiva de registros e informes",
    "createdAt": "Fecha y hora de creacion",
    "assignedUsersCount": 0,
    "isActive": true
  }
  ```
- **Errors**:
  - `400 Bad Request`: Input data validation failed.
  - `409 Conflict`: Role with same name already exists.

---

## 3. Update Global Role Details (`PUT /api/roles/{roleId}`)

- **Method**: `PUT`
- **Path**: `/api/roles/{roleId}`
- **Authorization**: Bearer JWT (Admin only)
- **Request Body**:
  ```json
  {
    "name": "Auditor Senior",
    "description": "Lectura y auditoría pasiva de registros e informes con rango extendido",
    "IsActive": "Indicador de Actividad/Inactividad"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "id": "auditor-role-uuid-3333",
    "name": "Auditor Senior",
    "description": "Lectura y auditoría pasiva de registros e informes con rango extendido",
    "isActive": "Indicador de Actividad/Inactividad",
    "createdAt": "Fecha y hora de creacion"
  }
  ```
- **Errors**:
  - `400 Bad Request`: Input data validation failed.
  - `404 Not Found`: Role ID does not exist.
  - `409 Conflict`: Another role with same name already exists.

---

## 4. Delete Global Role (`DELETE /api/roles/{roleId}`)

- **Method**: `DELETE`
- **Path**: `/api/roles/{roleId}`
- **Authorization**: Bearer JWT (Admin only)
- **Response**: `200 OK` or `204 No Content`
- **Errors**:
  - `400 Bad Request`: Cannot delete role because `assignedUsersCount > 0`.
  - `403 Forbidden`: Attempting to delete a protected system role (`isSystemRole: true`).
  - `404 Not Found`: Role ID does not exist.
