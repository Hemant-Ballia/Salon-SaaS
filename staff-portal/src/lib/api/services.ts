import { apiClient } from "./client";
import { PaginatedResponse } from "@/types/api";
import { Service } from "@/types/models";

export async function getServicesApi(): Promise<Service[]> {
  const response = await apiClient.get<PaginatedResponse<Service>>("/services");
  return response.data.data || [];
}