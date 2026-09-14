/**
 * src/config/redis.js
 *
 * Configures ioredis with graceful fallback.
 * If Redis is unavailable, isRedisConnected is set to false,
 * preventing BullMQ from crashing the app during local dev.
 */

import Redis from "ioredis";
import { REDIS_URL } from "./env.js";
import logger from "../utils/logger.js";

// We maintain connection state explicitly
export let isRedisConnected = false;

// Configure tight timeout and limited retries so local dev doesn't hang forever
export const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  connectTimeout: 3000,
  retryStrategy(times) {
    // Retry up to 3 times, then stop to avoid infinite crash loops
    if (times > 3) {
      logger.warn("[Redis] Max retries reached. Disabling Redis functionality.");
      return null;
    }
    return Math.min(times * 100, 2000); // Backoff: 100ms, 200ms, 300ms
  },
});

redisConnection.on("connect", () => {
  isRedisConnected = true;
  logger.info("[Redis] Connected successfully.");
});

redisConnection.on("error", (error) => {
  if (isRedisConnected) {
    logger.warn(`[Redis] Connection error: ${error.message}`);
  }
  isRedisConnected = false;
});

export default redisConnection;
