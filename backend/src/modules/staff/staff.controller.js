/**
 * src/modules/staff/staff.controller.js
 */

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from "../../utils/response.js";
import * as service from "./staff.service.js";

export const createStaffController = asyncHandler(async (req, res) => {
  const result = await service.createStaff(req.body, req.user);
  return sendCreated(res, "Staff member added successfully.", result);
});

export const listStaffController = asyncHandler(async (req, res) => {
  const { staff, pagination } = await service.listStaff(req.query, req.user);
  return sendPaginated(res, "Staff list fetched.", staff, pagination);
});

export const getStaffController = asyncHandler(async (req, res) => {
  const result = await service.getStaffById(req.params.id, req.user);
  return sendSuccess(res, "Staff member fetched.", result);
});

export const updateStaffController = asyncHandler(async (req, res) => {
  const result = await service.updateStaff(req.params.id, req.body, req.user);
  return sendSuccess(res, "Staff member updated.", result);
});

export const deleteStaffController = asyncHandler(async (req, res) => {
  await service.deleteStaff(req.params.id, req.user);
  return sendNoContent(res);
});

export const updateStaffStatusController = asyncHandler(async (req, res) => {
  const result = await service.updateStaffStatus(req.params.id, req.body, req.user);
  return sendSuccess(res, "Staff status updated.", result);
});

export const updateStaffScheduleController = asyncHandler(async (req, res) => {
  const result = await service.updateStaffSchedule(req.params.id, req.body, req.user);
  return sendSuccess(res, "Staff schedule updated.", result);
});

export const getStaffAppointmentsController = asyncHandler(async (req, res) => {
  const { appointments, pagination } = await service.getStaffAppointments(req.params.id, req.query, req.user);
  return sendPaginated(res, "Staff appointments fetched.", appointments, pagination);
});

export const getStaffQueueController = asyncHandler(async (req, res) => {
  const result = await service.getStaffQueue(req.params.id, req.user);
  return sendSuccess(res, "Staff queue fetched.", result);
});

export const getStaffPerformanceController = asyncHandler(async (req, res) => {
  const result = await service.getStaffPerformance(req.params.id, req.user);
  return sendSuccess(res, "Staff performance fetched.", result);
});
