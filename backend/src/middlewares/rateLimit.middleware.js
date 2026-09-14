/**
 * src/middlewares/rateLimit.middleware.js
 *
 * Tiered rate limiting using express-rate-limit.
 *
 * Different limits for different risk levels:
 *
 *   authLimiter         — login, register       (10 req / 15 min)
 *   otpLimiter          — OTP send/verify/resend (5 req / 15 min)
 *   passwordResetLimiter— forgot/reset password  (5 req / 60 min)
 *   generalLimiter      — all other API routes   (200 req / 15 min)
 *   publicLimiter       — public read endpoints  (500 req / 15 min)
 *   strictLimiter       — admin mutations        (30 req / 15 min)
 *
 * These are applied per-IP by default.
 * In production behind a load balancer, configure `trustProxy` in Express
 * and set `keyGenerator` to use a reliable IP header (e.g., X-Forwarded-For).
 */

import rateLimit from "express-rate-limit";
import { IS_PRODUCTION } from "../config/env.js";

/**
 * Standard rate limit error response.
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
    error: { code: "RATE_LIMITED" },
  });
};

/**
 * Skip rate limiting in test/CI environments.
 */
const skipInTest = () => process.env.NODE_ENV === "test";

// ── Limiters ──────────────────────────────────────────────────────────────────

/**
 * Strict limiter for authentication endpoints.
 * 10 requests per 15 minutes per IP.
 * Applied to: POST /auth/login, POST /auth/register
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PRODUCTION ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: rateLimitHandler,
  message: rateLimitHandler,
});

/**
 * Very strict limiter for OTP endpoints.
 * 5 requests per 15 minutes per IP.
 * Applied to: POST /otp/send, POST /otp/verify, POST /otp/resend
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PRODUCTION ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: rateLimitHandler,
});

/**
 * Strict limiter for password reset flow.
 * 5 requests per 60 minutes per IP.
 * Applied to: POST /auth/forgot-password, POST /auth/reset-password
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: IS_PRODUCTION ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: rateLimitHandler,
});

/**
 * General API limiter for authenticated endpoints.
 * 200 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PRODUCTION ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: rateLimitHandler,
});

/**
 * Generous limiter for public read endpoints.
 * 500 requests per 15 minutes per IP.
 * Applied to: GET /businesses (public listing), GET /services, etc.
 */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PRODUCTION ? 500 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: rateLimitHandler,
});

/**
 * Strict limiter for sensitive admin operations.
 * 30 requests per 15 minutes per IP.
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PRODUCTION ? 30 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: rateLimitHandler,
});

/**
 * Webhook limiter — allows Razorpay webhooks but prevents flooding.
 * 100 requests per 5 minutes per IP.
 */
export const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: IS_PRODUCTION ? 100 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: rateLimitHandler,
});
