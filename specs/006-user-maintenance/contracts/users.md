# API Contract Mapping: User Maintenance (Gestión de Usuarios)

This document maps out the backend API endpoints, Axios request payloads, and query parameters used by the **User Maintenance** CRUD module.

---

## 1. Get Paged & Sorted Users (`GET /api/auth/users/paged`)

Retrieves the list of users, sorted, filtered, and paginated server-side.

*   **Ruta**: `GET /api/auth/users/paged`
*   **Parámetros de Consulta (Query Params)**:
    *   `page` (number, opcional, por defecto `1`)
    *   `pageSize` (number, opcional, por defecto `10`)
    *   `search` (string, opcional): coincidencias en Nombre, Apellido, Email o Grupo Familiar.
    *   `sortBy` (string, opcional, por defecto `"name"`): `"name"`, `"lastname"`, `"email"`, `"createdat"`.
    *   `sortDesc` (boolean, opcional, por defecto `false`).
*   **Axios Request Call**:
    ```typescript
    apiClient.get<PaginatedUsersResult>('/auth/users/paged', {
      params: { page, pageSize, search, sortBy, sortDesc }
    });
    ```

---

## 2. Load Active Family Groups (`GET /api/family-groups`)

Fetches all Family Groups. Used to populate the multi-select filter list and the form fields.

*   **Ruta**: `GET /api/family-groups`
*   **Autorización**: Requerido (`Bearer <token>`)
*   **Filtro Cliente**: Loop results to only expose items where `isActive === true`.
*   **Axios Request Call**:
    ```typescript
    apiClient.get<FamilyGroup[]>('/api/family-groups');
    ```

---

## 3. Create Administrative User (`POST /api/auth/users`)

Creates a new user account administratively, sending a temporary password.

*   **Ruta**: `POST /api/auth/users`
*   **Cuerpo (JSON)**:
    ```json
    {
      "email": "nuevo.usuario@example.com",
      "name": "Juan",
      "lastName": "Pérez",
      "phone": "+1234567890",
      "dateOfBirth": "1995-08-25T00:00:00Z"
    }
    ```
*   **Axios Request Call**:
    ```typescript
    apiClient.post('/auth/users', { email, name, lastName, phone, dateOfBirth });
    ```
*   **Respuestas**:
    *   `201 Created`: Cuenta creada exitosamente.
    *   `400 Bad Request`: Error en parámetros.
    *   `409 Conflict`: El email ingresado ya existe.

---

## 4. Update User Details (`PUT /api/auth/users/{id}`)

Modifies details of an existing user.

*   **Ruta**: `PUT /api/auth/users/{id}`
*   **Cuerpo (JSON)**:
    ```json
    {
      "name": "Juan",
      "lastName": "Pérez",
      "dateOfBirth": "1990-05-15T00:00:00Z",
      "phoneNumber": "+1234567890",
      "photoUrl": "https://example.com/avatar.jpg",
      "address": "Calle Falsa 123"
    }
    ```
*   **Axios Request Call**:
    ```typescript
    apiClient.put(`/auth/users/${id}`, { name, lastName, dateOfBirth, phoneNumber, photoUrl, address });
    ```

---

## 5. Toggle Status (`PATCH /api/users/{userId}/toggle-status`)

Deactivates or Reactivates a user account.

*   **Ruta**: `PATCH /api/users/{userId}/toggle-status`
*   **Axios Request Call**:
    ```typescript
    apiClient.patch(`/users/${userId}/toggle-status`);
    ```
*   **Respuesta**:
    ```json
    {
      "userId": "string",
      "email": "string",
      "isLockedOut": true,
      "status": "Bloqueado"
    }
    ```
