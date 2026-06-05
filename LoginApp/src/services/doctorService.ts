import { apiClient } from './apiClient';
import type { DoctorItem, PaginatedDoctorsResult, DoctorAffiliationItem } from '../types/doctor';

export const doctorService = {
  /**
   * Fetch all doctors (unpaginated)
   */
  async getDoctors(): Promise<DoctorItem[]> {
    const response = await apiClient.get<DoctorItem[]>('/doctors');
    return response.data;
  },

  /**
   * Fetch active doctors for lookups/autocomplete dropdowns
   */
  async getDoctorsLookup(): Promise<{ id: string; name: string }[]> {
    const response = await apiClient.get<{ id: string; name: string }[]>('/doctors/lookup');
    return response.data;
  },

  /**
   * Fetch paged doctors with search and sort support
   */
  async getPagedDoctors(params: {
    page?: number;
    pageSize?: number;
    search?: string | null;
    sortBy?: string;
    sortDesc?: boolean;
  }): Promise<PaginatedDoctorsResult> {
    const response = await apiClient.get<PaginatedDoctorsResult>('/doctors/paged', {
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
   * Retrieve a single doctor by ID (UUID v7)
   */
  async getDoctorById(id: string): Promise<DoctorItem> {
    const response = await apiClient.get<DoctorItem>(`/doctors/${id}`);
    return response.data;
  },

  /**
   * Create a new doctor (multipart/form-data upload)
   */
  async createDoctor(payload: {
    name: string;
    lastName: string;
    specialtyId?: number | null;
    register?: string;
    phone?: string;
    email?: string;
    photo?: File | null;
    isVet: boolean;
    centers?: { id: string; officeNumber?: string; workSchedule?: string }[];
  }): Promise<DoctorItem> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('lastName', payload.lastName);
    formData.append('isVet', String(payload.isVet));

    if (payload.specialtyId !== undefined && payload.specialtyId !== null) {
      formData.append('specialtyId', String(payload.specialtyId));
    }
    if (payload.register) {
      formData.append('register', payload.register);
    }
    if (payload.phone) {
      formData.append('phone', payload.phone);
    }
    if (payload.email) {
      formData.append('email', payload.email);
    }
    if (payload.photo) {
      formData.append('Photo', payload.photo, payload.photo.name);
    }

    // Append centers array as serialized JSON string for atomic sync
    if (payload.centers) {
      formData.append('centers', JSON.stringify(payload.centers));
    }

    const response = await apiClient.post<DoctorItem>('/doctors', formData);
    return response.data;
  },

  /**
   * Update an existing doctor (multipart/form-data upload)
   */
  async updateDoctor(
    id: string,
    payload: {
      name: string;
      lastName: string;
      specialtyId?: number | null;
      register?: string;
      phone?: string;
      email?: string;
      photo?: File | null;
      isVet: boolean;
      isActive: boolean;
      centers?: { id: string; officeNumber?: string; workSchedule?: string }[];
    }
  ): Promise<DoctorItem> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('lastName', payload.lastName);
    formData.append('isVet', String(payload.isVet));
    formData.append('isActive', String(payload.isActive));

    if (payload.specialtyId !== undefined && payload.specialtyId !== null) {
      formData.append('specialtyId', String(payload.specialtyId));
    }
    if (payload.register) {
      formData.append('register', payload.register);
    }
    if (payload.phone) {
      formData.append('phone', payload.phone);
    }
    if (payload.email) {
      formData.append('email', payload.email);
    }
    if (payload.photo) {
      formData.append('Photo', payload.photo, payload.photo.name);
    }

    // Append centers array as serialized JSON string for atomic sync
    if (payload.centers) {
      formData.append('centers', JSON.stringify(payload.centers));
    }

    const response = await apiClient.put<DoctorItem>(`/doctors/${id}`, formData);
    return response.data;
  },

  /**
   * Toggle logical active status of a doctor
   */
  async toggleDoctorStatus(id: string): Promise<{ id: string; name: string; isActive: boolean; status: string }> {
    const response = await apiClient.patch<{ id: string; name: string; isActive: boolean; status: string }>(`/doctors/${id}/toggle-status`);
    return response.data;
  },

  /**
   * Fetch affiliations for a specific doctor
   */
  async getDoctorAffiliations(doctorId: string): Promise<DoctorAffiliationItem[]> {
    const response = await apiClient.get<DoctorAffiliationItem[]>('/doctor-affiliations', {
      params: { doctorId },
    });
    return response.data;
  },

  /**
   * Create a new doctor affiliation (JSON payload POST)
   */
  async createDoctorAffiliation(payload: {
    doctorId: string;
    centerId: string;
    officeNumber?: string;
    workSchedule?: string;
  }): Promise<number> {
    const response = await apiClient.post<number>('/doctor-affiliations', payload);
    return response.data;
  },

  /**
   * Update an existing doctor affiliation (JSON payload PUT)
   */
  async updateDoctorAffiliation(
    id: number,
    payload: {
      officeNumber?: string;
      workSchedule?: string;
    }
  ): Promise<void> {
    await apiClient.put(`/doctor-affiliations/${id}`, payload);
  },

  /**
   * Delete an existing doctor affiliation (DELETE)
   */
  async deleteDoctorAffiliation(id: number): Promise<void> {
    await apiClient.delete(`/doctor-affiliations/${id}`);
  }
};
