/**
 * src/modules/staff/staff.routes.js
 *
 * Mounted at: /api/v1/staff
 */

import { Router } from "express";
import * as ctrl from "./staff.controller.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { generalLimiter } from "../../middlewares/rateLimit.middleware.js";
import {
  createStaffSchema,
  updateStaffSchema,
  updateStaffStatusSchema,
  updateStaffScheduleSchema,
  listStaffSchema,
} from "./staff.validation.js";

const router = Router();

router.use(authenticate, generalLimiter);

// ── Collection ────────────────────────────────────────────────────────────────

router.route("/")
  .get(
    requireRole("ADMIN", "BUSINESS", "STAFF"),
    validateQuery(listStaffSchema),
    ctrl.listStaffController
  )
  .post(
    requireRole("ADMIN", "BUSINESS"),
    validate(createStaffSchema),
    ctrl.createStaffController
  );

// ── Single resource ───────────────────────────────────────────────────────────

router.route("/:id")
  .get(requireRole("ADMIN", "BUSINESS", "STAFF"), ctrl.getStaffController)
  .patch(
    requireRole("ADMIN", "BUSINESS", "STAFF"),
    validate(updateStaffSchema),
    ctrl.updateStaffController
  )
  .delete(requireRole("ADMIN", "BUSINESS"), ctrl.deleteStaffController);

// ── Sub-resources ─────────────────────────────────────────────────────────────

router.patch(
  "/:id/status",
  requireRole("ADMIN", "BUSINESS"),
  validate(updateStaffStatusSchema),
  ctrl.updateStaffStatusController
);

router.patch(
  "/:id/schedule",
  requireRole("ADMIN", "BUSINESS", "STAFF"),
  validate(updateStaffScheduleSchema),
  ctrl.updateStaffScheduleController
);

router.get(
  "/:id/appointments",
  requireRole("ADMIN", "BUSINESS", "STAFF"),
  ctrl.getStaffAppointmentsController
);

router.get(
  "/:id/queue",
  requireRole("ADMIN", "BUSINESS", "STAFF"),
  ctrl.getStaffQueueController
);

router.get(
  "/:id/performance",
  requireRole("ADMIN", "BUSINESS", "STAFF"),
  ctrl.getStaffPerformanceController
);

export default router;
