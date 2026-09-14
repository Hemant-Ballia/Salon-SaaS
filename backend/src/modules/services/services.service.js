/**
 * src/modules/services/services.service.js
 *
 * Service (menu item) module for a Business.
 *
 * Isolation rules:
 *   ADMIN    → can read all; can manage any service.
 *   BUSINESS → can manage services in their own business only.
 *   STAFF    → read-only for their business.
 *   CUSTOMER → read-only for ACTIVE services of ACTIVE businesses.
 *
 * businessId is NEVER trusted from request body.
 * It is resolved from the authenticated user's DB record.
 */

import { getDB } from "../../config/db.js";
import { paginate } from "../../utils/pagination.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

// ── Safe select ───────────────────────────────────────────────────────────────

const SERVICE_SELECT = {
  id: true, name: true, description: true, durationMinutes: true,
  price: true, category: true, imageUrl: true, isActive: true,
  createdAt: true, updatedAt: true,
  business: { select: { id: true, name: true, slug: true } },
};

// ── Resolve businessId from caller identity ───────────────────────────────────

const resolveCallerBusinessId = async (caller, requestedBizId = null) => {
  const prisma = getDB();

  if (caller.role === "ADMIN") {
    // ADMIN can specify any businessId; required for create
    if (!requestedBizId) throw ApiError.badRequest("businessId is required for ADMIN.", "MISSING_BUSINESS_ID");
    const biz = await prisma.business.findFirst({ where: { id: requestedBizId, deletedAt: null }, select: { id: true } });
    if (!biz) throw ApiError.notFound("Business not found.", "BUSINESS_NOT_FOUND");
    return requestedBizId;
  }

  if (caller.role === "BUSINESS") {
    const biz = await prisma.business.findFirst({ where: { ownerId: caller.userId, deletedAt: null }, select: { id: true } });
    if (!biz) throw ApiError.notFound("You do not have a registered business.", "BUSINESS_NOT_FOUND");
    return biz.id;
  }

  if (caller.role === "STAFF") {
    const s = await prisma.staff.findFirst({ where: { userId: caller.userId, deletedAt: null }, select: { businessId: true } });
    if (!s) throw ApiError.notFound("Staff profile not found.", "STAFF_NOT_FOUND");
    return s.businessId;
  }

  // CUSTOMER — no businessId isolation needed for reads; handled per method
  return requestedBizId || null;
};

// ── Ownership guard for write ops ─────────────────────────────────────────────

const resolveServiceAccess = async (serviceId, caller, writeAccess = false) => {
  const prisma = getDB();
  const service = await prisma.service.findFirst({
    where: { id: serviceId, deletedAt: null },
    select: { ...SERVICE_SELECT, businessId: true },
  });
  if (!service) throw ApiError.notFound("Service not found.", "SERVICE_NOT_FOUND");

  if (caller.role === "ADMIN") return service;

  if (writeAccess && caller.role === "CUSTOMER") throw ApiError.forbidden("Customers cannot modify services.", "FORBIDDEN");
  if (writeAccess && caller.role === "STAFF") throw ApiError.forbidden("Staff cannot modify services.", "FORBIDDEN");

  // BUSINESS: verify ownership
  if (caller.role === "BUSINESS") {
    const biz = await prisma.business.findFirst({ where: { ownerId: caller.userId, id: service.businessId, deletedAt: null }, select: { id: true } });
    if (!biz) throw ApiError.forbidden("You do not own this service's business.", "SERVICE_ACCESS_DENIED");
  }

  // STAFF: verify assigned to service's business
  if (caller.role === "STAFF") {
    const s = await prisma.staff.findFirst({ where: { userId: caller.userId, businessId: service.businessId, deletedAt: null }, select: { id: true } });
    if (!s) throw ApiError.forbidden("You are not assigned to this service's business.", "SERVICE_ACCESS_DENIED");
  }

  return service;
};

// ── Create ────────────────────────────────────────────────────────────────────

