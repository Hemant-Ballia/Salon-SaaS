/**
 * src/modules/otp/otp.service.js
 *
 * OTP delivery service — handles send, verify, resend across all channels.
 *
 * Security guarantees:
 *   - OTPs are generated with crypto.randomInt (cryptographically secure).
 *   - OTPs are HASHED before DB storage — plaintext is NEVER persisted.
 *   - Plaintext OTP is NEVER logged in production.
 *   - Each OTP record is single-use (verifiedAt is set on first success).
 *   - Expired, exhausted, or already-verified records are rejected.
 *   - Resend is blocked during the cooldown window.
 */

import { getDB } from "../../config/db.js";
import { sendEmail } from "../../config/mailer.js";
import { sendSms, sendWhatsApp } from "../../config/twilio.js";
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  getOtpExpiry,
  isOtpExhausted,
  canResendOtp,
  logOtpDev,
  OTP_MAX_ATTEMPTS,
  OTP_EXPIRES_IN_MINUTES,
} from "../../utils/otp.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";
import { EMAIL_OTP_SUBJECT, OTP_EMAIL_ENABLED, OTP_SMS_ENABLED, OTP_WHATSAPP_ENABLED } from "../../config/env.js";

// ── Email template ────────────────────────────────────────────────────────────

const buildOtpEmailHtml = (otp, purpose, expiresInMinutes) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 40px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <h2 style="color: #1a1a2e; margin-bottom: 8px;">Salon SaaS</h2>
    <p style="color: #555; margin-bottom: 24px;">Your one-time verification code</p>
    <div style="background: #f0f4ff; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5;">${otp}</span>
    </div>
    <p style="color: #666; font-size: 14px;">This code expires in <strong>${expiresInMinutes} minutes</strong>.</p>
    <p style="color: #666; font-size: 14px;">If you did not request this, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #999; font-size: 12px;">Do not share this code with anyone. Salon SaaS will never ask for your OTP.</p>
  </div>
</body>
</html>`;

const buildOtpSmsBody = (otp, expiresInMinutes) =>
  `Your Salon SaaS verification code is: ${otp}. Valid for ${expiresInMinutes} minutes. Do not share this code.`;

// ── Delivery ──────────────────────────────────────────────────────────────────

const deliverOtp = async (channel, contact, otp, purpose) => {

  switch (channel) {
    case "EMAIL":
      if (!OTP_EMAIL_ENABLED) {
        logger.warn("[OTP] Email channel disabled");
        return;
      }
      await sendEmail({
        to: contact,
        subject: EMAIL_OTP_SUBJECT,
        html: buildOtpEmailHtml(otp, purpose, OTP_EXPIRES_IN_MINUTES),
      });
      break;

    case "SMS":
      if (!OTP_SMS_ENABLED) {
        logger.warn("[OTP] SMS channel disabled");
        return;
      }
      await sendSms(contact, buildOtpSmsBody(otp, OTP_EXPIRES_IN_MINUTES));
      break;

    case "WHATSAPP":
      if (!OTP_WHATSAPP_ENABLED) {
        logger.warn("[OTP] WhatsApp channel disabled");
        return;
      }
      await sendWhatsApp(contact, buildOtpSmsBody(otp, OTP_EXPIRES_IN_MINUTES));
      break;

    default:
      throw ApiError.badRequest(`Unsupported OTP channel: ${channel}`, "INVALID_OTP_CHANNEL");
  }
};

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Send a new OTP.
 *
 * @param {{ userId?: string, contact: string, channel: "EMAIL"|"SMS"|"WHATSAPP", purpose: string }} params
 * @returns {Promise<{ expiresAt: Date }>}
 */
export const sendOtpService = async ({ userId, contact, channel, purpose }) => {
  const prisma = getDB();

  // Check resend cooldown — find the most recent non-verified OTP for this contact+channel+purpose
  const recent = await prisma.otpVerification.findFirst({
    where: { contact, channel, purpose, verifiedAt: null },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (recent) {
    const { allowed, waitSeconds } = canResendOtp(recent.createdAt);
    if (!allowed) {
      throw ApiError.tooManyRequests(
        `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
        "OTP_COOLDOWN"
      );
    }
  }

  // Generate and hash
  const plainOtp = generateOtp();
  const otpHash = await hashOtp(plainOtp);
  const expiresAt = getOtpExpiry();

  // Persist
  await prisma.otpVerification.create({
    data: {
      userId: userId || null,
      contact,
      channel,
      purpose,
      otpHash,
      expiresAt,
    },
  });

  // Deliver — log plaintext only in development
  logOtpDev(plainOtp, channel, contact);

  try {
    await deliverOtp(channel, contact, plainOtp, purpose);
  } catch (deliveryError) {
    logger.error(`[OTP] Delivery failed via ${channel}:`, deliveryError.message);
    // Don't fail the request — OTP is stored; retry via /resend
  }

  return { expiresAt };
};

/**
 * Verify an OTP submitted by the user.
 *
 * @param {{ contact: string, channel: string, purpose: string, otp: string }} params
 * @returns {Promise<{ otpRecordId: string }>} the verified record ID
 */
export const verifyOtpService = async ({ contact, channel, purpose, otp }) => {
  const prisma = getDB();

  // Find the most recent unused, unexpired OTP for this contact+channel+purpose
  const record = await prisma.otpVerification.findFirst({
    where: {
      contact,
      channel,
      purpose,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw ApiError.badRequest(
      "No active OTP found. Please request a new one.",
      "OTP_NOT_FOUND"
    );
  }

  // Check attempt limit
  if (isOtpExhausted(record.attempts)) {
    throw ApiError.badRequest(
      "Too many incorrect attempts. Please request a new OTP.",
      "OTP_EXHAUSTED"
    );
  }

  // Increment attempt counter
  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { attempts: { increment: 1 } },
  });

  // Verify hash
  const isValid = await verifyOtp(otp, record.otpHash);

  if (!isValid) {
    const remainingAttempts = OTP_MAX_ATTEMPTS - (record.attempts + 1);
    throw ApiError.badRequest(
      remainingAttempts > 0
        ? `Incorrect OTP. ${remainingAttempts} attempt(s) remaining.`
        : "Incorrect OTP. No attempts remaining. Please request a new OTP.",
      "OTP_INVALID"
    );
  }

  // Mark as verified (single-use)
  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { verifiedAt: new Date() },
  });

  return { otpRecordId: record.id };
};

/**
 * Resend an OTP (with cooldown check).
 * Delegates to sendOtpService — cooldown is enforced there.
 */
export const resendOtpService = async ({ userId, contact, channel, purpose }) => {
  return sendOtpService({ userId, contact, channel, purpose });
};

