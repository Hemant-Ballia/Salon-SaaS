/**
 * src/modules/qr/qr.service.js
 */

import crypto from "node:crypto";
import QRCode from "qrcode";
import { getDB } from "../../config/db.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

const generateToken = () => crypto.randomBytes(16).toString("hex");

// ── Helpers ───────────────────────────────────────────────────────────────────

const resolveCallerBusinessId = async (caller, requestedBizId = null) => {
  const prisma = getDB();

  if (caller.role === "ADMIN") {
    if (!requestedBizId) throw ApiError.badRequest("businessId is required for ADMIN.");
    return requestedBizId;
  }

  if (caller.role === "BUSINESS") {
    const biz = await prisma.business.findFirst({ where: { ownerId: caller.userId, deletedAt: null }, select: { id: true } });
    if (!biz) throw ApiError.notFound("Business not found.");
    return biz.id;
  }

  throw ApiError.forbidden("Access denied.");
};

// ── Generate QR ───────────────────────────────────────────────────────────────

export const generateBusinessQr = async (data, caller, origin) => {
  const prisma = getDB();
  const businessId = await resolveCallerBusinessId(caller, data.businessId);

  const token = generateToken();
  const targetUrl = `${origin}/booking/${businessId}`;

  const qrImageUrl = await QRCode.toDataURL(targetUrl);

  const qrCode = await prisma.qrCode.create({
    data: {
      businessId,
      type: "BUSINESS",
      token,
      targetUrl,
      qrImageUrl,
    },
  });

  logger.info(`[QR] Generated BUSINESS QR for ${businessId}`);
  return { qrCode };
};

export const generateServiceQr = async (data, caller, origin) => {
  const prisma = getDB();
  
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
    select: { id: true, businessId: true }
  });
  if (!service) throw ApiError.notFound("Service not found.");

  // verify caller owns this business
  if (caller.role !== "ADMIN") {
    const callerBizId = await resolveCallerBusinessId(caller);
    if (service.businessId !== callerBizId) throw ApiError.forbidden("You cannot generate a QR for this service.");
  }

  const token = generateToken();
  const targetUrl = `${origin}/booking/${service.businessId}?serviceId=${service.id}`;

  const qrImageUrl = await QRCode.toDataURL(targetUrl);

  const qrCode = await prisma.qrCode.create({
    data: {
      businessId: service.businessId,
      serviceId: service.id,
      type: "SERVICE",
      token,
      targetUrl,
      qrImageUrl,
    },
  });

  logger.info(`[QR] Generated SERVICE QR for ${service.id}`);
  return { qrCode };
};

// ── Get & Delete ──────────────────────────────────────────────────────────────

export const getQrCode = async (id, caller) => {
  const prisma = getDB();
  const qrCode = await prisma.qrCode.findUnique({ where: { id } });
  if (!qrCode || qrCode.deletedAt) throw ApiError.notFound("QR Code not found.");

  if (caller.role !== "ADMIN") {
    const callerBizId = await resolveCallerBusinessId(caller);
    if (qrCode.businessId !== callerBizId) throw ApiError.forbidden("Access denied.");
  }

  return { qrCode };
};

export const deleteQrCode = async (id, caller) => {
  const prisma = getDB();
  const qrCode = await prisma.qrCode.findUnique({ where: { id } });
  if (!qrCode || qrCode.deletedAt) throw ApiError.notFound("QR Code not found.");

  if (caller.role !== "ADMIN") {
    const callerBizId = await resolveCallerBusinessId(caller);
    if (qrCode.businessId !== callerBizId) throw ApiError.forbidden("Access denied.");
  }

  await prisma.qrCode.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  return { deleted: true };
};

// ── Scan ──────────────────────────────────────────────────────────────────────

/**
 * Scanning a QR code is a public action.
 * It increments the scan count and returns the target URL so the client can redirect.
 */
export const scanQrCode = async (id) => {
  const prisma = getDB();
  
  // Note: scanning can be done by token or by ID. The route specifies /:id/scan.
  const qrCode = await prisma.qrCode.findUnique({ where: { id } });
  
  if (!qrCode || !qrCode.isActive || qrCode.deletedAt) {
    throw ApiError.notFound("QR Code is invalid, inactive, or has been deleted.");
  }

  // Increment scan count asynchronously to not block the request
  prisma.qrCode.update({
    where: { id },
    data: { scanCount: { increment: 1 } },
  }).catch(err => logger.error(`[QR] Failed to increment scan count for ${id}: ${err.message}`));

  return { targetUrl: qrCode.targetUrl, type: qrCode.type, businessId: qrCode.businessId, serviceId: qrCode.serviceId };
};
