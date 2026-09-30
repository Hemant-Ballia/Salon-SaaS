import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { Business, Service } from "@/types/models";

export async function getBusinessesApi(params?: {
  search?: string;
  category?: string;
  city?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Business>> {
  const response = await apiClient.get<PaginatedResponse<Business>>("/businesses", { params });
  return response.data;
}

export async function getBusinessByIdApi(id: string): Promise<Business> {
  const response = await apiClient.get<ApiResponse<{ business: Business }>>(`/businesses/${id}`);
  return response.data.data.business;
}

export async function getBusinessServicesApi(businessId: string): Promise<Service[]> {
  const response = await apiClient.get<PaginatedResponse<Service>>("/services", {
    params: { businessId, limit: 100 },
  });
  return response.data.data || [];
}

export interface ResolvedQrData {
  token: string;
  type: string;
  businessId: string;
  serviceId?: string | null;
  targetUrl: string;
  scanCount: number;
  business: Business & {
    services?: Service[];
  };
}

export async function resolveQrTokenApi(token: string): Promise<ResolvedQrData> {
  const response = await apiClient.get<ApiResponse<ResolvedQrData>>(`/qr/resolve/${token}`);
  return response.data.data;
}