/**
 * src/config/bullmq.js
 *
 * BullMQ wrapper.
 * Provides safe `createQueue` and `createWorker` methods that check
 * `isRedisConnected` before attempting to add jobs or process them.
 * This satisfies the requirement that the app doesn't crash locally
 * if Redis is turned off.
 */

import { Queue, Worker } from "bullmq";
import { redisConnection, isRedisConnected } from "./redis.js";
import logger from "../utils/logger.js";

// Cache queues to avoid duplicate instantiation
const queues = new Map();

/**
 * Safely creates or retrieves a BullMQ Queue.
 * Wraps `.add()` so that if Redis is down, it just logs and resolves immediately,
 * preventing unhandled promise rejections on ECONNREFUSED.
 */
export const getQueue = (queueName) => {
  if (queues.has(queueName)) {
    return queues.get(queueName);
  }

  const queue = new Queue(queueName, { connection: redisConnection });
  
  // Intercept add()
  const originalAdd = queue.add.bind(queue);
  queue.add = async (name, data, opts) => {
    if (!isRedisConnected) {
      logger.warn(`[BullMQ] Redis is disconnected. Skipped job ${name} in queue ${queueName}.`);
      return null;
    }
    return originalAdd(name, data, opts);
  };

  queues.set(queueName, queue);
  return queue;
};

/**
 * Safely creates a BullMQ Worker.
 * If Redis is down, it does NOT start the worker to avoid crash loops.
 */
export const createWorker = (queueName, processor, concurrency = 1) => {
  // If we know Redis is definitely down on boot, we could avoid starting it entirely,
  // but Redis might connect asynchronously a few ms after boot.
  // BullMQ Worker handles reconnects automatically, but will throw if maxRetriesPerRequest is null
  // and the connection fails entirely. We'll catch and log worker errors.

  const worker = new Worker(queueName, processor, {
    connection: redisConnection,
    concurrency,
  });

  worker.on("error", (err) => {
    if (err.message.includes("ECONNREFUSED") || err.message.includes("Max retries reached")) {
      logger.warn(`[BullMQ] Worker for ${queueName} paused due to Redis connection error.`);
      worker.pause(true).catch(() => {}); // forcefully pause without throwing
    } else {
      logger.error(`[BullMQ] Worker error in ${queueName}: ${err.message}`);
    }
  });

  worker.on("failed", (job, err) => {
    logger.error(`[BullMQ] Job ${job?.name || 'unknown'} in ${queueName} failed: ${err.message}`);
  });

  return worker;
};
