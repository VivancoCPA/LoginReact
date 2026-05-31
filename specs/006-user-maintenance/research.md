# Research Findings: User Maintenance (Gestión de Usuarios)

This document details the design findings, API schemas, decision rationales, and rejected options evaluated during the discovery phase of the **User Maintenance** module.

---

## 1. API Integration & DTO Schemas

The [UsersEndpoints.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/UsersEndpoints.md) reference contract provides the precise bindings needed for our integrations.

### 1.1 Pagination & Filtering (`GET /api/auth/users/paged`)
*   **Path**: `GET /api/auth/users/paged`
*   **Request Params**:
    *   `page`: (default 1) Active page index.
    *   `pageSize`: (default 10) Records per page.
    *   `search`: (optional) Substring search targeting Name, LastName, Email, or Family Group Name.
    *   `sortBy`: Sorting criteria (`"name"`, `"lastname"`, `"email"`, `"createdat"`).
    *   `sortDesc`: Boolean sorting direction.
*   **Response DTO Structure**:
    ```json
    {
      "items": [
        {
          "id": "string",
          "email": "string",
          "name": "string",
          "lastName": "string",
          "phoneNumber": "string",
          "dateOfBirth": "2026-05-22",
          "photoUrl": "string",
          "address": "string",
          "emailConfirmed": true,
          "isLockedOut": false,
          "createdAt": "2026-05-22T18:24:27Z",
          "familyGroupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "familyGroupName": "string"
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

### 1.2 Family Groups Discovery (`GET /api/family-groups`)
*   **Path**: `GET /api/family-groups`
*   **Response array item DTO**:
    ```json
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Familia González Pérez",
      "userId": "d748f65e-2b1a-42c3-98fe-d27e7fcd61a2",
      "ownerName": "María González",
      "photoUrl": "https://example.com/photos/group_gonzalez.jpg",
      "isActive": true,
      "createdAt": "2026-05-20T18:24:27Z"
    }
    ```
*   **Filtering constraint**: Loop through results and only append items where `isActive === true` to the filter selector choices.

---

## 2. Image Selection & Size Validation

### 2.1 File Select Strategy
*   **Selected Option**: Implement an HTML `<input type="file" accept="image/*" />` trigger styled as a hidden native select covered by a premium avatar placeholder block in the drawer header.
*   **Visual Preview**: Once selected, standard browser API `URL.createObjectURL(file)` is used to construct a transient base-64 preview URL, displaying it immediately within the top avatar block.
*   **2MB Size Validation constraint**:
    ```typescript
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSizeInBytes) {
        toast.error('El tamaño de la foto no debe exceder los 2MB.');
        e.target.value = ''; // Reset file input
        return;
      }

      // Safe to generate preview and store file in state
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    };
    ```

---

## 3. Decision Logs & Rejected Alternatives

### 3.1 Role & Claim Management Scope
*   **Decision**: Render Roles and Claims as read-only badges within the "Ver Usuario" detail panel, blocking modifications within this CRUD spec.
*   **Rationale**: Decoupling prevents interface bloat and validation mismatches before role assignment mechanics are fully ratified.
*   **Rejected Option**: Full role selection inside edit/create modes (rejected due to speculative complexity and API coupling risks).

### 3.2 Dynamic Family Groups Population
*   **Decision**: Fetch active groups dynamically from `GET /api/family-groups` and filter for `isActive === true`.
*   **Rationale**: Prevents code maintenance overhead compared to hardcoded dropdown tags.
*   **Rejected Option**: Call global `/users` and list unique group names (rejected because it did not align with the dedicated `/api/family-groups` endpoint specification).

### 3.3 Search Operation Level
*   **Decision**: Server-side search using the paginated backend query parameter.
*   **Rationale**: Guarantees database search capability across multiple pages.
*   **Rejected Option**: Client-side filtering in memory (rejected because search wouldn't find matches existing on un-loaded pages).
