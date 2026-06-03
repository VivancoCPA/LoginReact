export interface RoleItem {
  id: string;                  // Unique UUID of the role
  name: string;                // Name of the role (e.g. "Admin")
  description?: string;        // Optional detailed description of the role's purpose
  isActive: boolean;           // Active status of the role
  createdAt?: string;          // Timestamp of role creation
  assignedUsersCount: number;  // Dynamic count of active users currently holding this role
  isSystemRole?: boolean;      // Flag indicating a protected base role (Admin, User)
}

export interface CreateRolePayload {
  roleName: string;
  description: string;
  isActive?: boolean;
}

export interface UpdateRolePayload {
  roleName: string;
  description: string;
  isActive: boolean;
}

