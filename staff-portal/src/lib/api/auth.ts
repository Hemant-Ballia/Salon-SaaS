import { apiClient } from "./client";
import { ApiResponse } from "@/types/api";
import { User } from "@/types/models";
import { LoginCredentials } from "@/types/auth";

export async function loginApi(credentials: LoginCredentials): Promise<{ user: User; accessToken: string }> {
  const response = await apiClient.post<ApiResponse<{ user: User; accessToken: string }>>("/auth/login", credentials);
  return response.data.data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function getMeApi(): Promise<{ user: User }> {
  const response = await apiClient.get<ApiResponse<{ user: User }>>("/auth/me");
  return response.data.data;
}

export async function changePasswordApi(data: { currentPassword: string; newPassword: string }): Promise<void> {
  await apiClient.post("/auth/change-password", data);
}