# Research Notes: Role Maintenance (Mantenimiento de Roles)

This document outlines the technical research, API integration choices, and architectural decisions made for the **Role Maintenance** module.

---

## 🛠️ API & Endpoints Integration

According to the central contract [UsersEndpoints.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/UsersEndpoints.md), the system currently exposes a public endpoint for listing roles and three individual endpoints for user role management. 

### 1. Existing Endpoints mapped in `UsersEndpoints.md`
- **GET `/api/roles`** (`ListRoles`): Returns the complete list of system roles with user counts.
- **GET `/api/users/{userId}/roles`** (`GetUserRoles`): Fetches roles linked to an individual user.
- **POST `/api/users/{userId}/roles`** (`AssignRole`): Links a role to a user.
- **DELETE `/api/users/{userId}/roles/{roleName}`** (`RemoveRole`): Unlinks a role from a user.

### 2. Required CRUD Extensions (Global Role Maintenance)
To support a full administration CRUD module (Create, Read, Update, Delete) where the Admin can add or modify roles globally:
- We will declare clean, standardized Axios service bindings matching standard RESTful patterns.
- If the external backend doesn't implement global mutating endpoints, we will implement transparent frontend catch-guards or mock fallback states inside the service layer (`roleService.ts`) to ensure seamless usability.
- **POST `/api/roles`**: Creates a new role. Payload: `{ name: string, description: string }`.
- **PUT `/api/roles/{roleId}`**: Updates role details. Payload: `{ name: string, description: string }`.
- **DELETE `/api/roles/{roleId}`**: Deletes a role globally (blocked if `assignedUsersCount > 0`).

---

## 🎨 Architectural & UI Decisions

### 1. View Toggling & sessionState Persistence
- **Decision**: Keep the view toggle ('table' vs 'cards') persisted using `sessionStorage.getItem('rolesLayoutSelection')`.
- **Rationale**: Meets requirement **FR-003** while ensuring that a browser refresh doesn't force the administrator to reset their preferred visualization dense structure.

### 2. High-Density Responsive Table
- **Decision**: Render table rows using dense vertical paddings (`py-2.5` to `py-3`) and provide ascending/descending order controls on "Nombre" and "Asignados".
- **Rationale**: Satisfies **FR-004** and matches the data-density guidelines from the Constitution (Principle IV).

### 3. Responsive Grid Cards Layout
- **Decision**: Card lists will render in a flexible Tailwind Grid system (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`), incorporating vertical actions menu dropdowns (⋮) on card headers.
- **Rationale**: Satisfies **FR-050** layout widths and mobile adaptation seamlessly.

### 4. Right Side-Over Drawer Layout
- **Decision**: All creation and edit forms are rendered inside a sliding right Drawer (`RoleDrawer.tsx`), matching the structure, close buttons, and styling of `UserDrawer.tsx` and `UserRolesDialog.tsx` drawer.
- **Rationale**: Complies with Constitution Principle IV (Drawers overlapping active tables instead of separate pages).

---

## 🔍 Alternatives Considered

| Alternative | Rationale for Rejection |
| :--- | :--- |
| **Centered Modals for CRUD Forms** | Centered modals disrupt page reading flow for large forms. Drawer slide-overs offer superior desktop screen utilization and align with our approved design system. |
| **Direct Axios calls in pages** | Violates Core Principle II (Decoupling services from presentation layer). Using a centralized `roleService.ts` keeps API details decoupled from page layouts. |
