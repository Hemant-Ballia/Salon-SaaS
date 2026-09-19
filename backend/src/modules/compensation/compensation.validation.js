/**
 * src/modules/compensation/compensation.validation.js
 *
 * Zod validation schemas for staff compensation, commission rules,
 * incentive rules, and staff-specific service pricing.
 */

import { z } from "zod";

const compensationTypeEnum = z.enum([
  "SALARY",
  "COMMISSION",
  "SALARY_COMMISSION",
  "SALARY_INCENTIVE",
  "SALARY_COMMISSION_INCENTIVE",
  "COMMISSION_INCENTIVE",
  "INCENTIVE",
]);

const commissionTypeEnum = z.enum(["PERCENTAGE", "FIXED"]);

const commissionBasisEnum = z.enum([
  "COMPLETED",
  "PAID",
  "COMPLETED_AND_PAID",
  "SERVICE_SUBTOTAL",
  "NET_AFTER_DISCOUNT",
]);

const incentiveMetricEnum = z.enum([
  "APPOINTMENT_COUNT",
  "TOTAL_REVENUE",
  "SERVICE_COUNT",
]);

const incentivePeriodEnum = z.enum(["WEEKLY", "MONTHLY", "CUSTOM"]);

export const setStaffCompensationSchema = z.object({
  compensationType: compensationTypeEnum,
  monthlySalary: z.number().min(0).nullable().optional(),
  payFrequency: z.enum(["MONTHLY", "BI_WEEKLY", "WEEKLY"]).default("MONTHLY").optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().nullable().optional(),
  isActive: z.boolean().default(true).optional(),

  // Optional embedded commission configuration
  commission: z
    .object({
      type: commissionTypeEnum,
      percentage: z.number().min(0).max(100).nullable().optional(),
      fixedAmount: z.number().min(0).nullable().optional(),
      calculationBasis: commissionBasisEnum.default("COMPLETED_AND_PAID").optional(),
      serviceIds: z.array(z.string().uuid()).default([]).optional(),
      isActive: z.boolean().default(true).optional(),
    })
    .optional(),
});

export const createCommissionRuleSchema = z.object({
  staffId: z.string().uuid().nullable().optional(),
  type: commissionTypeEnum,
  percentage: z.number().min(0).max(100).nullable().optional(),
  fixedAmount: z.number().min(0).nullable().optional(),
  calculationBasis: commissionBasisEnum.default("COMPLETED_AND_PAID").optional(),
  serviceIds: z.array(z.string().uuid()).default([]).optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().nullable().optional(),
  isActive: z.boolean().default(true).optional(),
});

export const updateCommissionRuleSchema = z.object({
  type: commissionTypeEnum.optional(),
  percentage: z.number().min(0).max(100).nullable().optional(),
  fixedAmount: z.number().min(0).nullable().optional(),
  calculationBasis: commissionBasisEnum.optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createIncentiveRuleSchema = z.object({
  staffId: z.string().uuid().nullable().optional(),
  name: z.string().min(2).max(100).trim(),
  metric: incentiveMetricEnum,
  target: z.number().positive(),
  rewardType: z.string().default("FIXED_BONUS").optional(),
  rewardAmount: z.number().positive(),
  period: incentivePeriodEnum.default("MONTHLY").optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  serviceId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true).optional(),
});

export const updateIncentiveRuleSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  metric: incentiveMetricEnum.optional(),
  target: z.number().positive().optional(),
  rewardType: z.string().optional(),
  rewardAmount: z.number().positive().optional(),
  period: incentivePeriodEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  serviceId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const setStaffServicePriceSchema = z.object({
  price: z.number().min(0),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().nullable().optional(),
  isActive: z.boolean().default(true).optional(),
});
