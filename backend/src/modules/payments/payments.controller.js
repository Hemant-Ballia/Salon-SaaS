/**
 * src/modules/payments/payments.controller.js
 */

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendCreated, sendPaginated } from "../../utils/response.js";
import * as service from "./payments.service.js";

export const createOrderController = asyncHandler(async (req, res) => {
  const result = await service.createOrder(req.body, req.user);
  const status = result.reused ? 200 : 201;
  const msg = result.reused ? "Existing order returned." : "Payment order created.";
  return status === 201 ? sendCreated(res, msg, result) : sendSuccess(res, msg, result);
});

export const verifyPaymentController = asyncHandler(async (req, res) => {
  const result = await service.verifyPayment(req.body, req.user);
  return sendSuccess(res, result.alreadyVerified ? "Payment already verified." : "Payment verified successfully.", result);
});

export const webhookController = asyncHandler(async (req, res) => {
  // req.body is raw buffer (configured in routes with express.raw)
  const rawBody = typeof req.body === "string" ? req.body : req.body.toString("utf8");
  const signature = req.headers["x-razorpay-signature"] || "";
  const result = await service.handleWebhook(rawBody, signature);
  return sendSuccess(res, "Webhook processed.", result);
});

export const listPaymentsController = asyncHandler(async (req, res) => {
  const { payments, pagination } = await service.listPayments(req.query, req.user);
  return sendPaginated(res, "Payments fetched.", payments, pagination);
});

export const getPaymentController = asyncHandler(async (req, res) => {
  const result = await service.getPaymentById(req.params.id, req.user);
  return sendSuccess(res, "Payment fetched.", result);
});

export const getPaymentStatusController = asyncHandler(async (req, res) => {
  const result = await service.getPaymentStatus(req.params.id, req.user);
  return sendSuccess(res, "Payment status fetched.", result);
});

export const refundPaymentController = asyncHandler(async (req, res) => {
  const result = await service.refundPayment(req.params.id, req.body, req.user);
  return sendSuccess(res, "Refund processed.", result);
});

export const paymentHistoryController = asyncHandler(async (req, res) => {
  const { payments, pagination } = await service.getPaymentHistory(req.query, req.user);
  return sendPaginated(res, "Payment history fetched.", payments, pagination);
});
