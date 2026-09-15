import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { Payment } from "@/types/models";

export async function getPaymentsApi(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<PaginatedResponse<Payment>> {
  const response = await apiClient.get<PaginatedResponse<Payment>>("/payments", { params });
  return response.data;
}

export async function getPaymentByIdApi(id: string): Promise<Payment> {
  const response = await apiClient.get<ApiResponse<{ payment: Payment }>>(`/payments/${id}`);
  return response.data.data.payment;
}
