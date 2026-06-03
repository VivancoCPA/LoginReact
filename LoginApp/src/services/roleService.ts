import { apiClient } from './apiClient';
import type { RoleItem, CreateRolePayload } from '../types/role';

export const roleService = {
  /**
   * Retrieves the complete list of system roles with user counts
   */
  async getRoles(): Promise<RoleItem[]> {
    const response = await apiClient.get<RoleItem[]>('/roles');
    return response.data;
  },

  /**
   * Creates a new global system role
   */
  async createRole(payload: CreateRolePayload): Promise<RoleItem> {
    const response = await apiClient.post<RoleItem>('/roles', payload);
    return response.data;
  },

  /**
   * Updates details of an existing global role
   */
  async updateRole(id: string, payload: CreateRolePayload): Promise<RoleItem> {
    const response = await apiClient.put<RoleItem>(`/roles/${id}`, payload);
    return response.data;
  },

  /**
   * Deletes a global system role (blocked if assignedUsersCount > 0 or if protected)
   */
  async deleteRole(id: string): Promise<any> {
    const response = await apiClient.delete(`/roles/${id}`);
    return response.data;
  }
};
