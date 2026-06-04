import { apiClient } from './apiClient';
import type { MedicalCenterItem, PaginatedMedicalCentersResult } from '../types/medicalCenter';

export const medicalCenterService = {
  /**
   * Fetch all medical centers (unpaginated)
   */
  async getMedicalCenters(): Promise<MedicalCenterItem[]> {
    const response = await apiClient.get<MedicalCenterItem[]>('/medical-centers');
    return response.data;
  },

  /**
   * Fetch active medical centers for lookups/autocomplete dropdowns
   */
  async getMedicalCentersLookup(): Promise<{ id: string; name: string }[]> {
    const response = await apiClient.get<{ id: string; name: string }[]>('/medical-centers/lookup');
    return response.data;
  },

  /**
   * Fetch paged medical centers with search and sort support
   */
  async getPagedMedicalCenters(params: {
    page?: number;
    pageSize?: number;
    search?: string | null;
    sortBy?: string;
    sortDesc?: boolean;
  }): Promise<PaginatedMedicalCentersResult> {
    const response = await apiClient.get<PaginatedMedicalCentersResult>('/medical-centers/paged', {
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
   * Retrieve a single medical center by ID (UUID v7)
   */
  async getMedicalCenterById(id: string): Promise<MedicalCenterItem> {
    const response = await apiClient.get<MedicalCenterItem>(`/medical-centers/${id}`);
    return response.data;
  },

  /**
   * Create a new medical center
   */
  async createMedicalCenter(payload: {
    name: string;
    typeId?: number;
    address?: string;
    phone?: string;
    isActive: boolean;
    latitude?: number;
    longitude?: number;
  }): Promise<MedicalCenterItem> {
    const response = await apiClient.post<MedicalCenterItem>('/medical-centers', payload);
    return response.data;
  },

  /**
   * Update an existing medical center
   */
  async updateMedicalCenter(
    id: string,
    payload: {
      name: string;
      typeId?: number;
      address?: string;
      phone?: string;
      isActive: boolean;
      latitude?: number;
      longitude?: number;
    }
  ): Promise<MedicalCenterItem> {
    const response = await apiClient.put<MedicalCenterItem>(`/medical-centers/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle active status of a medical center
   */
  async toggleMedicalCenterStatus(id: string): Promise<{ id: string; name: string; isActive: boolean; status: string }> {
    const response = await apiClient.patch<{ id: string; name: string; isActive: boolean; status: string }>(`/medical-centers/${id}/toggle-status`);
    return response.data;
  }
};
