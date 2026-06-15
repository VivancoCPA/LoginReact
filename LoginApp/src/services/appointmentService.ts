import { apiClient } from './apiClient';
import type { AppointmentStatus, AppointmentItem, PagedAppointmentResult } from '../types/appointment';

/**
 * Service to manage appointments with the backend API endpoints
 */
export const appointmentService = {
  /**
   * List all available appointment statuses
   */
  async getStatuses(): Promise<AppointmentStatus[]> {
    const response = await apiClient.get<AppointmentStatus[]>('/appointment-statuses');
    return response.data;
  },

  /**
   * Fetch paginated list of appointments for the authenticated user
   */
  async getPagedAppointments(params: {
    page?: number;
    pageSize?: number;
    statusId?: string;
    date?: string;
  }): Promise<PagedAppointmentResult> {
    const response = await apiClient.get<PagedAppointmentResult>('/appointments/paged', {
      params,
    });
    return response.data;
  },

  /**
   * Fetch all appointments for the authenticated user (optionally filtered by status or date)
   */
  async getAllAppointments(params?: {
    statusId?: string;
    date?: string;
  }): Promise<AppointmentItem[]> {
    const response = await apiClient.get<AppointmentItem[]>('/appointments', {
      params,
    });
    return response.data;
  },
};
