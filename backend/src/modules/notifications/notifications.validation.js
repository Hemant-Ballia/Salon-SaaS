/**
 * src/modules/notifications/notifications.validation.js
 */

import { z } from "zod";

export const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  whatsappEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  appointmentAlerts: z.boolean().optional(),
  queueAlerts: z.boolean().optional(),
  paymentAlerts: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isRead: z.enum(["true", "false"]).transform(v => v === "true").optional(),
});
