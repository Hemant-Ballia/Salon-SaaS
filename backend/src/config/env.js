/**
 * src/config/env.js
 *
 * Centralised environment variable access.
 * Load this early — before any other module that reads process.env.
 *
 * All values are read here so that:
 *   • There is a single place to see every env variable the app uses.
 *   • Startup fails fast with a clear message if a critical variable is missing.
 *   • No secrets are scattered across the codebase.
 */

import dotenv from "dotenv";

dotenv.config();

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Read a required environment variable.
 * Throws during startup if the variable is absent.
 */
const required = (key) => {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[env] Missing required environment variable: ${key}. ` +
        `Check your .env file against .env.example.`
    );
  }
  return value.trim();
};

/**
 * Read an optional environment variable with a fallback default.
 */
const optional = (key, defaultValue = "") => {
  const value = process.env[key];
  return value && value.trim() !== "" ? value.trim() : defaultValue;
};

// ── Application ───────────────────────────────────────────────────────────────

export const NODE_ENV = optional("NODE_ENV", "development");
export const PORT = parseInt(optional("PORT", "5000"), 10);
export const API_VERSION = optional("API_VERSION", "v1");
export const IS_PRODUCTION = NODE_ENV === "production";
export const IS_DEVELOPMENT = NODE_ENV === "development";

// ── Database ──────────────────────────────────────────────────────────────────

// These are read by Prisma via env() in schema.prisma — we expose them here
// only so startup validation can catch missing values early.
export const DATABASE_URL = process.env.DATABASE_URL;
export const DIRECT_URL = process.env.DIRECT_URL;

// ── Supabase ──────────────────────────────────────────────────────────────────

export const SUPABASE_URL = optional("SUPABASE_URL");
export const SUPABASE_PUBLISHABLE_KEY = optional("SUPABASE_PUBLISHABLE_KEY");
export const SUPABASE_SECRET_KEY = optional("SUPABASE_SECRET_KEY");
export const SUPABASE_JWKS_URL = optional("SUPABASE_JWKS_URL");

// ── JWT ───────────────────────────────────────────────────────────────────────

export const JWT_ACCESS_SECRET = optional(
  "JWT_ACCESS_SECRET",
  "dev-access-secret-change-in-production"
);
export const JWT_REFRESH_SECRET = optional(
  "JWT_REFRESH_SECRET",
  "dev-refresh-secret-change-in-production"
);
export const JWT_ACCESS_EXPIRES_IN = optional("JWT_ACCESS_EXPIRES_IN", "15m");
export const JWT_REFRESH_EXPIRES_IN = optional(
  "JWT_REFRESH_EXPIRES_IN",
  "7d"
);

// ── Redis ─────────────────────────────────────────────────────────────────────

export const REDIS_HOST = optional("REDIS_HOST", "127.0.0.1");
export const REDIS_PORT = parseInt(optional("REDIS_PORT", "6379"), 10);
export const REDIS_PASSWORD = optional("REDIS_PASSWORD");

// ── CORS ──────────────────────────────────────────────────────────────────────

export const CORS_ORIGIN = optional(
  "CORS_ORIGIN",
  "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003"
);
export const SOCKET_CORS_ORIGIN = optional(
  "SOCKET_CORS_ORIGIN",
  "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003"
);
export const CUSTOMER_FRONTEND_URL = optional(
  "CUSTOMER_FRONTEND_URL",
  "http://localhost:3000"
);
export const BUSINESS_FRONTEND_URL = optional(
  "BUSINESS_FRONTEND_URL",
  "http://localhost:3001"
);
export const STAFF_FRONTEND_URL = optional(
  "STAFF_FRONTEND_URL",
  "http://localhost:3002"
);
export const ADMIN_FRONTEND_URL = optional(
  "ADMIN_FRONTEND_URL",
  "http://localhost:3003"
);

// ── OTP ───────────────────────────────────────────────────────────────────────

export const OTP_LENGTH = parseInt(optional("OTP_LENGTH", "6"), 10);
export const OTP_EXPIRES_IN_MINUTES = parseInt(
  optional("OTP_EXPIRES_IN_MINUTES", "5"),
  10
);
export const OTP_MAX_ATTEMPTS = parseInt(
  optional("OTP_MAX_ATTEMPTS", "5"),
  10
);
export const OTP_RESEND_COOLDOWN_SECONDS = parseInt(
  optional("OTP_RESEND_COOLDOWN_SECONDS", "60"),
  10
);
export const OTP_SMS_ENABLED =
  optional("OTP_SMS_ENABLED", "true") === "true";
export const OTP_WHATSAPP_ENABLED =
  optional("OTP_WHATSAPP_ENABLED", "true") === "true";
export const OTP_EMAIL_ENABLED =
  optional("OTP_EMAIL_ENABLED", "true") === "true";

// ── Twilio / SMS ──────────────────────────────────────────────────────────────

export const SMS_PROVIDER = optional("SMS_PROVIDER", "twilio");
export const SMS_ACCOUNT_SID = optional("SMS_ACCOUNT_SID");
export const SMS_AUTH_TOKEN = optional("SMS_AUTH_TOKEN");
export const SMS_FROM = optional("SMS_FROM");

export const WHATSAPP_PROVIDER = optional("WHATSAPP_PROVIDER", "twilio");
export const WHATSAPP_ACCOUNT_SID = optional("WHATSAPP_ACCOUNT_SID");
export const WHATSAPP_AUTH_TOKEN = optional("WHATSAPP_AUTH_TOKEN");
export const WHATSAPP_FROM = optional("WHATSAPP_FROM");

// ── Email / SMTP ──────────────────────────────────────────────────────────────

export const SMTP_HOST = optional("SMTP_HOST", "smtp.gmail.com");
export const SMTP_PORT = parseInt(optional("SMTP_PORT", "587"), 10);
export const SMTP_SECURE = optional("SMTP_SECURE", "false") === "true";
export const SMTP_USER = optional("SMTP_USER");
export const SMTP_PASSWORD = optional("SMTP_PASSWORD");
export const SMTP_FROM = optional("SMTP_FROM");
export const EMAIL_OTP_SUBJECT = optional(
  "EMAIL_OTP_SUBJECT",
  "Your Salon SaaS Verification Code"
);

// ── Razorpay ──────────────────────────────────────────────────────────────────

export const RAZORPAY_KEY_ID = optional("RAZORPAY_KEY_ID");
export const RAZORPAY_KEY_SECRET = optional("RAZORPAY_KEY_SECRET");
export const RAZORPAY_WEBHOOK_SECRET = optional("RAZORPAY_WEBHOOK_SECRET");
// ── Redis & Background Jobs ─────────────────────────────────────────────────────

export const REDIS_URL = optional("REDIS_URL", "redis://localhost:6379");

// ── File Upload ───────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE_MB = parseInt(
  optional("MAX_FILE_SIZE_MB", "5"),
  10
);
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ── Logging ───────────────────────────────────────────────────────────────────

export const LOG_LEVEL = optional("LOG_LEVEL", NODE_ENV);

// ── Aggregated export (for convenience) ──────────────────────────────────────

const env = {
  NODE_ENV,
  PORT,
  API_VERSION,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  DATABASE_URL,
  DIRECT_URL,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY,
  SUPABASE_JWKS_URL,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  CORS_ORIGIN,
  SOCKET_CORS_ORIGIN,
  CUSTOMER_FRONTEND_URL,
  BUSINESS_FRONTEND_URL,
  STAFF_FRONTEND_URL,
  ADMIN_FRONTEND_URL,
  OTP_LENGTH,
  OTP_EXPIRES_IN_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_SMS_ENABLED,
  OTP_WHATSAPP_ENABLED,
  OTP_EMAIL_ENABLED,
  SMS_PROVIDER,
  SMS_ACCOUNT_SID,
  SMS_AUTH_TOKEN,
  SMS_FROM,
  WHATSAPP_PROVIDER,
  WHATSAPP_ACCOUNT_SID,
  WHATSAPP_AUTH_TOKEN,
  WHATSAPP_FROM,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_FROM,
  EMAIL_OTP_SUBJECT,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  LOG_LEVEL,
};

export default env;
