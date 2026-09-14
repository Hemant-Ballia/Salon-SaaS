/**
 * src/jobs/queue.job.js
 */

import { getQueue, createWorker } from "../config/bullmq.js";
import { getDB } from "../config/db.js";
import logger from "../utils/logger.js";
import { dispatchNotification } from "./notification.job.js";

const QUEUE_NAME = "queueAnalyticsQueue";
export const queueAnalyticsQueue = getQueue(QUEUE_NAME);

/**
 * Dispatches an async queue summary task (e.g. daily cleanup/stats).
 */
export const dispatchQueueCleanup = async (businessId) => {
  await queueAnalyticsQueue.add("cleanup_stale_queues", { businessId });
};

// ── Worker ────────────────────────────────────────────────────────────────────

createWorker(QUEUE_NAME, async (job) => {
  if (job.name === "cleanup_stale_queues") {
    const { businessId } = job.data;
    const prisma = getDB();

    // Mark WAITING/CALLED entries older than 24h as CANCELLED
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const staleEntries = await prisma.queueEntry.updateMany({
      where: {
        queue: { businessId },
        status: { in: ["WAITING", "CALLED"] },
        createdAt: { lt: yesterday }
      },
      data: { status: "CANCELLED" }
    });

    if (staleEntries.count > 0) {
      logger.info(`[Job:Queue] Cleaned up ${staleEntries.count} stale queue entries for biz ${businessId}`);
    }
  }
}, 1);
