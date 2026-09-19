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

// Registered worker definitions waiting for or running with Redis
const registeredWorkers = [];

/**
 * Instantiates a BullMQ worker on an active Redis connection.
 */
const startWorkerInstance = (def) => {
  if (def.instance) {
    def.instance.resume().catch(() => {});
    return def.instance;
  }

  const worker = new Worker(def.queueName, def.processor, {
    connection: redisConnection,
    concurrency: def.concurrency,
  });

  worker.on("error", (err) => {
    if (err.message?.includes("ECONNREFUSED") || err.message?.includes("Max retries reached")) {
      logger.warn(`[BullMQ] Worker for ${def.queueName} paused due to Redis connection error.`);
      worker.pause(true).catch(() => {});
    } else {
      logger.error(`[BullMQ] Worker error in ${def.queueName}: ${err.message}`);
    }
  });

  worker.on("failed", (job, err) => {
    logger.error(`[BullMQ] Job ${job?.name || "unknown"} in ${def.queueName} failed: ${err.message}`);
  });

  def.instance = worker;
  return worker;
};

// When Redis successfully connects, initialize all registered workers
redisConnection.on("connect", () => {
  for (const def of registeredWorkers) {
    startWorkerInstance(def);
  }
});

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

  queue.on("error", (err) => {
    if (!isRedisConnected) return;
    logger.error(`[BullMQ] Queue error in ${queueName}: ${err.message}`);
  });
  
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
 * Defers worker creation until Redis is confirmed connected.
 * If Redis is unavailable, returns a safe handle and does NOT instantiate
 * a BullMQ Worker to prevent duplicate connection errors and crash loops.
 */
export const createWorker = (queueName, processor, concurrency = 1) => {
  const def = { queueName, processor, concurrency, instance: null };
  registeredWorkers.push(def);

  if (isRedisConnected) {
    return startWorkerInstance(def);
  }

  // Return a safe handle with no-op/proxy methods if Redis is not yet connected
  return {
    pause: async (...args) => def.instance?.pause(...args),
    resume: async (...args) => def.instance?.resume(...args),
    close: async (...args) => def.instance?.close(...args),
  };
};
