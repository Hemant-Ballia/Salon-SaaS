/**
 * src/middlewares/permission.middleware.js
 *
 * Fine-grained permission middleware.
 *
 * Must be used AFTER authenticate middleware — depends on req.user.role.
 *
 * This layer sits below role checks and provides granular action-level control.
 * A user may have the right role but still be denied a specific action if the
 * permission is not in their role's permission set.
 *
 * Usage:
 *   import { requirePermission } from "../middlewares/permission.middleware.js";
 *   import { PERMISSIONS } from "../utils/permissions.js";
 *
 *   router.post(
 *     "/businesses/:id/approve",
 *     authenticate,
 *     requirePermission(PERMISSIONS.BUSINESS_APPROVE),
 *     handler
 *   );
 *
 * Business isolation (businessId ownership) is a SEPARATE concern
 * handled inside each service layer — not here.
 */

import ApiError from "../utils/apiError.js";
import { hasPermission, hasAnyPermission } from "../utils/permissions.js";

/**
 * Middleware factory — requires the authenticated user to have a specific permission.
 *
 * @param {string} permission - PERMISSIONS constant
 * @returns {Function} Express middleware
 */
export const requirePermission = (permission) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required", "TOKEN_MISSING"));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(
        ApiError.forbidden(
          `You do not have the required permission: ${permission}`,
          "INSUFFICIENT_PERMISSION"
        )
      );
    }

    next();
  };
};

/**
 * Middleware factory — requires the user to have ANY of the given permissions.
 *
 * @param {string[]} permissions - Array of PERMISSIONS constants
 * @returns {Function} Express middleware
 */
export const requireAnyPermission = (permissions) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required", "TOKEN_MISSING"));
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      return next(
        ApiError.forbidden(
          "You do not have the required permissions to perform this action.",
          "INSUFFICIENT_PERMISSION"
        )
      );
    }

    next();
  };
};

/**
 * Business isolation guard.
 *
 * Checks that the authenticated user either:
 *   (a) is an ADMIN (can access all businesses), OR
 *   (b) is the BUSINESS owner of the business in req.params.businessId, OR
 *   (c) is a STAFF member assigned to that business.
 *
 * This middleware reads businessId from req.params.businessId.
 * It performs a DB lookup to verify the relationship — never trusts the request body.
 *
 * Usage:
 *   router.get("/:businessId/staff", authenticate, requireBusinessAccess, handler);
 */
export const requireBusinessAccess = async (req, _res, next) => {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required", "TOKEN_MISSING"));
    }

    const { role, userId } = req.user;

    // ADMIN has unrestricted access to all businesses
    if (role === "ADMIN") return next();

    const businessId = req.params.businessId || req.params.id;
    if (!businessId) {
      return next(ApiError.badRequest("businessId is required", "MISSING_BUSINESS_ID"));
    }

    const { getDB } = await import("../config/db.js");
    const prisma = getDB();

    if (role === "BUSINESS") {
      // Must own the business
      const business = await prisma.business.findFirst({
        where: { id: businessId, ownerId: userId, deletedAt: null },
        select: { id: true },
      });
      if (!business) {
        return next(ApiError.forbidden("You do not have access to this business.", "BUSINESS_ACCESS_DENIED"));
      }
      req.businessId = businessId;
      return next();
    }

    if (role === "STAFF") {
      // Must be assigned to this business
      const staff = await prisma.staff.findFirst({
        where: { businessId, userId, deletedAt: null },
        select: { id: true },
      });
      if (!staff) {
        return next(ApiError.forbidden("You are not a member of this business.", "BUSINESS_ACCESS_DENIED"));
      }
      req.businessId = businessId;
      req.staffId = staff.id;
      return next();
    }

    // CUSTOMER cannot access business management routes
    return next(ApiError.forbidden("Customers cannot access business management routes.", "BUSINESS_ACCESS_DENIED"));
  } catch (error) {
    next(error);
  }
};
