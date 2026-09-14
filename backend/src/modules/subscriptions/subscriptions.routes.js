/**
 * src/modules/subscriptions/subscriptions.routes.js
 *
 * Mounted at: /api/v1/subscriptions
 */

import { Router } from "express";
import * as ctrl from "./subscriptions.controller.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { generalLimiter } from "../../middlewares/rateLimit.middleware.js";
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  listSubscriptionsSchema,
} from "./subscriptions.validation.js";

const router = Router();

router.use(authenticate, generalLimiter);

// ── Static routes (before /:id) ─────────────────────────────────────────────

router.get(
  "/current",
  requireRole("BUSINESS", "STAFF"),
  ctrl.getCurrentSubscriptionController
);

// ── Collection ──────────────────────────────────────────────────────────────

router.post(
  "/",
  requireRole("ADMIN", "BUSINESS"),
  validate(createSubscriptionSchema),
  ctrl.createSubscriptionController
);

router.get(
  "/",
  requireRole("ADMIN", "BUSINESS", "STAFF"),
  validateQuery(listSubscriptionsSchema),
  ctrl.listSubscriptionsController
);

// ── Single resource ─────────────────────────────────────────────────────────

router.get(
  "/:id",
  requireRole("ADMIN", "BUSINESS", "STAFF"),
  ctrl.getSubscriptionController
);

router.patch(
  "/:id",
  requireRole("ADMIN", "BUSINESS"),
  validate(updateSubscriptionSchema),
  ctrl.updateSubscriptionController
);

export default router;
