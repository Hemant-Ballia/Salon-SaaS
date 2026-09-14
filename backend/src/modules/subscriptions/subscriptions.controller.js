/**
 * src/modules/subscriptions/subscriptions.controller.js
 */

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendCreated, sendPaginated } from "../../utils/response.js";
import * as service from "./subscriptions.service.js";

export const createSubscriptionController = asyncHandler(async (req, res) => {
  const result = await service.createSubscription(req.body, req.user);
  return sendCreated(res, "Subscription created.", result);
});

export const listSubscriptionsController = asyncHandler(async (req, res) => {
  const { subscriptions, pagination } = await service.listSubscriptions(req.query, req.user);
  return sendPaginated(res, "Subscriptions fetched.", subscriptions, pagination);
});

export const getSubscriptionController = asyncHandler(async (req, res) => {
  const result = await service.getSubscriptionById(req.params.id, req.user);
  return sendSuccess(res, "Subscription fetched.", result);
});

export const updateSubscriptionController = asyncHandler(async (req, res) => {
  const result = await service.updateSubscription(req.params.id, req.body, req.user);
  return sendSuccess(res, "Subscription updated.", result);
});

export const getCurrentSubscriptionController = asyncHandler(async (req, res) => {
  const result = await service.getCurrentSubscription(req.user);
  return sendSuccess(res, "Current subscription fetched.", result);
});
