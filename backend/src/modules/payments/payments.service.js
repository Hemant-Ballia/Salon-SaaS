/**
 * src/modules/payments/payments.service.js
 *
 * Razorpay payment integration.
 *
 * Security:
 *   - Amount is ALWAYS read from appointment.totalAmount (server-side)
 *   - Payment verification uses Razorpay HMAC SHA256 signature
 *   - Webhook verifies X-Razorpay-Signature header
 *   - State changes are idempotent (duplicate PAID → no-op)
 *
 * Stub mode:
 *   When RAZORPAY_KEY_ID is empty, order creation returns a simulated
 *   order object so dev/test can proceed without credentials.
 */

import crypto from "node:crypto";
import { getDB } from "../../config/db.js";
import { getRazorpay } from "../../config/razorpay.js";
import { paginate } from "../../utils/pagination.js";
import { RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } from "../../config/env.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

// ── Safe select ───────────────────────────────────────────────────────────────

const PAYMENT_SELECT = {
  id: true, amount: true, currency: true, status: true, method: true,
  razorpayOrderId: true, razorpayPaymentId: true,
  refundedAmount: true, refundId: true, refundedAt: true, failureReason: true,
  metadata: true, createdAt: true, updatedAt: true,
  business: { select: { id: true, name: true } },
  customer: { select: { id: true, user: { select: { id: true, name: true, email: true } } } },
  appointment: { select: { id: true, appointmentDate: true, startTime: true, status: true } },
};

// ── Caller context ────────────────────────────────────────────────────────────

const resolveCallerBusinessId = async (caller) => {
  const prisma = getDB();
  if (caller.role === "BUSINESS") {
    const biz = await prisma.business.findFirst({ where: { ownerId: caller.userId, deletedAt: null }, select: { id: true } });
    if (!biz) throw ApiError.notFound("Business not found.", "BUSINESS_NOT_FOUND");
    return biz.id;
  }
  if (caller.role === "STAFF") {
    const s = await prisma.staff.findFirst({ where: { userId: caller.userId, deletedAt: null }, select: { businessId: true } });
    if (!s) throw ApiError.notFound("Staff not found.", "STAFF_NOT_FOUND");
    return s.businessId;
  }
  return null;
};

const resolveCustomerId = async (caller) => {
  const prisma = getDB();
  if (caller.role === "CUSTOMER") {
    const c = await prisma.customer.findFirst({ where: { userId: caller.userId }, select: { id: true } });
    if (!c) throw ApiError.notFound("Customer profile not found.", "CUSTOMER_NOT_FOUND");
    return c.id;
  }
  return null;
};

// ── Create Order ──────────────────────────────────────────────────────────────

export const createOrder = async (data, caller) => {
  const prisma = getDB();

  // Fetch appointment and validate ownership
  const appointment = await prisma.appointment.findFirst({
    where: { id: data.appointmentId, deletedAt: null },
    select: {
      id: true, businessId: true, customerId: true, totalAmount: true, status: true,
      customer: { select: { id: true, userId: true } },
    },
  });
  if (!appointment) throw ApiError.notFound("Appointment not found.", "APPOINTMENT_NOT_FOUND");

  // Validate caller access
  if (caller.role === "CUSTOMER") {
    if (appointment.customer.userId !== caller.userId) {
      throw ApiError.forbidden("You can only pay for your own appointments.", "FORBIDDEN");
    }
  } else if (caller.role === "BUSINESS" || caller.role === "STAFF") {
    const callerBizId = await resolveCallerBusinessId(caller);
    if (appointment.businessId !== callerBizId) {
      throw ApiError.forbidden("This appointment belongs to a different business.", "PAYMENT_ACCESS_DENIED");
    }
  }

  // Check if payment already exists for this appointment
  const existing = await prisma.payment.findFirst({
    where: { appointmentId: appointment.id, status: { in: ["CREATED", "PENDING", "PAID"] } },
    select: { id: true, status: true, razorpayOrderId: true },
  });
  if (existing?.status === "PAID") {
    throw ApiError.conflict("This appointment has already been paid.", "ALREADY_PAID");
  }
  // If there's a CREATED/PENDING order, return it (idempotent)
  if (existing) {
    const fullPayment = await prisma.payment.findUnique({ where: { id: existing.id }, select: PAYMENT_SELECT });
    return { payment: serialize(fullPayment), reused: true };
  }

  // Server-side amount — NEVER from frontend
  const amountInPaise = Math.round(Number(appointment.totalAmount) * 100);
  const amountInRupees = Number(appointment.totalAmount);

  // Create Razorpay order (or stub in dev)
  const rz = getRazorpay();
  let rzOrder;

  if (rz) {
    rzOrder = await rz.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `appt_${appointment.id.slice(0, 8)}`,
      notes: { appointmentId: appointment.id, businessId: appointment.businessId },
    });
  } else {
    // Stub mode for dev/test
    rzOrder = {
      id: `order_stub_${crypto.randomBytes(8).toString("hex")}`,
      amount: amountInPaise,
      currency: "INR",
      status: "created",
      receipt: `appt_${appointment.id.slice(0, 8)}`,
    };
    logger.warn("[Payment] Razorpay not configured — using stub order.");
  }

  // Persist payment record
  const payment = await prisma.payment.create({
    data: {
      businessId: appointment.businessId,
      customerId: appointment.customerId,
      appointmentId: appointment.id,
      razorpayOrderId: rzOrder.id,
      amount: amountInRupees,
      currency: "INR",
      status: "CREATED",
      metadata: { razorpayOrderStatus: rzOrder.status },
    },
    select: PAYMENT_SELECT,
  });

  logger.info(`[Payment] Order created: ${payment.id} razorpayOrderId=${rzOrder.id} amount=₹${amountInRupees}`);
  return { payment: serialize(payment), razorpayOrderId: rzOrder.id, amount: amountInPaise, currency: "INR" };
};

