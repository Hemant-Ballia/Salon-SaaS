/**
 * src/modules/payments/payments.routes.js
 *
 * Mounted at: /api/v1/payments
 *
 * IMPORTANT: /webhook uses express.raw() instead of JSON parser because
 * Razorpay HMAC verification needs the raw body bytes.
 * /history and /create-order are static routes — registered BEFORE /:id.
 */

import { Router } from "express";
import express from "express";
import * as ctrl from "./payments.controller.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { generalLimiter, webhookLimiter } from "../../middlewares/rateLimit.middleware.js";
import {
  createOrderSchema,
  verifyPaymentSchema,
  refundPaymentSchema,
  listPaymentsSchema,
} from "./payments.validation.js";

const router = Router();

// ── Webhook — NO JWT auth, raw body ─────────────────────────────────────────
// Must be registered BEFORE authenticate middleware
router.post(
  "/webhook",
  webhookLimiter,
  express.raw({ type: "application/json" }),
  ctrl.webhookController
);

// ── All other routes need auth ──────────────────────────────────────────────
router.use(authenticate, generalLimiter);

// ── Static routes (before /:id) ─────────────────────────────────────────────

router.post(
  "/create-order",
  validate(createOrderSchema),
  ctrl.createOrderController
);

router.post(
  "/verify",
  validate(verifyPaymentSchema),
  ctrl.verifyPaymentController
);

router.get(
  "/history",
  validateQuery(listPaymentsSchema),
  ctrl.paymentHistoryController
);

// ── Collection ──────────────────────────────────────────────────────────────

router.get(
  "/",
  requireRole("ADMIN", "BUSINESS", "STAFF"),
  validateQuery(listPaymentsSchema),
  ctrl.listPaymentsController
);

// ── Single resource ─────────────────────────────────────────────────────────

router.get("/:id", ctrl.getPaymentController);
router.get("/:id/status", ctrl.getPaymentStatusController);

router.post(
  "/:id/refund",
  requireRole("ADMIN", "BUSINESS"),
  validate(refundPaymentSchema),
  ctrl.refundPaymentController
);

export default router;
