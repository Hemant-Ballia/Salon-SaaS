/**
 * src/middlewares/validate.middleware.js
 *
 * Zod-based request validation middleware factory.
 *
 * Usage:
 *   import { validate } from "../middlewares/validate.middleware.js";
 *   import { createBusinessSchema } from "../modules/businesses/businesses.validation.js";
 *
 *   router.post("/", authenticate, validate(createBusinessSchema), handler);
 *
 * Validates req.body by default.
 * Use validateQuery for req.query, validateParams for req.params.
 */

import { ZodError } from "zod";
import ApiError from "../utils/apiError.js";

/**
 * Format Zod errors into a clean field-error map for API responses.
 *
 * @param {ZodError} zodError
 * @returns {object} e.g. { email: "Invalid email", name: "Required" }
 */
const formatZodErrors = (zodError) => {
  const errors = {};
  for (const issue of zodError.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
};

/**
 * Validate req.body against a Zod schema.
 *
 * @param {import("zod").ZodTypeAny} schema - Zod schema
 * @returns {Function} Express middleware
 */
export const validate = (schema) => (req, _res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(
        ApiError.unprocessable(
          "Validation failed",
          "VALIDATION_ERROR",
          formatZodErrors(error)
        )
      );
    }
    next(error);
  }
};

/**
 * Validate req.query against a Zod schema.
 *
 * @param {import("zod").ZodTypeAny} schema
 * @returns {Function} Express middleware
 */
export const validateQuery = (schema) => (req, _res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(
        ApiError.unprocessable(
          "Invalid query parameters",
          "QUERY_VALIDATION_ERROR",
          formatZodErrors(error)
        )
      );
    }
    next(error);
  }
};

/**
 * Validate req.params against a Zod schema.
 *
 * @param {import("zod").ZodTypeAny} schema
 * @returns {Function} Express middleware
 */
export const validateParams = (schema) => (req, _res, next) => {
  try {
    req.params = schema.parse(req.params);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(
        ApiError.unprocessable(
          "Invalid URL parameters",
          "PARAMS_VALIDATION_ERROR",
          formatZodErrors(error)
        )
      );
    }
    next(error);
  }
};

export default validate;
