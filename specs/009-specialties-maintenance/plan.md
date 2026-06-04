# Implementation Plan: Medical Specialties Maintenance (Mantenimiento de Especialidades Médicas)

**Branch**: `009-specialties-maintenance` | **Date**: 2026-06-04 | **Spec**: [specs/009-specialties-maintenance/spec.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/009-specialties-maintenance/spec.md)

**Input**: Feature specification from `/specs/009-specialties-maintenance/spec.md`

---

## Summary

This plan details the technical architecture and frontend implementation for the **Medical Specialties Maintenance (Mantenimiento de Especialidades Médicas)** module inside the Vite-React application. It delivers a premium CRUD experience allowing administrators to list, search, filter, view, create, edit, and toggle the status of medical specialties.

All operations will integrate with the backend API endpoints documented in [SpecialtiesEndpoints.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/SpecialtiesEndpoints.md) using standard JSON payloads.

---

## User Review Required

* **API Casing and Parameter Mapping**:
  * We map endpoints to `/api/specialties`, `/api/specialties/paged`, `/api/specialties/{id}`, and `/api/specialties/{id}/toggle-status`.
  * The paging endpoint `GET /api/specialties/paged` supports search, sorting (`sortBy`, `sortDesc`), page, and pageSize.
  * Unlike the Insurers CRUD, the Specialties CRUD does not require upload files (no photo/avatar binary upload), so all operations are pure JSON requests.
  * Page layout preference (Table vs Cards) is stored in `sessionStorage` under the key `specialtiesLayoutSelection`.

* **Specific UX & UI Guidelines**:
  * **Right-Panel Slide-over Drawer**: Details form view and edit state slide from the right panel (`SpecialtyDrawer.tsx`).
  * **Initials/Text Avatar**: Since specialties don't have images, we will display initials as an indicator or visual badge in the list/grid views.
  * **High Density Spacing**: High-density styling is implemented with compact row paddings (`py-1.5` to `py-2`) to align with existing maintenance views.
  * **Inline Validations**: The specialty name must be entered, cannot be empty, and must have a minimum length of 3 characters.

---

## Open Questions

No major blocking open questions are identified since the endpoint models and UI expectations match the existing user and roles maintenance flows. We will default to `/admin/specialties` as the route path, which is already registered in `menuConfig.ts`.

---

## Proposed Changes

We will create types, service integrations, a detail/edit drawer, a dashboard page, and wire the route in `App.tsx` and the workspace configurations.

### 1. Types and API Services Layer

#### [NEW] [specialty.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/types/specialty.ts)
* Define the TypeScript interfaces matching the specialties API responses and payloads:
  ```typescript
  export interface SpecialtyItem {
    id: number; // Integer correlative
    name: string;
    isActive: boolean;
    createdAt?: string;
  }

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

#### [NEW] [specialtyService.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/services/specialtyService.ts)
* Implement Axios CRUD service mappings to specialties endpoints:
  ```typescript
  import { apiClient } from './apiClient';
  import type { SpecialtyItem, PaginatedSpecialtiesResult } from '../types/specialty';

  export const specialtyService = {
    async getSpecialties(): Promise<SpecialtyItem[]> {
      const response = await apiClient.get<SpecialtyItem[]>('/specialties');
      return response.data;
    },
    async getPagedSpecialties(params: {
      page?: number;
      pageSize?: number;
      search?: string | null;
      sortBy?: string;
      sortDesc?: boolean;
    }): Promise<PaginatedSpecialtiesResult> {
      const response = await apiClient.get<PaginatedSpecialtiesResult>('/specialties/paged', {
        params: {
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 10,
          search: params.search || undefined,
          sortBy: params.sortBy ?? 'created_at',
          sortDesc: params.sortDesc ?? false,
        },
      });
      return response.data;
    },
    async createSpecialty(payload: { name: string }): Promise<SpecialtyItem> {
      const response = await apiClient.post<SpecialtyItem>('/specialties', payload);
      return response.data;
    },
    async updateSpecialty(id: number, payload: { name: string; isActive: boolean }): Promise<SpecialtyItem> {
      const response = await apiClient.put<SpecialtyItem>(`/specialties/${id}`, payload);
      return response.data;
    },
    async toggleSpecialtyStatus(id: number): Promise<{ id: number; name: string; isActive: boolean; status: string }> {
      const response = await apiClient.patch<{ id: number; name: string; isActive: boolean; status: string }>(`/specialties/${id}/toggle-status`);
      return response.data;
    }
  };
  ```

---

### 2. UI Components & Pages

#### [NEW] [SpecialtyDrawer.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/SpecialtyDrawer.tsx)
* Create slide-over panel sliding from the right.
* Supports modes: `'view' | 'create' | 'edit'`.
* In `'view'` mode:
  * Read-only layout. Displays detail metadata.
  * Offers an "Editar" button to swap layout mode to `'edit'`.
* In `'create'` and `'edit'` modes:
  * Interactive text inputs using premium dark/light inputs.
  * Validates:
    * Name: Required, min 3 characters, max 100 characters.
  * Captures validation conflict issues.

#### [NEW] [SpecialtyMaintenance.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/pages/SpecialtyMaintenance.tsx)
* Create the dashboard console combining:
  * Toolbar: Search input, status filter (`'all' | 'active' | 'inactive'`), `+ Nueva Especialidad` button, and Table/Cards layout toggle.
  * Persist table/cards view layout inside `sessionStorage` key `specialtiesLayoutSelection`.
  * Table layout displaying: Initials badge fallback, Name, Badge status, and Actions (Ver, Editar, Inactivar/Activar). Sorting controls on Name, Status headers.
  * Cards layout: Responsive Grid displaying metadata and actions menu dropdown (⋮) on click.
  * Integrates the React `ConfirmDialog` modal component for status inactivation actions.
    * Warning message: *"Esta especialidad ya no estará disponible para nuevos médicos. ¿Desea continuar?"*

---

### 3. Route Registration & Workspace

#### [MODIFY] [App.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/App.tsx)
* Import the new `SpecialtyMaintenance` page component and configure its route:
  ```tsx
  import SpecialtyMaintenance from './pages/SpecialtyMaintenance';
  // ...
  <Route path="/admin/specialties" element={<SpecialtyMaintenance />} />
  ```

#### [MODIFY] [GEMINI.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/GEMINI.md)
* Update active spec pointer rule to the `009-specialties-maintenance` plan path.

---

## Verification Plan

### Automated Tests
* Validate compilation of components and modules with Vite compiler command:
  ```bash
  npm run build
  ```

### Manual Verification
1. **Menu Navigation**: Click Administration $\rightarrow$ Especialidades; ensure URL is `/admin/specialties`.
2. **Persistence**: Select Card/Grid layout mode; verify layout persists after refreshing the page (`sessionStorage` check).
3. **Filtering**: Search by specialty name; confirm lists filter in real-time. Toggle active/inactive filters.
4. **Form validations**: Attempt creating a specialty with invalid/empty fields or name length < 3. Verify inline error warnings.
5. **Confirm modal**: Deactivate a specialty; verify dialog overlay asking "Esta especialidad ya no estará disponible para nuevos médicos. ¿Desea continuar?" before modifying logical status in database.
