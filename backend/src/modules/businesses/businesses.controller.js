/**
 * src/modules/businesses/businesses.controller.js
 */

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from "../../utils/response.js";
import * as service from "./businesses.service.js";

export const createBusinessController = asyncHandler(async (req, res) => {
  const result = await service.createBusiness(req.body, req.user.userId);
  return sendCreated(res, "Business created successfully. Pending admin approval.", result);
});

export const listBusinessesController = asyncHandler(async (req, res) => {
  const { businesses, pagination } = await service.listBusinesses(req.query, req.user);
  return sendPaginated(res, "Businesses fetched successfully.", businesses, pagination);
});

export const getBusinessController = asyncHandler(async (req, res) => {
  const result = await service.getBusinessById(req.params.id, req.user);
  return sendSuccess(res, "Business fetched successfully.", result);
});

export const updateBusinessController = asyncHandler(async (req, res) => {
  const result = await service.updateBusiness(req.params.id, req.body, req.user);
  return sendSuccess(res, "Business updated successfully.", result);
});

export const deleteBusinessController = asyncHandler(async (req, res) => {
  await service.deleteBusiness(req.params.id, req.user);
  return sendNoContent(res);
});

export const updateBusinessStatusController = asyncHandler(async (req, res) => {
  const result = await service.updateBusinessStatus(req.params.id, req.body, req.user);
  return sendSuccess(res, `Business status updated to ${req.body.status}.`, result);
});

export const getBusinessDashboardController = asyncHandler(async (req, res) => {
  const result = await service.getBusinessDashboard(req.params.id, req.user);
  return sendSuccess(res, "Dashboard data fetched.", result);
});
