/**
 * src/utils/jwt.js
 *
 * JWT access and refresh token utilities.
 *
 * Token design:
 *   - Access token: short-lived (15m default), contains userId + role
 *   - Refresh token: long-lived (7d default), contains userId only
 *
 * Security rules:
 *   - Payload contains MINIMUM required info (userId, role).
 *   - Never put passwords, OTPs, or sensitive data in JWT.
 *   - Access secret !== refresh secret.
 *   - Tokens are verified server-side on every protected request.
 */

import jwt from "jsonwebtoken";
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} from "../config/env.js";
import ApiError from "./apiError.js";

// ── Token signing ─────────────────────────────────────────────────────────────

/**
 * Sign an access token.
 *
 * @param {{ userId: string, role: string }} payload
 * @returns {string} Signed JWT
 */
export const signAccessToken = (payload) => {
  if (!payload.userId || !payload.role) {
    throw new Error("Access token payload must contain userId and role");
  }
  return jwt.sign(
    { userId: payload.userId, role: payload.role },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES_IN }
  );
};

/**
 * Sign a refresh token.
 * Refresh token intentionally contains only userId to limit exposure.
 *
 * @param {{ userId: string }} payload
 * @returns {string} Signed JWT
 */
export const signRefreshToken = (payload) => {
  if (!payload.userId) {
    throw new Error("Refresh token payload must contain userId");
  }
  return jwt.sign(
    { userId: payload.userId },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

/**
 * Generate both access and refresh tokens for a user.
 *
 * @param {{ userId: string, role: string }} user
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export const generateTokenPair = (user) => {
  const accessToken = signAccessToken({ userId: user.userId, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.userId });
  return { accessToken, refreshToken };
};

// ── Token verification ────────────────────────────────────────────────────────

/**
 * Verify an access token.
 *
 * @param {string} token
 * @returns {{ userId: string, role: string, iat: number, exp: number }}
 * @throws {ApiError} 401 if invalid or expired
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Access token has expired", "TOKEN_EXPIRED");
    }
    if (error.name === "JsonWebTokenError") {
      throw ApiError.unauthorized("Invalid access token", "TOKEN_INVALID");
    }
    throw ApiError.unauthorized("Token verification failed", "TOKEN_ERROR");
  }
};

/**
 * Verify a refresh token.
 *
 * @param {string} token
 * @returns {{ userId: string, iat: number, exp: number }}
 * @throws {ApiError} 401 if invalid or expired
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Refresh token has expired. Please log in again.", "REFRESH_TOKEN_EXPIRED");
    }
    if (error.name === "JsonWebTokenError") {
      throw ApiError.unauthorized("Invalid refresh token", "REFRESH_TOKEN_INVALID");
    }
    throw ApiError.unauthorized("Refresh token verification failed", "REFRESH_TOKEN_ERROR");
  }
};

/**
 * Decode a token without verifying the signature.
 * Use only for inspecting token claims where verification already happened.
 *
 * @param {string} token
 * @returns {object|null}
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};

/**
 * Extract bearer token from Authorization header.
 *
 * @param {string|undefined} authHeader - "Bearer <token>"
 * @returns {string|null}
 */
export const extractBearerToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
};
