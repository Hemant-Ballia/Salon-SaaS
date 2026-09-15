import { apiClient } from "./client";
import { ApiResponse } from "@/types/api";
import { AuthData, LoginCredentials, RegisterBusinessInput } from "@/types/auth";
import { User } from "@/types/models";

export async function loginApi(credentials: LoginCredentials): Promise<AuthData> {
  const response = await apiClient.post<ApiResponse<AuthData>>("/auth/login", credentials);
  return response.data.data;
}

export async function registerBusinessApi(input: RegisterBusinessInput): Promise<AuthData> {
  const response = await apiClient.post<ApiResponse<AuthData>>("/auth/register/business", input);
  return response.data.data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post<ApiResponse<null>>("/auth/logout");
}

export async function getMeApi(): Promise<User> {
  const response = await apiClient.get<ApiResponse<{ user: User }>>("/auth/me");
  return response.data.data.user;
}
