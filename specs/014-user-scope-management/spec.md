# Feature Specification: User Scope Management (Gestión de Scope de Usuarios)

**Feature Branch**: `014-user-scope-management`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "Nueva Spec de Scope de Usuarios: Sobre el CRUD de usuarios ya existente necesitamos agregar funcionalidad.

Funciones:
-Sobre la información del usuario que esta logueado se debe ajustar:
	--Mostrar su Avatar
	--Mostrar el Rol 
-Sobre la opción de modificar su perfil, tenga la opción de poder cargar/modificar su avatar siguiendo las mismas reglas que cuando se edita un usuario.
Se debe crear una opción en donde solo el Rol Admin podrá ver y su funcionalidad sera asociar Usuarios que no esten en ningún Scope asociado.
Agregar en Accions la opción solo para el Admin donde se desasocia el usuario al scope, debe tener un mensaje  de confirmación.

Controles:
Existen dos Roles principales Admin y SuperAdmin
EL Rol SuperAdmin podrá
	-Crear Nuevo Usuarios.
	-Asignar Roles.
	-Ver usuario.
	-Editar. 
	-Desactivar/Activar.
EL Rol Admin podrá
	-Crear Nuevo Usuarios.
	-Asignar Roles.
	-Ver usuario.
	-Editar. 
	-Desactivar/Activar.
	-Asociar Usuarios al Scope del Admin
	-Remover Usuarios del Scope del Admin"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Header Profile & Own Avatar Management (Priority: P1)

As a logged-in user, I want to see my avatar and my role in the header/navbar, and I want to be able to upload or modify my profile photo in my settings so that my profile is complete and personalized.

**Why this priority**: Displaying identity and roles is critical for user context, and self-avatar updates are standard functionality.

**Independent Test**: Can be tested by logging in, observing header profile info, navigating to profile edit panel, uploading a new valid image, and verifying that the header immediately updates.

**Acceptance Scenarios**:

1. **Given** a user is logged in, **When** they view the header navbar, **Then** they see their profile avatar (or fallback initials) and their current assigned role.
2. **Given** a logged-in user has opened their profile settings, **When** they select a valid image file (<= 2MB, JPG/PNG) and submit, **Then** their photo is uploaded and updated dynamically across the application.
3. **Given** a logged-in user tries to upload an invalid profile photo (> 2MB or non-image format), **When** they select the file, **Then** the system displays a validation error message and cancels the upload.

---

### User Story 2 - Admin Scope Association (Priority: P2)

As an Admin, I want to access a dedicated view where I can see all system users who do not belong to any scope, so that I can select and associate them with my Admin scope.

**Why this priority**: Essential to onboard scopeless users into a specific administrator's purview.

**Independent Test**: Can be tested by logging in as an Admin, navigating to the "Asociar Usuarios" view, selecting a user from the scopeless list, clicking "Asociar", and verifying the user disappears from the list and is visible in the Admin's user maintenance panel.

**Acceptance Scenarios**:

1. **Given** an Admin is logged in and visits the Scope Management page, **When** there are users in the system without an assigned scope, **Then** those users are listed in a table/grid.
2. **Given** an Admin is on the Scope Management page, **When** they click "Asociar" on a scopeless user, **Then** the system associates the user with the Admin's scope and refreshes the list.
3. **Given** a SuperAdmin or regular user is logged in, **When** they attempt to access the Scope Management page, **Then** the system denies access and redirects them to the home page or shows an access error.

---

### User Story 3 - Admin Scope Disassociation (Priority: P3)

As an Admin, I want to be able to remove users from my scope from the User Maintenance page, so that I no longer manage them.

**Why this priority**: Crucial for offboarding or transferring users out of an administrator's scope.

**Independent Test**: Can be tested by logging in as an Admin, finding a user in the list, clicking "Desasociar del Scope" in the actions menu, confirming the warning dialog, and verifying the user is removed from the Admin's list.

**Acceptance Scenarios**:

1. **Given** an Admin is on the User Maintenance list, **When** they click "Desasociar" on a user, **Then** the system displays a modal dialog asking to confirm the disassociation.
2. **Given** the disassociation confirmation modal is open, **When** the Admin clicks "Confirmar", **Then** the system removes the user from the Admin's scope and refreshes the list.
3. **Given** the disassociation confirmation modal is open, **When** the Admin clicks "Cancelar", **Then** the modal closes and no changes are made.

---

### Edge Cases

- **Concurrency**: What happens if two Admins try to associate the same scopeless user simultaneously? The first Admin's request succeeds; the second Admin's request fails gracefully with a message indicating the user is already associated.
- **Admin Disassociation**: Can an Admin disassociate themselves from their own scope? The system MUST block this action to prevent orphans or lockouts.
- **Empty States**: If there are no users in the system without a scope, the Scope Association page MUST display an appropriate empty state illustration and message rather than a blank table.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The main application layout header MUST display the logged-in user's profile avatar (with fallback initials styled dynamically) and their active role name.
- **FR-002**: The logged-in user profile page/drawer MUST allow the user to modify their name, lastName, address, phoneNumber, dateOfBirth, and upload a new avatar file.
- **FR-003**: Profile photo uploads MUST be limited to a maximum size of 2MB and support JPEG/PNG formats. They MUST be submitted as binary `photo` FormData.
- **FR-004**: The application MUST include a menu item/view named "Asociación de Scope" visible exclusively to users possessing the `Admin` role.
- **FR-005**: The "Asociación de Scope" view MUST query all users who are not mapped to any administrator scope (i.e. having no record in the user_scope system).
- **FR-006**: The "Asociación de Scope" view MUST allow an Admin to associate any scopeless user to their scope by sending a `POST /api/users/{adminId}/scope/{userId}` request.
- **FR-007**: In the User Maintenance list, users with the `Admin` role MUST see a "Desasociar del Scope" button in the action controls.
- **FR-008**: The "Desasociar del Scope" button MUST display a confirmation dialog prompting the Admin to confirm the removal before calling `DELETE /api/users/{adminId}/scope/{userId}`.
- **FR-009**: The system MUST enforce access control matrix:
  - **SuperAdmin**: Can create, assign roles, view, edit, toggle active status globally (no scope boundaries).
  - **Admin**: Can create, assign roles, view, edit, toggle active status within their scope, associate scopeless users, and remove users from their scope.
  - **Regular User**: Cannot access administrative views, and can only edit their own profile details.

### Key Entities

- **User**: Represents a registered system member (id, name, lastName, email, photoUrl, isLockedOut, passwordConfirmed).
- **UserScope**: Represents the binding registry linking a managed `User` to a specific `Admin` administrator.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All authenticated users see their correct role name and avatar image in the header immediately upon page load.
- **SC-002**: Profile avatar updates are fully processed, uploaded, and updated in the UI in under 2 seconds.
- **SC-003**: The list of scopeless users on the Scope Association page updates instantly after an association action completes.
- **SC-004**: Confirmation dialogs for disassociation block accidental clicks, preventing unauthorized scope removals.

## Assumptions

- **Existing API Support**: It is assumed that the backend endpoints `POST /api/users/{adminId}/scope/{userId}` and `DELETE /api/users/{adminId}/scope/{userId}` are already defined and functional.
- **Scope Query Endpoint**: It is assumed that an endpoint or filter exists to list scopeless users (e.g. GET `/api/users` without scopes, or a specific query parameter).
- **Profile Endpoint**: Updating own profile uses a standard `/api/auth/profile` or the existing user PUT endpoint.
