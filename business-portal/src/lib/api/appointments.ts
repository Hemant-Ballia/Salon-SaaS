import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { Appointment } from "@/types/models";

export async function getAppointmentsApi(params?: {
  page?: number;
  limit?: number;
  status?: string;
  appointmentDate?: string;
}): Promise<PaginatedResponse<Appointment>> {
  const response = await apiClient.get<PaginatedResponse<Appointment>>("/appointments", { params });
  return response.data;
}

export async function getAppointmentByIdApi(id: string): Promise<Appointment> {
  const response = await apiClient.get<ApiResponse<{ appointment: Appointment }>>(`/appointments/${id}`);
  return response.data.data.appointment;
}

export async function confirmAppointmentApi(id: string): Promise<Appointment> {
  const response = await apiClient.post<ApiResponse<{ appointment: Appointment }>>(`/appointments/${id}/confirm`);
  return response.data.data.appointment;
}

export async function cancelAppointmentApi(id: string, reason?: string): Promise<Appointment> {
  const response = await apiClient.post<ApiResponse<{ appointment: Appointment }>>(`/appointments/${id}/cancel`, { reason });
  return response.data.data.appointment;
}

export async function rescheduleAppointmentApi(id: string, data: { appointmentDate: string; startTime: string }): Promise<Appointment> {
  const response = await apiClient.post<ApiResponse<{ appointment: Appointment }>>(`/appointments/${id}/reschedule`, data);
  return response.data.data.appointment;
}

export async function completeAppointmentApi(id: string): Promise<Appointment> {
  const response = await apiClient.post<ApiResponse<{ appointment: Appointment }>>(`/appointments/${id}/complete`);
  return response.data.data.appointment;
}

export async function noShowAppointmentApi(id: string): Promise<Appointment> {
  const response = await apiClient.post<ApiResponse<{ appointment: Appointment }>>(`/appointments/${id}/no-show`);
  return response.data.data.appointment;
}
