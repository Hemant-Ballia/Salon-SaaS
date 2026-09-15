import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { Business, BusinessDashboardStats, Appointment } from "@/types/models";

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

export async function getBusinessDashboardApi(businessId: string): Promise<{
  stats: BusinessDashboardStats;
  recentAppointments: Appointment[];
}> {
  const response = await apiClient.get<ApiResponse<{
    dashboard: {
      stats: BusinessDashboardStats;
      recentAppointments: Appointment[];
    };
  }>>(`/businesses/${businessId}/dashboard`);
  return response.data.data.dashboard;
}
