/**
 * src/modules/compensation/compensation.routes.js
 */

import { Router } from "express";
import * as ctrl from "./compensation.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { generalLimiter } from "../../middlewares/rateLimit.middleware.js";
import {
  setStaffCompensationSchema,
  createCommissionRuleSchema,
  createIncentiveRuleSchema,
  updateIncentiveRuleSchema,
  setStaffServicePriceSchema,
} from "./compensation.validation.js";

const businessCompensationRouter = Router({ mergeParams: true });

businessCompensationRouter.use(authenticate, generalLimiter);

// ── Staff Compensation ────────────────────────────────────────────────────────
businessCompensationRouter.route("/staff/:staffId/compensation")
  .get(
    requireRole("ADMIN", "BUSINESS", "STAFF"),
    ctrl.getStaffCompensationController
  )
  .post(
    requireRole("ADMIN", "BUSINESS"),
    validate(setStaffCompensationSchema),
    ctrl.setStaffCompensationController
  )
  .put(
    requireRole("ADMIN", "BUSINESS"),
    validate(setStaffCompensationSchema),
    ctrl.setStaffCompensationController
  );

businessCompensationRouter.get(
  "/staff/:staffId/earnings",
  requireRole("ADMIN", "BUSINESS", "STAFF"),
  ctrl.getStaffEarningsController
);

// ── Commission Rules ──────────────────────────────────────────────────────────
businessCompensationRouter.route("/commission-rules")
  .get(
    requireRole("ADMIN", "BUSINESS"),
    ctrl.listCommissionRulesController
  )
  .post(
    requireRole("ADMIN", "BUSINESS"),
    validate(createCommissionRuleSchema),
    ctrl.createCommissionRuleController
  );

// ── Incentives ────────────────────────────────────────────────────────────────
businessCompensationRouter.route("/incentives")
  .get(
    requireRole("ADMIN", "BUSINESS", "STAFF"),
    ctrl.listIncentiveRulesController
  )
  .post(
    requireRole("ADMIN", "BUSINESS"),
    validate(createIncentiveRuleSchema),
    ctrl.createIncentiveRuleController
  );

businessCompensationRouter.route("/incentives/:id")
  .put(
    requireRole("ADMIN", "BUSINESS"),
    validate(updateIncentiveRuleSchema),
    ctrl.updateIncentiveRuleController
  )
  .delete(
    requireRole("ADMIN", "BUSINESS"),
    ctrl.deleteIncentiveRuleController
  );

// ── Staff-Specific Service Pricing ───────────────────────────────────────────
businessCompensationRouter.route("/services/:serviceId/staff-prices")
  .get(
    requireRole("ADMIN", "BUSINESS", "STAFF"),
    ctrl.listStaffServicePricesController
  );

businessCompensationRouter.route("/services/:serviceId/staff-prices/:staffId")
  .post(
    requireRole("ADMIN", "BUSINESS"),
    validate(setStaffServicePriceSchema),
    ctrl.setStaffServicePriceController
  )
  .put(
    requireRole("ADMIN", "BUSINESS"),
    validate(setStaffServicePriceSchema),
    ctrl.setStaffServicePriceController
  )
  .delete(
    requireRole("ADMIN", "BUSINESS"),
    ctrl.deleteStaffServicePriceController
  );

// ── Business Payroll Summary (for Dashboard) ──────────────────────────────────
businessCompensationRouter.get(
  "/payroll/summary",
  requireRole("ADMIN", "BUSINESS"),
  ctrl.getBusinessPayrollSummaryController
);

export default businessCompensationRouter;
