/**
 * src/modules/businesses/businesses.service.js
 *
 * Isolation rules enforced via DB lookups — businessId NEVER trusted from body.
 *   ADMIN    → all businesses
 *   BUSINESS → own business only (ownerId === userId)
 *   STAFF    → their assigned business (staff.businessId === userId's staffRecord)
 *   CUSTOMER → public ACTIVE businesses only
 */

import { getDB } from "../../config/db.js";
import { paginate } from "../../utils/pagination.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

// ── Safe select (no sensititive fields) ──────────────────────────────────────

const BUSINESS_SELECT = {
  id: true, name: true, slug: true, businessType: true,
  description: true, email: true, phone: true, address: true,
  city: true, state: true, country: true, pincode: true,
  latitude: true, longitude: true, logoUrl: true, coverImageUrl: true,
  status: true, isActive: true, createdAt: true, updatedAt: true,
  owner: { select: { id: true, name: true, email: true } },
};

// ── Ownership guard ───────────────────────────────────────────────────────────

const resolveBusinessAccess = async (businessId, userId, role) => {
  const prisma = getDB();

  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
    select: { ...BUSINESS_SELECT, ownerId: true },
  });
  if (!business) throw ApiError.notFound("Business not found.", "BUSINESS_NOT_FOUND");
  if (role === "ADMIN") return business;

  if (role === "BUSINESS") {
    if (business.ownerId !== userId) throw ApiError.forbidden("You do not own this business.", "BUSINESS_ACCESS_DENIED");
    return business;
  }

  if (role === "STAFF") {
    const s = await prisma.staff.findFirst({ where: { businessId, userId, deletedAt: null }, select: { id: true } });
    if (!s) throw ApiError.forbidden("You are not assigned to this business.", "BUSINESS_ACCESS_DENIED");
    return business;
  }

  throw ApiError.forbidden("Access denied.", "FORBIDDEN");
};

// ── Create ────────────────────────────────────────────────────────────────────

export const createBusiness = async (data, userId) => {
  const prisma = getDB();

  const existing = await prisma.business.findFirst({ where: { ownerId: userId, deletedAt: null }, select: { id: true } });
  if (existing) throw ApiError.conflict("You already have a registered business.", "BUSINESS_EXISTS");

  // Unique slug
  const base = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  let slug = base, n = 1;
  while (await prisma.business.findUnique({ where: { slug }, select: { id: true } })) slug = `${base}-${n++}`;

  const business = await prisma.business.create({
    data: { ...data, ownerId: userId, slug, status: "PENDING", isActive: false },
    select: BUSINESS_SELECT,
  });

  logger.info(`[Business] Created: ${business.name} by userId=${userId}`);
  return { business };
};

// ── List ──────────────────────────────────────────────────────────────────────

export const listBusinesses = async (query, caller) => {
  const prisma = getDB();
  const { skip, take, orderBy, page, limit, meta } = paginate(query, ["name", "createdAt", "status", "city"]);
  const where = { deletedAt: null };

  if (caller.role === "BUSINESS") {
    where.ownerId = caller.userId;
  } else if (caller.role === "STAFF") {
    const s = await prisma.staff.findFirst({ where: { userId: caller.userId, deletedAt: null }, select: { businessId: true } });
    if (!s) return { businesses: [], pagination: meta(0) };
    where.id = s.businessId;
  } else if (caller.role === "CUSTOMER") {
    where.status = "ACTIVE";
    where.isActive = true;
  }

  // ADMIN-only filters
  if (caller.role === "ADMIN") {
    if (query.status) where.status = query.status;
    if (query.businessType) where.businessType = query.businessType;
    if (query.city) where.city = { contains: query.city, mode: "insensitive" };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { city: { contains: query.search, mode: "insensitive" } },
      ];
    }
  }

  const [businesses, total] = await prisma.$transaction([
    prisma.business.findMany({ where, skip, take, orderBy, select: BUSINESS_SELECT }),
    prisma.business.count({ where }),
  ]);

  return { businesses, pagination: meta(total) };
};

// ── Get by ID ─────────────────────────────────────────────────────────────────

export const getBusinessById = async (businessId, caller) => {
  if (caller.role === "CUSTOMER") {
    const prisma = getDB();
    const b = await prisma.business.findFirst({
      where: { id: businessId, deletedAt: null, status: "ACTIVE", isActive: true },
      select: BUSINESS_SELECT,
    });
    if (!b) throw ApiError.notFound("Business not found.", "BUSINESS_NOT_FOUND");
    return { business: b };
  }
  const business = await resolveBusinessAccess(businessId, caller.userId, caller.role);
  // eslint-disable-next-line no-unused-vars
  const { ownerId, ...safe } = business;
  return { business: safe };
};

