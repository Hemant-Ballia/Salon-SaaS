/**
 * src/modules/qr/qr.service.js
 */

import crypto from "node:crypto";
import QRCode from "qrcode";
import { getDB } from "../../config/db.js";
import { CUSTOMER_FRONTEND_URL } from "../../config/env.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

/**
 * Generate a clean, brand-aware, cryptographically secure token.
 * Example: BLUSH-8F3A for Salon, BWK-9B1C for Car Wash.
 */
export const generateSecureToken = async (businessType = "SALON") => {
  const prisma = getDB();
  const prefix =
    businessType === "SALON" || businessType === "PARLOUR"
      ? "BLUSH"
      : businessType === "CAR_WASH"
      ? "BWK"
      : "BIZ";

  let token = "";
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    attempts++;
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    token = `${prefix}-${randomSuffix}`;
    const found = await prisma.qrCode.findUnique({
      where: { token },
      select: { id: true },
    });
    if (!found) exists = false;
  }

  return token;
};

/**
 * Generate a high-contrast, maximum-scannability QR Code Data URL (PNG).
 * Uses error correction level H (30% redundancy) and 512px resolution.
 */
export const generateQrDataUrl = async (targetUrl) => {
  return await QRCode.toDataURL(targetUrl, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "H",
    color: {
      dark: "#0f172a", // deep slate/navy
      light: "#ffffff", // clean white
    },
  });
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const resolveCallerBusinessId = async (caller, requestedBizId = null) => {
  const prisma = getDB();

  if (caller.role === "ADMIN") {
    if (!requestedBizId) throw ApiError.badRequest("businessId is required for ADMIN.");
    return requestedBizId;
  }

  if (caller.role === "BUSINESS") {
    const biz = await prisma.business.findFirst({
      where: { ownerId: caller.userId, deletedAt: null },
      select: { id: true },
    });
    if (!biz) throw ApiError.notFound("Business not found.");
    return biz.id;
  }

  throw ApiError.forbidden("Access denied.");
};

/**
 * Ensure a business has an active QR code with a valid generated image URL.
 * Automatically generates one lazily if absent.
 */
export const ensureBusinessQr = async (businessId, businessType = "SALON", customOrigin = null) => {
  const prisma = getDB();

  const baseUrl = (customOrigin || CUSTOMER_FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

  let qrCode = await prisma.qrCode.findFirst({
    where: { businessId, type: "BUSINESS", isActive: true, deletedAt: null },
  });

  if (qrCode) {
    // If image URL is missing or targetUrl is empty, backfill it
    if (!qrCode.qrImageUrl || !qrCode.targetUrl) {
      const targetUrl = qrCode.targetUrl || `${baseUrl}/book/${qrCode.token}`;
      const qrImageUrl = await generateQrDataUrl(targetUrl);
      qrCode = await prisma.qrCode.update({
        where: { id: qrCode.id },
        data: { targetUrl, qrImageUrl },
      });
      logger.info(`[QR] Backfilled qrImageUrl for business QR ${businessId} (${qrCode.token})`);
    }
    return qrCode;
  }

  // Create brand new QR
  const token = await generateSecureToken(businessType);
  const targetUrl = `${baseUrl}/book/${token}`;
  const qrImageUrl = await generateQrDataUrl(targetUrl);

  qrCode = await prisma.qrCode.create({
    data: {
      businessId,
      type: "BUSINESS",
      token,
      targetUrl,
      qrImageUrl,
      isActive: true,
    },
  });

  logger.info(`[QR] Created brand new business QR for ${businessId} (${token})`);
  return qrCode;
};

// ── Generate QR ───────────────────────────────────────────────────────────────

export const generateBusinessQr = async (data, caller, origin) => {
  const prisma = getDB();
  const businessId = await resolveCallerBusinessId(caller, data.businessId);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { businessType: true },
  });

  const baseUrl = (origin || CUSTOMER_FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const token = await generateSecureToken(business?.businessType || "SALON");
  const targetUrl = `${baseUrl}/book/${token}`;
  const qrImageUrl = await generateQrDataUrl(targetUrl);

  const qrCode = await prisma.qrCode.create({
    data: {
      businessId,
      type: "BUSINESS",
      token,
      targetUrl,
      qrImageUrl,
      isActive: true,
    },
  });

  logger.info(`[QR] Generated BUSINESS QR for ${businessId} with token ${token}`);
  return { qrCode };
};

