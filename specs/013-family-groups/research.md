# Research & Decision Log: Family Groups

This document outlines the API endpoints, authorization checks, and payload design decisions for the **Family Groups** module.

---

## 1. Endpoints Mapping

### A. Family Groups (CRUD & Status)
- `GET /api/family-groups`: Returns list of all family groups.
- `GET /api/family-groups/my`: Returns list of groups where the authenticated user is a member but not the owner/creator.
- `GET /api/family-groups/paged`: Returns paginated groups with query parameters (`page`, `pageSize`, `search`, `sortBy`, `sortDesc`).
- `GET /api/family-groups/{id}`: Returns details of a specific group by GUID.
- `POST /api/family-groups`: Creates a new group. Must be submitted via `FormData` to upload `Photo` as an `IFormFile` (key `Photo`).
- `PUT /api/family-groups/{id}`: Updates a group. Must be submitted via `FormData` to handle `Photo` file uploads.
- `PATCH /api/family-groups/{id}/toggle-status`: Alternates logical `isActive` status.

### B. Family Memberships (System Users)
- `GET /api/family-groups/{familyGroupId}/members`: List all system users registered in the group.
- `POST /api/family-groups/{familyGroupId}/members`: Assign an existing user.
  - JSON payload: `{ userId: string, isAdmin: boolean, relationship: string }`.
  - Constraint: Only 1 member can be `isParent`/`isAdmin` per group. A user can belong to only 1 family group in total (returns `409 Conflict` if already assigned).
- `DELETE /api/family-groups/{familyGroupId}/members/{userId}`: Remove/desvincule a user.

### C. Family Extra Memberships (Non-System Profiles)
- `GET /api/family-groups/{familyGroupId}/extra-members`: List non-system profiles.
- `POST /api/family-groups/{familyGroupId}/extra-members`: Create an extra member.
  - FormData parameters: `FullName`, `IdType`, `Description`, `Photo` (file).
- `PUT /api/family-groups/{familyGroupId}/extra-members/{id}`: Update an extra member.
  - FormData parameters: `FullName`, `IdType`, `Description`, `Photo` (file), `IsActive`.
- `DELETE /api/family-groups/{familyGroupId}/extra-members/{id}`: Permanent deletion.
- `PATCH /api/family-groups/{familyGroupId}/extra-members/{id}/toggle-status`: Toggle logical active status.

### D. Lookups & Lookups Fallbacks
- `GET /api/relationships`: Returns the static list of parentescos (relationships):
  ```json
  [
    { "id": "MADRE", "label": "Madre" },
    { "id": "PADRE", "label": "Padre" },
    { "id": "HIJO_A", "label": "Hijo/a" },
    { "id": "HERMANO_A", "label": "Hermano/a" },
    { "id": "CONYUGE", "label": "Cónyuge" }
  ]
  ```
- `GET /api/auth/users/paged`: Used in the members assignment dropdown search box to list system users who can be added to the group.

---

## 2. Multipart/Form-Data & Photo Upload Design

To comply with the requirement that profile photos must not be sent as base64 strings in the JSON body, the service layer will prepare a `FormData` object for creations and updates.

### Casing Details
The C# backend parses keys case-sensitively or case-insensitively depending on binding parameters:
- To match the C# parameters exactly, files must be appended with the key **`Photo`** (with a capital P).
- Text fields are appended as standard lowercase keys: `name`, `userId`, `isActive`, `fullName`, `idType`, `description`.
- Example for group creation:
  ```typescript
  const formData = new FormData();
  formData.append('name', name);
  formData.append('userId', currentUserId);
  if (photoFile) {
    formData.append('Photo', photoFile, photoFile.name);
  }
  ```

---

## 3. Logical Authorization & Permissions

- **Parent/Creator Role**: Defined by matching the authenticated user's ID (`user.id`) with the group's `userId` property.
  - **Full Privileges**: Add/Edit/Delete/Toggle Status of groups, members, and extra members.
- **Member-Only Role**: If `user.id` is not equal to `userId` of the group.
  - **Read-Only Privileges**: The user can open the group details drawer in view mode. The "Editar", "Desactivar" and "Add Member" controls are hidden or disabled.
- **Card Background Differentiation**:
  - Creator/Parent card: Default light/dark container theme matching user maintenance.
  - Member-only card: Light Green background (e.g. `bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40`).

---

## 4. Incidents Mock Data (Right-hand Sidebar)

The sidebar displays 5 static incidents using `sessionStorage` to persist the toggle state of the sidebar (`familyGroupsShowIncidents`).
Mock incident structure:
```typescript
interface IncidentItem {
  id: string;
  groupName: string;
  date: string;
  userName: string;
  medicalCenter: string;
  status: 'programado' | 'atendido' | 'cancelado' | 'vencido';
}
```
Mock Incidents List:
1. Group: "Familia Pérez", Date: "2026-06-06 10:00 AM", User: "María Pérez", Center: "Clínica San Borja", Status: "programado"
2. Group: "Familia Gómez", Date: "2026-06-05 03:30 PM", User: "Juan Gómez", Center: "Hospital Rebagliati", Status: "atendido"
3. Group: "Familia Pérez", Date: "2026-06-04 11:15 AM", User: "Abuelo Pedro", Center: "Clínica Delgado", Status: "vencido"
4. Group: "Familia Torres", Date: "2026-06-03 08:00 AM", User: "Sofía Torres", Center: "Clínica Internacional", Status: "cancelado"
5. Group: "Familia Gómez", Date: "2026-06-02 02:00 PM", User: "Lucas Gómez", Center: "Clínica San Felipe", Status: "atendido"
