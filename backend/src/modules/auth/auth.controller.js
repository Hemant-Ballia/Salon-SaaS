/**
 * src/modules/auth/auth.controller.js
 *
 * Thin HTTP layer — delegates all logic to auth.service.js.
 *
 * Responsibilities:
 *   - Extract validated req.body (Zod already ran via validate middleware)
 *   - Call service
 *   - Set/clear HTTP-only refresh token cookie
 *   - Send standardised response via sendSuccess/sendCreated
 *
 * Refresh token cookie settings:
 *   - httpOnly: true   — JavaScript cannot access it (XSS mitigation)
 *   - secure: true     — HTTPS only in production
 *   - sameSite: strict — CSRF mitigation
 *   - maxAge: 7 days
 */

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendCreated } from "../../utils/response.js";
import {
  registerCustomer,
  registerBusiness,
  login,
  refreshAccessToken,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from "./auth.service.js";
import {
  sendOtpService,
  verifyOtpService,
  resendOtpService,
} from "../otp/otp.service.js";

// ── Cookie config ─────────────────────────────────────────────────────────────

const REFRESH_TOKEN_COOKIE = "refreshToken";

const cookieOptions = (maxAge = 7 * 24 * 60 * 60 * 1000) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge,
  path: "/",
});

const setRefreshCookie = (res, refreshToken) => {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
};

// ── Controllers ───────────────────────────────────────────────────────────────

export const registerCustomerController = asyncHandler(async (req, res) => {
  const result = await registerCustomer(req.body);
  return sendCreated(res, "Account created successfully. Please verify your email.", result);
});

export const registerBusinessController = asyncHandler(async (req, res) => {
  const result = await registerBusiness(req.body);
  return sendCreated(
    res,
    "Business account created. Your business is pending approval. Please verify your email.",
    result
  );
});

export const loginController = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await login(req.body);
  setRefreshCookie(res, refreshToken);
  return sendSuccess(res, "Login successful.", { user, accessToken });
});

export const logoutController = asyncHandler(async (_req, res) => {
  clearRefreshCookie(res);
  return sendSuccess(res, "Logged out successfully.");
});

export const refreshController = asyncHandler(async (req, res) => {
  // Prefer cookie, fall back to request body (for non-browser clients)
  const refreshToken =
    req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refreshToken;

  const { user, accessToken, refreshToken: newRefreshToken } =
    await refreshAccessToken(refreshToken);

  setRefreshCookie(res, newRefreshToken);
  return sendSuccess(res, "Token refreshed successfully.", { user, accessToken });
});

export const getMeController = asyncHandler(async (req, res) => {
  const result = await getMe(req.user.userId);
  return sendSuccess(res, "User profile fetched.", result);
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const result = await changePassword(req.user.userId, req.body);
  return sendSuccess(res, result.message);
});

export const forgotPasswordController = asyncHandler(async (req, res) => {
  const result = await forgotPassword(req.body);
  return sendSuccess(res, result.message);
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  const result = await resetPassword(req.body);
  return sendSuccess(res, result.message);
});

export const verifyEmailController = asyncHandler(async (req, res) => {
  const result = await verifyEmail(req.body);
  return sendSuccess(res, result.message);
});

// ── OTP controllers ───────────────────────────────────────────────────────────

export const sendOtpController = asyncHandler(async (req, res) => {
  const { contact, channel, purpose } = req.body;
  const userId = req.user?.userId || null; // Optional auth — some OTPs are pre-login

  const result = await sendOtpService({ userId, contact, channel, purpose });
  return sendSuccess(res, "OTP sent successfully.", {
    expiresAt: result.expiresAt,
  });
});

export const verifyOtpController = asyncHandler(async (req, res) => {
  const { contact, channel, purpose, otp } = req.body;
  await verifyOtpService({ contact, channel, purpose, otp });
  return sendSuccess(res, "OTP verified successfully.");
});

export const resendOtpController = asyncHandler(async (req, res) => {
  const { contact, channel, purpose } = req.body;
  const userId = req.user?.userId || null;

  const result = await resendOtpService({ userId, contact, channel, purpose });
  return sendSuccess(res, "OTP resent successfully.", {
    expiresAt: result.expiresAt,
  });
});
