import { apiClient } from "./client";
import { ApiResponse } from "@/types/api";
import { Subscription, SubscriptionPlan } from "@/types/models";

export async function getMySubscriptionApi(): Promise<Subscription | null> {
  const response = await apiClient.get<ApiResponse<{ subscription: Subscription }>>("/subscriptions");
  return response.data.data?.subscription || null;
}

export async function createSubscriptionApi(plan: SubscriptionPlan): Promise<Subscription> {
  const response = await apiClient.post<ApiResponse<{ subscription: Subscription }>>("/subscriptions", { plan });
  return response.data.data.subscription;
}

export async function cancelSubscriptionApi(): Promise<void> {
  await apiClient.post("/subscriptions/cancel");
}
