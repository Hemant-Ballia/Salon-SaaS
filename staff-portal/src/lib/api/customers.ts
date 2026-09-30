import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { Customer, Appointment } from "@/types/models";

export async function getCustomersListApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<PaginatedResponse<Customer>> {
  const response = await apiClient.get<PaginatedResponse<Customer>>("/customers", { params });
  return response.data;
}

export async function getCustomerByIdApi(id: string): Promise<Customer> {
  const response = await apiClient.get<ApiResponse<{ customer: Customer }>>(`/customers/${id}`);
  return response.data.data.customer;
}

export async function getCustomerAppointmentsApi(
  id: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    sortOrder?: "asc" | "desc";
  }
): Promise<PaginatedResponse<Appointment>> {
  const response = await apiClient.get<PaginatedResponse<Appointment>>(`/customers/${id}/appointments`, { params });
  return response.data;
}
