/**
 * src/modules/subscriptions/subscriptions.validation.js
 */

import { z } from "zod";

export const createSubscriptionSchema = z.object({
  businessId: z.string().uuid().optional(), // ADMIN can specify; BUSINESS auto-resolved
  plan: z.enum(["FREE", "BASIC", "PRO", "PREMIUM"]),
});

export const updateSubscriptionSchema = z.object({
  plan: z.enum(["FREE", "BASIC", "PRO", "PREMIUM"]).optional(),
  status: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"]).optional(),
  endDate: z.coerce.date().optional().nullable(),
  renewalDate: z.coerce.date().optional().nullable(),
}).strict();

export const listSubscriptionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"]).optional(),
  plan: z.enum(["FREE", "BASIC", "PRO", "PREMIUM"]).optional(),
  businessId: z.string().uuid().optional(),
});
