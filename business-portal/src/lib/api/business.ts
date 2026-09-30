import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { Business, BusinessDashboardData } from "@/types/models";

export async function getMyBusinessApi(): Promise<Business | null> {
  const response = await apiClient.get<PaginatedResponse<Business>>("/businesses");
  return response.data.data?.[0] || null;
}

export async function getBusinessByIdApi(id: string): Promise<Business> {
  const response = await apiClient.get<ApiResponse<{ business: Business }>>(`/businesses/${id}`);
  return response.data.data.business;
}

export async function updateBusinessApi(id: string, data: Partial<Business>): Promise<Business> {
  const response = await apiClient.patch<ApiResponse<{ business: Business }>>(`/businesses/${id}`, data);
  return response.data.data.business;
}

export async function getBusinessDashboardApi(
  businessId: string,
  period: "7D" | "30D" | "3M" = "7D"
): Promise<BusinessDashboardData> {
  const response = await apiClient.get<ApiResponse<{
    dashboard: BusinessDashboardData;
  }>>(`/businesses/${businessId}/dashboard`, {
    params: { period },
  });
  return response.data.data.dashboard;
}

export async function getBusinessQrApi(businessId: string): Promise<any> {
  const response = await apiClient.get<ApiResponse<{ qrCode: any }>>(`/businesses/${businessId}/qr`);
  return response.data.data.qrCode;
}

export async function regenerateBusinessQrApi(businessId: string): Promise<any> {
  const response = await apiClient.post<ApiResponse<{ qrCode: any }>>(`/businesses/${businessId}/qr/regenerate`);
  return response.data.data.qrCode;
}

export async function resolveQrTokenApi(token: string): Promise<any> {
  const response = await apiClient.get<ApiResponse<any>>(`/qr/resolve/${token}`);
  return response.data.data;
}


