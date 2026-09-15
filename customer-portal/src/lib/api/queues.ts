import { apiClient } from "./client";
import { ApiResponse } from "@/types/api";
import { QueueEntry } from "@/types/models";

export interface JoinQueueResponse {
  entry: QueueEntry;
  queueName?: string;
  businessName?: string;
}

export interface QueueEntryDetailResponse {
  entry: QueueEntry;
  position: number;
}

export interface LiveQueueResponse {
  business: string;
  businessId: string;
  queueName: string | null;
  entries: Array<{
    id: string;
    tokenNumber: number;
    status: string;
    estimatedWaitMinutes: number;
    joinedAt: string;
    calledAt?: string;
  }>;
  stats: {
    total: number;
    waiting: number;
    serving: number;
    called: number;
  };
}

export async function joinQueueApi(data: { businessId: string; appointmentId?: string }): Promise<JoinQueueResponse> {
  const response = await apiClient.post<ApiResponse<JoinQueueResponse>>("/queues/join", data);
  return response.data.data;
}

export async function getQueueEntryByIdApi(id: string): Promise<QueueEntryDetailResponse> {
  const response = await apiClient.get<ApiResponse<QueueEntryDetailResponse>>(`/queues/${id}`);
  return response.data.data;
}

export async function leaveQueueApi(id: string): Promise<void> {
  await apiClient.delete(`/queues/${id}`);
}

export async function getLiveQueueApi(businessId: string): Promise<LiveQueueResponse> {
  const response = await apiClient.get<ApiResponse<LiveQueueResponse>>("/queues/live", {
    params: { businessId },
  });
  return response.data.data;
}