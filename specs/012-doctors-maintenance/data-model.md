# Data Model & Validation: Doctors Maintenance (Mantenimiento de Médicos)

This document specifies the TypeScript interfaces, validation schemas, and relationships for the doctor entities.

---

## 1. Data Model Schema

### Entity: `DoctorItem`
Represents a medical doctor in the system.

| Property | Type | Required | Read-Only | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` (UUID v7) | Yes | Yes | Unique identifier. |
| `name` | `string` | Yes | No | Name. Length range: 2 - 200. |
| `lastName` | `string` | Yes | No | Last name. Length range: 2 - 200. |
| `specialtyId` | `number` | No | No | Linked Specialty ID. |
| `specialtyName` | `string` | No | Yes | Name of the associated specialty. |
| `register` | `string` | No | No | Doctor registration number/CMP. |
| `phone` | `string` | No | No | Phone contact (numeric validation). |
| `email` | `string` | Yes | No | Valid email format, unique. |
| `photoUrl` | `string` | No | Yes | Profile picture URL. |
| `isVet` | `boolean` | Yes | No | True if doctor handles veterinary care. |
| `isActive` | `boolean` | Yes | No | Logical status flag. |
| `createdAt` | `string` (ISO DateTime) | Yes | Yes | Timestamp of creation. |
| `updatedAt` | `string` (ISO DateTime) | Yes | Yes | Timestamp of last modification. |
| `centers` | `DoctorCenterAssociation[]` | No | No | Associated medical center affiliations. |

### Entity: `DoctorCenterAssociation`
Represents the many-to-many link between a Doctor and a Medical Center.

| Property | Type | Required | Read-Only | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` (UUID v7) | Yes | No | Linked Medical Center ID. |
| `name` | `string` | No | Yes | Name of the medical center. |
| `officeNumber` | `string` | No | No | Doctor office / consultorio details. |
| `workSchedule` | `string` | No | No | Work schedule in this center. |

---

## 2. Validation Rules

- **Name**: Required, minimum 2 characters, maximum 200 characters.
- **LastName**: Required, minimum 2 characters, maximum 200 characters.
- **Email**: Required, must match a valid email format (`^[^\s@]+@[^\s@]+\.[^\s@]+$`), must be unique.
- **Phone**: Optional, must contain only numeric characters/spaces/pluses (if provided).
- **Photo**: Optional, file size must not exceed 2MB. Valid mime-types: `image/jpeg`, `image/png`, `image/webp`.
- **SpecialtyId**: Optional, must correspond to a valid active specialty.
- **Centers**: Optional, but if provided, each center ID must be valid, and cannot have duplicate centers in the same affiliations list.
