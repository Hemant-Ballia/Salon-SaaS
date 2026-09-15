import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { Customer } from "@/types/models";

export async function getCustomersApi(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Customer>> {
  const response = await apiClient.get<PaginatedResponse<Customer>>("/customers", { params });
  return response.data;
}

export async function getCustomerByIdApi(id: string): Promise<Customer> {
  const response = await apiClient.get<ApiResponse<{ customer: Customer }>>(`/customers/${id}`);
  return response.data.data.customer;
}
