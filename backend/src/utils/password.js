/**
 * src/utils/password.js
 *
 * Password hashing and comparison using bcryptjs.
 *
 * Rules:
 *   - NEVER store plaintext passwords.
 *   - NEVER log passwords.
 *   - NEVER return passwordHash in API responses.
 *   - Use BCRYPT_ROUNDS = 12 (good balance of security vs performance).
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/**
 * Generate a cryptographically secure random temporary password.
 * Contains uppercase, lowercase, digits, and special characters.
 * Avoids ambiguous characters (0, O, o, 1, l, I).
 *
 * @param {number} [length=14] - Length of generated password (min 12)
 * @returns {string} Plaintext temporary password
 */
export const generateSecureTemporaryPassword = (length = 14) => {
  const effectiveLength = Math.max(12, length);

  const upperChars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowerChars = "abcdefghijkmnopqrstuvwxyz";
  const digitChars = "23456789";
  const specialChars = "@#$!%*?&";
  const allChars = upperChars + lowerChars + digitChars + specialChars;

  // Guarantee at least 2 of each category for maximum entropy and compliance
  const chars = [
    upperChars[crypto.randomInt(upperChars.length)],
    upperChars[crypto.randomInt(upperChars.length)],
    lowerChars[crypto.randomInt(lowerChars.length)],
    lowerChars[crypto.randomInt(lowerChars.length)],
    digitChars[crypto.randomInt(digitChars.length)],
    digitChars[crypto.randomInt(digitChars.length)],
    specialChars[crypto.randomInt(specialChars.length)],
    specialChars[crypto.randomInt(specialChars.length)],
  ];

  // Fill remaining characters
  for (let i = chars.length; i < effectiveLength; i++) {
    chars.push(allChars[crypto.randomInt(allChars.length)]);
  }

  // Fisher-Yates cryptographically secure shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
};

/**
 * Hash a plaintext password.
 *
 * @param {string} plaintext - The plaintext password to hash
 * @returns {Promise<string>} bcrypt hash
 */
export const hashPassword = async (plaintext) => {
  if (!plaintext || typeof plaintext !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
};

/**
 * Compare a plaintext password against a stored hash.
 *
 * @param {string} plaintext - The plaintext password attempt
 * @param {string} hash - The stored bcrypt hash
 * @returns {Promise<boolean>} true if match, false otherwise
 */
export const comparePassword = async (plaintext, hash) => {
  if (!plaintext || !hash) return false;
  return bcrypt.compare(plaintext, hash);
};

/**
 * Validate password strength.
 * Minimum: 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char.
 *
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
export const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one digit" };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one special character" };
  }
  return { valid: true, message: "Password is strong" };
};
