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

import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

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
