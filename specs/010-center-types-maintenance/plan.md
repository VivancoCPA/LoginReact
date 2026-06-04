# Implementation Plan: Medical Center Types Maintenance (Mantenimiento de Tipos de Centro Médico)

**Branch**: `010-center-types-maintenance` | **Date**: 2026-06-04 | **Spec**: [specs/010-center-types-maintenance/spec.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/010-center-types-maintenance/spec.md)

**Input**: Feature specification from `/specs/010-center-types-maintenance/spec.md`

---

## Summary

This plan details the technical architecture and frontend implementation for the **Medical Center Types Maintenance (Mantenimiento de Tipos de Centro Médico)** CRUD module. It allows administrators to search, paginate, view details, create, edit, and toggle the status of medical center types.

All operations will integrate with the backend API endpoints documented in [CenterTypesEndpoints.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/CenterTypesEndpoints.md) using standard JSON payloads.

---

## User Review Required

* **API Casing and Parameter Mapping**:
  * We map endpoints to `/api/center-types`, `/api/center-types/paged`, `/api/center-types/{id}`, and `/api/center-types/{id}/toggle-status`.
  * The paging endpoint `GET /api/center-types/paged` supports search, sorting (`sortBy`, `sortDesc`), page, and pageSize.
  * Page layout preference (Table vs Cards) is stored in `sessionStorage` under the key `centerTypesLayoutSelection`.

* **Specific UX & UI Guidelines**:
  * **No Avatar Column**: As requested, there will be no Avatar column, initials visual badge, or icon block in the Table list, Cards list, view details panel, edit panel, or registration drawer. The listings are entirely text-based.
  * **Right-Panel Slide-over Drawer**: Detail view and edit states slide from the right panel (`CenterTypeDrawer.tsx`).
  * **High Density Spacing**: Table row padding is minimized (`py-1.5` to `py-2`) to keep consistent with existing modules.
  * **Inline Validations**: Name is mandatory and must have a minimum length of 3 characters.

---

## Open Questions

No major blocking open questions are identified since the endpoint models and UI expectations match the specialties maintenance flow. We will default to `/admin/center-types` as the route path, aligning with the registered path in `menuConfig.ts`.

---

## Proposed Changes

We will create types, service integrations, a detail/edit drawer, a dashboard page, and wire the route in `App.tsx` and the workspace configurations.

### 1. Types and API Services Layer

#### [NEW] [centerType.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/types/centerType.ts)
* Define the TypeScript interfaces matching the center types API models:
  ```typescript
  export interface CenterTypeItem {
    id: number; // Integer correlative
    name: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
  }

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

#### [NEW] [centerTypeService.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/services/centerTypeService.ts)
* Implement Axios CRUD service mappings to center types endpoints:
  ```typescript
  import { apiClient } from './apiClient';
  import type { CenterTypeItem, PaginatedCenterTypesResult } from '../types/centerType';

  export const centerTypeService = {
    async getCenterTypes(): Promise<CenterTypeItem[]> {
      const response = await apiClient.get<CenterTypeItem[]>('/center-types');
      return response.data;
    },
    async getCenterTypesLookup(): Promise<{ id: number; name: string }[]> {
      const response = await apiClient.get<{ id: number; name: string }[]>('/center-types/lookup');
      return response.data;
    },
    async getPagedCenterTypes(params: {
      page?: number;
      pageSize?: number;
      search?: string | null;
      sortBy?: string;
      sortDesc?: boolean;
    }): Promise<PaginatedCenterTypesResult> {
      const response = await apiClient.get<PaginatedCenterTypesResult>('/center-types/paged', {
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
    async createCenterType(payload: { name: string }): Promise<CenterTypeItem> {
      const response = await apiClient.post<CenterTypeItem>('/center-types', payload);
      return response.data;
    },
    async updateCenterType(id: number, payload: { name: string; isActive: boolean }): Promise<CenterTypeItem> {
      const response = await apiClient.put<CenterTypeItem>(`/center-types/${id}`, payload);
      return response.data;
    },
    async toggleCenterTypeStatus(id: number): Promise<{ id: number; name: string; isActive: boolean; status: string }> {
      const response = await apiClient.patch<{ id: number; name: string; isActive: boolean; status: string }>(`/center-types/${id}/toggle-status`);
      return response.data;
    }
  };
  ```

---

### 2. UI Components & Pages

#### [NEW] [CenterTypeDrawer.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/CenterTypeDrawer.tsx)
* Create slide-over panel sliding from the right.
* Supports modes: `'view' | 'create' | 'edit'`.
* Displays no visual avatar initials or image badges.
* In `'view'` mode:
  * Read-only layout. Displays detail metadata.
  * Offers an "Editar" button to swap layout mode to `'edit'`.
* In `'create'` and `'edit'` modes:
  * Interactive text inputs using premium dark/light inputs.
  * Validates Name: Required, min 3 characters, max 100 characters.

#### [NEW] [CenterTypeMaintenance.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/pages/CenterTypeMaintenance.tsx)
* Create the dashboard console combining:
  * Toolbar: Search input, status filter (`'all' | 'active' | 'inactive'`), `+ Nuevo Tipo Centro` button, and Table/Cards layout toggle.
  * Persist table/cards view layout inside `sessionStorage` key `centerTypesLayoutSelection`.
  * Table layout displaying: Name, Badge status, and Actions (Ver, Editar, Inactivar/Activar) without any Avatar column. Sorting controls on Name and Status.
  * Cards layout: Responsive Grid displaying Name, Status badge, and actions menu dropdown (⋮) on click. No avatar visual.
  * Integrates the React `ConfirmDialog` modal component for status inactivation actions.
    * Warning message: *"Este tipo de centro ya no estará disponible para nuevos centros médicos. ¿Desea continuar?"*

---

### 3. Route Registration & Workspace

#### [MODIFY] [App.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/App.tsx)
* Import the new `CenterTypeMaintenance` page component and configure its route:
  ```tsx
  import CenterTypeMaintenance from './pages/CenterTypeMaintenance';
  // ...
  <Route path="/admin/center-types" element={<CenterTypeMaintenance />} />
  ```

#### [MODIFY] [GEMINI.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/GEMINI.md)
* Update active spec pointer rule to the `010-center-types-maintenance` plan path.

---

## Verification Plan

### Automated Tests
* Validate compilation of components and modules with Vite compiler command:
  ```bash
  npm run build
  ```

### Manual Verification
1. **Menu Navigation**: Click Administration $\rightarrow$ Tipos de Centro; ensure URL is `/admin/center-types`.
2. **Persistence**: Select Card/Grid layout mode; verify layout persists after refreshing the page (`sessionStorage` check).
3. **Filtering**: Search by name; confirm lists filter in real-time. Toggle active/inactive filters.
4. **Form validations**: Attempt creating a type with invalid/empty fields or name length < 3. Verify inline error warnings.
5. **Confirm modal**: Deactivate a type; verify dialog overlay asking "Este tipo de centro ya no estará disponible para nuevos centros médicos. ¿Desea continuar?" before modifying status.
