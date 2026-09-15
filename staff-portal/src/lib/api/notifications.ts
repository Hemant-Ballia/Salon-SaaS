import { apiClient } from "./client";
import { PaginatedResponse } from "@/types/api";
import { Notification } from "@/types/models";

export async function getNotificationsApi(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Notification>> {
  const response = await apiClient.get<PaginatedResponse<Notification>>("/notifications", { params });
  return response.data;
}

export async function markNotificationReadApi(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsReadApi(): Promise<void> {
  await apiClient.patch("/notifications/read-all");
}