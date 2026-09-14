/**
 * src/middlewares/auth.middleware.js
 *
 * JWT authentication middleware.
 *
 * Extracts and verifies the access token from the Authorization header.
 * On success, attaches req.user = { userId, role } for downstream use.
 * On failure, throws ApiError(401).
 *
 * Usage:
 *   router.get("/protected", authenticate, handler);
 *
 * Optional usage (auth if token present, continue if not):
 *   router.get("/public", optionalAuthenticate, handler);
 */

import { extractBearerToken, verifyAccessToken } from "../utils/jwt.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getDB } from "../config/db.js";

/**
 * Required authentication middleware.
 * Rejects the request if no valid access token is provided.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  // 1. Extract token from Authorization header
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    throw ApiError.unauthorized(
      "Authentication required. Provide a Bearer token in the Authorization header.",
      "TOKEN_MISSING"
    );
  }

  // 2. Verify token signature and expiry
  const decoded = verifyAccessToken(token); // throws ApiError on failure

  // 3. Verify user still exists and is active in the database
  //    This prevents tokens from being valid after account suspension/deletion.
  const prisma = getDB();
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      deletedAt: true,
    },
  });

  if (!user || !user.isActive || user.deletedAt) {
    throw ApiError.unauthorized(
      "Account not found or has been deactivated.",
      "ACCOUNT_INACTIVE"
    );
  }

  // 4. Attach clean user context to request
  req.user = {
    userId: user.id,
    role: user.role,
  };

  next();
});

/**
 * Optional authentication middleware.
 * Attaches req.user if a valid token is present, but does NOT reject
 * the request if no token is provided. Useful for public endpoints that
 * have enhanced behaviour for authenticated users.
 */
export const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const prisma = getDB();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true, deletedAt: true },
    });

    req.user = user && user.isActive && !user.deletedAt
      ? { userId: user.id, role: user.role }
      : null;
  } catch {
    req.user = null;
  }

  next();
});
