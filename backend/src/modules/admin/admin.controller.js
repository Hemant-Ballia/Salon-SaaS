/**
 * src/modules/admin/admin.controller.js
 */

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendPaginated } from "../../utils/response.js";
import { getDB } from "../../config/db.js";
import { paginate } from "../../utils/pagination.js";
import ApiError from "../../utils/apiError.js";
import { auditLog } from "../../utils/audit.js";
import * as service from "./admin.service.js";

// ── Dashboard Metrics ─────────────────────────────────────────────────────────

export const getDashboard = asyncHandler(async (req, res) => {
  const period = req.query.period || "7D";
  const dashboard = await service.getAdminDashboardData(period);

  return sendSuccess(res, "Admin dashboard fetched.", {
    metrics: {
      users: dashboard.overview.totalUsers,
      businesses: dashboard.overview.totalBusinesses,
      appointments: dashboard.overview.totalAppointments,
      revenue: dashboard.overview.totalRevenue,
    },
    dashboard,
  });
});

// ── Users ─────────────────────────────────────────────────────────────────────

export const listUsers = asyncHandler(async (req, res) => {
  const prisma = getDB();
  const { skip, take, orderBy, meta } = paginate(req.query, ["createdAt", "role", "isActive"]);

  // Exclude master ADMIN accounts from operational User Management list
  const where = {
    deletedAt: null,
    role: { not: "ADMIN" },
  };

  if (req.query.role && req.query.role !== "ALL" && req.query.role !== "ADMIN") {
    where.role = req.query.role;
  }

  if (req.query.isActive !== undefined && req.query.isActive !== "ALL") {
    where.isActive = req.query.isActive === "true" || req.query.isActive === true;
  }

  if (req.query.search) {
    where.OR = [
      { name: { contains: req.query.search, mode: "insensitive" } },
      { email: { contains: req.query.search, mode: "insensitive" } },
      { phone: { contains: req.query.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);
  return sendPaginated(res, "Users fetched.", data, meta(total));
});

export const getUser = asyncHandler(async (req, res) => {
  const prisma = getDB();
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
  });
  if (!user) throw ApiError.notFound("User not found.");
  return sendSuccess(res, "User fetched.", { user });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const prisma = getDB();
  const { isActive } = req.body;

  const targetUser = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, role: true } });
  if (!targetUser) throw ApiError.notFound("User not found.");
  if (targetUser.role === "ADMIN") {
    throw ApiError.forbidden("Master Administrator accounts cannot be deactivated from user management.", "FORBIDDEN");
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive },
    select: { id: true, isActive: true },
  });

  await auditLog(req.user.userId, null, "account_status_change", "User", user.id, { isActive });
  return sendSuccess(res, "User status updated.", { user });
});

// ── Businesses ────────────────────────────────────────────────────────────────

export const listBusinesses = asyncHandler(async (req, res) => {
  const prisma = getDB();
  const { skip, take, orderBy, meta } = paginate(req.query, ["createdAt", "status"]);
  const where = { deletedAt: null };
  if (req.query.status && req.query.status !== "ALL") {
    where.status = req.query.status;
  }
  const [data, total] = await prisma.$transaction([
    prisma.business.findMany({ where, skip, take, orderBy, include: { owner: { select: { email: true, name: true } } } }),
    prisma.business.count({ where }),
  ]);
  return sendPaginated(res, "Businesses fetched.", data, meta(total));
});

export const getBusiness = asyncHandler(async (req, res) => {
  const prisma = getDB();
  const business = await prisma.business.findUnique({
    where: { id: req.params.id },
    include: { owner: { select: { email: true, name: true } } },
  });
  if (!business) throw ApiError.notFound("Business not found.");
  return sendSuccess(res, "Business fetched.", { business });
});

export const updateBusinessStatus = asyncHandler(async (req, res) => {
  const prisma = getDB();
  const { status } = req.body; // PENDING, ACTIVE, SUSPENDED
  
  const business = await prisma.business.update({
    where: { id: req.params.id },
    data: { status },
  });

  const action = status === "ACTIVE" ? "business_approved" : (status === "SUSPENDED" ? "business_suspended" : "business_status_change");
  await auditLog(req.user.userId, business.id, action, "Business", business.id, { status });

  return sendSuccess(res, `Business status updated to ${status}.`, { business });
});

// ── Aggregates (Staff, Customers, Appointments, Payments) ─────────────────────

export const listStaff = asyncHandler(async (req, res) => {
  const prisma = getDB();
  const { skip, take, orderBy, meta } = paginate(req.query, ["createdAt"]);
  const [data, total] = await prisma.$transaction([
    prisma.staff.findMany({ skip, take, orderBy, include: { user: { select: { email: true } }, business: { select: { name: true } } } }),
    prisma.staff.count(),
  ]);
  return sendPaginated(res, "Staff fetched.", data, meta(total));
});

export const listCustomers = asyncHandler(async (req, res) => {
  const prisma = getDB();
  const { skip, take, orderBy, meta } = paginate(req.query, ["createdAt"]);
  const [data, total] = await prisma.$transaction([
    prisma.customer.findMany({ skip, take, orderBy, include: { user: { select: { email: true } } } }),
    prisma.customer.count(),
  ]);
  return sendPaginated(res, "Customers fetched.", data, meta(total));
});

export const listAppointments = asyncHandler(async (req, res) => {
  const prisma = getDB();
  const { skip, take, orderBy, meta } = paginate(req.query, ["createdAt", "appointmentDate", "status"]);
  const [data, total] = await prisma.$transaction([
    prisma.appointment.findMany({ skip, take, orderBy }),
    prisma.appointment.count(),
  ]);
  return sendPaginated(res, "Appointments fetched.", data, meta(total));
});

export const listPayments = asyncHandler(async (req, res) => {
  const prisma = getDB();
  const { skip, take, orderBy, meta } = paginate(req.query, ["createdAt", "amount", "status"]);
  const [data, total] = await prisma.$transaction([
    prisma.payment.findMany({ skip, take, orderBy }),
    prisma.payment.count(),
  ]);
  
  // Transform Decimal
  const transformed = data.map(p => ({ ...p, amount: Number(p.amount), refundedAmount: p.refundedAmount ? Number(p.refundedAmount) : null }));
  return sendPaginated(res, "Payments fetched.", transformed, meta(total));
});

// ── Audit Logs ────────────────────────────────────────────────────────────────

export const listAuditLogs = asyncHandler(async (req, res) => {
  const prisma = getDB();
  const { skip, take, orderBy, meta } = paginate(req.query, ["createdAt"]);
  const [data, total] = await prisma.$transaction([
    prisma.auditLog.findMany({ skip, take, orderBy }),
    prisma.auditLog.count(),
  ]);
  return sendPaginated(res, "Audit logs fetched.", data, meta(total));
});
