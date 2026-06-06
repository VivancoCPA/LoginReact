import { apiClient } from './apiClient';
import type { 
  FamilyGroupItem, 
  PaginatedFamilyGroupsResult, 
  FamilyMembershipItem,
  FamilyExtraMembershipItem,
  RelationshipLookup
} from '../types/familyGroup';

export const familyGroupService = {
  // --- Family Groups CRUD & Status ---
  
  async getFamilyGroups(): Promise<FamilyGroupItem[]> {
    const response = await apiClient.get<FamilyGroupItem[]>('/family-groups');
    return response.data;
  },

  async getMyFamilyGroups(): Promise<FamilyGroupItem[]> {
    const response = await apiClient.get<FamilyGroupItem[]>('/family-groups/my');
    return response.data;
  },

  async getPagedFamilyGroups(params: {
    page?: number;
    pageSize?: number;
    search?: string | null;
    sortBy?: string;
    sortDesc?: boolean;
  }): Promise<PaginatedFamilyGroupsResult> {
    const response = await apiClient.get<PaginatedFamilyGroupsResult>('/family-groups/paged', {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 10,
        search: params.search || undefined,
        sortBy: params.sortBy ?? 'name',
        sortDesc: params.sortDesc ?? false,
      },
    });
    return response.data;
  },

  async getFamilyGroupById(id: string): Promise<FamilyGroupItem> {
    const response = await apiClient.get<FamilyGroupItem>(`/family-groups/${id}`);
    return response.data;
  },

  async createFamilyGroup(payload: {
    name: string;
    userId: string;
    photo?: File | null;
  }): Promise<FamilyGroupItem> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('userId', payload.userId);
    if (payload.photo) {
      formData.append('Photo', payload.photo, payload.photo.name);
    }
    const response = await apiClient.post<FamilyGroupItem>('/family-groups', formData);
    return response.data;
  },

  async updateFamilyGroup(
    id: string,
    payload: {
      name: string;
      userId: string;
      photo?: File | null;
      isActive: boolean;
    }
  ): Promise<FamilyGroupItem> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('userId', payload.userId);
    formData.append('isActive', String(payload.isActive));
    if (payload.photo) {
      formData.append('Photo', payload.photo, payload.photo.name);
    }
    const response = await apiClient.put<FamilyGroupItem>(`/family-groups/${id}`, formData);
    return response.data;
  },

  async toggleFamilyGroupStatus(id: string): Promise<{ id: string; name: string; isActive: boolean; status: string }> {
    const response = await apiClient.patch<{ id: string; name: string; isActive: boolean; status: string }>(
      `/family-groups/${id}/toggle-status`
    );
    return response.data;
  },

  // --- Lookups ---
  
  async getRelationships(): Promise<RelationshipLookup[]> {
    const response = await apiClient.get<RelationshipLookup[]>('/relationships');
    return response.data;
  },

  // --- Members (System Users) ---
  
  async getMembers(familyGroupId: string): Promise<FamilyMembershipItem[]> {
    const response = await apiClient.get<FamilyMembershipItem[]>(`/family-groups/${familyGroupId}/members`);
    return response.data;
  },

  async assignMember(
    familyGroupId: string,
    payload: {
      userId: string;
      isAdmin: boolean;
      relationship: string;
    }
  ): Promise<FamilyMembershipItem> {
    const response = await apiClient.post<FamilyMembershipItem>(
      `/family-groups/${familyGroupId}/members`,
      payload
    );
    return response.data;
  },

  async removeMember(familyGroupId: string, userId: string): Promise<void> {
    await apiClient.delete(`/family-groups/${familyGroupId}/members/${userId}`);
  },

  // --- Extra Members (Non-System Profiles) ---
  
  async getExtraMembers(familyGroupId: string): Promise<FamilyExtraMembershipItem[]> {
    const response = await apiClient.get<FamilyExtraMembershipItem[]>(
      `/family-groups/${familyGroupId}/extra-members`
    );
    return response.data;
  },

  async createExtraMember(
    familyGroupId: string,
    payload: {
      fullName: string;
      idType: string;
      description?: string;
      photo?: File | null;
    }
  ): Promise<FamilyExtraMembershipItem> {
    const formData = new FormData();
    formData.append('FullName', payload.fullName);
    formData.append('IdType', payload.idType);
    if (payload.description) {
      formData.append('Description', payload.description);
    }
    if (payload.photo) {
      formData.append('Photo', payload.photo, payload.photo.name);
    }
    const response = await apiClient.post<FamilyExtraMembershipItem>(
      `/family-groups/${familyGroupId}/extra-members`,
      formData
    );
    return response.data;
  },

  async updateExtraMember(
    familyGroupId: string,
    id: number,
    payload: {
      fullName: string;
      idType: string;
      description?: string;
      photo?: File | null;
      isActive: boolean;
    }
  ): Promise<FamilyExtraMembershipItem> {
    const formData = new FormData();
    formData.append('FullName', payload.fullName);
    formData.append('IdType', payload.idType);
    formData.append('IsActive', String(payload.isActive));
    if (payload.description) {
      formData.append('Description', payload.description);
    }
    if (payload.photo) {
      formData.append('Photo', payload.photo, payload.photo.name);
    }
    const response = await apiClient.put<FamilyExtraMembershipItem>(
      `/family-groups/${familyGroupId}/extra-members/${id}`,
      formData
    );
    return response.data;
  },

  async deleteExtraMember(familyGroupId: string, id: number): Promise<void> {
    await apiClient.delete(`/family-groups/${familyGroupId}/extra-members/${id}`);
  },

  async toggleExtraMemberStatus(
    familyGroupId: string,
    id: number
  ): Promise<{ id: number; fullName: string; isActive: boolean; status: string }> {
    const response = await apiClient.patch<{ id: number; fullName: string; isActive: boolean; status: string }>(
      `/family-groups/${familyGroupId}/extra-members/${id}/toggle-status`
    );
    return response.data;
  }
};
