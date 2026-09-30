import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { Staff, StaffScheduleItem, Appointment, QueueEntry, StaffPerformanceStats } from "@/types/models";

export async function getStaffListApi(): Promise<Staff[]> {
  const response = await apiClient.get<PaginatedResponse<Staff>>("/staff");
  return response.data.data || [];
}

export async function getStaffByIdApi(id: string): Promise<Staff> {
  const response = await apiClient.get<ApiResponse<{ staff: Staff }>>(`/staff/${id}`);
  return response.data.data.staff;
}

export async function updateStaffScheduleApi(id: string, schedules: StaffScheduleItem[]): Promise<Staff> {
  const response = await apiClient.patch<ApiResponse<{ staff: Staff }>>(`/staff/${id}/schedule`, { schedules });
  return response.data.data.staff;
}

export async function getStaffAppointmentsApi(
  id: string,
  params?: { page?: number; limit?: number; status?: string; date?: string; search?: string }
): Promise<PaginatedResponse<Appointment>> {
  const response = await apiClient.get<PaginatedResponse<Appointment>>(`/staff/${id}/appointments`, { params });
  return response.data;
}

export async function getStaffQueueApi(id: string): Promise<QueueEntry[]> {
  const response = await apiClient.get<ApiResponse<{ queue: QueueEntry[] }>>(`/staff/${id}/queue`);
  return response.data.data.queue || [];
}

export async function getStaffPerformanceApi(id: string): Promise<StaffPerformanceStats> {
  const response = await apiClient.get<ApiResponse<any>>(`/staff/${id}/performance`);
  const raw = response.data.data || {};
  const perf = raw.performance || raw;
  return {
    totalAppointments: perf.totalAppointments ?? perf.total ?? 0,
    completedAppointments: perf.completedAppointments ?? perf.completed ?? 0,
    cancelledAppointments: perf.cancelledAppointments ?? perf.cancelled ?? 0,
    noShowAppointments: perf.noShowAppointments ?? perf.noShow ?? 0,
    totalRevenue: Number(perf.totalRevenue ?? perf.revenue?._sum?.amount ?? 0),
  };
}