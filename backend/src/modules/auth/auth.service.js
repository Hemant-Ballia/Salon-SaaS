/**
 * src/modules/auth/auth.service.js
 *
 * Authentication business logic.
 *
 * Security rules enforced here:
 *   - Roles are NEVER accepted from client input — always set server-side.
 *   - passwordHash is NEVER returned in any response.
 *   - Access tokens are short-lived (15m).
 *   - Refresh tokens are long-lived (7d), stored in HTTP-only cookies.
 *   - Generic error messages for login failures (no user enumeration).
 *   - Password comparison uses timing-safe bcrypt.compare.
 */

import { getDB } from "../../config/db.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { generateTokenPair, verifyRefreshToken } from "../../utils/jwt.js";
import { withTransaction } from "../../utils/transaction.js";
import { sendOtpService, verifyOtpService } from "../otp/otp.service.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";
import { auditLog } from "../../utils/audit.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fields to select from user records for API responses.
 * passwordHash is NEVER selected.
 */
const USER_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Build a user-safe object — strips passwordHash even if accidentally selected.
 */
const sanitizeUser = (user) => {
  // eslint-disable-next-line no-unused-vars
  const { passwordHash, deletedAt, ...safe } = user;
  return safe;
};

// ── Register (Customer) ───────────────────────────────────────────────────────

/**
 * Register a new CUSTOMER account.
 * Role is hardcoded to CUSTOMER — never accepted from request.
 */
export const registerCustomer = async ({ name, email, phone, password }) => {
  const prisma = getDB();

  // Check uniqueness
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] },
    select: { id: true, email: true, phone: true },
  });

  if (existing) {
    if (existing.email === email) {
      throw ApiError.conflict("An account with this email already exists.", "EMAIL_TAKEN");
    }
    throw ApiError.conflict("An account with this phone number already exists.", "PHONE_TAKEN");
  }

  const passwordHash = await hashPassword(password);

  const user = await withTransaction(async (tx) => {
    // Create user with CUSTOMER role (hardcoded)
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "CUSTOMER", // NEVER from request body
        isActive: true,
      },
      select: USER_SAFE_SELECT,
    });

    // Create customer profile
    await tx.customer.create({
      data: { userId: newUser.id },
    });

    // Create default notification preferences
    await tx.notificationPreference.create({
      data: { userId: newUser.id },
    });

    return newUser;
  });

  // Send email verification OTP (non-blocking — don't fail registration if email fails)
  sendOtpService({
    userId: user.id,
    contact: email,
    channel: "EMAIL",
    purpose: "EMAIL_VERIFICATION",
  }).catch((err) => logger.error("[Auth] Email verification OTP failed:", err.message));

  logger.info(`[Auth] New CUSTOMER registered: ${email}`);
  return { user: sanitizeUser(user) };
};

// ── Register (Business) ───────────────────────────────────────────────────────

/**
 * Register a new BUSINESS account.
 * Creates User (role=BUSINESS) + Business record in a transaction.
 * Business starts in PENDING status — requires admin approval.
 */
