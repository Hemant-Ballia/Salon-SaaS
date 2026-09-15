import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
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

export async function getNotificationPreferencesApi(): Promise<{
  preferences: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    inAppEnabled: boolean;
  };
}> {
  const response = await apiClient.get<ApiResponse<{
    preferences: {
      emailEnabled: boolean;
      smsEnabled: boolean;
      whatsappEnabled: boolean;
      inAppEnabled: boolean;
    };
  }>>("/notifications/preferences");
  return response.data.data;
}

export async function updateNotificationPreferencesApi(data: {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  whatsappEnabled?: boolean;
  inAppEnabled?: boolean;
}): Promise<void> {
  await apiClient.patch("/notifications/preferences", data);
}