export const generateServiceQr = async (data, caller, origin) => {
  const prisma = getDB();

  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
    select: { id: true, businessId: true, business: { select: { businessType: true } } },
  });
  if (!service) throw ApiError.notFound("Service not found.");

  if (caller.role !== "ADMIN") {
    const callerBizId = await resolveCallerBusinessId(caller);
    if (service.businessId !== callerBizId) {
      throw ApiError.forbidden("You cannot generate a QR for this service.");
    }
  }

  const baseUrl = (origin || CUSTOMER_FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const token = await generateSecureToken(service.business?.businessType || "SALON");
  const targetUrl = `${baseUrl}/book/${token}?serviceId=${service.id}`;
  const qrImageUrl = await generateQrDataUrl(targetUrl);

  const qrCode = await prisma.qrCode.create({
    data: {
      businessId: service.businessId,
      serviceId: service.id,
      type: "SERVICE",
      token,
      targetUrl,
      qrImageUrl,
      isActive: true,
    },
  });

  logger.info(`[QR] Generated SERVICE QR for service ${service.id} with token ${token}`);
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

// ── Scan & Public Resolution ──────────────────────────────────────────────────

/**
 * Public endpoint to resolve a business by its QR token.
 * Customer scans QR -> lands on /book/:token -> customer portal calls /qr/resolve/:token.
 * Returns business identity, active services, and targetUrl.
 */
export const resolveQrToken = async (token) => {
  const prisma = getDB();

  const qrCode = await prisma.qrCode.findFirst({
    where: { token, isActive: true, deletedAt: null },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          businessType: true,
          description: true,
          logoUrl: true,
          coverImageUrl: true,
          phone: true,
          email: true,
          address: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
          status: true,
          services: {
            where: { isActive: true, deletedAt: null },
            select: {
              id: true,
              name: true,
              description: true,
              durationMinutes: true,
              price: true,
              category: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  if (!qrCode || !qrCode.business || qrCode.business.status !== "ACTIVE") {
    throw ApiError.notFound(
      "QR Code is invalid, inactive, or has been regenerated.",
      "QR_NOT_FOUND"
    );
  }

  // Increment scanCount asynchronously
  prisma.qrCode
    .update({
      where: { id: qrCode.id },
      data: { scanCount: { increment: 1 } },
    })
    .catch((err) =>
      logger.error(`[QR] Failed to increment scan count for ${qrCode.id}: ${err.message}`)
    );

  return {
    token: qrCode.token,
    type: qrCode.type,
    businessId: qrCode.businessId,
    serviceId: qrCode.serviceId,
    targetUrl: qrCode.targetUrl,
    scanCount: qrCode.scanCount + 1,
    business: qrCode.business,
  };
};

/**
 * Legacy scan endpoint by QR ID.
 */
export const scanQrCode = async (id) => {
  const prisma = getDB();

  const qrCode = await prisma.qrCode.findUnique({ where: { id } });

  if (!qrCode || !qrCode.isActive || qrCode.deletedAt) {
    throw ApiError.notFound("QR Code is invalid, inactive, or has been deleted.");
  }

  prisma.qrCode
    .update({
      where: { id },
      data: { scanCount: { increment: 1 } },
    })
    .catch((err) =>
      logger.error(`[QR] Failed to increment scan count for ${id}: ${err.message}`)
    );

  return {
    targetUrl: qrCode.targetUrl,
    type: qrCode.type,
    businessId: qrCode.businessId,
    serviceId: qrCode.serviceId,
  };
};
