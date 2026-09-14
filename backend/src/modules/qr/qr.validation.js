/**
 * src/modules/qr/qr.validation.js
 */

import { z } from "zod";

export const generateBusinessQrSchema = z.object({
  businessId: z.string().uuid("Invalid businessId format").optional(), // ADMIN specifies, BUSINESS auto-resolved
});

export const generateServiceQrSchema = z.object({
  serviceId: z.string().uuid("Invalid serviceId format"),
});
