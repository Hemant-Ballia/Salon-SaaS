/**
 * src/modules/staff/staff.service.js
 *
 * Staff belongs to exactly one Business.
 * businessId is resolved from DB — NEVER trusted from request body.
 *
 * Isolation:
 *   ADMIN    → any staff, any business (requires ?businessId for list)
 *   BUSINESS → staff in own business only
 *   STAFF    → read own business's staff; update own profile/schedule only
 *   CUSTOMER → no access
 */

import { getDB } from "../../config/db.js";
import { paginate } from "../../utils/pagination.js";
import { withTransaction } from "../../utils/transaction.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

// ── Safe select fields ────────────────────────────────────────────────────────

const STAFF_SELECT = {
  id: true, displayName: true, designation: true, bio: true,
  profileImageUrl: true, status: true, joiningDate: true,
  createdAt: true, updatedAt: true,
  user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
  business: { select: { id: true, name: true, slug: true } },
  schedules: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true, isAvailable: true } },
};

// ── Resolve businessId for caller ─────────────────────────────────────────────

const resolveCallerBusinessId = async (caller, queryBusinessId = null) => {
  const prisma = getDB();

  if (caller.role === "ADMIN") {
    if (!queryBusinessId) throw ApiError.badRequest("businessId query parameter is required for ADMIN.", "MISSING_BUSINESS_ID");
    const biz = await prisma.business.findFirst({ where: { id: queryBusinessId, deletedAt: null }, select: { id: true } });
    if (!biz) throw ApiError.notFound("Business not found.", "BUSINESS_NOT_FOUND");
    return queryBusinessId;
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

  throw ApiError.forbidden("Customers cannot access staff management.", "FORBIDDEN");
};

// ── Create ────────────────────────────────────────────────────────────────────

export const createStaff = async (data, caller) => {
  if (caller.role === "STAFF" || caller.role === "CUSTOMER") {
    throw ApiError.forbidden("Only business owners and admins can add staff.", "FORBIDDEN");
  }

  const prisma = getDB();
  // businessId resolved from DB — ignore any businessId in data
  const businessId = await resolveCallerBusinessId(caller, data.businessId || null);

  const targetUser = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { id: true, role: true, isActive: true, deletedAt: true },
  });
  if (!targetUser || targetUser.deletedAt || !targetUser.isActive) {
    throw ApiError.notFound("User not found or inactive.", "USER_NOT_FOUND");
  }
  if (targetUser.role !== "STAFF") {
    throw ApiError.badRequest("User must have the STAFF role to be added as staff.", "INVALID_ROLE");
  }

  const dup = await prisma.staff.findFirst({ where: { userId: data.userId, businessId, deletedAt: null }, select: { id: true } });
  if (dup) throw ApiError.conflict("This user is already a staff member of this business.", "STAFF_EXISTS");

  const { userId, businessId: _ignored, ...profileData } = data;
  const staff = await prisma.staff.create({
    data: { userId, businessId, ...profileData },
    select: STAFF_SELECT,
  });

  logger.info(`[Staff] Created: ${staff.id} in business=${businessId}`);
  return { staff };
};

// ── List ──────────────────────────────────────────────────────────────────────

