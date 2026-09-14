/**
 * src/modules/subscriptions/subscriptions.service.js
 *
 * SaaS subscription management.
 *
 * Plans: FREE / BASIC / PRO / PREMIUM
 * Statuses: TRIAL / ACTIVE / PAST_DUE / CANCELLED / EXPIRED
 *
 * Isolation:
 *   ADMIN    → manage any subscription
 *   BUSINESS → view/manage own subscription only
 *   STAFF    → read-only (own business)
 *   CUSTOMER → no access
 */

import { getDB } from "../../config/db.js";
import { paginate } from "../../utils/pagination.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

// ── Plan config ───────────────────────────────────────────────────────────────

const PLAN_CONFIG = {
  FREE:    { durationDays: null, price: 0 },
  BASIC:   { durationDays: 30,   price: 999 },
  PRO:     { durationDays: 30,   price: 2499 },
  PREMIUM: { durationDays: 30,   price: 4999 },
};

// ── Select ────────────────────────────────────────────────────────────────────

const SUB_SELECT = {
  id: true, plan: true, status: true,
  startDate: true, endDate: true, renewalDate: true,
  provider: true, providerSubscriptionId: true,
  metadata: true, createdAt: true, updatedAt: true,
  business: { select: { id: true, name: true, slug: true } },
};

// ── Resolve businessId ────────────────────────────────────────────────────────

const resolveCallerBusinessId = async (caller, requestedBizId = null) => {
  const prisma = getDB();

  if (caller.role === "ADMIN") {
    if (!requestedBizId) throw ApiError.badRequest("businessId is required for ADMIN.", "MISSING_BUSINESS_ID");
    return requestedBizId;
  }

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

  throw ApiError.forbidden("Customers cannot access subscriptions.", "FORBIDDEN");
};

// ── Create / Activate ─────────────────────────────────────────────────────────

export const createSubscription = async (data, caller) => {
  if (caller.role === "CUSTOMER" || caller.role === "STAFF") {
    throw ApiError.forbidden("Only business owners and admins can manage subscriptions.", "FORBIDDEN");
  }

  const prisma = getDB();
  const businessId = await resolveCallerBusinessId(caller, data.businessId);

  // Check if business already has an active subscription
  const existing = await prisma.subscription.findFirst({
    where: { businessId, status: { in: ["TRIAL", "ACTIVE"] } },
    select: { id: true, plan: true, status: true },
  });

  if (existing) {
    throw ApiError.conflict(
      `Business already has an ${existing.status} subscription (${existing.plan}). Update it instead.`,
      "SUBSCRIPTION_EXISTS"
    );
  }

  const plan = PLAN_CONFIG[data.plan];
  const now = new Date();
  const endDate = plan.durationDays ? new Date(now.getTime() + plan.durationDays * 86400000) : null;
  const renewalDate = endDate ? new Date(endDate.getTime() - 3 * 86400000) : null; // 3 days before end

  const subscription = await prisma.subscription.create({
    data: {
      businessId,
      plan: data.plan,
      status: data.plan === "FREE" ? "ACTIVE" : "TRIAL",
      startDate: now,
      endDate,
      renewalDate,
    },
    select: SUB_SELECT,
  });

  logger.info(`[Subscription] Created: ${subscription.id} plan=${data.plan} for businessId=${businessId}`);
  return { subscription };
};

// ── List ──────────────────────────────────────────────────────────────────────

export const listSubscriptions = async (query, caller) => {
  const prisma = getDB();
  const { skip, take, orderBy, meta } = paginate(query, ["createdAt", "plan", "status"]);

  const where = {};

  if (caller.role === "ADMIN") {
    if (query.businessId) where.businessId = query.businessId;
  } else {
    where.businessId = await resolveCallerBusinessId(caller);
  }

  if (query.status) where.status = query.status;
  if (query.plan) where.plan = query.plan;

  const [subscriptions, total] = await prisma.$transaction([
    prisma.subscription.findMany({ where, skip, take, orderBy, select: SUB_SELECT }),
    prisma.subscription.count({ where }),
  ]);

  return { subscriptions, pagination: meta(total) };
};

// ── Get by ID ─────────────────────────────────────────────────────────────────

export const getSubscriptionById = async (subId, caller) => {
  const prisma = getDB();
  const sub = await prisma.subscription.findUnique({ where: { id: subId }, select: { ...SUB_SELECT, businessId: true } });
  if (!sub) throw ApiError.notFound("Subscription not found.", "SUBSCRIPTION_NOT_FOUND");

  if (caller.role !== "ADMIN") {
    const callerBizId = await resolveCallerBusinessId(caller);
    if (sub.businessId !== callerBizId) throw ApiError.forbidden("Access denied.", "SUBSCRIPTION_ACCESS_DENIED");
  }

  const { businessId: _bid, ...safe } = sub;
  return { subscription: safe };
};

// ── Update (plan change, status change) ───────────────────────────────────────

export const updateSubscription = async (subId, data, caller) => {
  if (caller.role === "CUSTOMER" || caller.role === "STAFF") {
    throw ApiError.forbidden("Only business owners and admins can manage subscriptions.", "FORBIDDEN");
  }

  const prisma = getDB();
  const sub = await prisma.subscription.findUnique({ where: { id: subId }, select: { id: true, businessId: true, status: true, plan: true } });
  if (!sub) throw ApiError.notFound("Subscription not found.", "SUBSCRIPTION_NOT_FOUND");

  if (caller.role !== "ADMIN") {
    const callerBizId = await resolveCallerBusinessId(caller);
    if (sub.businessId !== callerBizId) throw ApiError.forbidden("Access denied.", "SUBSCRIPTION_ACCESS_DENIED");
  }

  // Build update
  const updateData = { updatedAt: new Date() };

  if (data.plan && data.plan !== sub.plan) {
    const plan = PLAN_CONFIG[data.plan];
    updateData.plan = data.plan;
    if (plan.durationDays) {
      updateData.endDate = new Date(Date.now() + plan.durationDays * 86400000);
      updateData.renewalDate = new Date(updateData.endDate.getTime() - 3 * 86400000);
    }
  }

  if (data.status) updateData.status = data.status;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;
  if (data.renewalDate !== undefined) updateData.renewalDate = data.renewalDate;

  const updated = await prisma.subscription.update({
    where: { id: subId },
    data: updateData,
    select: SUB_SELECT,
  });

  logger.info(`[Subscription] Updated: ${subId}`);
  return { subscription: updated };
};

// ── Get current subscription for caller's business ────────────────────────────

export const getCurrentSubscription = async (caller) => {
  const prisma = getDB();
  const businessId = await resolveCallerBusinessId(caller);

  const sub = await prisma.subscription.findFirst({
    where: { businessId, status: { in: ["TRIAL", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
    select: SUB_SELECT,
  });

  return { subscription: sub, plan: sub?.plan || "FREE", status: sub?.status || "NONE" };
};
