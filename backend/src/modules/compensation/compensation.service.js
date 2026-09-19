/**
 * src/modules/compensation/compensation.service.js
 *
 * Production-ready Business Staff Compensation & Service Pricing System.
 *
 * Business Rules & Guarantees:
 * 1. Business Owner has full authority over staff compensation, commission rules,
 *    incentive rules, and staff-specific service pricing.
 * 2. Strict Tenant Isolation: All operations are strictly scoped to businessId.
 * 3. Exact Financial Precision: Uses Prisma.Decimal for all monetary calculations.
 * 4. Snapshot-based Immutable Ledgers: Historical earnings never change retroactively.
 * 5. Idempotent Ledger Generation: Unique constraints and guards prevent duplicate entries.
 * 6. Audit Trail: All configuration changes are recorded in AuditLog.
 */

import { Prisma } from "@prisma/client";
import { getDB } from "../../config/db.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";
import { auditLog } from "../../utils/audit.js";
import { emitToBusiness } from "../../config/socket.js";

// ── Tenant & Access Verification ──────────────────────────────────────────────

export const resolveCallerBusinessId = async (caller, requestedBizId = null) => {
  const prisma = getDB();

  if (caller.role === "ADMIN") {
    if (!requestedBizId) {
      throw ApiError.badRequest("businessId is required for ADMIN.", "MISSING_BUSINESS_ID");
    }
    const biz = await prisma.business.findFirst({
      where: { id: requestedBizId, deletedAt: null },
      select: { id: true },
    });
    if (!biz) throw ApiError.notFound("Business not found.", "BUSINESS_NOT_FOUND");
    return requestedBizId;
  }

  if (caller.role === "BUSINESS") {
    const biz = await prisma.business.findFirst({
      where: { ownerId: caller.userId, deletedAt: null },
      select: { id: true },
    });
    if (!biz) throw ApiError.notFound("You do not have a registered business.", "BUSINESS_NOT_FOUND");
    if (requestedBizId && biz.id !== requestedBizId) {
      throw ApiError.forbidden("You cannot access another business's data.", "CROSS_TENANT_FORBIDDEN");
    }
    return biz.id;
  }

  if (caller.role === "STAFF") {
    const staff = await prisma.staff.findFirst({
      where: { userId: caller.userId, deletedAt: null },
      select: { id: true, businessId: true },
    });
    if (!staff) throw ApiError.notFound("Staff profile not found.", "STAFF_NOT_FOUND");
    if (requestedBizId && staff.businessId !== requestedBizId) {
      throw ApiError.forbidden("You cannot access another business's data.", "CROSS_TENANT_FORBIDDEN");
    }
    return staff.businessId;
  }

  throw ApiError.forbidden("Customers cannot access compensation or staff pricing.", "FORBIDDEN");
};

// ── Staff Compensation Configuration (Business Owner Authority) ──────────────

