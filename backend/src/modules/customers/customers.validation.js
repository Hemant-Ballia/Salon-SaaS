/**
 * src/modules/customers/customers.validation.js
 */

import { z } from "zod";

export const updateCustomerSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, "Phone must be in E.164 format")
    .optional()
    .nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional().nullable(),
  profileImageUrl: z.string().url().optional().nullable(),
  preferences: z.record(z.unknown()).optional().nullable(),
}).strict();

export const listCustomersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().max(100).trim().optional(),
  businessId: z.string().uuid().optional(),
});

export const listCustomerAppointmentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const listCustomerPaymentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
