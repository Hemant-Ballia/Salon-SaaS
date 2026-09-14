/**
 * src/modules/notifications/notifications.controller.js
 */

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendPaginated } from "../../utils/response.js";
import * as service from "./notifications.service.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const { notifications, pagination } = await service.listNotifications(req.user.userId, req.query);
  return sendPaginated(res, "Notifications fetched.", notifications, pagination);
});

export const getNotification = asyncHandler(async (req, res) => {
  const result = await service.getNotificationById(req.user.userId, req.params.id);
  return sendSuccess(res, "Notification fetched.", result);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const result = await service.markAsRead(req.user.userId, req.params.id);
  return sendSuccess(res, "Notification marked as read.", result);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await service.markAllAsRead(req.user.userId);
  return sendSuccess(res, "All notifications marked as read.", result);
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const result = await service.deleteNotification(req.user.userId, req.params.id);
  return sendSuccess(res, "Notification deleted.", result);
});

export const getPreferences = asyncHandler(async (req, res) => {
  const result = await service.getPreferences(req.user.userId);
  return sendSuccess(res, "Preferences fetched.", result);
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const result = await service.updatePreferences(req.user.userId, req.body);
  return sendSuccess(res, "Preferences updated.", result);
});
