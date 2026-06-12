import { apiClient } from "./apiClient";
import type { PaginatedUsersResult, FamilyGroup } from "../types/user";

export const userService = {
  /**
   * Retrieves paged, sorted, and filtered users from the backend
   */
  async getPagedUsers(params: {
    page?: number;
    pageSize?: number;
    search?: string | null;
    sortBy?: string;
    sortDesc?: boolean;
    isLockedOut?: boolean | null;
    isActive?: boolean | null;
  }): Promise<PaginatedUsersResult> {
    const response = await apiClient.get<PaginatedUsersResult>(
      "/auth/users/paged",
      {
        params: {
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 10,
          search: params.search || undefined,
          sortBy: params.sortBy ?? "name",
          sortDesc: params.sortDesc ?? false,
          isLockedOut:
            params.isLockedOut !== undefined ? params.isLockedOut : null,
          isActive: params.isActive !== undefined ? params.isActive : null,
        },
      },
    );
    return response.data;
  },

  /**
   * Retrieves all family groups
   */
  async getFamilyGroups(): Promise<FamilyGroup[]> {
    const response = await apiClient.get<FamilyGroup[]>("/family-groups");
    return response.data;
  },

  /**
   * Creates a user account administratively
   */
  async createUser(payload: {
    email: string;
    name: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    photo?: File | null;
    address?: string;
  }): Promise<any> {
    const formData = new FormData();

    // Use exact casing keys matching the contract to avoid duplicate model-binding collections in .NET
    formData.append("email", payload.email);
    formData.append("name", payload.name);
    formData.append("lastName", payload.lastName);

    if (payload.phone) {
      formData.append("phone", payload.phone);
    }
    if (payload.dateOfBirth) {
      formData.append("dateOfBirth", payload.dateOfBirth);
    }
    if (payload.photo) {
      // Pass the file with explicit name to help IFormFile model binding on backend
      formData.append("photo", payload.photo, payload.photo.name);
    }
    if (payload.address) {
      formData.append("address", payload.address);
    }

    const response = await apiClient.post("/auth/users", formData, {
      headers: {
        "Content-Type": undefined,
      },
    });
    return response.data;
  },

  /**
   * Updates an existing user's profile details using FormData
   */
  async updateUser(
    id: string,
    payload: {
      name: string;
      lastName: string;
      dateOfBirth?: string;
      phoneNumber?: string;
      photo?: File | null;
      address?: string;
    },
  ): Promise<any> {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("lastName", payload.lastName);

    if (payload.dateOfBirth) {
      formData.append("dateOfBirth", payload.dateOfBirth);
    }
    if (payload.phoneNumber) {
      formData.append("phoneNumber", payload.phoneNumber);
    }
    if (payload.photo) {
      formData.append("photo", payload.photo, payload.photo.name);
    }
    if (payload.address) {
      formData.append("address", payload.address);
    }

    const response = await apiClient.put(`/auth/users/${id}`, formData, {
      headers: {
        "Content-Type": undefined,
      },
    });
    return response.data;
  },

  /**
   * Toggles the user's active/locked lockout status
   */
  async toggleUserStatus(userId: string): Promise<{
    userId: string;
    email: string;
    isLockedOut: boolean;
    status: string;
  }> {
    const response = await apiClient.patch<{
      userId: string;
      email: string;
      isLockedOut: boolean;
      status: string;
    }>(`/users/${userId}/toggle-status`);
    return response.data;
  },

  /**
   * Fetches roles assigned to a user
   */
  async getUserRoles(
    userId: string,
  ): Promise<{ userId: string; email: string; roles: string[] }> {
    const response = await apiClient.get<{
      userId: string;
      email: string;
      roles: string[];
    }>(`/users/${userId}/roles`);
    return response.data;
  },

  /**
   * Fetches claims assigned to a user
   */
  async getUserClaims(userId: string): Promise<{
    userId: string;
    email: string;
    claims: Array<{ type: string; value: string }>;
  }> {
    const response = await apiClient.get<{
      userId: string;
      email: string;
      claims: Array<{ type: string; value: string }>;
    }>(`/users/${userId}/claims`);
    return response.data;
  },

  /**
   * Assigns a role to a user
   */
  async assignUserRole(userId: string, roleName: string): Promise<any> {
    const response = await apiClient.post(`/users/${userId}/roles`, {
      roleName,
    });
    return response.data;
  },

  /**
   * Removes a role from a user
   */
  async removeUserRole(userId: string, roleName: string): Promise<any> {
    const response = await apiClient.delete(
      `/users/${userId}/roles/${roleName}`,
    );
    return response.data;
  },

  /**
   * Retrieves all users (without pagination)
   */
  async getAllUsers(): Promise<any[]> {
    const response = await apiClient.get<any[]>("/users");
    return response.data;
  },

  /**
   * Retrieves users associated with an Admin's scope
   */
  async getUserScopes(adminId: string): Promise<Array<{
    id: number;
    userIdAdmin: string;
    userId: string;
    userEmail: string;
    userFullName: string;
  }>> {
    const response = await apiClient.get<Array<{
      id: number;
      userIdAdmin: string;
      userId: string;
      userEmail: string;
      userFullName: string;
    }>>(`/users/${adminId}/scopes`);
    return response.data;
  },

  /**
   * Associates a user to an Admin's scope
   */
  async associateUserToScope(adminId: string, userId: string): Promise<any> {
    const response = await apiClient.post(`/users/${adminId}/scope/${userId}`);
    return response.data;
  },

  /**
   * Removes a user from an Admin's scope
   */
  async disassociateUserFromScope(adminId: string, userId: string): Promise<any> {
    const response = await apiClient.delete(`/users/${adminId}/scope/${userId}`);
    return response.data;
  },
};
