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
