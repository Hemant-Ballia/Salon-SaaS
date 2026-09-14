/**
 * src/utils/logger.js
 *
 * Lightweight application logger.
 *
 * In development: uses console with colour-coded levels.
 * In production:  uses structured JSON output.
 *
 * Rules:
 *   - NEVER log passwords, OTPs, tokens, or secrets.
 *   - NEVER log DATABASE_URL or connection strings.
 *   - Use logger.warn/error for issues that need attention.
 *   - Use logger.info for significant lifecycle events.
 *   - Use logger.debug for verbose dev-only tracing.
 */

import { IS_PRODUCTION, LOG_LEVEL } from "../config/env.js";

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const MIN_LEVEL = LEVELS[LOG_LEVEL] ?? (IS_PRODUCTION ? LEVELS.warn : LEVELS.debug);

// ANSI colour codes (dev only)
const COLOURS = {
  reset:  "\x1b[0m",
  red:    "\x1b[31m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
  grey:   "\x1b[90m",
};

const timestamp = () => new Date().toISOString();

const devLog = (level, colour, ...args) => {
  if (LEVELS[level] > MIN_LEVEL) return;
  const prefix = `${colour}[${level.toUpperCase()}]${COLOURS.reset} ${COLOURS.grey}${timestamp()}${COLOURS.reset}`;
  console[level === "debug" ? "log" : level](prefix, ...args);
};

const prodLog = (level, ...args) => {
  if (LEVELS[level] > MIN_LEVEL) return;
  const entry = {
    level,
    timestamp: timestamp(),
    message: args.map((a) => (typeof a === "object" ? JSON.stringify(a) : a)).join(" "),
  };
  console[level === "debug" ? "log" : level](JSON.stringify(entry));
};

const logger = {
  error: (...args) =>
    IS_PRODUCTION
      ? prodLog("error", ...args)
      : devLog("error", COLOURS.red, ...args),

  warn: (...args) =>
    IS_PRODUCTION
      ? prodLog("warn", ...args)
      : devLog("warn", COLOURS.yellow, ...args),

  info: (...args) =>
    IS_PRODUCTION
      ? prodLog("info", ...args)
      : devLog("info", COLOURS.cyan, ...args),

  debug: (...args) =>
    IS_PRODUCTION
      ? prodLog("debug", ...args)
      : devLog("debug", COLOURS.grey, ...args),

  /**
   * Log an HTTP request summary (used in production instead of morgan).
   */
  http: (req, statusCode, duration) => {
    const msg = `${req.method} ${req.originalUrl} ${statusCode} ${duration}ms`;
    if (statusCode >= 500) return logger.error(msg);
    if (statusCode >= 400) return logger.warn(msg);
    logger.info(msg);
  },
};

export default logger;
