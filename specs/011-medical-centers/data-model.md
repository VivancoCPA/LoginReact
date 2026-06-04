# Data Model: Medical Centers

This document outlines the TypeScript interfaces, validation rules, and session persistence parameters for Medical Centers.

## Entity Schema

### `MedicalCenterItem`
Represents a single medical center item. Matches the C# `GetMedicalCenterResponse` and `PagedMedicalCenterItem`.

```typescript
export interface MedicalCenterItem {
  id: string;               // UUID v7 unique identifier
  name: string;             // Name of the medical center (required, max 200 chars)
  typeId?: number;          // ID of the center type (references center_types.id)
  typeName?: string;        // Lookup name of the center type (read-only)
  address?: string;         // Physical address (max 500 chars)
  phone?: string;           // Contact phone number (max 30 chars)
  isActive: boolean;        // Logical deletion state flag
  latitude?: number;        // Geographic latitude coordinate [-90, 90]
  longitude?: number;       // Geographic longitude coordinate [-180, 180]
  createdAt?: string;       // ISO timestamp
  updatedAt?: string;       // ISO timestamp
}

export interface PaginatedMedicalCentersResult {
  items: MedicalCenterItem[];
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
| `name` | String | Yes | $\ge 2$ characters, $\le 200$ characters. | "El nombre del centro médico es obligatorio." / "El nombre debe tener al menos 2 caracteres." |
| `address` | String | Yes | $\ge 2$ characters, $\le 500$ characters. | "La dirección del centro médico es obligatoria." / "La dirección debe tener al menos 2 caracteres." |
| `typeId` | Number | Yes | Must be $\gt 0$ selection. | "Debe seleccionar un tipo de centro médico." |
| `phone` | String | No | Max 30 characters. Regex matching: `^[\d\s+\-()]*$` | "El teléfono de contacto contiene caracteres inválidos." |
| `latitude` | Number | Yes | Numeric value between -90 and 90. | "La latitud debe ser un número decimal válido entre -90 y 90." |
| `longitude` | Number | Yes | Numeric value between -180 and 180. | "La longitud debe ser un número decimal válido entre -180 y 180." |

## Session Storage Keys

*   `medicalCentersLayoutSelection`: Layout mode selection (`"table"` or `"cards"`). Defaults to `"table"`.
