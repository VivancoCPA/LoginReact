# Research Notes: Doctors Maintenance (Mantenimiento de Médicos)

This document maps out key research findings, technical decisions, and API contract details resolved for this feature.

---

## 1. Lookups and Selectors Integration

- **Decision**: Fetch specialties list lookup from `/api/specialties/lookup` via `specialtyService.getSpecialtiesLookup()`. Fetch medical centers list lookup from `/api/medical-centers/lookup` via `medicalCenterService.getMedicalCentersLookup()`.
- **Rationale**: Reuses preexisting server endpoints, filtering active items on the database level, ensuring data integrity.
- **Alternatives considered**: Fetching the full unpaginated entities lists. Rejected because it pulls unnecessary details (descriptions, coordinates) and ignores active status filtering.

---

## 2. Profile Photo Multi-part Form Data Upload

- **Decision**: Package files into `FormData` and pass `headers: { 'Content-Type': undefined }` in the Axios call.
- **Rationale**:
  - Setting `'Content-Type': undefined` instructs the browser to automatically configure `multipart/form-data` with its boundary tags, which matches the backend ASP.NET expectation.
  - Form fields (`name`, `lastName`, `phone`, `email`, `register`, `isVet`, `isActive`, `specialtyId`) are appended as key-value pairs.
  - Image is validated to not exceed 2MB.
  - In Edit mode, if a new image file is chosen, it is appended as `photo`. If not, we fall back to the existing `photoUrl` value or empty.
- **Alternatives considered**: Base64 encoding. Rejected because the backend expects binary stream files and will throw `400 Bad Request` if base64 string bytes are passed in place of file fields.

---

## 3. Associated Medical Centers Array Binding

- **Decision**: Format center arrays using ASP.NET standard model binding format:
  - `centers[i].id`
  - `centers[i].officeNumber`
  - `centers[i].workSchedule`
- **Rationale**: Aligns with backend parameter binding rules detailed in `DoctorsEndpoints.md`.
- **Alternatives considered**: Passing a JSON-stringified array. Rejected because ASP.NET `IFormCollection` doesn't natively map nested JSON strings to typed collections when combining file uploads, unless custom binders are written on the server.

---

## 4. Scrollable Containment and Page Height

- **Decision**: Use `h-full overflow-hidden flex flex-col` on the main page wrapper, and `flex-1 overflow-y-auto min-h-0` on list containers.
- **Rationale**: Ensures the header, filter toolbar, and pagination footer remain fixed in place, while only the lists scroll. Prevents double scrollbars from appearing on the main browser window.
- **Alternatives considered**: Static dynamic `h-[calc(...)]` viewport calc. Rejected because margins/paddings from parent layout wrappers vary between mobile, tablet, and desktop views, causing viewport overflows.
