/**
 * src/modules/services/services.controller.js
 */

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from "../../utils/response.js";
import * as service from "./services.service.js";

export const createServiceController = asyncHandler(async (req, res) => {
  const result = await service.createService(req.body, req.user);
  return sendCreated(res, "Service created successfully.", result);
});

export const listServicesController = asyncHandler(async (req, res) => {
  const { services, pagination } = await service.listServices(req.query, req.user);
  return sendPaginated(res, "Services fetched.", services, pagination);
});

export const getServiceController = asyncHandler(async (req, res) => {
  const result = await service.getServiceById(req.params.id, req.user);
  return sendSuccess(res, "Service fetched.", result);
});

export const updateServiceController = asyncHandler(async (req, res) => {
  const result = await service.updateService(req.params.id, req.body, req.user);
  return sendSuccess(res, "Service updated.", result);
});

export const deleteServiceController = asyncHandler(async (req, res) => {
  await service.deleteService(req.params.id, req.user);
  return sendNoContent(res);
});

export const updateServiceStatusController = asyncHandler(async (req, res) => {
  const result = await service.updateServiceStatus(req.params.id, req.body, req.user);
  return sendSuccess(res, `Service ${req.body.isActive ? "activated" : "deactivated"}.`, result);
});
