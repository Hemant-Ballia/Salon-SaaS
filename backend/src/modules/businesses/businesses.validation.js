/**
 * src/modules/businesses/businesses.validation.js
 */

import { z } from "zod";

const phoneField = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Phone must be in E.164 format (e.g. +919876543210)")
  .optional()
  .nullable();

const latField = z.coerce
  .number()
  .min(-90)
  .max(90)
  .optional()
  .nullable();

const lngField = z.coerce
  .number()
  .min(-180)
  .max(180)
  .optional()
  .nullable();

export const createBusinessSchema = z.object({
  name: z.string().min(2).max(150).trim(),
  businessType: z.enum(["SALON", "BEAUTY_PARLOUR", "BARBER", "CAR_WASH", "OTHER"]).default("OTHER"),
  description: z.string().max(1000).trim().optional().nullable(),
  email: z.string().email().toLowerCase().trim().optional().nullable(),
  phone: phoneField,
  address: z.string().max(300).trim().optional().nullable(),
  city: z.string().max(100).trim().optional().nullable(),
  state: z.string().max(100).trim().optional().nullable(),
  country: z.string().max(50).trim().optional().default("IN"),
  pincode: z.string().max(20).trim().optional().nullable(),
  latitude: latField,
  longitude: lngField,
});

export const updateBusinessSchema = z.object({
  name: z.string().min(2).max(150).trim().optional(),
  description: z.string().max(1000).trim().optional().nullable(),
  email: z.string().email().toLowerCase().trim().optional().nullable(),
  phone: phoneField,
  address: z.string().max(300).trim().optional().nullable(),
  city: z.string().max(100).trim().optional().nullable(),
  state: z.string().max(100).trim().optional().nullable(),
  country: z.string().max(50).trim().optional(),
  pincode: z.string().max(20).trim().optional().nullable(),
  latitude: latField,
  longitude: lngField,
  logoUrl: z.string().url().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
}).strict();

export const updateBusinessStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "ACTIVE", "INACTIVE"], {
    required_error: "Status is required",
  }),
  reason: z.string().max(500).trim().optional(),
});

export const listBusinessesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["name", "createdAt", "status", "city"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "ACTIVE", "INACTIVE"]).optional(),
  businessType: z.enum(["SALON", "BEAUTY_PARLOUR", "BARBER", "CAR_WASH", "OTHER"]).optional(),
  city: z.string().max(100).trim().optional(),
  search: z.string().max(100).trim().optional(),
});
