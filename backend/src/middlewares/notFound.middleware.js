/**
 * src/middlewares/notFound.middleware.js
 *
 * 404 handler — catches all requests that don't match any registered route.
 *
 * Must be registered AFTER all routes and BEFORE the error middleware in app.js.
 * Creates an ApiError and passes it to the error middleware via next(err).
 */

import ApiError from "../utils/apiError.js";

const notFoundMiddleware = (req, _res, next) => {
  next(
    ApiError.notFound(
      `Route not found: ${req.method} ${req.originalUrl}`,
      "ROUTE_NOT_FOUND"
    )
  );
};

export default notFoundMiddleware;