// ── Update ────────────────────────────────────────────────────────────────────

export const updateBusiness = async (businessId, data, caller) => {
  const prisma = getDB();
  await resolveBusinessAccess(businessId, caller.userId, caller.role);
  if (caller.role === "STAFF") throw ApiError.forbidden("Staff cannot update business details.", "FORBIDDEN");

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: { ...data, updatedAt: new Date() },
    select: BUSINESS_SELECT,
  });
  logger.info(`[Business] Updated: ${businessId} by userId=${caller.userId}`);
  return { business: updated };
};

// ── Delete (soft) ─────────────────────────────────────────────────────────────

export const deleteBusiness = async (businessId, caller) => {
  const prisma = getDB();
  await resolveBusinessAccess(businessId, caller.userId, caller.role);
  if (caller.role === "STAFF") throw ApiError.forbidden("Staff cannot delete a business.", "FORBIDDEN");

  await prisma.business.update({
    where: { id: businessId },
    data: { deletedAt: new Date(), isActive: false, status: "INACTIVE" },
  });
  logger.info(`[Business] Soft-deleted: ${businessId}`);
};

// ── Update Status (ADMIN only) ────────────────────────────────────────────────

export const updateBusinessStatus = async (businessId, { status, reason }, caller) => {
  if (caller.role !== "ADMIN") throw ApiError.forbidden("Only ADMIN can update business status.", "FORBIDDEN");

  const prisma = getDB();
  const biz = await prisma.business.findFirst({ where: { id: businessId, deletedAt: null }, select: { id: true } });
  if (!biz) throw ApiError.notFound("Business not found.", "BUSINESS_NOT_FOUND");

  const isActive = status === "ACTIVE" || status === "APPROVED";
  const updated = await prisma.business.update({
    where: { id: businessId },
    data: { status, isActive, updatedAt: new Date() },
    select: BUSINESS_SELECT,
  });

  // Audit log
  prisma.auditLog.create({
    data: {
      userId: caller.userId, businessId,
      action: `BUSINESS_STATUS_${status}`,
      entity: "Business", entityId: businessId,
      metadata: { newStatus: status, reason: reason || null },
    },
  }).catch(() => {});

  logger.info(`[Business] Status→${status}: ${businessId} by admin=${caller.userId}`);
  return { business: updated };
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const getBusinessDashboard = async (businessId, caller) => {
  const prisma = getDB();
  await resolveBusinessAccess(businessId, caller.userId, caller.role);
  if (caller.role === "CUSTOMER") throw ApiError.forbidden("Customers cannot access the dashboard.", "FORBIDDEN");

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const [
    totalStaff, totalServices, totalAppointments, todayAppointments,
    pendingAppointments, activeQueueEntries, recentAppointments,
    totalRevenue, todayRevenue,
  ] = await prisma.$transaction([
    prisma.staff.count({ where: { businessId, deletedAt: null, status: "ACTIVE" } }),
    prisma.service.count({ where: { businessId, deletedAt: null, isActive: true } }),
    prisma.appointment.count({ where: { businessId, deletedAt: null } }),
    prisma.appointment.count({ where: { businessId, deletedAt: null, appointmentDate: { gte: today, lte: todayEnd } } }),
    prisma.appointment.count({ where: { businessId, status: "PENDING", deletedAt: null } }),
    prisma.queueEntry.count({ where: { queue: { businessId }, status: { in: ["WAITING", "CALLED", "SERVING"] } } }),
    prisma.appointment.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, appointmentDate: true, startTime: true, status: true, totalAmount: true,
        customer: { select: { user: { select: { name: true } } } },
      },
    }),
    prisma.payment.aggregate({ where: { businessId, status: "PAID" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { businessId, status: "PAID", createdAt: { gte: today, lte: todayEnd } }, _sum: { amount: true } }),
  ]);

  return {
    dashboard: {
      stats: {
        totalStaff, totalServices, totalAppointments, todayAppointments,
        pendingAppointments, activeQueueCount: activeQueueEntries,
        totalRevenue: Number(totalRevenue._sum.amount) || 0,
        todayRevenue: Number(todayRevenue._sum.amount) || 0,
      },
      recentAppointments,
    },
  };
};
