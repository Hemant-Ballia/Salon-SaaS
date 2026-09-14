/**
 * src/modules/customers/customers.routes.js
 *
 * Mounted at: /api/v1/customers
 */

import { Router } from "express";
import * as ctrl from "./customers.controller.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { generalLimiter } from "../../middlewares/rateLimit.middleware.js";
import {
  updateCustomerSchema,
  listCustomersSchema,
  listCustomerAppointmentsSchema,
  listCustomerPaymentsSchema,
} from "./customers.validation.js";

const router = Router();

router.use(authenticate, generalLimiter);

// ── Collection ────────────────────────────────────────────────────────────────

router.route("/")
  .get(
    requireRole("ADMIN", "BUSINESS", "STAFF"),
    validateQuery(listCustomersSchema),
    ctrl.listCustomersController
  )
  .post(
    requireRole("ADMIN"),
    ctrl.createCustomerController
  );

// ── Single resource ───────────────────────────────────────────────────────────

router.route("/:id")
  // CUSTOMER can read/update/delete their own (isolation enforced in service)
  .get(ctrl.getCustomerController)
  .patch(validate(updateCustomerSchema), ctrl.updateCustomerController)
  .delete(ctrl.deleteCustomerController);

// ── Sub-resources ─────────────────────────────────────────────────────────────

router.get(
  "/:id/appointments",
  validateQuery(listCustomerAppointmentsSchema),
  ctrl.getCustomerAppointmentsController
);

router.get(
  "/:id/payments",
  validateQuery(listCustomerPaymentsSchema),
  ctrl.getCustomerPaymentsController
);

router.get(
  "/:id/notifications",
  ctrl.getCustomerNotificationsController
);

export default router;
