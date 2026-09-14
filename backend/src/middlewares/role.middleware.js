/**
 * src/middlewares/role.middleware.js
 *
 * Role-based access control middleware.
 *
 * Must be used AFTER authenticate middleware — depends on req.user.
 *
 * Usage:
 *   // Single role
 *   router.get("/admin", authenticate, requireRole("ADMIN"), handler);
 *
 *   // Multiple allowed roles
 *   router.get("/dashboard", authenticate, requireRole("ADMIN", "BUSINESS"), handler);
 *
 * Valid roles: ADMIN | BUSINESS | STAFF | CUSTOMER
 */

import ApiError from "../utils/apiError.js";
import { ROLES } from "../utils/permissions.js";

const VALID_ROLES = new Set(Object.values(ROLES));

/**
 * Middleware factory — returns middleware that allows only the specified roles.
 *
 * @param {...string} allowedRoles - One or more UserRole enum values
 * @returns {Function} Express middleware
 */
export const requireRole = (...allowedRoles) => {
  // Validate at startup — catch mistyped role names immediately
  for (const role of allowedRoles) {
    if (!VALID_ROLES.has(role)) {
      throw new Error(
        `requireRole: "${role}" is not a valid role. Valid roles: ${[...VALID_ROLES].join(", ")}`
      );
    }
  }

  const allowed = new Set(allowedRoles);

  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required", "TOKEN_MISSING"));
    }

    if (!allowed.has(req.user.role)) {
      return next(
        ApiError.forbidden(
          `This action requires one of the following roles: ${[...allowed].join(", ")}`,
          "INSUFFICIENT_ROLE"
        )
      );
    }

    next();
  };
};

/**
 * Convenience middleware — ADMIN only.
 */
export const requireAdmin = requireRole("ADMIN");

/**
 * Convenience middleware — ADMIN or BUSINESS.
 */
export const requireAdminOrBusiness = requireRole("ADMIN", "BUSINESS");

/**
 * Convenience middleware — ADMIN, BUSINESS, or STAFF.
 */
export const requireStaffOrAbove = requireRole("ADMIN", "BUSINESS", "STAFF");
