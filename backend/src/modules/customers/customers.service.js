/**
 * src/modules/customers/customers.service.js
 *
 * Customer model fields (from schema):
 *   id, userId, dateOfBirth, gender, profileImageUrl, preferences, deletedAt, createdAt, updatedAt
 *
 * Isolation:
 *   ADMIN    → all customers
 *   BUSINESS → customers who have appointments with their business
 *   STAFF    → same as BUSINESS (scoped to their business)
 *   CUSTOMER → own data only (verified by userId lookup, not by trusting customerId from URL)
 *
 * NEVER trust customerId from frontend as proof of ownership.
 */

import { getDB } from "../../config/db.js";
import { paginate } from "../../utils/pagination.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

// ── Safe select (exact schema fields) ────────────────────────────────────────

const CUSTOMER_SELECT = {
  id: true,
  dateOfBirth: true,
  gender: true,
  profileImageUrl: true,
  preferences: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true, name: true, email: true, phone: true,
      isActive: true, isEmailVerified: true, isPhoneVerified: true,
      lastLoginAt: true, createdAt: true,
    },
  },
};

// ── Resolve caller's businessId ───────────────────────────────────────────────

const resolveCallerBusiness = async (caller) => {
  const prisma = getDB();
  if (caller.role === "ADMIN") return null;
  if (caller.role === "BUSINESS") {
    const b = await prisma.business.findFirst({ where: { ownerId: caller.userId, deletedAt: null }, select: { id: true } });
    if (!b) throw ApiError.notFound("Business not found.", "BUSINESS_NOT_FOUND");
    return b.id;
  }
  if (caller.role === "STAFF") {
    const s = await prisma.staff.findFirst({ where: { userId: caller.userId, deletedAt: null }, select: { businessId: true } });
    if (!s) throw ApiError.notFound("Staff profile not found.", "STAFF_NOT_FOUND");
    return s.businessId;
  }
  return null; // CUSTOMER — handled per-method
};

// ── Access guard ──────────────────────────────────────────────────────────────

const resolveCustomerAccess = async (customerId, caller) => {
  const prisma = getDB();
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, deletedAt: null },
    select: { ...CUSTOMER_SELECT, userId: true },
  });
  if (!customer) throw ApiError.notFound("Customer not found.", "CUSTOMER_NOT_FOUND");

  if (caller.role === "CUSTOMER") {
    // Verify this customer record belongs to the calling user
    const own = await prisma.customer.findFirst({ where: { userId: caller.userId }, select: { id: true } });
    if (!own || own.id !== customerId) throw ApiError.forbidden("You can only access your own profile.", "FORBIDDEN");
    return customer;
  }

  if (caller.role === "ADMIN") return customer;

  // BUSINESS/STAFF: customer must have ≥1 appointment with caller's business
  const businessId = await resolveCallerBusiness(caller);
  const rel = await prisma.appointment.findFirst({ where: { customerId, businessId, deletedAt: null }, select: { id: true } });
  if (!rel) throw ApiError.forbidden("This customer has no appointments with your business.", "CUSTOMER_ACCESS_DENIED");
  return customer;
};

// ── List ──────────────────────────────────────────────────────────────────────

export const listCustomers = async (query, caller) => {
  if (caller.role === "CUSTOMER") throw ApiError.forbidden("Customers cannot list other customers.", "FORBIDDEN");

  const prisma = getDB();
  const { skip, take, meta } = paginate(query, ["createdAt"]);
  const businessId = await resolveCallerBusiness(caller);
  const where = { deletedAt: null };

  if (businessId) {
    // Only customers who have visited this business
    const rows = await prisma.appointment.findMany({
      where: { businessId, deletedAt: null },
      select: { customerId: true },
      distinct: ["customerId"],
    });
    where.id = { in: rows.map((r) => r.customerId) };
  }

  if (query.search) {
    where.user = {
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
      ],
    };
  }

  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({ where, skip, take, orderBy: { createdAt: query.sortOrder || "desc" }, select: CUSTOMER_SELECT }),
    prisma.customer.count({ where }),
  ]);

  return { customers, pagination: meta(total) };
};

// ── Get by ID ─────────────────────────────────────────────────────────────────

export const getCustomerById = async (customerId, caller) => {
  const customer = await resolveCustomerAccess(customerId, caller);
  // eslint-disable-next-line no-unused-vars
  const { userId, ...safe } = customer;
  return { customer: safe };
};

// ── Update ────────────────────────────────────────────────────────────────────

