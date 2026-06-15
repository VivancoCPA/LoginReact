# API Contract: Appointments Maintenance (Mantenimiento de Citas)

**Branch**: `017-citas-maintenance` | **Date**: 2026-06-15

This contract details the network requests, HTTP verbs, payload models, and response structures for interaction between the front-end application and the appointments API slice.

---

## 1. List Paged Appointments
*   **Path**: `GET /api/appointments/paged`
*   **Headers**: `Authorization: Bearer <token>`
*   **Query Parameters**:
    *   `page` (integer, default `1`)
    *   `pageSize` (integer, default `10`)
    *   `statusId` (string, optional, e.g. `"CONFIRMADA"`)
    *   `date` (string, ISO-8601 Date `YYYY-MM-DD`, optional)
*   **Success Response** (`200 OK`):
    ```json
    {
      "items": [
        {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "userId": "d748f65e-2b1a-42c3-98fe-d27e7fcd61a2",
          "appointmentDate": "2026-06-20T14:30:00Z",
          "centerId": "a82fca21-5a41-477f-8c38-8c10be141123",
          "doctorId": "8c38a123-5a41-477f-a82f-8c10be1411f5",
          "specialtieId": 1,
          "insurerId": "b3fc2c96-5717-4562-3fa8-5f643f66afa6",
          "description": "Consulta de control rutinario anual",
          "statusId": "CONFIRMADA",
          "createdAt": "2026-06-15T10:00:00Z",
          "specialtyName": "Cardiología",
          "doctorName": "Alejandro Vivanco",
          "doctorPhotoUrl": "/uploads/profiles/doctor_avatar.jpg",
          "centerName": "Centro Médico Las Lomas",
          "centerAddress": "Av. Principal 123, Lima",
          "centerLatitude": -12.046374,
          "centerLongitude": -77.042793
        }
      ],
      "page": 1,
      "pageSize": 10,
      "totalCount": 1,
      "totalPages": 1,
      "hasPreviousPage": false,
      "hasNextPage": false
    }
    ```

---

## 2. List All Active Appointments
*   **Path**: `GET /api/appointments`
*   **Headers**: `Authorization: Bearer <token>`
*   **Query Parameters**:
    *   `statusId` (string, optional, e.g. `"CONFIRMADA"`)
    *   `date` (string, ISO-8601 Date `YYYY-MM-DD`, optional)
*   **Success Response** (`200 OK`):
    ```json
    [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "userId": "d748f65e-2b1a-42c3-98fe-d27e7fcd61a2",
        "appointmentDate": "2026-06-20T14:30:00Z",
        "centerId": "a82fca21-5a41-477f-8c38-8c10be141123",
        "doctorId": "8c38a123-5a41-477f-a82f-8c10be1411f5",
        "specialtieId": 1,
        "insurerId": "b3fc2c96-5717-4562-3fa8-5f643f66afa6",
        "description": "Consulta de control rutinario anual",
        "statusId": "CONFIRMADA",
        "createdAt": "2026-06-15T10:00:00Z",
        "specialtyName": "Cardiología",
        "doctorName": "Alejandro Vivanco",
        "doctorPhotoUrl": "/uploads/profiles/doctor_avatar.jpg",
        "centerName": "Centro Médico Las Lomas",
        "centerAddress": "Av. Principal 123, Lima",
        "centerLatitude": -12.046374,
        "centerLongitude": -77.042793
      }
    ]
    ```

---

## 3. List Appointment Statuses
*   **Path**: `GET /api/appointment-statuses`
*   **Headers**: None (Anonymous access)
*   **Success Response** (`200 OK`):
    ```json
    [
      {
        "id": "PENDIENTE",
        "label": "Pendiente"
      },
      {
        "id": "CONFIRMADA",
        "label": "Confirmada"
      },
      {
        "id": "INASISTENCIA",
        "label": "Inasistencia"
      },
      {
        "id": "CANCELADA",
        "label": "Cancelada"
      },
      {
        "id": "REPROGRAMADA",
        "label": "Reprogramada"
      },
      {
        "id": "ENCONSULTA",
        "label": "En Consulta"
      },
      {
        "id": "FINALIZADA",
        "label": "Finalizada"
      }
    ]
    ```
