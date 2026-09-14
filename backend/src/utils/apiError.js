/**
 * src/utils/apiError.js
 *
 * Custom API error class.
 *
 * Usage:
 *   throw new ApiError(404, "Business not found", "BUSINESS_NOT_FOUND");
 *   throw ApiError.unauthorized("Invalid token");
 *   throw ApiError.forbidden("Access denied");
 */

export class ApiError extends Error {
  constructor(statusCode, message, code = null, details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code || ApiError.defaultCode(statusCode);
    this.details = details; // Optional extra context (e.g., Zod field errors)
    this.isOperational = true; // Distinguishes known app errors from unexpected ones

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  // ── Static factory methods ──────────────────────────────────────────────────

  static badRequest(message = "Bad request", code = "BAD_REQUEST", details = null) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = "Authentication required", code = "UNAUTHORIZED") {
    return new ApiError(401, message, code);
  }

  static forbidden(message = "You do not have permission to perform this action", code = "FORBIDDEN") {
    return new ApiError(403, message, code);
  }

  static notFound(message = "Resource not found", code = "NOT_FOUND") {
    return new ApiError(404, message, code);
  }

  static conflict(message = "Resource already exists", code = "CONFLICT") {
    return new ApiError(409, message, code);
  }

  static unprocessable(message = "Validation failed", code = "VALIDATION_ERROR", details = null) {
    return new ApiError(422, message, code, details);
  }

  static tooManyRequests(message = "Too many requests. Please try again later.", code = "RATE_LIMITED") {
    return new ApiError(429, message, code);
  }

  static internal(message = "Internal server error", code = "INTERNAL_ERROR") {
    return new ApiError(500, message, code);
  }

  static serviceUnavailable(message = "Service temporarily unavailable", code = "SERVICE_UNAVAILABLE") {
    return new ApiError(503, message, code);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  static defaultCode(statusCode) {
    const map = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "VALIDATION_ERROR",
      429: "RATE_LIMITED",
      500: "INTERNAL_ERROR",
      503: "SERVICE_UNAVAILABLE",
    };
    return map[statusCode] || "UNKNOWN_ERROR";
  }

  toJSON() {
    return {
      success: false,
      message: this.message,
      error: {
        code: this.code,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

export default ApiError;
