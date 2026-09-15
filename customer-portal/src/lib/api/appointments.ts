import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { Appointment, TimeSlot } from "@/types/models";

export async function checkAvailabilityApi(params: {
  businessId: string;
  date: string;
  staffId?: string;
  serviceIds?: string;
}): Promise<{ date: string; slots: TimeSlot[] }> {
  const response = await apiClient.get<ApiResponse<{ date: string; slots: TimeSlot[] }>>(
    "/appointments/availability",
    { params }
  );
  return response.data.data;
}

export async function createAppointmentApi(data: {
  businessId: string;
  appointmentDate: string;
  startTime: string;
  serviceIds: string[];
  staffId?: string;
  notes?: string;
}): Promise<Appointment> {
  const response = await apiClient.post<ApiResponse<{ appointment: Appointment }>>("/appointments", data);
  return response.data.data.appointment;
}

export async function getMyAppointmentsApi(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Appointment>> {
  const response = await apiClient.get<PaginatedResponse<Appointment>>("/appointments/my", { params });
  return response.data;
}

export async function getAppointmentByIdApi(id: string): Promise<Appointment> {
  const response = await apiClient.get<ApiResponse<{ appointment: Appointment }>>(`/appointments/${id}`);
  return response.data.data.appointment;
}

export async function cancelAppointmentApi(id: string, reason?: string): Promise<Appointment> {
  const response = await apiClient.post<ApiResponse<{ appointment: Appointment }>>(`/appointments/${id}/cancel`, {
    cancelReason: reason,
  });
  return response.data.data.appointment;
}

export async function rescheduleAppointmentApi(
  id: string,
  data: { appointmentDate: string; startTime: string; staffId?: string }
): Promise<Appointment> {
  const response = await apiClient.post<ApiResponse<{ appointment: Appointment }>>(
    `/appointments/${id}/reschedule`,
    data
  );
  return response.data.data.appointment;
}