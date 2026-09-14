/**
 * src/utils/otp.js
 *
 * OTP generation, hashing, and verification.
 *
 * Security rules:
 *   - OTPs are generated server-side using crypto.randomInt (cryptographically secure).
 *   - OTPs are HASHED before storage using bcryptjs — never store plaintext.
 *   - OTPs are NEVER returned in API responses.
 *   - OTPs are NEVER logged in production.
 *   - Each OTP is single-use (verifiedAt is set on first valid verification).
 *   - OTPs expire after OTP_EXPIRES_IN_MINUTES.
 *   - Maximum OTP_MAX_ATTEMPTS before the record is invalidated.
 *   - Resend has a cooldown of OTP_RESEND_COOLDOWN_SECONDS.
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  OTP_LENGTH,
  OTP_EXPIRES_IN_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  IS_PRODUCTION,
} from "../config/env.js";

const BCRYPT_ROUNDS = 10; // Lower than password rounds — OTPs are short-lived

/**
 * Generate a cryptographically secure numeric OTP.
 *
 * @returns {string} Zero-padded numeric OTP string of OTP_LENGTH digits
 */
export const generateOtp = () => {
  const max = Math.pow(10, OTP_LENGTH); // e.g., 1000000 for 6 digits
  const min = Math.pow(10, OTP_LENGTH - 1); // e.g., 100000
  const otp = crypto.randomInt(min, max);
  return otp.toString().padStart(OTP_LENGTH, "0");
};

/**
 * Hash an OTP for database storage.
 * Uses bcryptjs — the OTP is treated like a short-lived password.
 *
 * @param {string} otp - Plaintext OTP
 * @returns {Promise<string>} bcrypt hash
 */
export const hashOtp = async (otp) => {
  return bcrypt.hash(otp, BCRYPT_ROUNDS);
};

/**
 * Verify a plaintext OTP against a stored hash.
 *
 * @param {string} plainOtp - OTP submitted by the user
 * @param {string} storedHash - Hash from the database
 * @returns {Promise<boolean>}
 */
export const verifyOtp = async (plainOtp, storedHash) => {
  if (!plainOtp || !storedHash) return false;
  return bcrypt.compare(plainOtp, storedHash);
};

/**
 * Calculate the OTP expiry timestamp.
 *
 * @returns {Date}
 */
export const getOtpExpiry = () => {
  return new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);
};

/**
 * Check if an OTP record has expired.
 *
 * @param {Date} expiresAt
 * @returns {boolean}
 */
export const isOtpExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

/**
 * Check if an OTP record has exceeded the maximum attempt count.
 *
 * @param {number} attempts
 * @returns {boolean}
 */
export const isOtpExhausted = (attempts) => {
  return attempts >= OTP_MAX_ATTEMPTS;
};

/**
 * Check if a resend is allowed based on the last OTP's createdAt.
 *
 * @param {Date} lastSentAt - When the last OTP was created
 * @returns {{ allowed: boolean, waitSeconds: number }}
 */
export const canResendOtp = (lastSentAt) => {
  const elapsed = Math.floor((Date.now() - new Date(lastSentAt).getTime()) / 1000);
  const wait = OTP_RESEND_COOLDOWN_SECONDS - elapsed;
  return {
    allowed: elapsed >= OTP_RESEND_COOLDOWN_SECONDS,
    waitSeconds: Math.max(0, wait),
  };
};

/**
 * Safe OTP log helper.
 * Logs the OTP in development only — never in production.
 * Remove this from production logs.
 *
 * @param {string} otp
 * @param {string} channel
 * @param {string} contact
 */
export const logOtpDev = (otp, channel, contact) => {
  if (!IS_PRODUCTION) {
    console.log(`[DEV OTP] Channel: ${channel} | Contact: ${contact} | OTP: ${otp}`);
  }
};

export {
  OTP_LENGTH,
  OTP_EXPIRES_IN_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
};
