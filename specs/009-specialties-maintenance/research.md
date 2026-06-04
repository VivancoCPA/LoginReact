# Research: Medical Specialties Maintenance API

This document analyzes the C# backend API endpoints for medical specialties and outlines our integration strategy.

## Backend Endpoints Analysis

The backend implements specialties endpoints with the tag `Specialties`. The mapping is as follows:

| Endpoint | Method | C# Action / Binding | Payload | Description |
|---|---|---|---|---|
| `/api/specialties` | `GET` | `ListSpecialties` | None | Retrieves all specialties sorted alphabetically. |
| `/api/specialties/lookup` | `GET` | `LookupSpecialties` | None | Simple lookup for active specialties. |
| `/api/specialties/paged` | `GET` | `PagedSpecialties` | Query Params | Paginated listing with search filtering and sorting. |
| `/api/specialties/{id}` | `GET` | `GetSpecialty` | Route Param (`id`) | Fetches a single specialty by integer ID. |
| `/api/specialties` | `POST` | `CreateSpecialty` | JSON Body | Creates a specialty with a specified name. |
| `/api/specialties/{id}` | `PUT` | `UpdateSpecialty` | Route Param (`id`) + JSON | Updates name and status. |
| `/api/specialties/{id}/toggle-status` | `PATCH` | `ToggleSpecialtyStatus` | Route Param (`id`) | Toggles `isActive` flag. |

## Parameter Binding Strategies

1. **Query String Binding**:
   The paged endpoint `/api/specialties/paged` maps to query string values:
   * `page` (default: 1): Integer $\ge 1$.
   * `pageSize` (default: 10): Integer between 1 and 100.
   * `search`: Option string matched using ILIKE against `name`.
   * `sortBy` (default: `created_at`): Supported values are `name`, `isActive`, and `created_at`.
   * `sortDesc` (default: `false`): Boolean indicating sorting order.

2. **JSON Payloads**:
   Creation and modification payloads use standard JSON instead of FormData (multipart).
   * **Creation**: `{ "name": "Neurología" }`
   * **Modification**: `{ "name": "Neurología Clínica", "isActive": true }`

3. **Status Toggle Response**:
   `PATCH /api/specialties/{id}/toggle-status` changes the status and returns the final state object:
   ```json
   {
     "id": 3,
     "name": "Neurología Clínica",
     "isActive": false,
     "status": "Inactivado"
   }
   ```
   The client updates its lists dynamically by fetching the page again or patching the local item. We reload the page data to ensure total count and pagination states are in sync.
