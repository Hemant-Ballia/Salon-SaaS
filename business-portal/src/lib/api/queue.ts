import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { QueueEntry } from "@/types/models";

export async function getLiveQueueApi(businessId?: string): Promise<QueueEntry[]> {
  const response = await apiClient.get<ApiResponse<{ queueEntries: QueueEntry[] }>>("/queues/live", {
    params: businessId ? { businessId } : undefined,
  });
  return response.data.data?.queueEntries || [];
}

export async function getQueueListApi(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<PaginatedResponse<QueueEntry>> {
  const response = await apiClient.get<PaginatedResponse<QueueEntry>>("/queues", { params });
  return response.data;
}

export async function callQueueEntryApi(id: string): Promise<QueueEntry> {
  const response = await apiClient.post<ApiResponse<{ queueEntry: QueueEntry }>>(`/queues/${id}/call`);
  return response.data.data.queueEntry;
}

export async function serveQueueEntryApi(id: string): Promise<QueueEntry> {
  const response = await apiClient.post<ApiResponse<{ queueEntry: QueueEntry }>>(`/queues/${id}/serve`);
  return response.data.data.queueEntry;
}

export async function completeQueueEntryApi(id: string): Promise<QueueEntry> {
  const response = await apiClient.post<ApiResponse<{ queueEntry: QueueEntry }>>(`/queues/${id}/complete`);
  return response.data.data.queueEntry;
}

export async function skipQueueEntryApi(id: string): Promise<QueueEntry> {
  const response = await apiClient.post<ApiResponse<{ queueEntry: QueueEntry }>>(`/queues/${id}/skip`);
  return response.data.data.queueEntry;
}