export const listStaff = async (query, caller) => {
  const prisma = getDB();
  const businessId = await resolveCallerBusinessId(caller, query.businessId);
  const { skip, take, orderBy, meta } = paginate(query, ["displayName", "createdAt", "joiningDate", "status"]);

  const where = { businessId, deletedAt: null };
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { displayName: { contains: query.search, mode: "insensitive" } },
      { designation: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [staffList, total] = await prisma.$transaction([
    prisma.staff.findMany({ where, skip, take, orderBy, select: STAFF_SELECT }),
    prisma.staff.count({ where }),
  ]);

  return { staff: staffList, pagination: meta(total) };
};

// ── Get by ID ─────────────────────────────────────────────────────────────────

export const getStaffById = async (staffId, caller) => {
  const prisma = getDB();
  const s = await prisma.staff.findFirst({ where: { id: staffId, deletedAt: null }, select: { ...STAFF_SELECT, businessId: true } });
  if (!s) throw ApiError.notFound("Staff member not found.", "STAFF_NOT_FOUND");

  if (caller.role !== "ADMIN") {
    // Verify caller has access to this staff's business
    await resolveCallerBusinessId(caller, s.businessId);
  }

  const { businessId: _biz, ...safe } = s;
  return { staff: safe };
};

// ── Update ────────────────────────────────────────────────────────────────────

export const updateStaff = async (staffId, data, caller) => {
  const prisma = getDB();
  const s = await prisma.staff.findFirst({ where: { id: staffId, deletedAt: null }, select: { id: true, userId: true, businessId: true } });
  if (!s) throw ApiError.notFound("Staff member not found.", "STAFF_NOT_FOUND");

  if (caller.role === "STAFF" && s.userId !== caller.userId) {
    throw ApiError.forbidden("You can only update your own staff profile.", "FORBIDDEN");
  }
  if (caller.role !== "ADMIN") await resolveCallerBusinessId(caller, s.businessId);

  const updated = await prisma.staff.update({
    where: { id: staffId },
    data: { ...data, updatedAt: new Date() },
    select: STAFF_SELECT,
  });
  return { staff: updated };
};

// ── Delete (soft) ─────────────────────────────────────────────────────────────

export const deleteStaff = async (staffId, caller) => {
  const prisma = getDB();
  const s = await prisma.staff.findFirst({ where: { id: staffId, deletedAt: null }, select: { id: true, businessId: true } });
  if (!s) throw ApiError.notFound("Staff member not found.", "STAFF_NOT_FOUND");

  if (caller.role === "STAFF") throw ApiError.forbidden("Staff cannot remove other staff.", "FORBIDDEN");
  if (caller.role !== "ADMIN") await resolveCallerBusinessId(caller, s.businessId);

  await prisma.staff.update({ where: { id: staffId }, data: { deletedAt: new Date(), status: "INACTIVE" } });
  logger.info(`[Staff] Soft-deleted: ${staffId}`);
};

// ── Update Status ─────────────────────────────────────────────────────────────

export const updateStaffStatus = async (staffId, { status }, caller) => {
  const prisma = getDB();
  const s = await prisma.staff.findFirst({ where: { id: staffId, deletedAt: null }, select: { id: true, businessId: true } });
  if (!s) throw ApiError.notFound("Staff member not found.", "STAFF_NOT_FOUND");

  if (caller.role === "STAFF") throw ApiError.forbidden("Staff cannot change staff status.", "FORBIDDEN");
  if (caller.role !== "ADMIN") await resolveCallerBusinessId(caller, s.businessId);

  const updated = await prisma.staff.update({ where: { id: staffId }, data: { status, updatedAt: new Date() }, select: STAFF_SELECT });
  return { staff: updated };
};

// ── Update Schedule ───────────────────────────────────────────────────────────

export const updateStaffSchedule = async (staffId, { schedules }, caller) => {
  const prisma = getDB();
  const s = await prisma.staff.findFirst({ where: { id: staffId, deletedAt: null }, select: { id: true, userId: true, businessId: true } });
  if (!s) throw ApiError.notFound("Staff member not found.", "STAFF_NOT_FOUND");

  if (caller.role === "STAFF" && s.userId !== caller.userId) {
    throw ApiError.forbidden("You can only update your own schedule.", "FORBIDDEN");
  }
  if (caller.role !== "ADMIN") await resolveCallerBusinessId(caller, s.businessId);

  const updated = await withTransaction(async (tx) => {
    await tx.staffSchedule.deleteMany({ where: { staffId } });
    await tx.staffSchedule.createMany({ data: schedules.map((sc) => ({ staffId, ...sc })) });
    return tx.staff.findUnique({ where: { id: staffId }, select: STAFF_SELECT });
  });

  return { staff: updated };
};

// ── Staff Appointments ────────────────────────────────────────────────────────

export const getStaffAppointments = async (staffId, query, caller) => {
  const prisma = getDB();
  const s = await prisma.staff.findFirst({ where: { id: staffId, deletedAt: null }, select: { id: true, businessId: true } });
  if (!s) throw ApiError.notFound("Staff member not found.", "STAFF_NOT_FOUND");
  if (caller.role !== "ADMIN") await resolveCallerBusinessId(caller, s.businessId);

  const { skip, take, meta } = paginate(query, ["appointmentDate", "createdAt", "status"]);
  const where = { staffId, deletedAt: null };
  if (query.status) where.status = query.status;

  const [appointments, total] = await prisma.$transaction([
    prisma.appointment.findMany({
      where, skip, take, orderBy: { appointmentDate: query.sortOrder || "desc" },
      select: {
        id: true, appointmentDate: true, startTime: true, endTime: true,
        status: true, totalAmount: true, notes: true, createdAt: true,
        customer: { select: { user: { select: { name: true, phone: true } } } },
        appointmentServices: {
          select: { quantity: true, priceAtBooking: true, service: { select: { name: true } } },
        },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return { appointments: appointments.map((a) => ({ ...a, totalAmount: Number(a.totalAmount) })), pagination: meta(total) };
};

// ── Staff Queue ───────────────────────────────────────────────────────────────

export const getStaffQueue = async (staffId, caller) => {
  const prisma = getDB();
  const s = await prisma.staff.findFirst({ where: { id: staffId, deletedAt: null }, select: { id: true, businessId: true } });
  if (!s) throw ApiError.notFound("Staff member not found.", "STAFF_NOT_FOUND");
  if (caller.role !== "ADMIN") await resolveCallerBusinessId(caller, s.businessId);

  const entries = await prisma.queueEntry.findMany({
    where: { queue: { businessId: s.businessId }, status: { in: ["WAITING", "CALLED", "SERVING"] } },
    orderBy: { tokenNumber: "asc" },
    select: {
      id: true, tokenNumber: true, status: true, estimatedWaitMinutes: true, joinedAt: true,
      customer: { select: { user: { select: { name: true, phone: true } } } },
    },
  });

  return { queue: entries };
};

// ── Staff Performance ─────────────────────────────────────────────────────────

export const getStaffPerformance = async (staffId, caller) => {
  const prisma = getDB();
  const s = await prisma.staff.findFirst({ where: { id: staffId, deletedAt: null }, select: { id: true, businessId: true, displayName: true } });
  if (!s) throw ApiError.notFound("Staff member not found.", "STAFF_NOT_FOUND");
  if (caller.role !== "ADMIN") await resolveCallerBusinessId(caller, s.businessId);

  const [total, completed, cancelled, noShow, revenue] = await prisma.$transaction([
    prisma.appointment.count({ where: { staffId, deletedAt: null } }),
    prisma.appointment.count({ where: { staffId, status: "COMPLETED", deletedAt: null } }),
    prisma.appointment.count({ where: { staffId, status: "CANCELLED", deletedAt: null } }),
    prisma.appointment.count({ where: { staffId, status: "NO_SHOW", deletedAt: null } }),
    prisma.payment.aggregate({ where: { appointment: { staffId }, status: "PAID" }, _sum: { amount: true } }),
  ]);

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return {
    performance: {
      staffId, displayName: s.displayName,
      totalAppointments: total, completed, cancelled, noShow,
      completionRate: `${completionRate}%`,
      totalRevenue: Number(revenue._sum.amount) || 0,
    },
  };
};
