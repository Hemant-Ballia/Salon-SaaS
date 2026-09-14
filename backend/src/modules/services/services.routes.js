/**
 * src/modules/services/services.routes.js
 *
 * Mounted at: /api/v1/services
 */

import { Router } from "express";
import * as ctrl from "./services.controller.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { generalLimiter } from "../../middlewares/rateLimit.middleware.js";
import {
  createServiceSchema,
  updateServiceSchema,
  updateServiceStatusSchema,
  listServicesSchema,
} from "./services.validation.js";

const router = Router();

router.use(authenticate, generalLimiter);

// ── Collection ────────────────────────────────────────────────────────────────

router.route("/")
  .get(validateQuery(listServicesSchema), ctrl.listServicesController)
  .post(
    requireRole("ADMIN", "BUSINESS"),
    validate(createServiceSchema),
    ctrl.createServiceController
  );

// ── Single resource ───────────────────────────────────────────────────────────

router.route("/:id")
  .get(ctrl.getServiceController)
  .patch(
    requireRole("ADMIN", "BUSINESS"),
    validate(updateServiceSchema),
    ctrl.updateServiceController
  )
  .delete(requireRole("ADMIN", "BUSINESS"), ctrl.deleteServiceController);

// ── Status toggle ─────────────────────────────────────────────────────────────

router.patch(
  "/:id/status",
  requireRole("ADMIN", "BUSINESS"),
  validate(updateServiceStatusSchema),
  ctrl.updateServiceStatusController
);

export default router;
