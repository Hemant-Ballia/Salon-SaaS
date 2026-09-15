import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { Service } from "@/types/models";

export async function getServicesApi(params?: {
  page?: number;
  limit?: number;
  isActive?: string;
  search?: string;
}): Promise<PaginatedResponse<Service>> {
  const response = await apiClient.get<PaginatedResponse<Service>>("/services", { params });
  return response.data;
}

export async function getServiceByIdApi(id: string): Promise<Service> {
  const response = await apiClient.get<ApiResponse<{ service: Service }>>(`/services/${id}`);
  return response.data.data.service;
}

export async function createServiceApi(data: {
  name: string;
  price: number;
  durationMinutes: number;
  description?: string;
  category?: string;
  isActive?: boolean;
}): Promise<Service> {
  const response = await apiClient.post<ApiResponse<{ service: Service }>>("/services", data);
  return response.data.data.service;
}

export async function updateServiceApi(id: string, data: Partial<Service>): Promise<Service> {
  const response = await apiClient.patch<ApiResponse<{ service: Service }>>(`/services/${id}`, data);
  return response.data.data.service;
}

export async function deleteServiceApi(id: string): Promise<void> {
  await apiClient.delete(`/services/${id}`);
}

export async function updateServiceStatusApi(id: string, isActive: boolean): Promise<Service> {
  const response = await apiClient.patch<ApiResponse<{ service: Service }>>(`/services/${id}/status`, { isActive });
  return response.data.data.service;
}
