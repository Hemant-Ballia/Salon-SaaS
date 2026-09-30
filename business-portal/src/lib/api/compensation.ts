/**
 * business-portal/src/lib/api/compensation.ts
 *
 * Client API methods for Staff Compensation, Commission Rules,
 * Incentives, Staff-Specific Service Pricing, and Payroll Summaries.
 */

import { apiClient } from "./client";
import { ApiResponse } from "@/types/api";
import {
  StaffCompensation,
  CommissionRule,
  IncentiveRule,
  StaffServicePrice,
  StaffEarningsSummary,
  BusinessPayrollSummary,
} from "@/types/models";

// ── Staff Compensation ────────────────────────────────────────────────────────

export async function getStaffCompensationApi(
  businessId: string,
  staffId: string
): Promise<{
  staffId: string;
  displayName: string;
  compensation: StaffCompensation | null;
  commissionRules: CommissionRule[];
  staffPrices: StaffServicePrice[];
  activeIncentives: IncentiveRule[];
}> {
  const response = await apiClient.get<
    ApiResponse<{
      staffId: string;
      displayName: string;
      compensation: StaffCompensation | null;
      commissionRules: CommissionRule[];
      staffPrices: StaffServicePrice[];
      activeIncentives: IncentiveRule[];
    }>
  >(`/businesses/${businessId}/staff/${staffId}/compensation`);
  return response.data.data;
}

export async function setStaffCompensationApi(
  businessId: string,
  staffId: string,
  data: {
    compensationType: string;
    monthlySalary?: number | null;
    payFrequency?: string;
    commission?: {
      type: "PERCENTAGE" | "FIXED";
      percentage?: number | null;
      fixedAmount?: number | null;
      calculationBasis: string;
      serviceIds?: string[];
      isActive?: boolean;
    };
    effectiveFrom?: string;
    effectiveTo?: string | null;
    isActive?: boolean;
  }
): Promise<{ compensation: StaffCompensation; commissionRule?: CommissionRule | null }> {
  const response = await apiClient.post<
    ApiResponse<{ compensation: StaffCompensation; commissionRule?: CommissionRule | null }>
  >(`/businesses/${businessId}/staff/${staffId}/compensation`, data);
  return response.data.data;
}

export async function getStaffEarningsApi(
  businessId: string,
  staffId: string,
  params?: { startDate?: string; endDate?: string }
): Promise<StaffEarningsSummary> {
  const response = await apiClient.get<ApiResponse<StaffEarningsSummary>>(
    `/businesses/${businessId}/staff/${staffId}/earnings`,
    { params }
  );
  return response.data.data;
}

// ── Commission Rules ──────────────────────────────────────────────────────────

export async function listCommissionRulesApi(
  businessId: string,
  params?: { staffId?: string; isActive?: boolean }
): Promise<CommissionRule[]> {
  const response = await apiClient.get<ApiResponse<{ rules: CommissionRule[] }>>(
    `/businesses/${businessId}/commission-rules`,
    { params }
  );
  return response.data.data.rules || [];
}

export async function createCommissionRuleApi(
  businessId: string,
  data: Partial<CommissionRule> & { serviceIds?: string[] }
): Promise<CommissionRule> {
  const response = await apiClient.post<ApiResponse<CommissionRule>>(
    `/businesses/${businessId}/commission-rules`,
    data
  );
  return response.data.data;
}

// ── Incentives ────────────────────────────────────────────────────────────────

export async function listIncentiveRulesApi(
  businessId: string,
  params?: { staffId?: string; isActive?: boolean }
): Promise<IncentiveRule[]> {
  const response = await apiClient.get<ApiResponse<{ incentives: IncentiveRule[] }>>(
    `/businesses/${businessId}/incentives`,
    { params }
  );
  return response.data.data.incentives || [];
}

export async function createIncentiveRuleApi(
  businessId: string,
  data: {
    staffId?: string | null;
    name: string;
    metric: string;
    target: number;
    rewardType?: string;
    rewardAmount: number;
    period?: string;
    startDate: string;
    endDate?: string | null;
    serviceId?: string | null;
    isActive?: boolean;
  }
): Promise<IncentiveRule> {
  const response = await apiClient.post<ApiResponse<IncentiveRule>>(
    `/businesses/${businessId}/incentives`,
    data
  );
  return response.data.data;
}

export async function updateIncentiveRuleApi(
  businessId: string,
  id: string,
  data: Partial<IncentiveRule>
): Promise<IncentiveRule> {
  const response = await apiClient.put<ApiResponse<IncentiveRule>>(
    `/businesses/${businessId}/incentives/${id}`,
    data
  );
  return response.data.data;
}

export async function deleteIncentiveRuleApi(
  businessId: string,
  id: string
): Promise<void> {
  await apiClient.delete(`/businesses/${businessId}/incentives/${id}`);
}

// ── Staff-Specific Service Pricing ───────────────────────────────────────────

export async function listStaffServicePricesApi(
  businessId: string,
  serviceId: string
): Promise<{
  service: { id: string; name: string; price: number | string; durationMinutes: number };
  basePrice: string;
  overrides: StaffServicePrice[];
}> {
  const response = await apiClient.get<
    ApiResponse<{
      service: { id: string; name: string; price: number | string; durationMinutes: number };
      basePrice: string;
      overrides: StaffServicePrice[];
    }>
  >(`/businesses/${businessId}/services/${serviceId}/staff-prices`);
  return response.data.data;
}

export async function setStaffServicePriceApi(
  businessId: string,
  serviceId: string,
  staffId: string,
  data: { price: number; isActive?: boolean; effectiveFrom?: string; effectiveTo?: string | null }
): Promise<StaffServicePrice> {
  const response = await apiClient.post<ApiResponse<StaffServicePrice>>(
    `/businesses/${businessId}/services/${serviceId}/staff-prices/${staffId}`,
    data
  );
  return response.data.data;
}

export async function deleteStaffServicePriceApi(
  businessId: string,
  serviceId: string,
  staffId: string
): Promise<void> {
  await apiClient.delete(`/businesses/${businessId}/services/${serviceId}/staff-prices/${staffId}`);
}

// ── Business Payroll Summary ──────────────────────────────────────────────────

export async function getBusinessPayrollSummaryApi(
  businessId: string
): Promise<BusinessPayrollSummary> {
  const response = await apiClient.get<ApiResponse<BusinessPayrollSummary>>(
    `/businesses/${businessId}/payroll/summary`
  );
  return response.data.data;
}
