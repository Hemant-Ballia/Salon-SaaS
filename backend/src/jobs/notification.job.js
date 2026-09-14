/**
 * src/jobs/notification.job.js
 */

import { getQueue, createWorker } from "../config/bullmq.js";
import { getDB } from "../config/db.js";
import { sendEmail } from "../config/mailer.js";
import logger from "../utils/logger.js";
import { emitToCustomer } from "../config/socket.js";

const QUEUE_NAME = "notificationQueue";
export const notificationQueue = getQueue(QUEUE_NAME);

/**
 * Dispatches a notification to the background worker.
 */
export const dispatchNotification = async (type, userId, businessId, title, message, metadata = {}) => {
  await notificationQueue.add("send_notification", { type, userId, businessId, title, message, metadata });
};

// ── Worker ────────────────────────────────────────────────────────────────────

createWorker(QUEUE_NAME, async (job) => {
  const { type, userId, businessId, title, message, metadata } = job.data;
  const prisma = getDB();

  // 1. Fetch user & preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { notificationPreference: true },
  });

  if (!user) {
    logger.warn(`[Job:Notification] User ${userId} not found.`);
    return;
  }

  const prefs = user.notificationPreference || {};

  // 2. Persist IN_APP notification
  if (prefs.inAppEnabled !== false) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        businessId,
        type,
        title,
        message,
        metadata,
      },
    });
    
    // Emit real-time socket event
    emitToCustomer(userId, "notification:new", notification);
  }

  // 3. Email Delivery
  if (prefs.emailEnabled !== false) {
    try {
      await sendEmail({
        to: user.email,
        subject: title,
        text: message,
      });
      logger.info(`[Job:Notification] Email sent to ${user.email} (type: ${type})`);
    } catch (err) {
      logger.error(`[Job:Notification] Failed to send email to ${user.email}: ${err.message}`);
    }
  }

  // Note: SMS/WhatsApp would go here, checking prefs.smsEnabled / prefs.whatsappEnabled

}, 5); // concurrency: 5