export const updateCustomer = async (customerId, data, caller) => {
  const prisma = getDB();
  const customer = await resolveCustomerAccess(customerId, caller);

  // Fields that live on User vs Customer
  const { name, phone, ...customerData } = data;
  const userUpdate = {};
  if (name) userUpdate.name = name;
  if (phone) userUpdate.phone = phone;

  const ops = [
    prisma.customer.update({
      where: { id: customerId },
      data: { ...customerData, updatedAt: new Date() },
      select: CUSTOMER_SELECT,
    }),
  ];
  if (Object.keys(userUpdate).length) {
    ops.push(prisma.user.update({ where: { id: customer.userId }, data: { ...userUpdate, updatedAt: new Date() } }));
  }

  const [updatedCustomer] = await prisma.$transaction(ops);
  return { customer: updatedCustomer };
};

// ── Delete (soft) ─────────────────────────────────────────────────────────────

export const deleteCustomer = async (customerId, caller) => {
  const prisma = getDB();
  const customer = await resolveCustomerAccess(customerId, caller);

  if (caller.role !== "ADMIN" && caller.role !== "CUSTOMER") {
    throw ApiError.forbidden("Only the customer or an admin can delete a customer account.", "FORBIDDEN");
  }

  await prisma.user.update({ where: { id: customer.userId }, data: { deletedAt: new Date(), isActive: false } });
  logger.info(`[Customer] Soft-deleted: ${customerId} by userId=${caller.userId}`);
};

// ── Customer Appointments ─────────────────────────────────────────────────────

export const getCustomerAppointments = async (customerId, query, caller) => {
  const prisma = getDB();
  await resolveCustomerAccess(customerId, caller);

  const { skip, take, meta } = paginate(query, ["appointmentDate", "createdAt"]);
  const where = { customerId, deletedAt: null };
  if (query.status) where.status = query.status;

  if (caller.role === "BUSINESS" || caller.role === "STAFF") {
    const businessId = await resolveCallerBusiness(caller);
    where.businessId = businessId;
  }

  const [appointments, total] = await prisma.$transaction([
    prisma.appointment.findMany({
      where, skip, take,
      orderBy: { appointmentDate: query.sortOrder === "asc" ? "asc" : "desc" },
      select: {
        id: true, appointmentDate: true, startTime: true, endTime: true,
        status: true, totalAmount: true, notes: true, createdAt: true,
        business: { select: { id: true, name: true, phone: true } },
        staff: { select: { id: true, displayName: true } },
        appointmentServices: {
          select: { priceAtBooking: true, quantity: true, service: { select: { name: true } } },
        },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    appointments: appointments.map((a) => ({ ...a, totalAmount: Number(a.totalAmount) })),
    pagination: meta(total),
  };
};

// ── Customer Payments ─────────────────────────────────────────────────────────

export const getCustomerPayments = async (customerId, query, caller) => {
  const prisma = getDB();
  await resolveCustomerAccess(customerId, caller);

  const { skip, take, meta } = paginate(query, ["createdAt"]);
  // Payment model fields: id, businessId, customerId, appointmentId, razorpayOrderId,
  // razorpayPaymentId, amount, currency, status, method, metadata, refundedAmount,
  // refundId, refundedAt, failureReason, createdAt, updatedAt
  const where = { customerId };
  if (query.status) where.status = query.status;

  if (caller.role === "BUSINESS" || caller.role === "STAFF") {
    const businessId = await resolveCallerBusiness(caller);
    where.businessId = businessId;
  }

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where, skip, take,
      orderBy: { createdAt: query.sortOrder === "asc" ? "asc" : "desc" },
      select: {
        id: true, amount: true, currency: true, status: true,
        method: true, razorpayOrderId: true, razorpayPaymentId: true,
        refundedAmount: true, refundedAt: true, failureReason: true, createdAt: true,
        business: { select: { id: true, name: true } },
        appointment: { select: { id: true, appointmentDate: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments: payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      refundedAmount: p.refundedAmount ? Number(p.refundedAmount) : null,
    })),
    pagination: meta(total),
  };
};

// ── Customer Notifications ────────────────────────────────────────────────────

export const getCustomerNotifications = async (customerId, query, caller) => {
  const prisma = getDB();
  const customer = await resolveCustomerAccess(customerId, caller);

  const { skip, take, meta } = paginate(query, ["createdAt"]);

  // Notification model fields: id, userId, businessId, type, channel, title, message,
  // isRead, readAt, metadata, createdAt  (no body, no deletedAt)
  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId: customer.userId },
      skip, take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, message: true, type: true, channel: true,
        isRead: true, readAt: true, createdAt: true, metadata: true,
      },
    }),
    prisma.notification.count({ where: { userId: customer.userId } }),
  ]);

  return { notifications, pagination: meta(total) };
};
