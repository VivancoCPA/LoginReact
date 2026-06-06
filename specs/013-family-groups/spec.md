# Feature Specification: Family Groups (Grupos Familiares)

**Feature Branch**: `013-family-groups`

**Created**: 2026-06-06

**Status**: Draft

**Input**: User description: "Crear el mantenimiento de Grupo Familiar con acceso autorizado a la aplicación siguiendo el diseño empresarial de la aplicación..."

---

## Clarifications

### Session 2026-06-06

- Q: Card fields relevance: Should we discard the doctor fields and show Family Group relevant fields on the card grid? → A: Discard the doctor fields and show Family Group relevant fields (Group Name, Parent/Creator Name, Member Avatars, Extra Members).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Group Visualization and Dashboard (Priority: P1)

As an authenticated user, I want to see a main dashboard listing my family groups (both those I created and those I am a member of) alongside a panel showing the latest incidents.

**Why this priority**: Core navigation and visibility. Without listing groups, no other actions can be taken.

**Independent Test**: Can be verified by logging in and navigating to the Family Groups dashboard to check if groups and mock incidents are displayed correctly.

**Acceptance Scenarios**:
1. **Given** the user is logged in, **When** they navigate to `/admin/family-groups`, **Then** they see their created groups and groups where they are a member (represented by a different card color).
2. **Given** the user is on the dashboard, **When** "Ver Incidentes" is toggled, **Then** the right sidebar displaying mock incidents (Group, Date, User, Medical Center, Status) is visible.
3. **Given** the user is on the dashboard, **When** they type in the search bar or select status filters, **Then** the list is filtered in real-time across the entire dataset.

---

### User Story 2 - Group Management (CRUD) (Priority: P2)

As a Parent/creator of a group, I want to create, view, edit, and activate/deactivate the family group.

**Why this priority**: Crucial for group administration. Non-creators (regular members) should not be able to edit or toggle group status.

**Independent Test**: Create a new group, verify its presence, edit its details, deactivate it, and verify that its name appears struck through.

**Acceptance Scenarios**:
1. **Given** the user is a Parent/creator of a group, **When** they click "Desactivar" on the actions menu (⋮) and confirm, **Then** the group status changes to Inactive and the name appears struck through.
2. **Given** a user who is only a member of a group, **When** they open the group actions menu (⋮), **Then** they only see the "Ver" option, and the "Editar", "Desactivar", and "Add Members" options are hidden or disabled.
3. **Given** the user clicks "+ Nuevo Grupo", **When** they fill in the name (minimum 2 characters), select an avatar, and click "Crear", **Then** the group is successfully persisted and a success toast is shown.

---

### User Story 3 - Member Management (Priority: P3)

As a Parent/creator of a group, I want to add, remove, and deactivate members (both system users and extra members).

**Why this priority**: Standardizes how group sizes and relationships are managed.

**Independent Test**: Add a user as a member with a relationship, verify they appear in the avatars circle. Add an extra member, verify they appear in the "Miembros Extra" section.

**Acceptance Scenarios**:
1. **Given** the user is the creator of the group, **When** they add a member, **Then** they must select from existing users, input their relationship, and state if they are a Parent (only 1 Parent/Admin is allowed per group).
2. **Given** the members list, **When** a user is added, **Then** the system prevents duplicate members.
3. **Given** an extra member (Avatar, Full Name, Description, Status), **When** the creator deactivates or deletes them, **Then** their status is updated and they appear struck through if deactivated.

---

### Edge Cases

- **Multiple Parent conflicts**: What happens if a user tries to assign a second member as "Parent" in the same group? (The system must throw a validation error since only 1 Parent is allowed).
- **Struck-through state cascading**: When a group is deactivated, do all its members and extra members automatically inherit the deactivated state? (Yes, the group deactivation logically disables the entire group scope).
- **Member is both creator and member**: How does the dashboard prevent duplicate cards? (The dashboard queries and joins groups, filtering duplicates using unique group IDs).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST authorize access to the Family Groups dashboard, permitting only authenticated users to view it.
- **FR-002**: The layout MUST use a fixed viewport height (`h-full overflow-hidden flex flex-col`) splitting the workspace: 3/4 width for group cards and 1/4 width for the incidents panel.
- **FR-003**: The dashboard MUST display groups created by the logged-in user and groups where they are a member. Member-only groups MUST use a distinct card background color.
- **FR-004**: The system MUST support real-time cumulative filtering (Search + Status) over the entire dataset.
- **FR-005**: The card layout MUST render a list of member avatars (up to 4 avatars, appending `...` for excess members).
- **FR-006**: The system MUST allow the group creator (Parent) to manage members: add members (selecting from registered users, specifying relationship, maximum of one Parent), add extra members (name, avatar, description), deactivate members, and delete members.
- **FR-007**: The system MUST show inactive groups, members, and extra members with a struck-through style (`line-through`).
- **FR-008**: The card grid MUST display fields specific to the Family Group (Group Name, Parent/Creator Name, Member Avatars, and the bottom Extra Members list) instead of doctor-related placeholders.
- **FR-009**: Group names MUST be validated to be required and at least 2 characters long.

### Key Entities *(include if feature involves data)*

- **FamilyGroup**: Represents the family group unit. Attributes: `Id`, `Name`, `AvatarUrl`, `CreatorUserId` (Parent), `IsActive`, `CreatedAt`, `UpdatedAt`.
- **FamilyMembership**: Associates system users to a group. Attributes: `Id`, `FamilyGroupId`, `UserId`, `Relationship` (e.g. Spouse, Child), `IsParent` (bool), `IsActive`.
- **ExtraMember**: Non-system member profiles managed directly within the group. Attributes: `Id`, `FamilyGroupId`, `FullName`, `AvatarUrl`, `Description`, `IsActive`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can load the Family Group dashboard and see cards rendered in under 1 second.
- **SC-002**: Searching and status filtering must update the card grid and paginator in real-time (< 300ms latency).
- **SC-003**: The system prevents saving a group if the name has fewer than 2 characters, showing clear validation errors.
- **SC-004**: The system enforces that only one Parent exists per group, rejecting saving with multiple Parents.

---

## Assumptions

- **A-001**: The "Ver Incidentes" toggle selection is persisted in `sessionStorage` or `localStorage` to keep the user's preference across reloads.
- **A-002**: Registered users list is fetched from the existing `/api/users` lookup endpoint to associate users to groups.
- **A-003**: The right-side incidents panel contains static mock data for now, as the backend API for incidents will be implemented in a future specification.
- **A-004**: Deactivation of a group does not physically delete it from the database; it updates `IsActive` to false.
