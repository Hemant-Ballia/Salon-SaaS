/**
 * staff-portal/src/lib/api/earnings.ts
 *
 * Staff Portal API methods to fetch own compensation and ledger history.
 */

import { apiClient } from "./client";
import { ApiResponse } from "@/types/api";
import { StaffEarningsSummary } from "@/types/models";

export async function getMyEarningsApi(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<StaffEarningsSummary> {
  const response = await apiClient.get<ApiResponse<StaffEarningsSummary>>("/staff/me/earnings", {
    params,
  });
  return response.data.data;
}
