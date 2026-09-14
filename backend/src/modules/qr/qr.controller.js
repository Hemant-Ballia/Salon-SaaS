/**
 * src/modules/qr/qr.controller.js
 */

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendCreated } from "../../utils/response.js";
import * as service from "./qr.service.js";

// Helper to get origin for absolute URLs in QR codes
const getOrigin = (req) => `${req.protocol}://${req.get("host")}`;

export const generateBusinessQr = asyncHandler(async (req, res) => {
  const result = await service.generateBusinessQr(req.body, req.user, getOrigin(req));
  return sendCreated(res, "Business QR generated.", result);
});

export const generateServiceQr = asyncHandler(async (req, res) => {
  const result = await service.generateServiceQr(req.body, req.user, getOrigin(req));
  return sendCreated(res, "Service QR generated.", result);
});

export const getQrCode = asyncHandler(async (req, res) => {
  const result = await service.getQrCode(req.params.id, req.user);
  return sendSuccess(res, "QR fetched.", result);
});

export const deleteQrCode = asyncHandler(async (req, res) => {
  const result = await service.deleteQrCode(req.params.id, req.user);
  return sendSuccess(res, "QR deleted.", result);
});

export const scanQrCode = asyncHandler(async (req, res) => {
  const result = await service.scanQrCode(req.params.id);
  return sendSuccess(res, "QR scanned.", result);
});
