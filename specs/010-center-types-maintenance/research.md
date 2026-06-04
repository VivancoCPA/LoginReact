# Research: Medical Center Types Maintenance API

This document analyzes the C# backend API endpoints for medical center types and outlines our integration strategy.

## Backend Endpoints Analysis

The backend implements center types endpoints with the tag `Center Types`. The mapping is as follows:

| Endpoint | Method | C# Action / Binding | Payload | Description |
|---|---|---|---|---|
| `/api/center-types` | `GET` | `ListCenterTypes` | None | Retrieves all center types sorted by date of creation. |
| `/api/center-types/lookup` | `GET` | `LookupCenterTypes` | None | Simple lookup for active center types (alphabetized). |
| `/api/center-types/paged` | `GET` | `PagedCenterTypes` | Query Params | Paginated listing with search filtering and sorting. |
| `/api/center-types/{id}` | `GET` | `GetCenterType` | Route Param (`id`) | Fetches a single center type by integer ID. |
| `/api/center-types` | `POST` | `CreateCenterType` | JSON Body | Creates a center type with a specified name. |
| `/api/center-types/{id}` | `PUT` | `UpdateCenterType` | Route Param (`id`) + JSON | Updates name and status. |
| `/api/center-types/{id}/toggle-status` | `PATCH` | `ToggleCenterTypeStatus` | Route Param (`id`) | Toggles `isActive` flag. |

## Parameter Binding Strategies

1. **Query String Binding**:
   The paged endpoint `/api/center-types/paged` maps to query string values:
   * `page` (default: 1): Integer $\ge 1$.
   * `pageSize` (default: 10): Integer between 1 and 100.
   * `search`: Option string matched using ILIKE against `name`.
   * `sortBy` (default: `created_at`): Supported values are `name`, `isActive`, `created_at`, and `updated_at`.
   * `sortDesc` (default: `false`): Boolean indicating sorting order.

2. **JSON Payloads**:
   Creation and modification payloads use standard JSON instead of FormData (multipart).
   * **Creation**: `{ "name": "Consultorio Privado" }`
   * **Modification**: `{ "name": "Consultorio Privado Modificado", "isActive": true }`

3. **Status Toggle Response**:
   `PATCH /api/center-types/{id}/toggle-status` changes the status and returns the final state object:
   ```json
   {
     "id": 3,
     "name": "Consultorio Privado Modificado",
     "isActive": false,
     "status": "Inactivado"
   }
   ```
   The client updates its lists dynamically by reloading the page data to ensure total count and pagination states are in sync.
