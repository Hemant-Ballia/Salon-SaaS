import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { Payment } from "@/types/models";

export async function createPaymentOrderApi(appointmentId: string): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
}> {
  const response = await apiClient.post<ApiResponse<{ orderId: string; amount: number; currency: string; keyId?: string }>>(
    "/payments/create-order",
    { appointmentId }
  );
  return response.data.data;
}

export async function verifyPaymentApi(data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<Payment> {
  const response = await apiClient.post<ApiResponse<{ payment: Payment }>>("/payments/verify", data);
  return response.data.data.payment;
}

export async function getPaymentHistoryApi(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Payment>> {
  const response = await apiClient.get<PaginatedResponse<Payment>>("/payments/history", { params });
  return response.data;
}