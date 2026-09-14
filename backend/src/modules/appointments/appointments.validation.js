/**
 * src/modules/appointments/appointments.validation.js
 */

import { z } from "zod";

// HH:MM time format
const timeField = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format");

// ISO date string that gets coerced to Date
const dateField = z.coerce.date();

export const createAppointmentSchema = z.object({
  businessId: z.string().uuid("businessId must be a valid UUID"),
  // customerId — NOT accepted from body for CUSTOMER role; resolved from JWT
  // ADMIN/BUSINESS/STAFF may provide it to book on behalf of a customer
  customerId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional().nullable(),
  appointmentDate: dateField,
  startTime: timeField,
  serviceIds: z.array(z.string().uuid()).min(1, "At least one service is required"),
  notes: z.string().max(1000).trim().optional().nullable(),
  // price, duration, endTime, totalAmount → ALL server-side, never from body
});

export const updateAppointmentSchema = z.object({
  notes: z.string().max(1000).trim().optional().nullable(),
  staffId: z.string().uuid().optional().nullable(),
}).strict();

export const cancelAppointmentSchema = z.object({
  cancelReason: z.string().min(5).max(500).trim().optional(),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentDate: dateField,
  startTime: timeField,
  staffId: z.string().uuid().optional().nullable(),
});

export const listAppointmentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["appointmentDate", "createdAt", "status", "totalAmount"]).default("appointmentDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "RESCHEDULED", "COMPLETED", "NO_SHOW"]).optional(),
  businessId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const availabilityQuerySchema = z.object({
  businessId: z.string().uuid("businessId is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  staffId: z.string().uuid().optional(),
  serviceIds: z.string().optional(), // comma-separated UUIDs
});
