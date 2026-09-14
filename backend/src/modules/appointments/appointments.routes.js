/**
 * src/modules/appointments/appointments.routes.js
 *
 * Mounted at: /api/v1/appointments
 *
 * IMPORTANT: /availability and /my are BEFORE /:id to prevent Express
 * from interpreting "availability" and "my" as UUID params.
 */

import { Router } from "express";
import * as ctrl from "./appointments.controller.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { generalLimiter, strictLimiter } from "../../middlewares/rateLimit.middleware.js";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
  listAppointmentsSchema,
  availabilityQuerySchema,
} from "./appointments.validation.js";

const router = Router();

router.use(authenticate, generalLimiter);

// ── Static routes FIRST (before /:id) ────────────────────────────────────────

// GET /appointments/availability — public slot checker (no specific role required)
router.get(
  "/availability",
  validateQuery(availabilityQuerySchema),
  ctrl.getAvailabilityController
);

// GET /appointments/my — customer's own appointments shortcut
router.get(
  "/my",
  requireRole("CUSTOMER"),
  validateQuery(listAppointmentsSchema),
  ctrl.getMyAppointmentsController
);

// ── Collection ────────────────────────────────────────────────────────────────

router.route("/")
  .get(validateQuery(listAppointmentsSchema), ctrl.listAppointmentsController)
  .post(
    strictLimiter,
    validate(createAppointmentSchema),
    ctrl.createAppointmentController
  );

// ── Single resource ───────────────────────────────────────────────────────────

router.route("/:id")
  .get(ctrl.getAppointmentController)
  .patch(validate(updateAppointmentSchema), ctrl.updateAppointmentController)
  .delete(ctrl.deleteAppointmentController);

// ── Status transitions ────────────────────────────────────────────────────────

// Confirm: ADMIN, BUSINESS, STAFF only
router.post(
  "/:id/confirm",
  requireRole("ADMIN", "BUSINESS", "STAFF"),
  ctrl.confirmAppointmentController
);

// Cancel: any authenticated user (ownership checked in service)
router.post(
  "/:id/cancel",
  validate(cancelAppointmentSchema),
  ctrl.cancelAppointmentController
);

// Reschedule: any authenticated user (service checks if CUSTOMER can reschedule)
router.post(
  "/:id/reschedule",
  validate(rescheduleAppointmentSchema),
  ctrl.rescheduleAppointmentController
);

// Complete: ADMIN, BUSINESS, STAFF only
router.post(
  "/:id/complete",
  requireRole("ADMIN", "BUSINESS", "STAFF"),
  ctrl.completeAppointmentController
);

// No-show: ADMIN, BUSINESS, STAFF only
router.post(
  "/:id/no-show",
  requireRole("ADMIN", "BUSINESS", "STAFF"),
  ctrl.noShowAppointmentController
);

export default router;
