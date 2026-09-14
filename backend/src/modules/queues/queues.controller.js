/**
 * src/modules/queues/queues.controller.js
 */

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from "../../utils/response.js";
import * as service from "./queues.service.js";

export const joinQueueController = asyncHandler(async (req, res) => {
  const result = await service.joinQueue(req.body, req.user);
  return sendCreated(res, `Joined queue. Your token number is #${result.entry.tokenNumber}.`, result);
});

export const listQueueController = asyncHandler(async (req, res) => {
  const { entries, pagination } = await service.listQueueEntries(req.query, req.user);
  return sendPaginated(res, "Queue entries fetched.", entries, pagination);
});

export const getQueueEntryController = asyncHandler(async (req, res) => {
  const result = await service.getQueueEntryById(req.params.id, req.user);
  return sendSuccess(res, "Queue entry fetched.", result);
});

export const updateQueueEntryController = asyncHandler(async (req, res) => {
  const result = await service.updateQueueEntry(req.params.id, req.body, req.user);
  return sendSuccess(res, "Queue entry updated.", result);
});

export const leaveQueueController = asyncHandler(async (req, res) => {
  await service.leaveQueue(req.params.id, req.user);
  return sendNoContent(res);
});

export const callQueueEntryController = asyncHandler(async (req, res) => {
  const result = await service.callQueueEntry(req.params.id, req.user);
  return sendSuccess(res, `Token #${result.entry.tokenNumber} has been called.`, result);
});

export const serveQueueEntryController = asyncHandler(async (req, res) => {
  const result = await service.serveQueueEntry(req.params.id, req.user);
  return sendSuccess(res, `Token #${result.entry.tokenNumber} is now being served.`, result);
});

export const completeQueueEntryController = asyncHandler(async (req, res) => {
  const result = await service.completeQueueEntry(req.params.id, req.user);
  return sendSuccess(res, `Token #${result.entry.tokenNumber} service completed.`, result);
});

export const skipQueueEntryController = asyncHandler(async (req, res) => {
  const result = await service.skipQueueEntry(req.params.id, req.user);
  return sendSuccess(res, `Token #${result.entry.tokenNumber} has been skipped.`, result);
});

export const liveQueueController = asyncHandler(async (req, res) => {
  const result = await service.getLiveQueue(req.query);
  return sendSuccess(res, "Live queue fetched.", result);
});
