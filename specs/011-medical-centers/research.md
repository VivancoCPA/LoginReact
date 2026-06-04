# Research: Medical Centers Maintenance & Leaflet Integration

This document outlines the research, API endpoints integration, and architectural decisions for the **Medical Center Maintenance (Mantenimiento de Centros Médicos)** module, with special emphasis on map visualization, coordinate capturing, and high-density listings.

## Technical Decisions

### 1. Leaflet Map Integration in React 19
*   **Problem**: Using `react-leaflet` with React 19 often introduces unresolved peer dependency errors or compatibility issues.
*   **Solution**: Direct integration of vanilla `leaflet` using a React `useRef` container.
*   **Details**:
    *   Initialize the map inside a `useEffect` hook targeting a container `div` ref:
        ```typescript
        const map = L.map(containerRef.current).setView([lat, lng], zoom);
        ```
    *   Load open-source map tile layers from OpenStreetMap (requires no API keys):
        ```typescript
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        ```
    *   **Cleanup**: To avoid double initialization errors (common in React Strict Mode), clean up the map instance when the component unmounts:
        ```typescript
        return () => {
          map.remove();
        };
        ```

### 2. Search-Based Coordinate Selection (Geocoding)
*   **Problem**: Users need to search a place or address to capture Latitude and Longitude instead of manually typing coordinates.
*   **Solution**: Integrate geocoding using the **OpenStreetMap Nominatim Search API** (`https://nominatim.openstreetmap.org`).
*   **Details**:
    *   Free-to-use search API returning structured results with coordinates.
    *   A simple geocoding handler in the Drawer component triggers a `GET` request:
        ```typescript
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
          params: { q: searchQuery, format: 'json', limit: 1 }
        });
        if (response.data.length > 0) {
          const { lat, lon } = response.data[0];
          setLatitude(parseFloat(lat));
          setLongitude(parseFloat(lon));
          // Move map marker to this position
        }
        ```
    *   Additionally, clicking directly on the form map will place a marker and automatically fill the Latitude and Longitude coordinate inputs.

### 3. API Integrations
The CRUD endpoints mapped in `MedicalCentersEndpoints.md` will be implemented using the custom `apiClient` instance:
*   `GET /api/medical-centers/paged`: Fetch paginated list. Supports `page`, `pageSize`, `search`, `sortBy`, and `sortDesc`.
*   `GET /api/center-types/lookup`: Retrieve active center types list to populate the selection dropdown in the drawer.
*   `POST /api/medical-centers`: Create a medical center.
*   `PUT /api/medical-centers/{id}`: Update an existing center.
*   `PATCH /api/medical-centers/{id}/toggle-status`: Toggle logical state (`isActive`).

---

## Visual Design & Aesthetics

*   **Split Layout**: The main layout `/admin/medical-centers` features a split-pane layout:
    *   **Left Pane (400px)**: Fixed, high-density scrollable panel. Houses the page title, search bar, active/inactive filters, table/cards layouts toggle, and the list of medical centers. Rows have tight padding (`py-2`) to maximize density.
    *   **Right Pane (flex-1)**: Full-height interactive Leaflet Map indicating markers for all visible medical centers.
*   **Drawers (600px)**: The CRUD drawers slide in from the right, overlaying the main map. To prevent congestion and ensure readability, it uses a wider drawer width (`max-w-xl` to `max-w-2xl`). Inside the drawer, a mini-interactive map is rendered for marker positioning and address search.
