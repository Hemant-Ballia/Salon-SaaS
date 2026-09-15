import { apiClient } from "./client";
import { ApiResponse } from "@/types/api";
import { QrCode } from "@/types/models";

export async function generateBusinessQrApi(): Promise<QrCode> {
  const response = await apiClient.post<ApiResponse<{ qrCode: QrCode }>>("/qr/business");
  return response.data.data.qrCode;
}

export async function generateServiceQrApi(serviceId: string): Promise<QrCode> {
  const response = await apiClient.post<ApiResponse<{ qrCode: QrCode }>>("/qr/service", { serviceId });
  return response.data.data.qrCode;
}

export async function getQrCodeApi(id: string): Promise<QrCode> {
  const response = await apiClient.get<ApiResponse<{ qrCode: QrCode }>>(`/qr/${id}`);
  return response.data.data.qrCode;
}
