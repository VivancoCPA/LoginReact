# Requirements Checklist: Medical Center Types Maintenance (Mantenimiento de Tipos de Centro Médico)

**Purpose**: Verifies that the spec.md functional requirements cover all user scenarios, API endpoints, validations, and edge cases.
**Created**: 2026-06-04
**Feature**: [spec.md](../spec.md)

## Functional Coverage

- [x] CHK001 List displays center types paginated with configurable page sizes (default: 10).
- [x] CHK002 Search input bar triggers server-side ILIKE filters with a debounced 300ms delay.
- [x] CHK003 Table and Cards Grid layouts are toggled and persisted in sessionStorage under `centerTypesLayoutSelection`.
- [x] CHK004 Table layout provides sortable headers for Name and Status.
- [x] CHK005 Right-panel slide-over drawer manages detailed view, creation, and updating operations.
- [x] CHK05.5 Creation and modification forms validate Name to be non-empty and at least 3 characters.
- [x] CHK007 Deactivating a center type prompts a general warning modal asking if they want to proceed since the type will no longer be available for new medical center assignments.
- [x] CHK008 Success toasts are rendered upon creation or updating.
- [x] CHK009 Backend write operations use standard JSON request bodies.

## Notes

- Check items off as completed: `[x]`
- Sequenced to ensure all spec criteria are verified before design starts.
