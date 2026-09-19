/**
 * src/config/redis.js
 *
 * Configures ioredis with graceful fallback.
 * If Redis is unavailable, isRedisConnected is set to false,
 * preventing BullMQ from crashing the app during local dev.
 */

import Redis from "ioredis";
import { REDIS_URL, IS_DEVELOPMENT } from "./env.js";
import logger from "../utils/logger.js";

// We maintain connection state explicitly
export let isRedisConnected = false;
let hasLoggedUnavailable = false;

// Configure tight timeout and limited retries so local dev doesn't hang forever
export const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  connectTimeout: 3000,
  enableOfflineQueue: false,
  retryStrategy(times) {
    if (IS_DEVELOPMENT) {
      // In development, stop retrying quickly if Redis is not running to avoid hanging or log spam
      if (times > 1) {
        return null;
      }
      return 200;
    }
    // In production, backoff and retry up to 5 times
    if (times > 5) {
      return null;
    }
    return Math.min(times * 500, 3000);
  },
});

redisConnection.on("connect", () => {
  isRedisConnected = true;
  hasLoggedUnavailable = false;
  logger.info("[Redis] Connected successfully.");
});

redisConnection.on("error", (error) => {
  const reason = error.code || error.message || "Unknown error";
  if (!isRedisConnected && !hasLoggedUnavailable) {
    hasLoggedUnavailable = true;
    logger.warn(`[Redis] Connection failed: ${reason}`);
    logger.warn(
      "[Redis] Redis is unavailable. Background queues and workers are disabled for this development session."
    );
  } else if (isRedisConnected) {
    logger.warn(`[Redis] Connection error: ${reason}`);
  }
  isRedisConnected = false;
});

export default redisConnection;
