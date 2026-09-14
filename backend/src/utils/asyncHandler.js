/**
 * src/utils/asyncHandler.js
 *
 * Wraps async route handlers so unhandled rejections are forwarded
 * to Express's next(err) instead of crashing the process.
 *
 * Usage:
 *   router.get("/", asyncHandler(async (req, res) => { ... }));
 *
 * Without this, any `throw` or rejected Promise inside an async handler
 * would result in an unhandled rejection in Node.js.
 */

/**
 * @param {Function} fn - Async Express route handler
 * @returns {Function} Express middleware that catches async errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
