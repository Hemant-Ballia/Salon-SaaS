/**
 * src/modules/queues/queues.service.js
 *
 * Real-time queue system.
 *
 * Token generation uses MAX(tokenNumber) + 1 inside a Prisma transaction
 * to prevent race conditions on concurrent joins.
 *
 * State machine:
 *   WAITING  → CALLED  → SERVING → COMPLETED
 *   WAITING  → SKIPPED
 *   WAITING  → CANCELLED (customer leaves)
 *   CALLED   → SKIPPED
 *   CALLED   → SERVING
 *   SERVING  → COMPLETED
 *
 * Isolation:
 *   ADMIN    → can read/manage any queue
 *   BUSINESS → own business queue only
 *   STAFF    → own business queue only
 *   CUSTOMER → join, view own position, leave own entry
 */

import { getDB } from "../../config/db.js";
import { withTransaction } from "../../utils/transaction.js";
import { paginate } from "../../utils/pagination.js";
import { emitToBusiness, emitToBusinessPublic, emitToCustomer } from "../../config/socket.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = ["WAITING", "CALLED", "SERVING"];
const AVG_SERVICE_MINUTES = 15; // fallback for estimated wait calculation

const QUEUE_ENTRY_SELECT = {
  id: true, tokenNumber: true, status: true,
  estimatedWaitMinutes: true, joinedAt: true,
  calledAt: true, servedAt: true, completedAt: true,
  skippedAt: true, cancelledAt: true,
  createdAt: true, updatedAt: true,
  customer: { select: { id: true, user: { select: { id: true, name: true, phone: true } } } },
  queue: { select: { id: true, name: true, businessId: true } },
  appointment: { select: { id: true, appointmentDate: true, startTime: true } },
};

// ── Resolve caller's businessId ───────────────────────────────────────────────

const resolveCallerBusinessId = async (caller) => {
  const prisma = getDB();

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

  return null;
};

// ── Ensure a default queue exists for a business ──────────────────────────────

const getOrCreateDefaultQueue = async (prisma, businessId) => {
  let queue = await prisma.queue.findFirst({
    where: { businessId, isActive: true, deletedAt: null },
    select: { id: true, name: true, maxCapacity: true },
    orderBy: { createdAt: "asc" },
  });

  if (!queue) {
    queue = await prisma.queue.create({
      data: { businessId, name: "Default Queue", isActive: true },
      select: { id: true, name: true, maxCapacity: true },
    });
    logger.info(`[Queue] Auto-created default queue for businessId=${businessId}`);
  }

  return queue;
};

// ── Estimated wait calculator ─────────────────────────────────────────────────

const calculateEstimatedWait = async (prisma, queueId, positionInQueue) => {
  // Use average service time from recent completed entries
  const recentCompleted = await prisma.queueEntry.findMany({
    where: { queueId, status: "COMPLETED", servedAt: { not: null }, completedAt: { not: null } },
    select: { servedAt: true, completedAt: true },
    orderBy: { completedAt: "desc" },
    take: 10,
  });

  let avgMinutes = AVG_SERVICE_MINUTES;
  if (recentCompleted.length > 0) {
    const durations = recentCompleted.map((e) =>
      (new Date(e.completedAt).getTime() - new Date(e.servedAt).getTime()) / 60000
    );
    avgMinutes = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    if (avgMinutes < 1) avgMinutes = 1;
  }

  return Math.round(positionInQueue * avgMinutes);
};

// ── Join Queue ────────────────────────────────────────────────────────────────

