/**
 * src/modules/services/services.validation.js
 */

import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(2).max(150).trim(),
  description: z.string().max(1000).trim().optional().nullable(),
  durationMinutes: z.coerce.number().int().min(5).max(480, "Max duration is 8 hours"),
  price: z.coerce.number().min(0).max(999999.99),
  category: z.string().max(100).trim().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
  // businessId NEVER from body — resolved from authenticated context
});

export const updateServiceSchema = z.object({
  name: z.string().min(2).max(150).trim().optional(),
  description: z.string().max(1000).trim().optional().nullable(),
  durationMinutes: z.coerce.number().int().min(5).max(480).optional(),
  price: z.coerce.number().min(0).max(999999.99).optional(),
  category: z.string().max(100).trim().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
}).strict();

export const updateServiceStatusSchema = z.object({
  isActive: z.boolean({ required_error: "isActive (boolean) is required" }),
});

export const listServicesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["name", "createdAt", "price", "durationMinutes"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  category: z.string().max(100).trim().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  search: z.string().max(100).trim().optional(),
  businessId: z.string().uuid().optional(), // ADMIN or public customers filtering
});
