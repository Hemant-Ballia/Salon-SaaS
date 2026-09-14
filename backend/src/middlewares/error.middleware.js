/**
 * src/middlewares/error.middleware.js
 *
 * Centralised Express error handler.
 *
 * Must be registered LAST in app.js (after all routes).
 * Must have exactly 4 parameters — Express detects error handlers by arity.
 *
 * Handles:
 *   - ApiError (known operational errors — 4xx/5xx with structured codes)
 *   - Prisma errors (P2002 unique, P2025 not found, etc.)
 *   - Zod errors (if leaked past validate middleware)
 *   - Generic errors (unexpected — always 500)
 *
 * Rules:
 *   - NEVER expose stack traces in production.
 *   - NEVER expose internal Prisma error details in production.
 *   - Log unexpected errors (5xx) server-side.
 */

import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import ApiError from "../utils/apiError.js";
import logger from "../utils/logger.js";
import { IS_PRODUCTION } from "../config/env.js";

// ── Prisma error → ApiError conversion ───────────────────────────────────────

const handlePrismaError = (error) => {
  // Unique constraint violation
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        const fields = error.meta?.target?.join(", ") || "field";
        return ApiError.conflict(
          `A record with this ${fields} already exists.`,
          "DUPLICATE_ENTRY"
        );
      }
      case "P2025":
        return ApiError.notFound("Record not found.", "RECORD_NOT_FOUND");
      case "P2003":
        return ApiError.badRequest(
          "Operation failed: a referenced record does not exist.",
          "FOREIGN_KEY_VIOLATION"
        );
      case "P2014":
        return ApiError.badRequest(
          "The change you are trying to make would violate a required relation.",
          "RELATION_VIOLATION"
        );
      default:
        return ApiError.internal(
          IS_PRODUCTION ? "Database error." : `Prisma error ${error.code}: ${error.message}`
        );
    }
  }

  // Validation error from Prisma (e.g., wrong field type)
  if (error instanceof Prisma.PrismaClientValidationError) {
    return ApiError.badRequest(
      IS_PRODUCTION ? "Invalid request data." : error.message,
      "PRISMA_VALIDATION_ERROR"
    );
  }

  // Connection or unknown Prisma error
  if (error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientRustPanicError) {
    logger.error("Critical Prisma error:", error.message);
    return ApiError.serviceUnavailable("Database service is unavailable. Please try again.");
  }

  return null; // Not a Prisma error
};

// ── Main error handler ────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (error, req, res, next) => {
  // 1. Convert known error types to ApiError
  let apiError = error;

  if (!(error instanceof ApiError)) {
    // Try Prisma
    const prismaError = handlePrismaError(error);
    if (prismaError) {
      apiError = prismaError;
    }
    // Try Zod (leaked past validate middleware)
    else if (error instanceof ZodError) {
      const details = {};
      for (const issue of error.issues) {
        const path = issue.path.join(".");
        if (!details[path]) details[path] = issue.message;
      }
      apiError = ApiError.unprocessable("Validation failed", "VALIDATION_ERROR", details);
    }
    // CORS errors
    else if (error.message && error.message.startsWith("CORS:")) {
      apiError = new ApiError(403, error.message, "CORS_BLOCKED");
    }
    // Body-parser JSON syntax errors (malformed request body)
    // body-parser sets error.type = 'entity.parse.failed' on JSON parse errors
    else if (
      error instanceof SyntaxError &&
      (error.type === "entity.parse.failed" || error.status === 400)
    ) {
      apiError = ApiError.badRequest(
        "Invalid JSON in request body.",
        "INVALID_JSON"
      );
    }
    // All other unexpected errors
    else {
      apiError = ApiError.internal(
        IS_PRODUCTION ? "An unexpected error occurred." : error.message
      );
    }
  }

  // 2. Log server-side errors
  if (apiError.statusCode >= 500) {
    logger.error(
      `[${req.method}] ${req.originalUrl} → ${apiError.statusCode} ${apiError.code}:`,
      IS_PRODUCTION ? apiError.message : (error.stack || error.message)
    );
  } else if (apiError.statusCode >= 400) {
    logger.warn(
      `[${req.method}] ${req.originalUrl} → ${apiError.statusCode} ${apiError.code}: ${apiError.message}`
    );
  }

  // 3. Build response body
  const body = {
    success: false,
    message: apiError.message,
    error: {
      code: apiError.code,
    },
  };

  // Include field-level details (e.g., Zod validation errors)
  if (apiError.details) {
    body.error.details = apiError.details;
  }

  // Include stack trace only in development
  if (!IS_PRODUCTION && error.stack) {
    body.error.stack = error.stack;
  }

  res.status(apiError.statusCode).json(body);
};

export default errorMiddleware;