export const joinQueue = async (data, caller) => {
  const prisma = getDB();

  // Resolve customerId
  let customerId;
  if (caller.role === "CUSTOMER") {
    const c = await prisma.customer.findFirst({ where: { userId: caller.userId }, select: { id: true } });
    if (!c) throw ApiError.notFound("Customer profile not found.", "CUSTOMER_NOT_FOUND");
    customerId = c.id;
  } else {
    throw ApiError.forbidden("Only customers can join queues.", "FORBIDDEN");
  }

  // Validate business
  const business = await prisma.business.findFirst({
    where: { id: data.businessId, status: "ACTIVE", isActive: true, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!business) throw ApiError.badRequest("Business not found or inactive.", "BUSINESS_INACTIVE");

  // Check if customer already in an active queue for this business
  const existingEntry = await prisma.queueEntry.findFirst({
    where: {
      customerId,
      status: { in: ACTIVE_STATUSES },
      queue: { businessId: data.businessId },
    },
    select: { id: true, tokenNumber: true },
  });
  if (existingEntry) {
    throw ApiError.conflict(
      `You are already in the queue (token #${existingEntry.tokenNumber}).`,
      "ALREADY_IN_QUEUE"
    );
  }

  const queue = await getOrCreateDefaultQueue(prisma, data.businessId);

  // Check capacity
  if (queue.maxCapacity) {
    const activeCount = await prisma.queueEntry.count({
      where: { queueId: queue.id, status: { in: ACTIVE_STATUSES } },
    });
    if (activeCount >= queue.maxCapacity) {
      throw ApiError.conflict("Queue is full. Please try again later.", "QUEUE_FULL");
    }
  }

  // Transactional token generation (atomic MAX + 1)
  const entry = await withTransaction(async (tx) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastEntry = await tx.queueEntry.findFirst({
      where: { queueId: queue.id, joinedAt: { gte: today } },
      orderBy: { tokenNumber: "desc" },
      select: { tokenNumber: true },
    });

    const nextToken = (lastEntry?.tokenNumber ?? 0) + 1;

    // Count people ahead for wait estimation
    const aheadCount = await tx.queueEntry.count({
      where: { queueId: queue.id, status: { in: ACTIVE_STATUSES } },
    });

    const estimatedWait = await calculateEstimatedWait(tx, queue.id, aheadCount);

    return tx.queueEntry.create({
      data: {
        queueId: queue.id,
        customerId,
        appointmentId: data.appointmentId || null,
        tokenNumber: nextToken,
        status: "WAITING",
        estimatedWaitMinutes: estimatedWait,
      },
      select: QUEUE_ENTRY_SELECT,
    });
  });

  // Emit real-time events
  emitToBusiness(data.businessId, "queue:joined", {
    entryId: entry.id,
    tokenNumber: entry.tokenNumber,
    customerName: entry.customer?.user?.name,
    estimatedWaitMinutes: entry.estimatedWaitMinutes,
  });
  emitToBusinessPublic(data.businessId, "queue:updated", {
    queueId: queue.id,
    businessId: data.businessId,
  });
  emitToCustomer(caller.userId, "queue:joined", {
    entryId: entry.id,
    tokenNumber: entry.tokenNumber,
    queueName: queue.name,
    estimatedWaitMinutes: entry.estimatedWaitMinutes,
  });

  logger.info(`[Queue] Customer joined: token #${entry.tokenNumber} queue=${queue.id}`);
  return { entry, queueName: queue.name, businessName: business.name };
};

// ── List queue entries ────────────────────────────────────────────────────────

export const listQueueEntries = async (query, caller) => {
  const prisma = getDB();
  const { skip, take, meta } = paginate(query, ["tokenNumber", "joinedAt", "status"]);

  let businessId;
  if (caller.role === "ADMIN") {
    if (!query.businessId) throw ApiError.badRequest("businessId is required for ADMIN.", "MISSING_BUSINESS_ID");
    businessId = query.businessId;
  } else if (caller.role === "CUSTOMER") {
    throw ApiError.forbidden("Use GET /queues/live instead.", "FORBIDDEN");
  } else {
    businessId = await resolveCallerBusinessId(caller);
  }

  const where = { queue: { businessId } };
  if (query.status) where.status = query.status;
  else where.status = { in: ACTIVE_STATUSES }; // Default: show active entries

  const [entries, total] = await prisma.$transaction([
    prisma.queueEntry.findMany({ where, skip, take, orderBy: { tokenNumber: "asc" }, select: QUEUE_ENTRY_SELECT }),
    prisma.queueEntry.count({ where }),
  ]);

  return { entries, pagination: meta(total) };
};

// ── Get queue entry by ID ─────────────────────────────────────────────────────

export const getQueueEntryById = async (entryId, caller) => {
  const prisma = getDB();
  const entry = await prisma.queueEntry.findUnique({ where: { id: entryId }, select: { ...QUEUE_ENTRY_SELECT, customerId: true } });
  if (!entry) throw ApiError.notFound("Queue entry not found.", "QUEUE_ENTRY_NOT_FOUND");

  if (caller.role === "CUSTOMER") {
    const c = await prisma.customer.findFirst({ where: { userId: caller.userId }, select: { id: true } });
    if (!c || c.id !== entry.customerId) throw ApiError.forbidden("You can only view your own queue entry.", "FORBIDDEN");
  } else if (caller.role !== "ADMIN") {
    const callerBizId = await resolveCallerBusinessId(caller);
    if (entry.queue.businessId !== callerBizId) throw ApiError.forbidden("This entry belongs to a different business.", "QUEUE_ACCESS_DENIED");
  }

  // Calculate current position
  const position = await prisma.queueEntry.count({
    where: {
      queueId: entry.queue.id,
      status: { in: ACTIVE_STATUSES },
      tokenNumber: { lte: entry.tokenNumber },
    },
  });

  const { customerId: _cid, ...safe } = entry;
  return { entry: safe, position };
};

// ── Update entry ──────────────────────────────────────────────────────────────

export const updateQueueEntry = async (entryId, data, caller) => {
  const prisma = getDB();
  if (caller.role === "CUSTOMER") throw ApiError.forbidden("Customers cannot update queue entries.", "FORBIDDEN");

  const entry = await prisma.queueEntry.findUnique({ where: { id: entryId }, select: { id: true, queue: { select: { businessId: true } } } });
  if (!entry) throw ApiError.notFound("Queue entry not found.", "QUEUE_ENTRY_NOT_FOUND");

  if (caller.role !== "ADMIN") {
    const callerBizId = await resolveCallerBusinessId(caller);
    if (entry.queue.businessId !== callerBizId) throw ApiError.forbidden("Access denied.", "QUEUE_ACCESS_DENIED");
  }

  const updated = await prisma.queueEntry.update({
    where: { id: entryId },
    data: { ...data, updatedAt: new Date() },
    select: QUEUE_ENTRY_SELECT,
  });

  return { entry: updated };
};

// ── Delete (customer leaves queue) ────────────────────────────────────────────

export const leaveQueue = async (entryId, caller) => {
  const prisma = getDB();
  const entry = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    select: { id: true, status: true, customerId: true, queue: { select: { id: true, businessId: true } } },
  });
  if (!entry) throw ApiError.notFound("Queue entry not found.", "QUEUE_ENTRY_NOT_FOUND");

  if (caller.role === "CUSTOMER") {
    const c = await prisma.customer.findFirst({ where: { userId: caller.userId }, select: { id: true } });
    if (!c || c.id !== entry.customerId) throw ApiError.forbidden("You can only leave your own queue entry.", "FORBIDDEN");
  } else if (caller.role !== "ADMIN") {
    const callerBizId = await resolveCallerBusinessId(caller);
    if (entry.queue.businessId !== callerBizId) throw ApiError.forbidden("Access denied.", "QUEUE_ACCESS_DENIED");
  }

  if (!ACTIVE_STATUSES.includes(entry.status)) {
    throw ApiError.badRequest(`Cannot leave a ${entry.status} queue entry.`, "INVALID_STATUS_TRANSITION");
  }

  await prisma.queueEntry.update({
    where: { id: entryId },
    data: { status: "CANCELLED", cancelledAt: new Date(), updatedAt: new Date() },
  });

  emitToBusiness(entry.queue.businessId, "queue:updated", { queueId: entry.queue.id });
  emitToBusinessPublic(entry.queue.businessId, "queue:updated", { queueId: entry.queue.id });

  logger.info(`[Queue] Entry cancelled: ${entryId}`);
};

