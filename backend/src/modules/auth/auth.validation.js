/**
 * src/modules/auth/auth.validation.js
 *
 * Zod schemas for all auth endpoints.
 *
 * Rules:
 *   - role is NEVER accepted from the request body.
 *   - passwordHash is NEVER accepted from the request body.
 *   - Email is always lowercased and trimmed.
 *   - Phone must be E.164 format.
 */

import { z } from "zod";

// ── Reusable field validators ─────────────────────────────────────────────────

const emailField = z
  .string({ required_error: "Email is required" })
  .email("Invalid email address")
  .toLowerCase()
  .trim();

const passwordField = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters");

const phoneField = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Phone must be in E.164 format (e.g. +919876543210)")
  .optional();

const otpField = z
  .string({ required_error: "OTP is required" })
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d+$/, "OTP must contain only digits");

const otpChannelField = z.enum(["EMAIL", "SMS", "WHATSAPP"], {
  required_error: "Channel is required",
  invalid_type_error: "Channel must be EMAIL, SMS, or WHATSAPP",
});

const otpPurposeField = z.enum(
  ["EMAIL_VERIFICATION", "PHONE_VERIFICATION", "PASSWORD_RESET", "LOGIN", "TRANSACTION"],
  {
    required_error: "Purpose is required",
    invalid_type_error: "Invalid OTP purpose",
  }
);

// ── Register ──────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim(),
  email: emailField,
  phone: phoneField,
  password: passwordField
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  // role is NOT accepted here — hardcoded to CUSTOMER at service level
  // BUSINESS registration uses a separate flow
});

export const registerBusinessSchema = registerSchema.extend({
  businessName: z
    .string({ required_error: "Business name is required" })
    .min(2, "Business name must be at least 2 characters")
    .max(150, "Business name must not exceed 150 characters")
    .trim(),
  businessType: z.enum(
    ["SALON", "BEAUTY_PARLOUR", "BARBER", "CAR_WASH", "OTHER"],
    { required_error: "Business type is required" }
  ),
  businessPhone: phoneField,
});

// ── Login ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
});

// ── Refresh token ─────────────────────────────────────────────────────────────

export const refreshSchema = z.object({
  refreshToken: z
    .string({ required_error: "Refresh token is required" })
    .min(1, "Refresh token is required")
    .optional(), // optional in body — can also come from cookie
});

// ── Change password ───────────────────────────────────────────────────────────

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: "Current password is required" }).min(1),
    newPassword: passwordField
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string({ required_error: "Please confirm your new password" }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });

// ── Forgot / Reset password ───────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    email: emailField,
    otp: otpField,
    newPassword: passwordField
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string({ required_error: "Please confirm your new password" }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── Email verification ────────────────────────────────────────────────────────

export const verifyEmailSchema = z.object({
  email: emailField,
  otp: otpField,
});

// ── OTP ───────────────────────────────────────────────────────────────────────

export const sendOtpSchema = z.object({
  contact: z
    .string({ required_error: "Contact is required" })
    .min(1, "Contact is required")
    .trim(),
  channel: otpChannelField,
  purpose: otpPurposeField,
});

export const verifyOtpSchema = z.object({
  contact: z.string({ required_error: "Contact is required" }).min(1).trim(),
  channel: otpChannelField,
  purpose: otpPurposeField,
  otp: otpField,
});

export const resendOtpSchema = z.object({
  contact: z.string({ required_error: "Contact is required" }).min(1).trim(),
  channel: otpChannelField,
  purpose: otpPurposeField,
});
