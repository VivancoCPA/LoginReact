import { apiClient } from './apiClient';
import type { InsurerItem, PaginatedInsurersResult } from '../types/insurer';

export const insurerService = {
  /**
   * List all insurers (usually returns alphabetized list)
   */
  async getInsurers(): Promise<InsurerItem[]> {
    const response = await apiClient.get<InsurerItem[]>('/insurers');
    return response.data;
  },

  /**
   * Paginated list with filtering and sorting
   */
  async getPagedInsurers(params: {
    page?: number;
    pageSize?: number;
    search?: string | null;
    sortBy?: string;
    sortDesc?: boolean;
  }): Promise<PaginatedInsurersResult> {
    const response = await apiClient.get<PaginatedInsurersResult>('/insurers/paged', {
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
   * Retrieve single insurer detail record
   */
  async getInsurerById(id: string): Promise<InsurerItem> {
    const response = await apiClient.get<InsurerItem>(`/insurers/${id}`);
    return response.data;
  },

  /**
   * Create a new insurer using FormData (multipart/form-data for image upload)
   */
  async createInsurer(payload: {
    name: string;
    address: string;
    phone: string;
    email: string;
    personInCharge?: string;
    photo?: File | null;
  }): Promise<InsurerItem> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('address', payload.address);
    formData.append('phone', payload.phone);
    formData.append('email', payload.email);

    if (payload.personInCharge) {
      formData.append('personInCharge', payload.personInCharge);
    }
    if (payload.photo) {
      formData.append('photo', payload.photo, payload.photo.name);
    }

    const response = await apiClient.post<InsurerItem>('/insurers', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
    return response.data;
  },

  /**
   * Update existing insurer (standard JSON body PUT)
   */
  async updateInsurer(
    id: string,
    payload: {
      name: string;
      address: string;
      phone: string;
      email: string;
      personInCharge?: string;
      logoUrl?: string;
      photo?: File | null;
      isActive: boolean;
    }
  ): Promise<InsurerItem> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('address', payload.address);
    formData.append('phone', payload.phone);
    formData.append('email', payload.email);
    formData.append('isActive', String(payload.isActive));

    if (payload.personInCharge) {
      formData.append('personInCharge', payload.personInCharge);
    }
    if (payload.logoUrl && !payload.photo) {
      formData.append('logoUrl', payload.logoUrl);
    }
    if (payload.photo) {
      formData.append('photo', payload.photo, payload.photo.name);
    }

    const response = await apiClient.put<InsurerItem>(`/insurers/${id}`, formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
    return response.data;
  },

  /**
   * Toggle active status of insurer
   */
  async toggleInsurerStatus(id: string): Promise<{ id: string; name: string; isActive: boolean; status: string }> {
    const response = await apiClient.patch<{ id: string; name: string; isActive: boolean; status: string }>(`/insurers/${id}/toggle-status`);
    return response.data;
  }
};
