/**
 * src/modules/queues/queues.validation.js
 */

import { z } from "zod";

export const joinQueueSchema = z.object({
  businessId: z.string().uuid("businessId is required"),
  appointmentId: z.string().uuid().optional().nullable(),
});

export const updateQueueEntrySchema = z.object({
  estimatedWaitMinutes: z.coerce.number().int().min(0).max(300).optional(),
}).strict();

export const listQueueSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  businessId: z.string().uuid().optional(),
  status: z
    .enum(["WAITING", "CALLED", "SERVING", "COMPLETED", "SKIPPED", "CANCELLED"])
    .optional(),
});
