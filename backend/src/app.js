/**
 * src/app.js
 *
 * Express application factory — Step 3 (complete foundation).
 *
 * Middleware order (critical — do not reorder without good reason):
 *   1.  Trust proxy (production reverse proxy support)
 *   2.  Security headers (Helmet)
 *   3.  CORS
 *   4.  Body parsing (JSON, URL-encoded, cookies)
 *   5.  HTTP request logging (Morgan)
 *   6.  General rate limiting (applied globally — specific routes add tighter limits)
 *   7.  Public health endpoints (no auth, no rate limit)
 *   8.  Global Health Check
 *   9.  404 handler
 *   10. Centralised error handler (MUST be last)
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import {
  CORS_ORIGIN,
  API_VERSION,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
} from "./config/env.js";

import apiRouter from "./routes/index.js";
import notFoundMiddleware from "./middlewares/notFound.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import { generalLimiter } from "./middlewares/rateLimit.middleware.js";

// ── Create app ────────────────────────────────────────────────────────────────

const app = express();

// ── 1. Trust proxy ────────────────────────────────────────────────────────────
// Required when running behind Nginx, Heroku, Render, Railway, etc.
// Ensures req.ip returns the real client IP from X-Forwarded-For,
// which rate limiters and audit logs depend on.
if (IS_PRODUCTION) {
  app.set("trust proxy", 1);
}

// ── 2. Security headers (Helmet) ──────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow media from CDN
    contentSecurityPolicy: IS_PRODUCTION
      ? undefined  // use Helmet defaults in production
      : false,     // disable CSP in development (avoids blocking Prisma studio, etc.)
  })
);

// ── 3. CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = CORS_ORIGIN
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (Postman, cURL, webhooks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(
        Object.assign(new Error(`CORS: Origin '${origin}' is not allowed.`), {
          statusCode: 403,
          code: "CORS_BLOCKED",
        })
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Razorpay-Signature", // for Razorpay webhook verification
    ],
    exposedHeaders: ["X-Total-Count"], // useful for pagination
  })
);

// ── 4. Body parsing ───────────────────────────────────────────────────────────
// Raw body needed for Razorpay webhook signature verification.
// We keep a raw body buffer on the request for the webhook route.
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      // Store raw body for webhook signature verification
      if (req.originalUrl === `/api/${API_VERSION}/payments/webhook`) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── 5. HTTP request logging ───────────────────────────────────────────────────
if (IS_DEVELOPMENT) {
  app.use(morgan("dev"));
} else {
  // Skip health check logs in production (too noisy)
  app.use(
    morgan("combined", {
      skip: (req, res) =>
        req.originalUrl === "/api/health" && res.statusCode === 200,
    })
  );
}

// ── 6. Global rate limiting ───────────────────────────────────────────────────
// Applied to all routes. Individual routes add tighter limits on top.
app.use(`/api/${API_VERSION}`, generalLimiter);

// ── 7. Public health endpoints ────────────────────────────────────────────────
// These must be registered BEFORE the versioned router to avoid auth middleware.
// No authentication. No rate limiting (health checks must always succeed).

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Salon SaaS API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ── 8. Versionedapp.get("/api/health", (req, res) => res.status(200).json({ status: "OK", timestamp: new Date() }));

// ── 8. API Router ────────────────────────────────────────────────────────────

app.use(`/api/${API_VERSION}`, apiRouter);

// ── 9. 404 handler ────────────────────────────────────────────────────────────
// Catches any request that didn't match a route above.
app.use(notFoundMiddleware);

// ── 10. Centralised error handler ─────────────────────────────────────────────
// MUST be last. Express identifies error handlers by their 4-arg signature.
app.use(errorMiddleware);

export default app;
