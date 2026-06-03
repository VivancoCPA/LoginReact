import { apiClient } from './apiClient';
import type { RoleItem, CreateRolePayload, UpdateRolePayload } from '../types/role';

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
  async updateRole(id: string, payload: UpdateRolePayload): Promise<RoleItem> {
    const response = await apiClient.put<RoleItem>(`/roles/${id}`, payload);
    return response.data;
  },

  /**
   * Toggles the active/inactive status of a role
   */
  async toggleRoleStatus(id: string): Promise<{ id: string; name: string; isActive: boolean; status: string }> {
    const response = await apiClient.patch<{ id: string; name: string; isActive: boolean; status: string }>(`/roles/${id}/toggle-status`);
    return response.data;
  }
};


