/**
 * src/modules/businesses/businesses.routes.js
 *
 * Mounted at: /api/v1/businesses
 */

import { Router } from "express";
import * as ctrl from "./businesses.controller.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole, requireAdmin } from "../../middlewares/role.middleware.js";
import { generalLimiter, strictLimiter } from "../../middlewares/rateLimit.middleware.js";
import {
  createBusinessSchema,
  updateBusinessSchema,
  updateBusinessStatusSchema,
  listBusinessesSchema,
} from "./businesses.validation.js";

const router = Router();

// All business routes require authentication
router.use(authenticate);
router.use(generalLimiter);

// ── Collection ────────────────────────────────────────────────────────────────

router.route("/")
  .get(validateQuery(listBusinessesSchema), ctrl.listBusinessesController)
  .post(
    requireRole("ADMIN", "BUSINESS"),
    validate(createBusinessSchema),
    ctrl.createBusinessController
  );

// ── Single resource ───────────────────────────────────────────────────────────

router.route("/:id")
  .get(ctrl.getBusinessController)
  .patch(
    requireRole("ADMIN", "BUSINESS"),
    validate(updateBusinessSchema),
    ctrl.updateBusinessController
  )
  .delete(
    requireRole("ADMIN", "BUSINESS"),
    ctrl.deleteBusinessController
  );

// ── Status (ADMIN only) ───────────────────────────────────────────────────────

router.patch(
  "/:id/status",
  strictLimiter,
  requireAdmin,
  validate(updateBusinessStatusSchema),
  ctrl.updateBusinessStatusController
);

// ── Dashboard ─────────────────────────────────────────────────────────────────

router.get(
  "/:id/dashboard",
  requireRole("ADMIN", "BUSINESS", "STAFF"),
  ctrl.getBusinessDashboardController
);

export default router;