// ── Status transitions ────────────────────────────────────────────────────────

const transitionQueueEntry = async (entryId, targetStatus, caller) => {
  if (caller.role === "CUSTOMER") throw ApiError.forbidden("Customers cannot change queue status.", "FORBIDDEN");

  const prisma = getDB();
  const entry = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    select: { id: true, status: true, tokenNumber: true, customerId: true, queue: { select: { id: true, businessId: true } } },
  });
  if (!entry) throw ApiError.notFound("Queue entry not found.", "QUEUE_ENTRY_NOT_FOUND");

  if (caller.role !== "ADMIN") {
    const callerBizId = await resolveCallerBusinessId(caller);
    if (entry.queue.businessId !== callerBizId) throw ApiError.forbidden("Access denied.", "QUEUE_ACCESS_DENIED");
  }

  // Validate transition
  const validTransitions = {
    WAITING: ["CALLED", "SKIPPED"],
    CALLED: ["SERVING", "SKIPPED"],
    SERVING: ["COMPLETED"],
  };

  const allowed = validTransitions[entry.status] || [];
  if (!allowed.includes(targetStatus)) {
    throw ApiError.badRequest(
      `Cannot transition from ${entry.status} to ${targetStatus}.`,
      "INVALID_STATUS_TRANSITION"
    );
  }

  // Build update data with appropriate timestamps
  const updateData = { status: targetStatus, updatedAt: new Date() };
  if (targetStatus === "CALLED") updateData.calledAt = new Date();
  if (targetStatus === "SERVING") updateData.servedAt = new Date();
  if (targetStatus === "COMPLETED") updateData.completedAt = new Date();
  if (targetStatus === "SKIPPED") updateData.skippedAt = new Date();

  const updated = await prisma.queueEntry.update({
    where: { id: entryId },
    data: updateData,
    select: QUEUE_ENTRY_SELECT,
  });

  // Resolve customer userId for socket notification
  const customer = await prisma.customer.findUnique({
    where: { id: entry.customerId },
    select: { userId: true },
  });

  // Map target status to event name
  const eventMap = {
    CALLED: "queue:called",
    SERVING: "queue:serving",
    COMPLETED: "queue:completed",
    SKIPPED: "queue:skipped",
  };

  const eventName = eventMap[targetStatus];
  const payload = {
    entryId: updated.id,
    tokenNumber: entry.tokenNumber,
    status: targetStatus,
    customerName: updated.customer?.user?.name,
  };

  emitToBusiness(entry.queue.businessId, eventName, payload);
  emitToBusinessPublic(entry.queue.businessId, "queue:updated", { queueId: entry.queue.id });
  if (customer) emitToCustomer(customer.userId, eventName, payload);

  logger.info(`[Queue] Token #${entry.tokenNumber} → ${targetStatus}`);
  return { entry: updated };
};