export const registerBusiness = async ({
  name, email, phone, password,
  businessName, businessType, businessPhone,
}) => {
  const prisma = getDB();

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] },
    select: { id: true, email: true },
  });

  if (existing) {
    if (existing.email === email) {
      throw ApiError.conflict("An account with this email already exists.", "EMAIL_TAKEN");
    }
    throw ApiError.conflict("An account with this phone number already exists.", "PHONE_TAKEN");
  }

  const passwordHash = await hashPassword(password);

  // Generate a slug from business name
  const baseSlug = businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Ensure slug uniqueness
  let slug = baseSlug;
  let slugSuffix = 1;
  while (await prisma.business.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${slugSuffix++}`;
  }

  const { user, business } = await withTransaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "BUSINESS", // NEVER from request body
        isActive: true,
      },
      select: USER_SAFE_SELECT,
    });

    const newBusiness = await tx.business.create({
      data: {
        ownerId: newUser.id,
        name: businessName,
        slug,
        businessType: businessType || "OTHER",
        phone: businessPhone || phone || null,
        status: "PENDING", // Requires admin approval
        isActive: false,
      },
      select: { id: true, name: true, slug: true, status: true, businessType: true },
    });

    // Default notification preferences
    await tx.notificationPreference.create({
      data: { userId: newUser.id },
    });

    return { user: newUser, business: newBusiness };
  });

  sendOtpService({
    userId: user.id,
    contact: email,
    channel: "EMAIL",
    purpose: "EMAIL_VERIFICATION",
  }).catch((err) => logger.error("[Auth] Business email verification OTP failed:", err.message));

  logger.info(`[Auth] New BUSINESS registered: ${email} | Business: ${businessName}`);
  return { user: sanitizeUser(user), business };
};

// ── Login ─────────────────────────────────────────────────────────────────────

export const login = async ({ email, password }) => {
  const prisma = getDB();

  // Find user — use generic error to prevent user enumeration
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...USER_SAFE_SELECT, passwordHash: true, deletedAt: true },
  });

  const INVALID_CREDS_ERROR = ApiError.unauthorized(
    "Invalid email or password.",
    "INVALID_CREDENTIALS"
  );

  if (!user || user.deletedAt) throw INVALID_CREDS_ERROR;
  if (!user.isActive) {
    throw ApiError.forbidden("Your account has been deactivated. Please contact support.", "ACCOUNT_DEACTIVATED");
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) throw INVALID_CREDS_ERROR;

  // Update lastLoginAt (fire-and-forget)
  prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  }).catch((err) => logger.error("[Auth] lastLoginAt update failed:", err.message));

  const { accessToken, refreshToken } = generateTokenPair({
    userId: user.id,
    role: user.role,
  });

  logger.info(`[Auth] Login: ${email} (${user.role})`);
  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

// ── Refresh token ─────────────────────────────────────────────────────────────

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw ApiError.unauthorized("Refresh token is required.", "REFRESH_TOKEN_MISSING");
  }

  // Verify token signature (throws if expired or invalid)
  const decoded = verifyRefreshToken(refreshToken);

  const prisma = getDB();
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: USER_SAFE_SELECT,
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Account not found or deactivated.", "ACCOUNT_INACTIVE");
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair({
    userId: user.id,
    role: user.role,
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken: newRefreshToken,
  };
};

// ── Me (current user) ─────────────────────────────────────────────────────────

export const getMe = async (userId) => {
  const prisma = getDB();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SAFE_SELECT,
  });

  if (!user) {
    throw ApiError.notFound("User not found.", "USER_NOT_FOUND");
  }

  return { user: sanitizeUser(user) };
};

// ── Change password ───────────────────────────────────────────────────────────

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const prisma = getDB();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) throw ApiError.notFound("User not found.", "USER_NOT_FOUND");

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw ApiError.badRequest("Current password is incorrect.", "WRONG_PASSWORD");
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash, updatedAt: new Date() },
  });

  logger.info(`[Auth] Password changed for userId: ${userId}`);
  return { message: "Password changed successfully." };
};

// ── Forgot password ───────────────────────────────────────────────────────────

export const forgotPassword = async ({ email }) => {
  const prisma = getDB();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isActive: true },
  });

  // Always return success to prevent user enumeration
  if (!user || !user.isActive) {
    logger.warn(`[Auth] Forgot password: user not found for ${email}`);
    return { message: "If an account exists for that email, an OTP has been sent." };
  }

  await sendOtpService({
    userId: user.id,
    contact: email,
    channel: "EMAIL",
    purpose: "PASSWORD_RESET",
  });

  return { message: "If an account exists for that email, an OTP has been sent." };
};

// ── Reset password ────────────────────────────────────────────────────────────

export const resetPassword = async ({ email, otp, newPassword }) => {
  const prisma = getDB();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw ApiError.badRequest("Invalid or expired reset request.", "RESET_FAILED");
  }

  // Verify OTP
  await verifyOtpService({
    contact: email,
    channel: "EMAIL",
    purpose: "PASSWORD_RESET",
    otp,
  });

  // Update password
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, updatedAt: new Date() },
  });

  logger.info(`[Auth] Password reset for: ${email}`);
  return { message: "Password reset successfully. Please log in with your new password." };
};

// ── Email verification ────────────────────────────────────────────────────────

export const verifyEmail = async ({ email, otp }) => {
  const prisma = getDB();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isEmailVerified: true },
  });

  if (!user) {
    throw ApiError.notFound("User not found.", "USER_NOT_FOUND");
  }

  if (user.isEmailVerified) {
    throw ApiError.conflict("Email is already verified.", "EMAIL_ALREADY_VERIFIED");
  }

  await verifyOtpService({
    contact: email,
    channel: "EMAIL",
    purpose: "EMAIL_VERIFICATION",
    otp,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, updatedAt: new Date() },
  });

  logger.info(`[Auth] Email verified: ${email}`);
  return { message: "Email verified successfully." };
};