// ── Verify Payment ────────────────────────────────────────────────────────────

export const verifyPayment = async (data, caller) => {
  const prisma = getDB();

  // Find payment by razorpayOrderId
  const payment = await prisma.payment.findFirst({
    where: { razorpayOrderId: data.razorpayOrderId },
    select: { id: true, status: true, amount: true, businessId: true, appointmentId: true, customerId: true },
  });
  if (!payment) throw ApiError.notFound("Payment not found for this order.", "PAYMENT_NOT_FOUND");

  // Idempotent: if already paid, return success
  if (payment.status === "PAID") {
    const fullPayment = await prisma.payment.findUnique({ where: { id: payment.id }, select: PAYMENT_SELECT });
    return { payment: serialize(fullPayment), alreadyVerified: true };
  }

  // Verify Razorpay signature
  const secret = RAZORPAY_KEY_SECRET || "stub_secret";
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== data.razorpaySignature) {
    // Mark as failed
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: "Signature verification failed", updatedAt: new Date() },
    });
    logger.warn(`[Payment] Signature mismatch for orderId=${data.razorpayOrderId}`);
    throw ApiError.badRequest("Payment signature verification failed.", "SIGNATURE_MISMATCH");
  }

  // Update payment to PAID
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
      status: "PAID",
      updatedAt: new Date(),
    },
    select: PAYMENT_SELECT,
  });

  logger.info(`[Payment] Verified & PAID: ${payment.id}`);
  return { payment: serialize(updated) };
};

// ── Webhook ───────────────────────────────────────────────────────────────────

export const handleWebhook = async (rawBody, signature) => {
  const prisma = getDB();

  // Verify webhook signature
  const secret = RAZORPAY_WEBHOOK_SECRET || "stub_webhook_secret";
  const expectedSig = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  if (expectedSig !== signature) {
    logger.warn("[Payment] Webhook signature mismatch.");
    throw ApiError.unauthorized("Invalid webhook signature.", "WEBHOOK_SIGNATURE_INVALID");
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event;
  const payload = event.payload?.payment?.entity;

  if (!payload) {
    logger.warn(`[Payment] Webhook event ${eventType}: no payment entity.`);
    return { received: true, action: "ignored" };
  }

  const razorpayOrderId = payload.order_id;
  const razorpayPaymentId = payload.id;

  const payment = await prisma.payment.findFirst({
    where: { razorpayOrderId },
    select: { id: true, status: true },
  });

  if (!payment) {
    logger.warn(`[Payment] Webhook: no payment found for orderId=${razorpayOrderId}`);
    return { received: true, action: "no_matching_payment" };
  }

  if (eventType === "payment.captured" || eventType === "payment.authorized") {
    // Idempotent: skip if already PAID
    if (payment.status === "PAID") return { received: true, action: "already_paid" };

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        razorpayPaymentId,
        method: payload.method || null,
        updatedAt: new Date(),
      },
    });
    logger.info(`[Payment] Webhook PAID: ${payment.id}`);
    return { received: true, action: "marked_paid" };
  }

  if (eventType === "payment.failed") {
    if (["PAID", "REFUNDED"].includes(payment.status)) return { received: true, action: "already_final" };

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        razorpayPaymentId,
        failureReason: payload.error_description || "Payment failed",
        updatedAt: new Date(),
      },
    });
    logger.info(`[Payment] Webhook FAILED: ${payment.id}`);
    return { received: true, action: "marked_failed" };
  }

  if (eventType === "refund.created" || eventType === "refund.processed") {
    const refund = event.payload?.refund?.entity;
    if (refund && payment.status === "PAID") {
      const refundedAmt = (refund.amount || 0) / 100;
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: refundedAmt >= Number(payment.amount) ? "REFUNDED" : "PARTIALLY_REFUNDED",
          refundedAmount: refundedAmt,
          refundId: refund.id,
          refundedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      logger.info(`[Payment] Webhook REFUND: ${payment.id} amount=₹${refundedAmt}`);
      return { received: true, action: "refund_processed" };
    }
  }

  return { received: true, action: "unhandled_event", event: eventType };
};

// ── List Payments ─────────────────────────────────────────────────────────────

