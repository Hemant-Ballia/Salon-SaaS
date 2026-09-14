/**
 * src/utils/response.js
 *
 * Standardised API response helpers.
 *
 * All API responses must use these helpers — never call res.json() directly.
 *
 * Success format:
 *   { success: true, message: "...", data: {...} }
 *
 * Paginated format:
 *   { success: true, message: "...", data: [...], pagination: {...} }
 *
 * Error format:
 *   { success: false, message: "...", error: { code: "..." } }
 */

// ── Success responses ─────────────────────────────────────────────────────────

/**
 * Send a success response.
 *
 * @param {object} res - Express response object
 * @param {string} message - Human-readable success message
 * @param {*} data - Response payload
 * @param {number} [statusCode=200] - HTTP status code
 */
export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const body = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    body.data = data;
  }

  return res.status(statusCode).json(body);
};

/**
 * Send a paginated success response.
 *
 * @param {object} res - Express response object
 * @param {string} message - Human-readable success message
 * @param {Array} data - Array of records
 * @param {object} pagination - Pagination metadata from getPaginationMeta()
 * @param {number} [statusCode=200] - HTTP status code
 */
export const sendPaginated = (res, message, data, pagination, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
};

/**
 * Send a 201 Created response.
 */
export const sendCreated = (res, message, data = null) => {
  return sendSuccess(res, message, data, 201);
};

/**
 * Send a 204 No Content response.
 */
export const sendNoContent = (res) => {
  return res.status(204).send();
};

// ── Error responses ───────────────────────────────────────────────────────────

/**
 * Send an error response.
 * Prefer throwing ApiError and letting error.middleware.js handle it.
 * Use this only for edge cases where you need direct control.
 *
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {string} [code="INTERNAL_ERROR"] - Machine-readable error code
 * @param {*} [details=null] - Optional additional error details
 */
export const sendError = (
  res,
  message,
  statusCode = 500,
  code = "INTERNAL_ERROR",
  details = null
) => {
  const body = {
    success: false,
    message,
    error: { code },
  };

  if (details) {
    body.error.details = details;
  }

  return res.status(statusCode).json(body);
};
