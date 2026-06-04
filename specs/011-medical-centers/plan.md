# Implementation Plan: Medical Centers Maintenance (Mantenimiento de Centros Médicos)

**Branch**: `011-medical-centers` | **Date**: 2026-06-04 | **Spec**: [specs/011-medical-centers/spec.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/011-medical-centers/spec.md)

**Input**: Feature specification from `/specs/011-medical-centers/spec.md`

---

## Summary

This plan details the implementation of the **Medical Centers Maintenance (Mantenimiento de Centros Médicos)** CRUD module. The dashboard will use a **split-pane layout**:
*   **Left Pane (Scrollable)**: Displays the search box, status filters, layout toggle (Table vs Cards), and the high-density list of medical centers.
*   **Right Pane**: Embeds an interactive OpenStreetMap Leaflet Map showing location markers for all visible medical centers.
*   **Wider Slide-Over Drawer**: Handles detail view, creation, and updating. Inside the drawer, a mini-map is embedded where the user can click to place a marker or search a place using OpenStreetMap's Nominatim geocoding service, capturing Latitude and Longitude coordinates.

---

## Technical Context

*   **Language/Version**: React 19 + TypeScript + Vite.
*   **Primary Dependencies**: Leaflet (vanilla integration using `useRef` and `useEffect` hooks) + Axios client.
*   **Storage**: Centralized API backend storage (REST client).
*   **Testing**: Vite production compilation checks (`npm run build`) and manual verification scenarios.
*   **Target Platform**: Responsive Web browsers (optimized for desktop grid/map split view, collapsing gracefully on mobile).
*   **Project Type**: Single-page Web Application.
*   **Performance Goals**: Debounced queries (300ms) to Nominatim and backend paged search, fast map loading using non-key tile layers.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

*   **JWT Bearer Tokens**: Reuses global authorization interceptors in `apiClient`.
*   **Centralized Axios client**: Connects endpoints using the custom client in `services/`.
*   **Enterprise Aesthetics**: High-density elements (`py-2` spacing), Light & Dark mode support, sliding right drawers, collapsible Sidebar Layout.
*   **Decoupled validations**: Form inputs validated inline before submissions.

---

## Project Structure

### Documentation (this feature)

```text
specs/011-medical-centers/
├── spec.md              # Functional specification
├── plan.md              # This file (Implementation Plan)
├── research.md          # Leaflet & Nominatim research notes
├── data-model.md        # Data models and validation rules
├── quickstart.md        # Integration & manual testing guide
└── checklists/
    └── requirements.md  # Spec checklist
```

### Source Code

```text
LoginApp/
└── src/
    ├── types/
    │   └── medicalCenter.ts          # [NEW] TypeScript Interfaces
    ├── services/
    │   └── medicalCenterService.ts   # [NEW] Axios API Client Services
    ├── components/
    │   └── MedicalCenterDrawer.tsx   # [NEW] Wider Right CRUD drawer with embedded Nominatim search map
    ├── pages/
    │   └── MedicalCenterMaintenance.tsx # [NEW] Split dashboard page (list on left, Leaflet map on right)
    ├── App.tsx                       # [MODIFY] Register route path `/admin/medical-centers`
    └── components/
        └── Topbar.tsx                # [MODIFY] Add breadcrumb header mapping
```

**Structure Decision**: Code lives within the main React project folder under standard directories (`src/types`, `src/services`, `src/components`, `src/pages`), aligning with other maintenance modules.

---

## Proposed Changes

### 1. TypeScript Types Layer
#### [NEW] [medicalCenter.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/types/medicalCenter.ts)
*   Define standard interfaces matching C# payloads: `MedicalCenterItem` and `PaginatedMedicalCentersResult`.

### 2. Services Layer
#### [NEW] [medicalCenterService.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/services/medicalCenterService.ts)
*   Provide backend integrations:
    *   `getPagedMedicalCenters(params)`: Maps to query parameters (`page`, `pageSize`, `search`, `sortBy`, `sortDesc`) for paginated search.
    *   `getMedicalCenterById(id)`: Fetches a single center's details.
    *   `createMedicalCenter(payload)`: Submits new center data.
    *   `updateMedicalCenter(id, payload)`: Modifies existing center details.
    *   `toggleMedicalCenterStatus(id)`: Patch logical activation state.

### 3. Right Slide-Over Panel Drawer
#### [NEW] [MedicalCenterDrawer.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/MedicalCenterDrawer.tsx)
*   Set a wider layout (`max-w-2xl` / `w-[600px]`) to ensure the input form and coordinate map don't look congested.
*   Form Fields: Name, Address, Center Type selection dropdown (loaded from `centerTypeService.getCenterTypesLookup()`), Phone, Latitude, Longitude.
*   **Interactive Location Map**:
    *   Renders a local Leaflet map inside a `useRef` container.
    *   **Click-to-place**: Clicking anywhere on the map moves the marker and sets Latitude and Longitude inputs.
    *   **Geocode Search**: Add an address search bar. Typing a place (e.g. "Jesús María, Lima") queries the Nominatim API, centers the map, places the marker, and updates the inputs automatically.
*   **Inline Validations**:
    *   Name $\ge 2$ characters.
    *   Address $\ge 2$ characters.
    *   Center Type selection required.
    *   Latitude between -90 and 90.
    *   Longitude between -180 and 180.

### 4. Main Maintenance Split Dashboard
#### [NEW] [MedicalCenterMaintenance.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/pages/MedicalCenterMaintenance.tsx)
*   Implements the Split Layout:
    *   **Left sidebar**: Contains the search bar, active/inactive/all status filter tabs, Table/Cards view switcher, `+ Nuevo Centro` CTA, and the scrollable list of centers. Uses tight cell padding for high visual density.
    *   **Right pane**: Embedded Leaflet map rendering markers for all medical centers returned in the active listing page. Clicking a marker highlights the center in the left panel.
*   **Layout Persistence**: Persists view mode in `sessionStorage` key `medicalCentersLayoutSelection`.
*   **Deactivation Warning**: Integrates `ConfirmDialog` warning the user before deactivation.

### 5. Routing and Header
#### [MODIFY] [App.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/App.tsx)
*   Add route `<Route path="/admin/medical-centers" element={<MedicalCenterMaintenance />} />` inside protected route scopes.

#### [MODIFY] [Topbar.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/Topbar.tsx)
*   Add breadcrumb name mapping: `/admin/medical-centers` $\rightarrow$ `'Centros Médicos'`.

---

## Verification Plan

### Automated Checks
*   Verify TypeScript and Vite compilation bundles:
    ```bash
    npm run build
    ```

### Manual Verification
1.  **Dashboard Navigation**: Ensure Administration $\rightarrow$ Centros Médicos navigates to `/admin/medical-centers`.
2.  **Split Screen Rendering**: Confirm split layout loads properly (left pane scrollable list, right pane full interactive map).
3.  **Coordinate Capture**: Open creation drawer. Move the marker on the map or type an address in the search box; verify coordinates auto-fill correctly.
4.  **Confirm Overlay**: Toggle an active center status; verify deactivation confirmation modal prompts.
5.  **Layout persistence**: Verify Table/Cards selections persist across page reloads.
