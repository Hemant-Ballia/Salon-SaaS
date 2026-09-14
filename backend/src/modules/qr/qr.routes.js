/**
 * src/modules/qr/qr.routes.js
 *
 * Mounted at: /api/v1/qr
 */

import { Router } from "express";
import * as ctrl from "./qr.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { generalLimiter } from "../../middlewares/rateLimit.middleware.js";
import { generateBusinessQrSchema, generateServiceQrSchema } from "./qr.validation.js";

const router = Router();

// Public route for scanning
router.get("/:id/scan", generalLimiter, ctrl.scanQrCode);

// Authenticated routes
router.use(authenticate, generalLimiter);

router.post(
  "/business",
  requireRole("ADMIN", "BUSINESS"),
  validate(generateBusinessQrSchema),
  ctrl.generateBusinessQr
);

router.post(
  "/service",
  requireRole("ADMIN", "BUSINESS"),
  validate(generateServiceQrSchema),
  ctrl.generateServiceQr
);

router.get("/:id", requireRole("ADMIN", "BUSINESS"), ctrl.getQrCode);
router.delete("/:id", requireRole("ADMIN", "BUSINESS"), ctrl.deleteQrCode);

export default router;