export const listPayments = async (query, caller) => {
  const prisma = getDB();
  const { skip, take, orderBy, meta } = paginate(query, ["createdAt", "amount", "status"]);

  const where = {};

  if (caller.role === "CUSTOMER") {
    const customerId = await resolveCustomerId(caller);
    where.customerId = customerId;
  } else if (caller.role === "BUSINESS" || caller.role === "STAFF") {
    where.businessId = await resolveCallerBusinessId(caller);
  } else {
    // ADMIN
    if (query.businessId) where.businessId = query.businessId;
    if (query.customerId) where.customerId = query.customerId;
  }

  if (query.status) where.status = query.status;

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({ where, skip, take, orderBy, select: PAYMENT_SELECT }),
    prisma.payment.count({ where }),
  ]);

  return { payments: payments.map(serialize), pagination: meta(total) };
};

// ── Get by ID ─────────────────────────────────────────────────────────────────

export const getPaymentById = async (paymentId, caller) => {
  const prisma = getDB();
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, select: { ...PAYMENT_SELECT, customerId: true, businessId: true } });
  if (!payment) throw ApiError.notFound("Payment not found.", "PAYMENT_NOT_FOUND");

  if (caller.role === "CUSTOMER") {
    const customerId = await resolveCustomerId(caller);
    if (payment.customerId !== customerId) throw ApiError.forbidden("Access denied.", "PAYMENT_ACCESS_DENIED");
  } else if (caller.role === "BUSINESS" || caller.role === "STAFF") {
    const callerBizId = await resolveCallerBusinessId(caller);
    if (payment.businessId !== callerBizId) throw ApiError.forbidden("Access denied.", "PAYMENT_ACCESS_DENIED");
  }

  const { customerId: _c, businessId: _b, ...safe } = payment;
  return { payment: serialize(safe) };
};

// ── Get Payment Status ────────────────────────────────────────────────────────

export const getPaymentStatus = async (paymentId, caller) => {
  const result = await getPaymentById(paymentId, caller);
  return { paymentId, status: result.payment.status, razorpayPaymentId: result.payment.razorpayPaymentId };
};

// ── Refund ─────────────────────────────────────────────────────────────────────

export const refundPayment = async (paymentId, data, caller) => {
  if (caller.role === "CUSTOMER") throw ApiError.forbidden("Customers cannot initiate refunds.", "FORBIDDEN");

  const prisma = getDB();
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, status: true, amount: true, businessId: true, razorpayPaymentId: true, refundedAmount: true },
  });
  if (!payment) throw ApiError.notFound("Payment not found.", "PAYMENT_NOT_FOUND");

  if (caller.role !== "ADMIN") {
    const callerBizId = await resolveCallerBusinessId(caller);
    if (payment.businessId !== callerBizId) throw ApiError.forbidden("Access denied.", "PAYMENT_ACCESS_DENIED");
  }

  if (payment.status !== "PAID" && payment.status !== "PARTIALLY_REFUNDED") {
    throw ApiError.badRequest(`Cannot refund a ${payment.status} payment.`, "INVALID_REFUND");
  }

  const refundAmount = data.amount || Number(payment.amount);
  const alreadyRefunded = Number(payment.refundedAmount || 0);
  const maxRefundable = Number(payment.amount) - alreadyRefunded;

  if (refundAmount > maxRefundable) {
    throw ApiError.badRequest(`Refund amount ₹${refundAmount} exceeds refundable ₹${maxRefundable}.`, "REFUND_EXCEEDS_AMOUNT");
  }

  // Razorpay refund (or stub)
  const rz = getRazorpay();
  let refundResult;

  if (rz && payment.razorpayPaymentId) {
    refundResult = await rz.payments.refund(payment.razorpayPaymentId, {
      amount: Math.round(refundAmount * 100),
      notes: { reason: data.reason || "Refund initiated" },
    });
  } else {
    refundResult = { id: `rfnd_stub_${crypto.randomBytes(6).toString("hex")}`, amount: Math.round(refundAmount * 100) };
    logger.warn("[Payment] Razorpay not configured — stub refund created.");
  }

  const totalRefunded = alreadyRefunded + refundAmount;
  const newStatus = totalRefunded >= Number(payment.amount) ? "REFUNDED" : "PARTIALLY_REFUNDED";

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: newStatus,
      refundedAmount: totalRefunded,
      refundId: refundResult.id,
      refundedAt: new Date(),
      updatedAt: new Date(),
    },
    select: PAYMENT_SELECT,
  });

  logger.info(`[Payment] Refund: ${paymentId} amount=₹${refundAmount} status=${newStatus}`);
  return { payment: serialize(updated) };
};

// ── Payment History (alias for list with customer scope) ──────────────────────

export const getPaymentHistory = async (query, caller) => {
  return listPayments(query, caller);
};

// ── Serializer ────────────────────────────────────────────────────────────────

const serialize = (p) => {
  if (!p) return null;
  return {
    ...p,
    amount: p.amount ? Number(p.amount) : undefined,
    refundedAmount: p.refundedAmount ? Number(p.refundedAmount) : null,
  };
};
