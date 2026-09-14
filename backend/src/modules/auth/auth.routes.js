/**
 * src/modules/auth/auth.routes.js
 *
 * Auth routes — mounted at /api/v1/auth
 *
 * Public routes (no authentication required):
 *   POST /register          — Customer registration
 *   POST /register/business — Business registration
 *   POST /login             — Login
 *   POST /refresh           — Refresh access token
 *   POST /forgot-password   — Request password reset OTP
 *   POST /reset-password    — Reset password with OTP
 *   POST /verify-email      — Verify email with OTP
 *   POST /otp/send          — Send OTP (pre-login)
 *   POST /otp/verify        — Verify OTP (pre-login)
 *   POST /otp/resend        — Resend OTP (pre-login)
 *
 * Protected routes (authentication required):
 *   GET  /me                — Get current user
 *   POST /logout            — Logout (clear cookie)
 *   POST /change-password   — Change password
 *   POST /otp/send          — Send OTP (post-login, attaches userId)
 */

import { Router } from "express";
import {
  registerCustomerController,
  registerBusinessController,
  loginController,
  logoutController,
  refreshController,
  getMeController,
  changePasswordController,
  forgotPasswordController,
  resetPasswordController,
  verifyEmailController,
  sendOtpController,
  verifyOtpController,
  resendOtpController,
} from "./auth.controller.js";

import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, optionalAuthenticate } from "../../middlewares/auth.middleware.js";
import {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
} from "../../middlewares/rateLimit.middleware.js";
import {
  registerSchema,
  registerBusinessSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  sendOtpSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from "./auth.validation.js";

const router = Router();

// ── Public: Registration ──────────────────────────────────────────────────────

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  registerCustomerController
);

router.post(
  "/register/business",
  authLimiter,
  validate(registerBusinessSchema),
  registerBusinessController
);

// ── Public: Login / Token ─────────────────────────────────────────────────────

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  loginController
);

router.post(
  "/refresh",
  validate(refreshSchema),
  refreshController
);

// ── Protected: Session ────────────────────────────────────────────────────────

router.get(
  "/me",
  authenticate,
  getMeController
);

router.post(
  "/logout",
  authenticate,
  logoutController
);

// ── Protected: Password management ───────────────────────────────────────────

router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePasswordController
);

// ── Public: Forgot / Reset password ──────────────────────────────────────────

router.post(
  "/forgot-password",
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordController
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  validate(resetPasswordSchema),
  resetPasswordController
);

// ── Public: Email verification ────────────────────────────────────────────────

router.post(
  "/verify-email",
  otpLimiter,
  validate(verifyEmailSchema),
  verifyEmailController
);

// ── OTP endpoints ─────────────────────────────────────────────────────────────
// optionalAuthenticate — attaches userId if token present, continues if not.
// This allows the same endpoint to work pre-login and post-login.

router.post(
  "/otp/send",
  otpLimiter,
  optionalAuthenticate,
  validate(sendOtpSchema),
  sendOtpController
);

router.post(
  "/otp/verify",
  otpLimiter,
  optionalAuthenticate,
  validate(verifyOtpSchema),
  verifyOtpController
);

router.post(
  "/otp/resend",
  otpLimiter,
  optionalAuthenticate,
  validate(resendOtpSchema),
  resendOtpController
);

export default router;
