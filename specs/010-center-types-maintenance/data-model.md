# Data Model: Medical Center Types

This document details the TypeScript interfaces, local React states, and form validations for Center Types.

## Entity Schema

### `CenterTypeItem`
Represents a single medical center type. Matches the C# `GetCenterTypeResponse` and `PagedCenterTypeItem`.

```typescript
export interface CenterTypeItem {
  id: number;          // Unique incremental integer correlative
  name: string;        // Name of the type (required, max 100 chars, unique)
  isActive: boolean;   // Active status (logical deletion flag)
  createdAt?: string;  // ISO timestamp of registration
  updatedAt?: string;  // ISO timestamp of modification
}
```

### `PaginatedCenterTypesResult`
Wrapper returned by the paged center types API.

```typescript
export interface PaginatedCenterTypesResult {
  items: CenterTypeItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

## Form Fields & Validation Rules

| Field | Type | Mandatory | Validation Rules | Error Message |
|---|---|---|---|---|
| `name` | String | Yes | $\ge 3$ characters, $\le 100$ characters. | "El nombre del tipo de centro es obligatorio." / "El nombre del tipo de centro debe tener al menos 3 caracteres." |
| `isActive` | Boolean | Yes | Defaults to `true` on creation. | None |

Form submissions capture `409 Conflict` HTTP exceptions when the name is already taken, printing: `"Ya existe un tipo de centro registrado con este nombre."`

## Session Storage Keys

*   `centerTypesLayoutSelection`: Layout preference persistence (`"table"` or `"cards"`). Defaults to `"table"`.