export const createService = async (data, caller) => {
  if (caller.role === "CUSTOMER" || caller.role === "STAFF") {
    throw ApiError.forbidden("Only business owners and admins can create services.", "FORBIDDEN");
  }

  const prisma = getDB();
  const businessId = await resolveCallerBusinessId(caller, data.businessId);

  const service = await prisma.service.create({
    data: {
      businessId,
      name: data.name,
      description: data.description ?? null,
      durationMinutes: data.durationMinutes,
      price: data.price,
      category: data.category ?? null,
      imageUrl: data.imageUrl ?? null,
      isActive: data.isActive ?? true,
    },
    select: SERVICE_SELECT,
  });

  logger.info(`[Service] Created: ${service.name} for businessId=${businessId}`);
  return { service: { ...service, price: Number(service.price) } };
};

// ── List ──────────────────────────────────────────────────────────────────────

export const listServices = async (query, caller) => {
  const prisma = getDB();
  const { skip, take, orderBy, meta } = paginate(query, ["name", "createdAt", "price", "durationMinutes"]);

  const where = { deletedAt: null };

  if (caller.role === "CUSTOMER") {
    // Customers: ACTIVE services of ACTIVE businesses only
    where.isActive = true;
    if (query.businessId) where.businessId = query.businessId;
    else where.business = { status: "ACTIVE", isActive: true, deletedAt: null };
  } else if (caller.role === "STAFF") {
    where.businessId = await resolveCallerBusinessId(caller);
    if (query.isActive !== undefined) where.isActive = query.isActive === "true";
  } else if (caller.role === "BUSINESS") {
    where.businessId = await resolveCallerBusinessId(caller);
    if (query.isActive !== undefined) where.isActive = query.isActive === "true";
  } else {
    // ADMIN
    if (query.businessId) where.businessId = query.businessId;
    if (query.isActive !== undefined) where.isActive = query.isActive === "true";
  }

  if (query.category) where.category = { contains: query.category, mode: "insensitive" };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { category: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [services, total] = await prisma.$transaction([
    prisma.service.findMany({ where, skip, take, orderBy, select: SERVICE_SELECT }),
    prisma.service.count({ where }),
  ]);

  return {
    services: services.map((s) => ({ ...s, price: Number(s.price) })),
    pagination: meta(total),
  };
};

// ── Get by ID ─────────────────────────────────────────────────────────────────

export const getServiceById = async (serviceId, caller) => {
  const service = await resolveServiceAccess(serviceId, caller, false);
  // Customers only see active services
  if (caller.role === "CUSTOMER" && !service.isActive) {
    throw ApiError.notFound("Service not found.", "SERVICE_NOT_FOUND");
  }
  const { businessId: _biz, ...safe } = service;
  return { service: { ...safe, price: Number(safe.price) } };
};

// ── Update ────────────────────────────────────────────────────────────────────

export const updateService = async (serviceId, data, caller) => {
  const prisma = getDB();
  await resolveServiceAccess(serviceId, caller, true);

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { ...data, updatedAt: new Date() },
    select: SERVICE_SELECT,
  });

  return { service: { ...updated, price: Number(updated.price) } };
};

// ── Delete (soft) ─────────────────────────────────────────────────────────────

export const deleteService = async (serviceId, caller) => {
  const prisma = getDB();
  await resolveServiceAccess(serviceId, caller, true);

  await prisma.service.update({ where: { id: serviceId }, data: { deletedAt: new Date(), isActive: false } });
  logger.info(`[Service] Soft-deleted: ${serviceId}`);
};

// ── Update Status ─────────────────────────────────────────────────────────────

export const updateServiceStatus = async (serviceId, { isActive }, caller) => {
  const prisma = getDB();
  await resolveServiceAccess(serviceId, caller, true);

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { isActive, updatedAt: new Date() },
    select: SERVICE_SELECT,
  });

  return { service: { ...updated, price: Number(updated.price) } };
};
