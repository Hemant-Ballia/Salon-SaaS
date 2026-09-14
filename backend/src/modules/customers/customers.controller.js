/**
 * src/modules/customers/customers.controller.js
 */

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from "../../utils/response.js";
import * as service from "./customers.service.js";

export const listCustomersController = asyncHandler(async (req, res) => {
  const { customers, pagination } = await service.listCustomers(req.query, req.user);
  return sendPaginated(res, "Customers fetched.", customers, pagination);
});

export const createCustomerController = asyncHandler(async (req, res) => {
  // Customers are created during auth registration.
  // This endpoint allows ADMIN to manually create a customer record if needed.
  return sendCreated(res, "Not implemented — customers are created via /auth/register.", null);
});

export const getCustomerController = asyncHandler(async (req, res) => {
  const result = await service.getCustomerById(req.params.id, req.user);
  return sendSuccess(res, "Customer fetched.", result);
});

export const updateCustomerController = asyncHandler(async (req, res) => {
  const result = await service.updateCustomer(req.params.id, req.body, req.user);
  return sendSuccess(res, "Customer updated.", result);
});

export const deleteCustomerController = asyncHandler(async (req, res) => {
  await service.deleteCustomer(req.params.id, req.user);
  return sendNoContent(res);
});

export const getCustomerAppointmentsController = asyncHandler(async (req, res) => {
  const { appointments, pagination } = await service.getCustomerAppointments(req.params.id, req.query, req.user);
  return sendPaginated(res, "Customer appointments fetched.", appointments, pagination);
});

export const getCustomerPaymentsController = asyncHandler(async (req, res) => {
  const { payments, pagination } = await service.getCustomerPayments(req.params.id, req.query, req.user);
  return sendPaginated(res, "Customer payments fetched.", payments, pagination);
});

export const getCustomerNotificationsController = asyncHandler(async (req, res) => {
  const { notifications, pagination } = await service.getCustomerNotifications(req.params.id, req.query, req.user);
  return sendPaginated(res, "Customer notifications fetched.", notifications, pagination);
});
