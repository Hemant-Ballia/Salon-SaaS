/**
 * src/modules/queues/queues.routes.js
 *
 * Mounted at: /api/v1/queues
 *
 * /join and /live are static routes — registered BEFORE /:id
 */

import { Router } from "express";
import * as ctrl from "./queues.controller.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { generalLimiter, strictLimiter } from "../../middlewares/rateLimit.middleware.js";
import { joinQueueSchema, updateQueueEntrySchema, listQueueSchema } from "./queues.validation.js";

const router = Router();

router.use(authenticate, generalLimiter);

// ── Static routes (before /:id) ───────────────────────────────────────────────

// POST /queues/join — customer joins queue
router.post(
  "/join",
  requireRole("CUSTOMER"),
  strictLimiter,
  validate(joinQueueSchema),
  ctrl.joinQueueController
);

// GET /queues/live?businessId=... — public live queue board
router.get(
  "/live",
  validateQuery(listQueueSchema),
  ctrl.liveQueueController
);

// ── Collection ────────────────────────────────────────────────────────────────

router.get(
  "/",
  requireRole("ADMIN", "BUSINESS", "STAFF"),
  validateQuery(listQueueSchema),
  ctrl.listQueueController
);

// ── Single entry ──────────────────────────────────────────────────────────────

router.route("/:id")
  .get(ctrl.getQueueEntryController)
  .patch(
    requireRole("ADMIN", "BUSINESS", "STAFF"),
    validate(updateQueueEntrySchema),
    ctrl.updateQueueEntryController
  )
  .delete(ctrl.leaveQueueController);

// ── Status transitions ────────────────────────────────────────────────────────

router.post("/:id/call", requireRole("ADMIN", "BUSINESS", "STAFF"), ctrl.callQueueEntryController);
router.post("/:id/serve", requireRole("ADMIN", "BUSINESS", "STAFF"), ctrl.serveQueueEntryController);
router.post("/:id/complete", requireRole("ADMIN", "BUSINESS", "STAFF"), ctrl.completeQueueEntryController);
router.post("/:id/skip", requireRole("ADMIN", "BUSINESS", "STAFF"), ctrl.skipQueueEntryController);

export default router;
