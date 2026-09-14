/**
 * src/jobs/payment.job.js
 */

import { getQueue, createWorker } from "../config/bullmq.js";
import { getDB } from "../config/db.js";
import logger from "../utils/logger.js";
import { getRazorpay } from "../config/razorpay.js";

const QUEUE_NAME = "paymentQueue";
export const paymentQueue = getQueue(QUEUE_NAME);

/**
 * Dispatches an async payment verification task (e.g. cron fallback if webhook missed).
 */
export const dispatchPaymentCheck = async (paymentId) => {
  await paymentQueue.add("verify_payment_status", { paymentId }, { delay: 60000 }); // check 1 min later
};

// ── Worker ────────────────────────────────────────────────────────────────────

createWorker(QUEUE_NAME, async (job) => {
  if (job.name === "verify_payment_status") {
    const { paymentId } = job.data;
    const prisma = getDB();

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, status: true, razorpayOrderId: true },
    });

    if (!payment || payment.status !== "CREATED" || !payment.razorpayOrderId) return;

    const rz = getRazorpay();
    if (!rz) return;

    try {
      // Fetch latest order status from Razorpay
      const rzOrder = await rz.orders.fetch(payment.razorpayOrderId);
      
      if (rzOrder.status === "paid" || rzOrder.status === "captured") {
        // Only update if webhook missed it
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: "PAID", updatedAt: new Date() },
        });
        logger.info(`[Job:Payment] Reconciled order ${payment.razorpayOrderId} to PAID.`);
      }
    } catch (err) {
      logger.error(`[Job:Payment] Failed to verify payment ${paymentId}: ${err.message}`);
    }
  }
}, 2); // concurrency: 2
