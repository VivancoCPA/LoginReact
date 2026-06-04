import { apiClient } from './apiClient';
import type { CenterTypeItem, PaginatedCenterTypesResult } from '../types/centerType';

export const centerTypeService = {
  /**
   * Fetch all medical center types (unpaginated)
   */
  async getCenterTypes(): Promise<CenterTypeItem[]> {
    const response = await apiClient.get<CenterTypeItem[]>('/center-types');
    return response.data;
  },

  /**
   * Fetch active center types for lookups/autocomplete dropdowns
   */
  async getCenterTypesLookup(): Promise<{ id: number; name: string }[]> {
    const response = await apiClient.get<{ id: number; name: string }[]>('/center-types/lookup');
    return response.data;
  },

  /**
   * Fetch paged medical center types with search and sort support
   */
  async getPagedCenterTypes(params: {
    page?: number;
    pageSize?: number;
    search?: string | null;
    sortBy?: string;
    sortDesc?: boolean;
  }): Promise<PaginatedCenterTypesResult> {
    const response = await apiClient.get<PaginatedCenterTypesResult>('/center-types/paged', {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 10,
        search: params.search || undefined,
        sortBy: params.sortBy ?? 'created_at',
        sortDesc: params.sortDesc ?? false,
      },
    });
    return response.data;
  },

  /**
   * Retrieve a single medical center type by ID
   */
  async getCenterTypeById(id: number): Promise<CenterTypeItem> {
    const response = await apiClient.get<CenterTypeItem>(`/center-types/${id}`);
    return response.data;
  },

  /**
   * Create a new medical center type
   */
  async createCenterType(payload: { name: string }): Promise<CenterTypeItem> {
    const response = await apiClient.post<CenterTypeItem>('/center-types', payload);
    return response.data;
  },

  /**
   * Update an existing medical center type
   */
  async updateCenterType(id: number, payload: { name: string; isActive: boolean }): Promise<CenterTypeItem> {
    const response = await apiClient.put<CenterTypeItem>(`/center-types/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle active status of a medical center type
   */
  async toggleCenterTypeStatus(id: number): Promise<{ id: number; name: string; isActive: boolean; status: string }> {
    const response = await apiClient.patch<{ id: number; name: string; isActive: boolean; status: string }>(`/center-types/${id}/toggle-status`);
    return response.data;
  }
};
