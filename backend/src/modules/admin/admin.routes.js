/**
 * src/modules/admin/admin.routes.js
 *
 * Mounted at: /api/v1/admin
 */

import { Router } from "express";
import * as ctrl from "./admin.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";

const router = Router();

// Strictly ADMIN only
router.use(authenticate, requireRole("ADMIN"));

// Dashboard
router.get("/dashboard", ctrl.getDashboard);

// Users
router.get("/users", ctrl.listUsers);
router.get("/users/:id", ctrl.getUser);
router.patch("/users/:id/status", ctrl.updateUserStatus);

// Businesses
router.get("/businesses", ctrl.listBusinesses);
router.get("/businesses/:id", ctrl.getBusiness);
router.patch("/businesses/:id/status", ctrl.updateBusinessStatus);
router.post("/businesses/:id/approve", (req, res, next) => {
  req.body.status = "ACTIVE";
  ctrl.updateBusinessStatus(req, res, next);
});
router.post("/businesses/:id/reject", (req, res, next) => {
  req.body.status = "REJECTED"; // Assuming REJECTED is valid or we just use SUSPENDED/PENDING
  ctrl.updateBusinessStatus(req, res, next);
});

// Aggregates
router.get("/staff", ctrl.listStaff);
router.get("/customers", ctrl.listCustomers);
router.get("/appointments", ctrl.listAppointments);
router.get("/payments", ctrl.listPayments);
router.get("/audit-logs", ctrl.listAuditLogs);

export default router;
