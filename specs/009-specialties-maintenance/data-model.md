# Data Model: Medical Specialties

This document details the TypeScript interfaces, local React states, and form validations for Specialties.

## Entity Schema

### `SpecialtyItem`
Represents a single specialty item. Matches the C# `GetSpecialtyResponse` and `PagedSpecialtyItem`.

```typescript
export interface SpecialtyItem {
  id: number;          // Unique incremental integer correlative
  name: string;        // Name of the specialty (required, max 100 chars, unique)
  isActive: boolean;   // Active status (logical deletion flag)
  createdAt?: string;  // ISO timestamp of registration
}
```

### `PaginatedSpecialtiesResult`
Wrapper returned by the paged specialties API.

```typescript
export interface PaginatedSpecialtiesResult {
  items: SpecialtyItem[];
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
| `name` | String | Yes | $\ge 3$ characters, $\le 100$ characters. | "El nombre de la especialidad es obligatorio." / "El nombre de la especialidad debe tener al menos 3 caracteres." |
| `isActive` | Boolean | Yes | Defaults to `true` on creation. | None |

Form submissions capture `409 Conflict` HTTP exceptions when the specialty name is already taken, printing: `"Ya existe una especialidad registrada con este nombre."`

## Session Storage Keys

*   `specialtiesLayoutSelection`: Layout preference persistence (`"table"` or `"cards"`). Defaults to `"table"`.
