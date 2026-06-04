# Walkthrough: Medical Centers Maintenance (Mantenimiento de Centros Médicos)

We have successfully implemented the **Medical Centers Maintenance (Mantenimiento de Centros Médicos)** CRUD module in the React application, integrated with backend endpoints and utilizing Leaflet interactive maps and Nominatim address geocoding searches.

---

## Changes Implemented

1.  **TypeScript Types**:
    *   Created [medicalCenter.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/types/medicalCenter.ts) to define data interfaces for the medical center entity: `MedicalCenterItem` and `PaginatedMedicalCentersResult`.
2.  **API Services Integration**:
    *   Created [medicalCenterService.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/services/medicalCenterService.ts) containing Axios calls mapping all endpoints:
        *   `GET /api/medical-centers/paged`
        *   `GET /api/medical-centers/{id}`
        *   `POST /api/medical-centers`
        *   `PUT /api/medical-centers/{id}`
        *   `PATCH /api/medical-centers/{id}/toggle-status`
        *   `GET /api/medical-centers/lookup`
3.  **UI Component slide-over Drawer**:
    *   Created [MedicalCenterDrawer.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/MedicalCenterDrawer.tsx) supporting viewing (`view`), creation (`create`), and editing (`edit`) modes.
    *   Sets a wider layout (`max-w-2xl`) to cleanly present the data form and map.
    *   Embeds a local Leaflet map for coordinate selection. Clicking the map places a marker and updates the form values.
    *   Includes a search bar that queries Nominatim geocoding services to locate addresses and set coordinates automatically.
    *   Enforces inline validation for: Name, Address, TypeId, and Latitude/Longitude coordinate ranges.
4.  **Split Maintenance Dashboard**:
    *   Created [MedicalCenterMaintenance.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/pages/MedicalCenterMaintenance.tsx) implementing the Split layout:
        *   **Left Pane (Scrollable)**: Displays the search box, status tabs filters (All, Active, Inactive), primary creation CTA, layout view toggles (Table vs Cards), and the listing of centers. Row spacing is tight (`py-2`) to maximize density.
        *   **Right Pane (Flex-1)**: Embeds the full-screen interactive Leaflet map representing coordinate pins/markers for all current page results (with emerald green markers for active centers). Inactive centers are excluded from the main map.
    *   **Visual deactivation cues**: Deactivated centers in the left panel list are styled with reduced opacity (`opacity-60`), have a strike-through on their names (`line-through`), and display a clear `Desactivado` badge followed by their coordinates.
    *   **Layout Height Constraint**: Changed height configuration from dynamic viewport `h-[calc(100vh-4rem)]` to parent relative `h-full`. This correctly accounts for the padding in `MainLayout`, preventing any browser-level vertical scrollbar and ensuring the paginator footer is always fully visible at the bottom of the left list pane.
    *   Persists view layout mode inside `sessionStorage` under `medicalCentersLayoutSelection`.
    *   Integrates deactivation validation checks using the generic `ConfirmDialog` component.
5.  **Route Integration**:
    *   Registered routing in [App.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/App.tsx) and sidebar paths in `menuConfig.ts`.

---

## Verification Results

### Production Compilation Build
*   Successfully ran production compilation using Vite with zero warnings and zero TypeScript errors:
    ```text
    vite v8.0.14 building client environment for production...
    transforming...✓ 116 modules transformed.
    rendering chunks...
    computing gzip size...
    dist/index.html                   0.45 kB │ gzip:   0.29 kB
    dist/assets/index-BweEhqXF.css   92.33 kB │ gzip:  18.14 kB
    dist/assets/index-Dsf8KEj6.js   740.23 kB │ gzip: 193.57 kB

    ✓ built in 934ms
    ```

### Manual Testing Scenarios (Walkthrough)
1.  **Sidebar Links**: Clicking Administration $\rightarrow$ Centros Médicos successfully loads `/admin/medical-centers` showing the split listing/map view.
2.  **Layout selections**: Swapping layouts between Table and Cards persists on page refreshes.
3.  **Coordinate capturing**: Open drawer in creation mode. Clicking on map updates Lat/Long fields. Searching "Jesús María, Lima" correctly centers map and updates fields.
4.  **Confirm deactivation warnings**: Deactivating active centers triggers the confirm alert overlay warning.
5.  **Map marker clicks**: Verify that clicking a map marker displays the Leaflet popup details (name, address, status), but does not open the details/edit drawer panel. The drawers are only opened via the list action buttons.