export const callQueueEntry = (entryId, caller) => transitionQueueEntry(entryId, "CALLED", caller);
export const serveQueueEntry = (entryId, caller) => transitionQueueEntry(entryId, "SERVING", caller);
export const completeQueueEntry = (entryId, caller) => transitionQueueEntry(entryId, "COMPLETED", caller);
export const skipQueueEntry = (entryId, caller) => transitionQueueEntry(entryId, "SKIPPED", caller);

// ── Live queue (public) ───────────────────────────────────────────────────────

export const getLiveQueue = async (query) => {
  const prisma = getDB();
  const businessId = query.businessId;
  if (!businessId) throw ApiError.badRequest("businessId is required.", "MISSING_BUSINESS_ID");

  const business = await prisma.business.findFirst({
    where: { id: businessId, status: "ACTIVE", deletedAt: null },
    select: { id: true, name: true },
  });
  if (!business) throw ApiError.notFound("Business not found.", "BUSINESS_NOT_FOUND");

  const queue = await prisma.queue.findFirst({
    where: { businessId, isActive: true, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!queue) return { business: business.name, queueName: null, entries: [], stats: { total: 0, waiting: 0, serving: 0 } };

  const entries = await prisma.queueEntry.findMany({
    where: { queueId: queue.id, status: { in: ACTIVE_STATUSES } },
    orderBy: { tokenNumber: "asc" },
    select: {
      id: true, tokenNumber: true, status: true,
      estimatedWaitMinutes: true, joinedAt: true, calledAt: true,
    },
  });

  const waiting = entries.filter((e) => e.status === "WAITING").length;
  const serving = entries.filter((e) => e.status === "SERVING").length;

  return {
    business: business.name,
    businessId,
    queueName: queue.name,
    entries,
    stats: { total: entries.length, waiting, serving, called: entries.filter((e) => e.status === "CALLED").length },
  };
};
