/**
 * src/modules/compensation/compensation.controller.js
 */

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendCreated } from "../../utils/response.js";
import * as service from "./compensation.service.js";

export const getStaffCompensationController = asyncHandler(async (req, res) => {
  const result = await service.getStaffCompensation(req.params.businessId, req.params.staffId, req.user);
  return sendSuccess(res, "Staff compensation retrieved successfully.", result);
});

export const setStaffCompensationController = asyncHandler(async (req, res) => {
  const result = await service.setStaffCompensation(req.params.businessId, req.params.staffId, req.body, req.user);
  return sendSuccess(res, "Staff compensation configured successfully.", result);
});

export const listCommissionRulesController = asyncHandler(async (req, res) => {
  const result = await service.listCommissionRules(req.params.businessId, req.query, req.user);
  return sendSuccess(res, "Commission rules retrieved.", result);
});

export const createCommissionRuleController = asyncHandler(async (req, res) => {
  const result = await service.createCommissionRule(req.params.businessId, req.body, req.user);
  return sendCreated(res, "Commission rule created successfully.", result);
});

export const listIncentiveRulesController = asyncHandler(async (req, res) => {
  const result = await service.listIncentiveRules(req.params.businessId, req.query, req.user);
  return sendSuccess(res, "Incentive rules retrieved.", result);
});

export const createIncentiveRuleController = asyncHandler(async (req, res) => {
  const result = await service.createIncentiveRule(req.params.businessId, req.body, req.user);
  return sendCreated(res, "Incentive rule created successfully.", result);
});

export const updateIncentiveRuleController = asyncHandler(async (req, res) => {
  const result = await service.updateIncentiveRule(req.params.businessId, req.params.id, req.body, req.user);
  return sendSuccess(res, "Incentive rule updated successfully.", result);
});

export const deleteIncentiveRuleController = asyncHandler(async (req, res) => {
  const result = await service.deleteIncentiveRule(req.params.businessId, req.params.id, req.user);
  return sendSuccess(res, "Incentive rule deactivated successfully.", result);
});

export const listStaffServicePricesController = asyncHandler(async (req, res) => {
  const result = await service.listStaffServicePrices(req.params.businessId, req.params.serviceId, req.user);
  return sendSuccess(res, "Staff service prices retrieved.", result);
});

export const setStaffServicePriceController = asyncHandler(async (req, res) => {
  const result = await service.setStaffServicePrice(
    req.params.businessId,
    req.params.serviceId,
    req.params.staffId,
    req.body,
    req.user
  );
  return sendSuccess(res, "Staff service price override configured successfully.", result);
});

export const deleteStaffServicePriceController = asyncHandler(async (req, res) => {
  const result = await service.deleteStaffServicePrice(
    req.params.businessId,
    req.params.serviceId,
    req.params.staffId,
    req.user
  );
  return sendSuccess(res, "Staff service price override removed successfully.", result);
});

export const getStaffEarningsController = asyncHandler(async (req, res) => {
  const result = await service.getStaffEarnings(req.params.businessId, req.params.staffId, req.query, req.user);
  return sendSuccess(res, "Staff earnings summary retrieved.", result);
});

export const getStaffMeEarningsController = asyncHandler(async (req, res) => {
  // Extract staff member's businessId and staffId from caller profile
  const resolvedBizId = await service.resolveCallerBusinessId(req.user);
  const prisma = (await import("../../config/db.js")).getDB();
  const staff = await prisma.staff.findFirst({
    where: { userId: req.user.userId, deletedAt: null },
    select: { id: true },
  });
  if (!staff) {
    return res.status(404).json({ success: false, message: "Staff profile not found." });
  }

  const result = await service.getStaffEarnings(resolvedBizId, staff.id, req.query, req.user);
  return sendSuccess(res, "My earnings retrieved successfully.", result);
});

export const getBusinessPayrollSummaryController = asyncHandler(async (req, res) => {
  const result = await service.getBusinessPayrollSummary(req.params.businessId, req.user);
  return sendSuccess(res, "Business payroll summary retrieved.", result);
});
