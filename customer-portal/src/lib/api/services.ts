import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { Service } from "@/types/models";

export async function getServicesApi(params?: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Service>> {
  const response = await apiClient.get<PaginatedResponse<Service>>("/services", { params });
  return response.data;
}

export async function getServiceByIdApi(id: string): Promise<Service> {
  const response = await apiClient.get<ApiResponse<{ service: Service }>>(`/services/${id}`);
  return response.data.data.service;
}