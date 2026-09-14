/**
 * src/modules/notifications/notifications.routes.js
 *
 * Mounted at: /api/v1/notifications
 */

import { Router } from "express";
import * as ctrl from "./notifications.controller.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { updatePreferencesSchema, listNotificationsSchema } from "./notifications.validation.js";

const router = Router();

// All notification endpoints require authentication
router.use(authenticate);

// ── Static routes (before /:id) ─────────────────────────────────────────────

router.get("/preferences", ctrl.getPreferences);
router.patch("/preferences", validate(updatePreferencesSchema), ctrl.updatePreferences);

router.patch("/read-all", ctrl.markAllAsRead);

// ── Collection ──────────────────────────────────────────────────────────────

router.get("/", validateQuery(listNotificationsSchema), ctrl.listNotifications);

// ── Single resource ─────────────────────────────────────────────────────────

router.get("/:id", ctrl.getNotification);
router.patch("/:id/read", ctrl.markAsRead);
router.delete("/:id", ctrl.deleteNotification);

export default router;