export const getStaffCompensation = async (businessId, staffId, caller) => {
  const prisma = getDB();
  const resolvedBizId = await resolveCallerBusinessId(caller, businessId);

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, businessId: resolvedBizId, deletedAt: null },
    select: { id: true, displayName: true, userId: true },
  });
  if (!staff) throw ApiError.notFound("Staff member not found in this business.", "STAFF_NOT_FOUND");

  // Privacy: Staff role can only inspect their own compensation
  if (caller.role === "STAFF" && staff.userId !== caller.userId) {
    throw ApiError.forbidden("You can only view your own compensation details.", "STAFF_PRIVACY_VIOLATION");
  }

  const [compensation, commissionRules, staffPrices, activeIncentives] = await Promise.all([
    prisma.staffCompensation.findUnique({
      where: { staffId },
    }),
    prisma.commissionRule.findMany({
      where: { businessId: resolvedBizId, staffId, isActive: true },
      include: {
        services: {
          include: {
            service: { select: { id: true, name: true, price: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.staffServicePrice.findMany({
      where: { businessId: resolvedBizId, staffId, isActive: true },
      include: {
        service: { select: { id: true, name: true, price: true } },
      },
    }),
    prisma.incentiveRule.findMany({
      where: {
        businessId: resolvedBizId,
        isActive: true,
        OR: [{ staffId }, { staffId: null }],
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    staffId,
    displayName: staff.displayName,
    compensation: compensation || null,
    commissionRules,
    staffPrices,
    activeIncentives,
  };
};

export const setStaffCompensation = async (businessId, staffId, data, caller) => {
  const prisma = getDB();
  const resolvedBizId = await resolveCallerBusinessId(caller, businessId);

  if (caller.role === "STAFF") {
    throw ApiError.forbidden("Staff members cannot modify compensation configurations.", "FORBIDDEN");
  }

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, businessId: resolvedBizId, deletedAt: null },
    select: { id: true, displayName: true },
  });
  if (!staff) throw ApiError.notFound("Staff member not found in this business.", "STAFF_NOT_FOUND");

  const existing = await prisma.staffCompensation.findUnique({ where: { staffId } });

  const monthlySalary = data.monthlySalary !== undefined && data.monthlySalary !== null
    ? new Prisma.Decimal(data.monthlySalary)
    : null;

  const result = await prisma.$transaction(async (tx) => {
    const compensation = await tx.staffCompensation.upsert({
      where: { staffId },
      create: {
        businessId: resolvedBizId,
        staffId,
        compensationType: data.compensationType,
        monthlySalary,
        payFrequency: data.payFrequency || "MONTHLY",
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      update: {
        compensationType: data.compensationType,
        monthlySalary,
        payFrequency: data.payFrequency || "MONTHLY",
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    // Handle embedded commission rule configuration if provided
    let commissionRule = null;
    if (data.commission) {
      // Deactivate prior active commission rules for this staff member
      await tx.commissionRule.updateMany({
        where: { businessId: resolvedBizId, staffId, isActive: true },
        data: { isActive: false, effectiveTo: new Date() },
      });

      const percentage = data.commission.percentage !== undefined && data.commission.percentage !== null
        ? new Prisma.Decimal(data.commission.percentage)
        : null;
      const fixedAmount = data.commission.fixedAmount !== undefined && data.commission.fixedAmount !== null
        ? new Prisma.Decimal(data.commission.fixedAmount)
        : null;

      commissionRule = await tx.commissionRule.create({
        data: {
          businessId: resolvedBizId,
          staffId,
          type: data.commission.type,
          percentage,
          fixedAmount,
          calculationBasis: data.commission.calculationBasis || "COMPLETED_AND_PAID",
          effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
          effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
          isActive: data.commission.isActive !== undefined ? data.commission.isActive : true,
        },
      });

      if (data.commission.serviceIds && data.commission.serviceIds.length > 0) {
        await tx.commissionRuleService.createMany({
          data: data.commission.serviceIds.map((serviceId) => ({
            commissionRuleId: commissionRule.id,
            serviceId,
          })),
        });
      }
    }

    return { compensation, commissionRule };
  });

  // Audit log entry
  await auditLog(
    caller.userId,
    resolvedBizId,
    existing ? "STAFF_COMPENSATION_UPDATED" : "STAFF_COMPENSATION_CREATED",
    "StaffCompensation",
    result.compensation.id,
    {
      staffId,
      staffName: staff.displayName,
      compensationType: data.compensationType,
      monthlySalary: data.monthlySalary,
    }
  );

  emitToBusiness(resolvedBizId, "compensation:updated", {
    staffId,
    compensationType: data.compensationType,
  });

  return result;
};

// ── Commission Rules Management ───────────────────────────────────────────────

export const listCommissionRules = async (businessId, query, caller) => {
  const prisma = getDB();
  const resolvedBizId = await resolveCallerBusinessId(caller, businessId);

  const where = { businessId: resolvedBizId };
  if (query.staffId) where.staffId = query.staffId;
  if (query.isActive !== undefined) where.isActive = query.isActive === "true" || query.isActive === true;

  const rules = await prisma.commissionRule.findMany({
    where,
    include: {
      staff: { select: { id: true, displayName: true } },
      services: {
        include: {
          service: { select: { id: true, name: true, price: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { rules };
};

export const createCommissionRule = async (businessId, data, caller) => {
  const prisma = getDB();
  const resolvedBizId = await resolveCallerBusinessId(caller, businessId);

  if (caller.role === "STAFF") throw ApiError.forbidden("Staff cannot create commission rules.", "FORBIDDEN");

  if (data.staffId) {
    const staff = await prisma.staff.findFirst({
      where: { id: data.staffId, businessId: resolvedBizId, deletedAt: null },
    });
    if (!staff) throw ApiError.notFound("Staff not found in this business.", "STAFF_NOT_FOUND");
  }

  const percentage = data.percentage !== undefined && data.percentage !== null
    ? new Prisma.Decimal(data.percentage)
    : null;
  const fixedAmount = data.fixedAmount !== undefined && data.fixedAmount !== null
    ? new Prisma.Decimal(data.fixedAmount)
    : null;

  const rule = await prisma.$transaction(async (tx) => {
    const created = await tx.commissionRule.create({
      data: {
        businessId: resolvedBizId,
        staffId: data.staffId || null,
        type: data.type,
        percentage,
        fixedAmount,
        calculationBasis: data.calculationBasis || "COMPLETED_AND_PAID",
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    if (data.serviceIds && data.serviceIds.length > 0) {
      await tx.commissionRuleService.createMany({
        data: data.serviceIds.map((serviceId) => ({
          commissionRuleId: created.id,
          serviceId,
        })),
      });
    }

    return created;
  });

  await auditLog(
    caller.userId,
    resolvedBizId,
    "COMMISSION_RULE_CREATED",
    "CommissionRule",
    rule.id,
    { staffId: data.staffId, type: data.type, percentage: data.percentage, fixedAmount: data.fixedAmount }
  );

  return rule;
};

// ── Incentive Rules Management & Live Progress ────────────────────────────────

export const listIncentiveRules = async (businessId, query, caller) => {
  const prisma = getDB();
  const resolvedBizId = await resolveCallerBusinessId(caller, businessId);

  const where = { businessId: resolvedBizId };
  if (query.staffId) where.OR = [{ staffId: query.staffId }, { staffId: null }];
  if (query.isActive !== undefined) where.isActive = query.isActive === "true" || query.isActive === true;

  const rules = await prisma.incentiveRule.findMany({
    where,
    include: {
      staff: { select: { id: true, displayName: true } },
      service: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate live progress for each rule
  const rulesWithProgress = await Promise.all(
    rules.map(async (rule) => {
      const progress = await calculateIncentiveProgress(prisma, rule, query.staffId || rule.staffId);
      return {
        ...rule,
        progress,
      };
    })
  );

  return { incentives: rulesWithProgress };
};

export const createIncentiveRule = async (businessId, data, caller) => {
  const prisma = getDB();
  const resolvedBizId = await resolveCallerBusinessId(caller, businessId);

  if (caller.role === "STAFF") throw ApiError.forbidden("Staff cannot create incentive rules.", "FORBIDDEN");

  if (data.staffId) {
    const staff = await prisma.staff.findFirst({
      where: { id: data.staffId, businessId: resolvedBizId, deletedAt: null },
    });
    if (!staff) throw ApiError.notFound("Staff not found in this business.", "STAFF_NOT_FOUND");
  }

  const rule = await prisma.incentiveRule.create({
    data: {
      businessId: resolvedBizId,
      staffId: data.staffId || null,
      name: data.name,
      metric: data.metric,
      target: new Prisma.Decimal(data.target),
      rewardType: data.rewardType || "FIXED_BONUS",
      rewardAmount: new Prisma.Decimal(data.rewardAmount),
      period: data.period || "MONTHLY",
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      serviceId: data.serviceId || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });

  await auditLog(
    caller.userId,
    resolvedBizId,
    "INCENTIVE_CREATED",
    "IncentiveRule",
    rule.id,
    { name: data.name, metric: data.metric, target: data.target, rewardAmount: data.rewardAmount }
  );

  return rule;
};

export const updateIncentiveRule = async (businessId, incentiveId, data, caller) => {
  const prisma = getDB();
  const resolvedBizId = await resolveCallerBusinessId(caller, businessId);

  if (caller.role === "STAFF") throw ApiError.forbidden("Staff cannot update incentive rules.", "FORBIDDEN");

  const existing = await prisma.incentiveRule.findFirst({
    where: { id: incentiveId, businessId: resolvedBizId },
  });
  if (!existing) throw ApiError.notFound("Incentive rule not found.", "INCENTIVE_NOT_FOUND");

  const updateData = { ...data };
  if (data.target !== undefined) updateData.target = new Prisma.Decimal(data.target);
  if (data.rewardAmount !== undefined) updateData.rewardAmount = new Prisma.Decimal(data.rewardAmount);
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

  const updated = await prisma.incentiveRule.update({
    where: { id: incentiveId },
    data: updateData,
  });

  await auditLog(
    caller.userId,
    resolvedBizId,
    "INCENTIVE_UPDATED",
    "IncentiveRule",
    incentiveId,
    { old: existing, updated: data }
  );

  return updated;
};

export const deleteIncentiveRule = async (businessId, incentiveId, caller) => {
  const prisma = getDB();
  const resolvedBizId = await resolveCallerBusinessId(caller, businessId);

  if (caller.role === "STAFF") throw ApiError.forbidden("Staff cannot delete incentive rules.", "FORBIDDEN");

  const existing = await prisma.incentiveRule.findFirst({
    where: { id: incentiveId, businessId: resolvedBizId },
  });
  if (!existing) throw ApiError.notFound("Incentive rule not found.", "INCENTIVE_NOT_FOUND");

  await prisma.incentiveRule.update({
    where: { id: incentiveId },
    data: { isActive: false },
  });

  await auditLog(caller.userId, resolvedBizId, "INCENTIVE_DEACTIVATED", "IncentiveRule", incentiveId, {});
  return { success: true, message: "Incentive rule deactivated successfully." };
};

// ── Live Incentive Progress Calculator ────────────────────────────────────────

const calculateIncentiveProgress = async (prisma, rule, targetStaffId = null) => {
  const now = new Date();
  let startDate = rule.startDate;
  let endDate = rule.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  if (rule.period === "MONTHLY") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (rule.period === "WEEKLY") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startDate = new Date(now.setDate(diff));
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  }

  const staffFilter = targetStaffId || rule.staffId;
  const whereAppt = {
    businessId: rule.businessId,
    status: "COMPLETED",
    appointmentDate: {
      gte: startDate,
      lte: endDate,
    },
    deletedAt: null,
    ...(staffFilter ? { staffId: staffFilter } : {}),
  };

  let currentVal = new Prisma.Decimal(0);

  if (rule.metric === "APPOINTMENT_COUNT") {
    const count = await prisma.appointment.count({ where: whereAppt });
    currentVal = new Prisma.Decimal(count);
  } else if (rule.metric === "TOTAL_REVENUE") {
    const agg = await prisma.appointment.aggregate({
      where: whereAppt,
      _sum: { totalAmount: true },
    });
    currentVal = agg._sum.totalAmount || new Prisma.Decimal(0);
  } else if (rule.metric === "SERVICE_COUNT") {
    if (!rule.serviceId) {
      currentVal = new Prisma.Decimal(0);
    } else {
      const count = await prisma.appointmentService.count({
        where: {
          serviceId: rule.serviceId,
          appointment: whereAppt,
        },
      });
      currentVal = new Prisma.Decimal(count);
    }
  }

  const target = new Prisma.Decimal(rule.target);
  const percentage = target.gt(0)
    ? Math.min(100, Math.round(currentVal.div(target).mul(100).toNumber()))
    : 0;

  return {
    current: currentVal.toString(),
    target: target.toString(),
    percentage,
    isAchieved: currentVal.gte(target),
    periodStart: startDate,
    periodEnd: endDate,
  };
};

// ── Staff-Specific Service Pricing (Fallback to Base Price) ───────────────────

export const listStaffServicePrices = async (businessId, serviceId, caller) => {
  const prisma = getDB();
  const resolvedBizId = await resolveCallerBusinessId(caller, businessId);

  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: resolvedBizId, deletedAt: null },
    select: { id: true, name: true, price: true, durationMinutes: true },
  });
  if (!service) throw ApiError.notFound("Service not found.", "SERVICE_NOT_FOUND");

  const overrides = await prisma.staffServicePrice.findMany({
    where: { businessId: resolvedBizId, serviceId },
    include: {
      staff: { select: { id: true, displayName: true, designation: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    service,
    basePrice: service.price.toString(),
    overrides,
  };
};

export const setStaffServicePrice = async (businessId, serviceId, staffId, data, caller) => {
  const prisma = getDB();
  const resolvedBizId = await resolveCallerBusinessId(caller, businessId);

  if (caller.role === "STAFF") throw ApiError.forbidden("Staff cannot set service prices.", "FORBIDDEN");

  const [service, staff] = await Promise.all([
    prisma.service.findFirst({ where: { id: serviceId, businessId: resolvedBizId, deletedAt: null } }),
    prisma.staff.findFirst({ where: { id: staffId, businessId: resolvedBizId, deletedAt: null } }),
  ]);
  if (!service) throw ApiError.notFound("Service not found.", "SERVICE_NOT_FOUND");
  if (!staff) throw ApiError.notFound("Staff not found in this business.", "STAFF_NOT_FOUND");

  const priceDecimal = new Prisma.Decimal(data.price);

  const override = await prisma.staffServicePrice.upsert({
    where: {
      staffId_serviceId: { staffId, serviceId },
    },
    create: {
      businessId: resolvedBizId,
      staffId,
      serviceId,
      price: priceDecimal,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
    update: {
      price: priceDecimal,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });

  await auditLog(
    caller.userId,
    resolvedBizId,
    "STAFF_SERVICE_PRICE_UPDATED",
    "StaffServicePrice",
    override.id,
    {
      serviceId,
      serviceName: service.name,
      staffId,
      staffName: staff.displayName,
      basePrice: service.price.toString(),
      overridePrice: data.price,
    }
  );

  return override;
};

export const deleteStaffServicePrice = async (businessId, serviceId, staffId, caller) => {
  const prisma = getDB();
  const resolvedBizId = await resolveCallerBusinessId(caller, businessId);

  if (caller.role === "STAFF") throw ApiError.forbidden("Staff cannot remove service price overrides.", "FORBIDDEN");

  const existing = await prisma.staffServicePrice.findUnique({
    where: { staffId_serviceId: { staffId, serviceId } },
  });
  if (!existing || existing.businessId !== resolvedBizId) {
    throw ApiError.notFound("Staff service price override not found.", "OVERRIDE_NOT_FOUND");
  }

  await prisma.staffServicePrice.delete({
    where: { staffId_serviceId: { staffId, serviceId } },
  });

  await auditLog(
    caller.userId,
    resolvedBizId,
    "STAFF_SERVICE_PRICE_DELETED",
    "StaffServicePrice",
    existing.id,
    { serviceId, staffId }
  );

  return { success: true, message: "Staff service price override removed. Base price will apply." };
};

/**
 * Helper to resolve the authoritative service price for booking.
 * Fallback order:
 * 1. Active StaffServicePrice override (if staffId supplied).
 * 2. Service base price.
 */
export const resolveServicePrice = async (businessId, serviceId, staffId = null) => {
  const prisma = getDB();

  if (staffId) {
    const override = await prisma.staffServicePrice.findFirst({
      where: {
        businessId,
        staffId,
        serviceId,
        isActive: true,
      },
      select: { price: true },
    });
    if (override) return override.price;
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId, isActive: true, deletedAt: null },
    select: { price: true },
  });
  if (!service) throw ApiError.badRequest(`Service ${serviceId} not found or inactive.`, "INVALID_SERVICE");
  return service.price;
};

// ── Commission Calculation & Immutable Ledger Engine ─────────────────────────

/**
 * Evaluates commission eligibility and creates immutable CompensationLedger entries.
 * Idempotent: Uses unique constraint on (staffId, appointmentId, type, serviceId).
 */
export const evaluateAppointmentCommission = async (appointmentId) => {
  const prisma = getDB();

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      staff: true,
      appointmentServices: {
        include: { service: true },
      },
      payment: true,
    },
  });

  if (!appointment || !appointment.staffId) {
    logger.debug(`[Commission] Appointment ${appointmentId} has no assigned staff. Skipping.`);
    return [];
  }

  const { staffId, businessId } = appointment;

  // 1. Check if staff has compensation configured
  const compensation = await prisma.staffCompensation.findUnique({
    where: { staffId },
  });

  // Check if compensation type includes COMMISSION
  const commissionTypes = ["COMMISSION", "SALARY_COMMISSION", "SALARY_COMMISSION_INCENTIVE", "COMMISSION_INCENTIVE"];
  if (!compensation || !commissionTypes.includes(compensation.compensationType) || !compensation.isActive) {
    logger.debug(`[Commission] Staff ${staffId} compensation model does not include commission.`);
    return [];
  }

  // 2. Fetch active commission rules for this staff member (or business-wide rule)
  const rules = await prisma.commissionRule.findMany({
    where: {
      businessId,
      isActive: true,
      OR: [{ staffId }, { staffId: null }],
    },
    include: {
      services: true,
    },
    orderBy: { staffId: "desc" }, // Staff-specific rule prioritized over business-wide rule
  });

  if (rules.length === 0) {
    logger.debug(`[Commission] No active commission rules found for staff ${staffId}.`);
    return [];
  }

  const createdLedgerEntries = [];

  for (const as of appointment.appointmentServices) {
    // Find matching rule for this service
    const matchingRule = rules.find((r) => {
      if (!r.services || r.services.length === 0) return true; // Applies to all services
      return r.services.some((s) => s.serviceId === as.serviceId);
    });

    if (!matchingRule) continue;

    // Check Calculation Basis Eligibility
    const basis = matchingRule.calculationBasis;
    const isCompleted = appointment.status === "COMPLETED";
    const isPaid = appointment.payment && appointment.payment.status === "PAID";

    let isEligible = false;
    if (basis === "COMPLETED" && isCompleted) isEligible = true;
    else if (basis === "PAID" && isPaid) isEligible = true;
    else if (basis === "COMPLETED_AND_PAID" && isCompleted && isPaid) isEligible = true;
    else if ((basis === "SERVICE_SUBTOTAL" || basis === "NET_AFTER_DISCOUNT") && (isCompleted || isPaid)) isEligible = true;

    if (!isEligible) {
      logger.debug(`[Commission] Appointment ${appointmentId} not yet eligible under basis ${basis}.`);
      continue;
    }

    // Check idempotency: does a COMMISSION entry already exist for this service?
    const existing = await prisma.compensationLedger.findFirst({
      where: {
        staffId,
        appointmentId,
        serviceId: as.serviceId,
        type: "COMMISSION",
      },
    });

    if (existing) {
      logger.debug(`[Commission] Ledger entry already exists for appt ${appointmentId}, service ${as.serviceId}.`);
      continue;
    }

    // Calculate commission amount using exact Decimal
    const unitPrice = new Prisma.Decimal(as.priceAtBooking);
    const quantity = new Prisma.Decimal(as.quantity || 1);
    const grossAmount = unitPrice.mul(quantity);
    const discount = new Prisma.Decimal(0); // Can be extended if discount metadata exists
    const eligibleAmount = grossAmount.sub(discount);

    let commissionAmount = new Prisma.Decimal(0);
    if (matchingRule.type === "PERCENTAGE" && matchingRule.percentage) {
      commissionAmount = eligibleAmount.mul(matchingRule.percentage).div(new Prisma.Decimal(100));
    } else if (matchingRule.type === "FIXED" && matchingRule.fixedAmount) {
      commissionAmount = new Prisma.Decimal(matchingRule.fixedAmount).mul(quantity);
    }

    // Capture complete calculation snapshot
    const snapshot = {
      appointmentId,
      serviceId: as.serviceId,
      serviceName: as.service.name,
      priceAtBooking: as.priceAtBooking.toString(),
      quantity: as.quantity,
      grossAmount: grossAmount.toString(),
      discount: discount.toString(),
      netEligibleAmount: eligibleAmount.toString(),
      commissionRuleId: matchingRule.id,
      commissionType: matchingRule.type,
      commissionRate: matchingRule.type === "PERCENTAGE" ? `${matchingRule.percentage}%` : `₹${matchingRule.fixedAmount}`,
      calculationBasis: basis,
      appointmentStatus: appointment.status,
      paymentStatus: appointment.payment?.status || "UNPAID",
      calculatedAt: new Date().toISOString(),
    };

    const ledgerEntry = await prisma.compensationLedger.create({
      data: {
        businessId,
        staffId,
        appointmentId,
        serviceId: as.serviceId,
        type: "COMMISSION",
        amount: commissionAmount,
        calculationSnapshot: snapshot,
        status: "APPROVED",
      },
    });

    createdLedgerEntries.push(ledgerEntry);
    logger.info(`[Commission] Ledger created: staff=${staffId} appt=${appointmentId} amount=₹${commissionAmount}`);
  }

  // Also check if any incentive thresholds were met
  await evaluateIncentivesOnEvent(appointmentId);

  return createdLedgerEntries;
};

/**
 * Checks active incentive rules and awards rewards if newly achieved.
 */
export const evaluateIncentivesOnEvent = async (appointmentId) => {
  const prisma = getDB();

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { businessId: true, staffId: true, status: true },
  });

  if (!appointment || !appointment.staffId || appointment.status !== "COMPLETED") return [];

  const { businessId, staffId } = appointment;

  const activeRules = await prisma.incentiveRule.findMany({
    where: {
      businessId,
      isActive: true,
      OR: [{ staffId }, { staffId: null }],
    },
  });

  const awarded = [];

  for (const rule of activeRules) {
    const progress = await calculateIncentiveProgress(prisma, rule, staffId);
    if (!progress.isAchieved) continue;

    // Check if an INCENTIVE ledger entry was already granted for this period
    const existing = await prisma.compensationLedger.findFirst({
      where: {
        businessId,
        staffId,
        type: "INCENTIVE",
        periodStart: progress.periodStart,
        periodEnd: progress.periodEnd,
        calculationSnapshot: {
          path: ["incentiveRuleId"],
          equals: rule.id,
        },
      },
    });

    if (existing) continue;

    const snapshot = {
      incentiveRuleId: rule.id,
      incentiveName: rule.name,
      metric: rule.metric,
      target: progress.target,
      currentAchieved: progress.current,
      rewardType: rule.rewardType,
      period: rule.period,
      periodStart: progress.periodStart,
      periodEnd: progress.periodEnd,
      awardedAt: new Date().toISOString(),
    };

    const entry = await prisma.compensationLedger.create({
      data: {
        businessId,
        staffId,
        type: "INCENTIVE",
        amount: rule.rewardAmount,
        calculationSnapshot: snapshot,
        status: "APPROVED",
        periodStart: progress.periodStart,
        periodEnd: progress.periodEnd,
      },
    });

    awarded.push(entry);
    logger.info(`[Incentive] Goal reached! Staff=${staffId} Rule='${rule.name}' Reward=₹${rule.rewardAmount}`);

    emitToBusiness(businessId, "incentive:earned", {
      staffId,
      incentiveName: rule.name,
      rewardAmount: rule.rewardAmount.toString(),
    });
  }

  return awarded;
};

/**
 * Handles appointment cancellation by generating immutable REVERSAL ledger entries.
 */
export const handleAppointmentCancellation = async (appointmentId) => {
  const prisma = getDB();

  const existingEntries = await prisma.compensationLedger.findMany({
    where: { appointmentId, type: "COMMISSION" },
  });

  const reversals = [];

  for (const entry of existingEntries) {
    // Check if reversal already exists
    const alreadyReversed = await prisma.compensationLedger.findFirst({
      where: {
        staffId: entry.staffId,
        appointmentId,
        serviceId: entry.serviceId,
        type: "REVERSAL",
      },
    });

    if (alreadyReversed) continue;

    const reversal = await prisma.compensationLedger.create({
      data: {
        businessId: entry.businessId,
        staffId: entry.staffId,
        appointmentId,
        serviceId: entry.serviceId,
        type: "REVERSAL",
        amount: entry.amount.negated(),
        calculationSnapshot: {
          reason: "APPOINTMENT_CANCELLED",
          originalLedgerId: entry.id,
          originalAmount: entry.amount.toString(),
          reversedAt: new Date().toISOString(),
        },
        status: "APPROVED",
      },
    });

    reversals.push(reversal);
    logger.info(`[Compensation] Commission reversed for cancelled appt ${appointmentId}: -₹${entry.amount}`);
  }

  return reversals;
};

/**
 * Handles payment refunds by creating adjustment/reversal entries.
 */
export const handlePaymentRefund = async (paymentId) => {
  const prisma = getDB();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { appointmentId: true, businessId: true },
  });

  if (!payment || !payment.appointmentId) return [];

  const existingEntries = await prisma.compensationLedger.findMany({
    where: { appointmentId: payment.appointmentId, type: "COMMISSION" },
  });

  const adjustments = [];

  for (const entry of existingEntries) {
    const alreadyAdjusted = await prisma.compensationLedger.findFirst({
      where: {
        staffId: entry.staffId,
        appointmentId: payment.appointmentId,
        serviceId: entry.serviceId,
        type: "ADJUSTMENT",
      },
    });

    if (alreadyAdjusted) continue;

    const adj = await prisma.compensationLedger.create({
      data: {
        businessId: entry.businessId,
        staffId: entry.staffId,
        appointmentId: payment.appointmentId,
        serviceId: entry.serviceId,
        type: "ADJUSTMENT",
        amount: entry.amount.negated(),
        calculationSnapshot: {
          reason: "PAYMENT_REFUNDED",
          paymentId,
          originalLedgerId: entry.id,
          originalAmount: entry.amount.toString(),
          adjustedAt: new Date().toISOString(),
        },
        status: "APPROVED",
      },
    });

    adjustments.push(adj);
  }

  return adjustments;
};

// ── Staff Earnings & Ledger History (Read-only for Staff) ─────────────────────

export const getStaffEarnings = async (businessId, staffId, query, caller) => {
  const prisma = getDB();
  const resolvedBizId = await resolveCallerBusinessId(caller, businessId);

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, businessId: resolvedBizId, deletedAt: null },
    include: { user: { select: { email: true } } },
  });
  if (!staff) throw ApiError.notFound("Staff not found in this business.", "STAFF_NOT_FOUND");

  // Privacy check
  if (caller.role === "STAFF" && staff.userId !== caller.userId) {
    throw ApiError.forbidden("You can only view your own earnings.", "STAFF_PRIVACY_VIOLATION");
  }

  const now = new Date();
  const periodStart = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = query.endDate ? new Date(query.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [compensation, ledgers, incentiveRules] = await Promise.all([
    prisma.staffCompensation.findUnique({ where: { staffId } }),
    prisma.compensationLedger.findMany({
      where: {
        staffId,
        businessId: resolvedBizId,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            startTime: true,
            status: true,
            customer: { select: { user: { select: { name: true } } } },
          },
        },
        service: { select: { id: true, name: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.incentiveRule.findMany({
      where: {
        businessId: resolvedBizId,
        isActive: true,
        OR: [{ staffId }, { staffId: null }],
      },
    }),
  ]);

  let totalCommission = new Prisma.Decimal(0);
  let totalIncentives = new Prisma.Decimal(0);
  let totalReversals = new Prisma.Decimal(0);

  for (const entry of ledgers) {
    if (entry.type === "COMMISSION") {
      totalCommission = totalCommission.add(entry.amount);
    } else if (entry.type === "INCENTIVE") {
      totalIncentives = totalIncentives.add(entry.amount);
    } else if (entry.type === "REVERSAL" || entry.type === "ADJUSTMENT") {
      totalReversals = totalReversals.add(entry.amount);
    }
  }

  const baseSalary = compensation && compensation.isActive && compensation.monthlySalary
    ? compensation.monthlySalary
    : new Prisma.Decimal(0);

  const totalPeriodEarnings = baseSalary.add(totalCommission).add(totalIncentives).add(totalReversals);

  // Calculate live incentive progress for this staff
  const incentiveProgress = await Promise.all(
    incentiveRules.map(async (r) => {
      const p = await calculateIncentiveProgress(prisma, r, staffId);
      return {
        id: r.id,
        name: r.name,
        metric: r.metric,
        target: r.target.toString(),
        rewardAmount: r.rewardAmount.toString(),
        period: r.period,
        progress: p,
      };
    })
  );

  return {
    staffId,
    displayName: staff.displayName,
    compensationType: compensation?.compensationType || "UNCONFIGURED",
    baseSalary: baseSalary.toString(),
    totalCommission: totalCommission.toString(),
    totalIncentives: totalIncentives.toString(),
    totalReversals: totalReversals.toString(),
    totalPeriodEarnings: totalPeriodEarnings.toString(),
    periodStart,
    periodEnd,
    incentiveProgress,
    ledgerEntries: ledgers.map((l) => ({
      id: l.id,
      type: l.type,
      amount: l.amount.toString(),
      status: l.status,
      appointmentId: l.appointmentId,
      serviceName: l.service?.name || l.calculationSnapshot?.serviceName || "Service",
      customerName: l.appointment?.customer?.user?.name || "Customer",
      calculationSnapshot: l.calculationSnapshot,
      createdAt: l.createdAt,
    })),
  };
};

// ── Business Dashboard Payroll Summary ─────────────────────────────────────────

export const getBusinessPayrollSummary = async (businessId, caller) => {
  const prisma = getDB();
  const resolvedBizId = await resolveCallerBusinessId(caller, businessId);

  if (caller.role === "STAFF") {
    throw ApiError.forbidden("Staff cannot view business payroll summary.", "FORBIDDEN");
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [staffList, ledgers, activeIncentives] = await Promise.all([
    prisma.staff.findMany({
      where: { businessId: resolvedBizId, deletedAt: null },
      include: {
        compensation: true,
      },
    }),
    prisma.compensationLedger.findMany({
      where: {
        businessId: resolvedBizId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.incentiveRule.findMany({
      where: { businessId: resolvedBizId, isActive: true },
    }),
  ]);

  let totalStaffCost = new Prisma.Decimal(0);
  const staffSummaries = [];

  for (const s of staffList) {
    const salary = s.compensation?.isActive && s.compensation.monthlySalary
      ? s.compensation.monthlySalary
      : new Prisma.Decimal(0);

    totalStaffCost = totalStaffCost.add(salary);

    const staffLedgers = ledgers.filter((l) => l.staffId === s.id);
    let sComm = new Prisma.Decimal(0);
    let sInc = new Prisma.Decimal(0);
    let sRev = new Prisma.Decimal(0);

    for (const sl of staffLedgers) {
      if (sl.type === "COMMISSION") sComm = sComm.add(sl.amount);
      else if (sl.type === "INCENTIVE") sInc = sInc.add(sl.amount);
      else if (sl.type === "REVERSAL" || sl.type === "ADJUSTMENT") sRev = sRev.add(sl.amount);
    }

    staffSummaries.push({
      staffId: s.id,
      name: s.displayName,
      designation: s.designation,
      compensationType: s.compensation?.compensationType || "UNCONFIGURED",
      salary: salary.toString(),
      commissionEarned: sComm.toString(),
      incentivesEarned: sInc.toString(),
      totalPeriodEarnings: salary.add(sComm).add(sInc).add(sRev).toString(),
    });
  }

  let totalCommission = new Prisma.Decimal(0);
  let totalIncentives = new Prisma.Decimal(0);
  let totalReversals = new Prisma.Decimal(0);

  for (const l of ledgers) {
    if (l.type === "COMMISSION") totalCommission = totalCommission.add(l.amount);
    else if (l.type === "INCENTIVE") totalIncentives = totalIncentives.add(l.amount);
    else if (l.type === "REVERSAL" || l.type === "ADJUSTMENT") totalReversals = totalReversals.add(l.amount);
  }

  let pendingIncentivesTotal = new Prisma.Decimal(0);
  for (const r of activeIncentives) {
    pendingIncentivesTotal = pendingIncentivesTotal.add(r.rewardAmount);
  }

  const estimatedPayroll = totalStaffCost.add(totalCommission).add(totalIncentives).add(totalReversals);

  return {
    month: monthStart.toLocaleString("default", { month: "long", year: "numeric" }),
    totalStaffCost: totalStaffCost.toString(),
    totalCommission: totalCommission.toString(),
    totalIncentives: totalIncentives.toString(),
    totalReversals: totalReversals.toString(),
    pendingIncentives: pendingIncentivesTotal.toString(),
    estimatedPayroll: estimatedPayroll.toString(),
    staffCount: staffList.length,
    staffBreakdown: staffSummaries,
  };
};
