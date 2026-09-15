import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { Staff, StaffScheduleItem, StaffStatus } from "@/types/models";

export async function getStaffListApi(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<PaginatedResponse<Staff>> {
  const response = await apiClient.get<PaginatedResponse<Staff>>("/staff", { params });
  return response.data;
}

export async function getStaffByIdApi(id: string): Promise<Staff> {
  const response = await apiClient.get<ApiResponse<{ staff: Staff }>>(`/staff/${id}`);
  return response.data.data.staff;
}

export async function createStaffApi(data: {
  displayName: string;
  email: string;
  password?: string;
  designation?: string;
}): Promise<Staff> {
  const response = await apiClient.post<ApiResponse<{ staff: Staff }>>("/staff", data);
  return response.data.data.staff;
}

export async function updateStaffApi(id: string, data: Partial<Staff>): Promise<Staff> {
  const response = await apiClient.patch<ApiResponse<{ staff: Staff }>>(`/staff/${id}`, data);
  return response.data.data.staff;
}

export async function deleteStaffApi(id: string): Promise<void> {
  await apiClient.delete(`/staff/${id}`);
}

export async function updateStaffStatusApi(id: string, status: StaffStatus): Promise<Staff> {
  const response = await apiClient.patch<ApiResponse<{ staff: Staff }>>(`/staff/${id}/status`, { status });
  return response.data.data.staff;
}

export async function getStaffScheduleApi(id: string): Promise<StaffScheduleItem[]> {
  const response = await apiClient.get<ApiResponse<{ schedules: StaffScheduleItem[] }>>(`/staff/${id}/schedule`);
  return response.data.data.schedules || [];
}

export async function updateStaffScheduleApi(id: string, schedules: StaffScheduleItem[]): Promise<StaffScheduleItem[]> {
  const response = await apiClient.put<ApiResponse<{ schedules: StaffScheduleItem[] }>>(`/staff/${id}/schedule`, { schedules });
  return response.data.data.schedules || [];
}

export async function getStaffPerformanceApi(id: string): Promise<Record<string, unknown>> {
  const response = await apiClient.get<ApiResponse<Record<string, unknown>>>(`/staff/${id}/performance`);
  return response.data.data;
}
