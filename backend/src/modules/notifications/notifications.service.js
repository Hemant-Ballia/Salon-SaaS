/**
 * src/modules/notifications/notifications.service.js
 */

import { getDB } from "../../config/db.js";
import { paginate } from "../../utils/pagination.js";
import ApiError from "../../utils/apiError.js";

// ── Notifications CRUD ────────────────────────────────────────────────────────

export const listNotifications = async (userId, query) => {
  const prisma = getDB();
  const { skip, take, orderBy, meta } = paginate(query, ["createdAt", "isRead"]);

  const where = { userId };
  if (query.isRead !== undefined) where.isRead = query.isRead;

  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({ where, skip, take, orderBy }),
    prisma.notification.count({ where }),
  ]);

  return { notifications, pagination: meta(total) };
};

export const getNotificationById = async (userId, id) => {
  const prisma = getDB();
  const notification = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notification) throw ApiError.notFound("Notification not found.");
  return { notification };
};

export const markAsRead = async (userId, id) => {
  const prisma = getDB();
  const exists = await prisma.notification.findFirst({ where: { id, userId } });
  if (!exists) throw ApiError.notFound("Notification not found.");

  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
  return { notification };
};

export const markAllAsRead = async (userId) => {
  const prisma = getDB();
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { count: result.count };
};

export const deleteNotification = async (userId, id) => {
  const prisma = getDB();
  const exists = await prisma.notification.findFirst({ where: { id, userId } });
  if (!exists) throw ApiError.notFound("Notification not found.");

  await prisma.notification.delete({ where: { id } });
  return { deleted: true };
};

// ── Preferences ───────────────────────────────────────────────────────────────

export const getPreferences = async (userId) => {
  const prisma = getDB();
  let prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  
  if (!prefs) {
    prefs = await prisma.notificationPreference.create({ data: { userId } });
  }
  return { preferences: prefs };
};

export const updatePreferences = async (userId, data) => {
  const prisma = getDB();
  let prefs = await prisma.notificationPreference.findUnique({ where: { userId } });

  if (!prefs) {
    prefs = await prisma.notificationPreference.create({ data: { userId, ...data } });
  } else {
    prefs = await prisma.notificationPreference.update({
      where: { userId },
      data,
    });
  }
  return { preferences: prefs };
};
