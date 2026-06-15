# Data Model: Appointments Maintenance (Mantenimiento de Citas)

**Branch**: `017-citas-maintenance` | **Date**: 2026-06-15

This document outlines the TypeScript types and structures representing appointments and appointment statuses.

---

## 1. Type Definitions

### AppointmentStatus
Represents the available states of a medical appointment.
```typescript
export interface AppointmentStatus {
  id: string;      // Unique code: PENDIENTE, CONFIRMADA, INASISTENCIA, CANCELADA, REPROGRAMADA, ENCONSULTA, FINALIZADA
  label: string;   // Display label: Pendiente, Confirmada, Inasistencia, Cancelada, Reprogramada, En Consulta, Finalizada
}
```

### AppointmentItem
Represents an individual appointment retrieved from the backend API.
```typescript
export interface AppointmentItem {
  id: string;                 // GUID unique identifier
  userId: string;             // Associated patient user GUID
  appointmentDate: string;    // ISO 8601 Date string (e.g. "2026-06-20T14:30:00Z")
  centerId: string;           // Associated medical center GUID
  doctorId: string;           // Associated doctor user GUID
  specialtieId: number;       // Associated specialty integer ID
  insurerId?: string;         // Associated insurance provider GUID (optional)
  description: string;        // Appointment notes / symptoms description
  statusId: string;           // Active status code (e.g. "CONFIRMADA")
  createdAt: string;          // ISO 8601 creation timestamp
  
  // Flattened profile data returned by API joins
  specialtyName?: string;     // Medical specialty display name
  doctorName?: string;        // Doctor's full name (first + last name)
  doctorPhotoUrl?: string;    // URL to doctor's profile picture
  centerName?: string;        // Medical facility name
  centerAddress?: string;     // Medical facility physical address
  centerLatitude?: number;    // Geographic latitude coordinate
  centerLongitude?: number;   // Geographic longitude coordinate
}
```

### PagedAppointmentResult
The paginated container returned by `/api/appointments/paged`.
```typescript
export interface PagedAppointmentResult {
  items: AppointmentItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```
