/**
 * src/modules/staff/staff.validation.js
 */

import { z } from "zod";

const dayOfWeek = z.enum([
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"
]);

const timeField = z.string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format (e.g. 09:00)");

export const createStaffSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
  displayName: z.string().min(2).max(100).trim(),
  designation: z.string().max(100).trim().optional().nullable(),
  bio: z.string().max(1000).trim().optional().nullable(),
  profileImageUrl: z.string().url().optional().nullable(),
  joiningDate: z.coerce.date().optional().nullable(),
  // businessId is NEVER accepted from body — resolved from JWT+DB in service
});

export const updateStaffSchema = z.object({
  displayName: z.string().min(2).max(100).trim().optional(),
  designation: z.string().max(100).trim().optional().nullable(),
  bio: z.string().max(1000).trim().optional().nullable(),
  profileImageUrl: z.string().url().optional().nullable(),
  joiningDate: z.coerce.date().optional().nullable(),
}).strict();

export const updateStaffStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"], {
    required_error: "Status is required",
  }),
});

export const updateStaffScheduleSchema = z.object({
  schedules: z.array(
    z.object({
      dayOfWeek,
      startTime: timeField,
      endTime: timeField,
      isAvailable: z.boolean().default(true),
    })
  )
  .min(1, "At least one schedule entry is required")
  .max(7, "Maximum 7 schedule entries (one per day)"),
}).refine(
  (d) => new Set(d.schedules.map((s) => s.dayOfWeek)).size === d.schedules.length,
  { message: "Duplicate days in schedule are not allowed", path: ["schedules"] }
);

export const listStaffSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["displayName", "createdAt", "joiningDate", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
  search: z.string().max(100).trim().optional(),
});
