/**
 * src/modules/payments/payments.validation.js
 */

import { z } from "zod";

export const createOrderSchema = z.object({
  appointmentId: z.string().uuid("appointmentId must be a valid UUID"),
  // amount is NEVER from body — computed server-side from appointment.totalAmount
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, "razorpayOrderId is required"),
  razorpayPaymentId: z.string().min(1, "razorpayPaymentId is required"),
  razorpaySignature: z.string().min(1, "razorpaySignature is required"),
});

export const refundPaymentSchema = z.object({
  amount: z.coerce.number().min(0.01).optional(), // partial refund; null = full refund
  reason: z.string().max(500).trim().optional(),
});

export const listPaymentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "amount", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  status: z.enum(["CREATED", "PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]).optional(),
  businessId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
});
