import { apiClient } from './apiClient';
import type { SpecialtyItem, PaginatedSpecialtiesResult } from '../types/specialty';

export const specialtyService = {
  /**
   * Fetch all specialties (unpaginated, ordered alphabetically)
   */
  async getSpecialties(): Promise<SpecialtyItem[]> {
    const response = await apiClient.get<SpecialtyItem[]>('/specialties');
    return response.data;
  },

  /**
   * Fetch active specialties for dropdowns/autocomplete lookups
   */
  async getSpecialtiesLookup(): Promise<{ id: number; name: string }[]> {
    const response = await apiClient.get<{ id: number; name: string }[]>('/specialties/lookup');
    return response.data;
  },

  /**
   * Paginated list of specialties with search and sorting support
   */
  async getPagedSpecialties(params: {
    page?: number;
    pageSize?: number;
    search?: string | null;
    sortBy?: string;
    sortDesc?: boolean;
  }): Promise<PaginatedSpecialtiesResult> {
    const response = await apiClient.get<PaginatedSpecialtiesResult>('/specialties/paged', {
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
   * Retrieve a single specialty by ID
   */
  async getSpecialtyById(id: number): Promise<SpecialtyItem> {
    const response = await apiClient.get<SpecialtyItem>(`/specialties/${id}`);
    return response.data;
  },

  /**
   * Create a new medical specialty
   */
  async createSpecialty(payload: { name: string; description?: string }): Promise<SpecialtyItem> {
    const response = await apiClient.post<SpecialtyItem>('/specialties', payload);
    return response.data;
  },

  /**
   * Update an existing medical specialty
   */
  async updateSpecialty(id: number, payload: { name: string; description?: string; isActive: boolean }): Promise<SpecialtyItem> {
    const response = await apiClient.put<SpecialtyItem>(`/specialties/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the active status of a medical specialty
   */
  async toggleSpecialtyStatus(id: number): Promise<{ id: number; name: string; isActive: boolean; status: string }> {
    const response = await apiClient.patch<{ id: number; name: string; isActive: boolean; status: string }>(`/specialties/${id}/toggle-status`);
    return response.data;
  }
};
