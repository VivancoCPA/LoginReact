# Data Model Design: Role Maintenance (Mantenimiento de Roles)

This document defines the TypeScript types, interfaces, state management structures, and validation schemas used across the Role Maintenance module.

---

## 1. Type Safe Interfaces (`src/types/role.ts`)

We will introduce a new file `src/types/role.ts` to manage strong typings for global roles:

```typescript
export interface RoleItem {
  id: string;                  // Unique UUID of the role
  name: string;                // Name of the role (e.g. "Admin")
  description?: string;        // Optional detailed description of the role's purpose
  assignedUsersCount: number;  // Dynamic count of active users currently holding this role
  isSystemRole?: boolean;      // Flag indicating a protected base role (Admin, User)
}

export interface CreateRolePayload {
  name: string;
  description: string;
}

export interface UpdateRolePayload {
  name: string;
  description: string;
}
```

---

## 2. Page & Component State Shape (`RoleMaintenance.tsx`)

The main administration console will maintain the following structured state properties:

```typescript
// Layout Mode
type LayoutMode = 'table' | 'cards';

// Active Filters
interface RoleFilters {
  search: string;              // Free-text query matching role name
}

// React State declarations
const [roles, setRoles] = useState<RoleItem[]>([]);
const [isLoading, setIsLoading] = useState<boolean>(true);
const [layoutMode, setLayoutMode] = useState<LayoutMode>('table');
const [filters, setFilters] = useState<RoleFilters>({ search: '' });

// Pagination State
const [currentPage, setCurrentPage] = useState<number>(1);
const [pageSize] = useState<number>(10);

// Drawer Control State
const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
```

---

## 3. Form Validation Schema (`RoleDrawer.tsx`)

In compliance with Core Principle V (Decoupled Forms & Validations), validation rules are managed in-line prior to API request submissions:

```typescript
interface RoleFormErrors {
  name?: string;
  description?: string;
}

// Inline Validation Logic
const validateForm = (name: string, description: string): RoleFormErrors => {
  const errors: RoleFormErrors = {};
  
  if (!name.trim()) {
    errors.name = 'El nombre del rol es requerido.';
  } else if (name.trim().length < 3) {
    errors.name = 'El nombre del rol debe tener al menos 3 caracteres.';
  }
  
  if (description.trim().length > 250) {
    errors.description = 'La descripción no puede superar los 250 caracteres.';
  }
  
  return errors;
};
```
