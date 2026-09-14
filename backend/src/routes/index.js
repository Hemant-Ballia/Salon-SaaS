/**
 * src/routes/index.js
 *
 * Central API router — mounts all versioned module routes.
 *
 * Mounting point: /api/v1  (set in app.js)
 *
 * Each module router handles its own sub-paths.
 *
 * Modules are added here as they are built in later steps:
 *   Step 4+: auth, businesses, customers, staff, services,
 *            appointments, queues, payments, subscriptions,
 *            notifications, otp, qr, admin, audit
 */

import { Router } from "express";
import { API_VERSION } from "../config/env.js";

const router = Router();

// ── Health (versioned) ────────────────────────────────────────────────────────

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Salon SaaS API is running",
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ── Module routes (uncommented as each step is completed) ────────────────────

// Step 4 — Auth
import authRoutes from "../modules/auth/auth.routes.js";
router.use("/auth", authRoutes);

// Step 5 — Business modules
import businessesRoutes from "../modules/businesses/businesses.routes.js";
import staffRoutes from "../modules/staff/staff.routes.js";
import customersRoutes from "../modules/customers/customers.routes.js";
router.use("/businesses", businessesRoutes);
router.use("/staff", staffRoutes);
router.use("/customers", customersRoutes);

// Step 6 — Services & Appointments
import servicesRoutes from "../modules/services/services.routes.js";
import appointmentsRoutes from "../modules/appointments/appointments.routes.js";
router.use("/services", servicesRoutes);
router.use("/appointments", appointmentsRoutes);

// Step 7 — Queues (real-time)
import queuesRoutes from "../modules/queues/queues.routes.js";
router.use("/queues", queuesRoutes);

// Step 8 — Payments & Subscriptions
import paymentsRoutes from "../modules/payments/payments.routes.js";
import subscriptionsRoutes from "../modules/subscriptions/subscriptions.routes.js";
router.use("/payments", paymentsRoutes);
router.use("/subscriptions", subscriptionsRoutes);

// Step 9 — Notifications, OTP, QR
import notificationsRoutes from "../modules/notifications/notifications.routes.js";
import qrRoutes from "../modules/qr/qr.routes.js";
// OTP will be integrated or is already in auth... The user just asked for Notifications and QR.
router.use("/notifications", notificationsRoutes);
router.use("/qr", qrRoutes);
// router.use("/otp", otpRoutes);
// router.use("/qr", qrRoutes);

// Step 9 — Admin & Audit
import adminRoutes from "../modules/admin/admin.routes.js";
router.use("/admin", adminRoutes);

router.get("/health", (req, res) => res.status(200).json({ status: "OK", version: "v1" }));

export default router;
