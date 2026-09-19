/**
 * backend/tests/compensation.test.js
 *
 * Comprehensive Test Suite for Business Staff Compensation & Service Pricing System.
 * Covers all 22 business rules & constraints.
 */

import "dotenv/config";
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient, Prisma } from "@prisma/client";
import * as compService from "../src/modules/compensation/compensation.service.js";
import * as apptService from "../src/modules/appointments/appointments.service.js";
import * as paymentService from "../src/modules/payments/payments.service.js";

const prisma = new PrismaClient();

describe("Business Staff Compensation + Service Pricing System", () => {
  let bizOwnerA, bizOwnerB, staffUserA, staffUserB, staffUserC, staffUserD, staffUserE, customerUser;
  let businessA, businessB;
  let staffA, staffB, staffC, staffD, staffE;
  let serviceHaircut, serviceSpa, serviceFacial;

  before(async () => {
    // 1. Create Business Owner A & Business A
    bizOwnerA = await prisma.user.create({
      data: {
        name: "Owner A",
        email: `owner_a_${Date.now()}@test.com`,
        passwordHash: "hash",
        role: "BUSINESS",
      },
    });

    businessA = await prisma.business.create({
      data: {
        ownerId: bizOwnerA.id,
        name: "Luxe Salon A",
        slug: `luxe-salon-a-${Date.now()}`,
        status: "ACTIVE",
        isActive: true,
      },
    });

    // 2. Create Business Owner B & Business B (for Tenant Isolation testing)
    bizOwnerB = await prisma.user.create({
      data: {
        name: "Owner B",
        email: `owner_b_${Date.now()}@test.com`,
        passwordHash: "hash",
        role: "BUSINESS",
      },
    });

    businessB = await prisma.business.create({
      data: {
        ownerId: bizOwnerB.id,
        name: "Elite Salon B",
        slug: `elite-salon-b-${Date.now()}`,
        status: "ACTIVE",
        isActive: true,
      },
    });

    // 3. Create Staff Users & Profiles for Business A
    // Staff A: Salary Only
    staffUserA = await prisma.user.create({
      data: { name: "Staff A", email: `staff_a_${Date.now()}@test.com`, passwordHash: "hash", role: "STAFF" },
    });
    staffA = await prisma.staff.create({
      data: { userId: staffUserA.id, businessId: businessA.id, displayName: "Staff A (Salary Only)", status: "ACTIVE" },
    });

    // Staff B: Commission Only
    staffUserB = await prisma.user.create({
      data: { name: "Staff B", email: `staff_b_${Date.now()}@test.com`, passwordHash: "hash", role: "STAFF" },
    });
    staffB = await prisma.staff.create({
      data: { userId: staffUserB.id, businessId: businessA.id, displayName: "Staff B (Commission Only)", status: "ACTIVE" },
    });

    // Staff C: Salary + Commission
    staffUserC = await prisma.user.create({
      data: { name: "Staff C", email: `staff_c_${Date.now()}@test.com`, passwordHash: "hash", role: "STAFF" },
    });
    staffC = await prisma.staff.create({
      data: { userId: staffUserC.id, businessId: businessA.id, displayName: "Staff C (Salary+Comm)", status: "ACTIVE" },
    });

    // Staff D: Salary + Incentive
    staffUserD = await prisma.user.create({
      data: { name: "Staff D", email: `staff_d_${Date.now()}@test.com`, passwordHash: "hash", role: "STAFF" },
    });
    staffD = await prisma.staff.create({
      data: { userId: staffUserD.id, businessId: businessA.id, displayName: "Staff D (Salary+Inc)", status: "ACTIVE" },
    });

    // Staff E: Salary + Commission + Incentive
    staffUserE = await prisma.user.create({
      data: { name: "Staff E", email: `staff_e_${Date.now()}@test.com`, passwordHash: "hash", role: "STAFF" },
    });
    staffE = await prisma.staff.create({
      data: { userId: staffUserE.id, businessId: businessA.id, displayName: "Staff E (Full Hybrid)", status: "ACTIVE" },
    });

    // Schedules for all staff
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    for (const s of [staffA, staffB, staffC, staffD, staffE]) {
      for (const day of days) {
        await prisma.staffSchedule.create({
          data: { staffId: s.id, dayOfWeek: day, startTime: "09:00", endTime: "20:00", isAvailable: true },
        });
      }
    }

    // Customer
    customerUser = await prisma.user.create({
      data: { name: "Test Customer", email: `customer_${Date.now()}@test.com`, passwordHash: "hash", role: "CUSTOMER" },
    });
    await prisma.customer.create({
      data: { userId: customerUser.id },
    });

    // Services for Business A
    serviceHaircut = await prisma.service.create({
      data: { businessId: businessA.id, name: "Haircut", durationMinutes: 30, price: new Prisma.Decimal("300.00"), isActive: true },
    });
    serviceSpa = await prisma.service.create({
      data: { businessId: businessA.id, name: "Hair Spa", durationMinutes: 60, price: new Prisma.Decimal("1200.00"), isActive: true },
    });
    serviceFacial = await prisma.service.create({
      data: { businessId: businessA.id, name: "Facial", durationMinutes: 45, price: new Prisma.Decimal("1500.00"), isActive: true },
    });
  });

  after(async () => {
    // Clean up created records
    try {
      await prisma.compensationLedger.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.commissionRuleService.deleteMany({});
      await prisma.commissionRule.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.incentiveRule.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.staffServicePrice.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.staffCompensation.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.appointmentService.deleteMany({ where: { appointment: { businessId: { in: [businessA.id, businessB.id] } } } });
      await prisma.payment.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.appointment.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.staffSchedule.deleteMany({ where: { staff: { businessId: { in: [businessA.id, businessB.id] } } } });
      await prisma.service.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.staff.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.business.deleteMany({ where: { id: { in: [businessA.id, businessB.id] } } });
      await prisma.customer.deleteMany({ where: { userId: customerUser.id } });
      await prisma.user.deleteMany({
        where: {
          id: {
            in: [
              bizOwnerA.id, bizOwnerB.id,
              staffUserA.id, staffUserB.id, staffUserC.id, staffUserD.id, staffUserE.id,
              customerUser.id,
            ],
          },
        },
      });
    } catch (e) {
      // Ignore cleanup error
    } finally {
      await prisma.$disconnect();
    }
  });

  // ── 1. Staff Compensation Models Setup ───────────────────────────────────────
  test("1. Business Owner creates Salary-Only staff (₹25,000/mo)", async () => {
    const caller = { userId: bizOwnerA.id, role: "BUSINESS" };
    const res = await compService.setStaffCompensation(
      businessA.id,
      staffA.id,
      {
        compensationType: "SALARY",
        monthlySalary: 25000,
        payFrequency: "MONTHLY",
        isActive: true,
      },
      caller
    );

    assert.equal(res.compensation.compensationType, "SALARY");
    assert.equal(res.compensation.monthlySalary.toString(), "25000");
  });

  test("2. Business Owner creates Commission-Only staff (30% commission)", async () => {
    const caller = { userId: bizOwnerA.id, role: "BUSINESS" };
    const res = await compService.setStaffCompensation(
      businessA.id,
      staffB.id,
      {
        compensationType: "COMMISSION",
        monthlySalary: null,
        commission: {
          type: "PERCENTAGE",
          percentage: 30,
          calculationBasis: "COMPLETED_AND_PAID",
          isActive: true,
        },
      },
      caller
    );

    assert.equal(res.compensation.compensationType, "COMMISSION");
    assert.equal(res.commissionRule.type, "PERCENTAGE");
    assert.equal(res.commissionRule.percentage.toString(), "30");
  });

  test("3. Business Owner creates Salary + Commission staff (₹18,000 + 15%)", async () => {
    const caller = { userId: bizOwnerA.id, role: "BUSINESS" };
    const res = await compService.setStaffCompensation(
      businessA.id,
      staffC.id,
      {
        compensationType: "SALARY_COMMISSION",
        monthlySalary: 18000,
        commission: {
          type: "PERCENTAGE",
          percentage: 15,
          calculationBasis: "COMPLETED",
          isActive: true,
        },
      },
      caller
    );

    assert.equal(res.compensation.compensationType, "SALARY_COMMISSION");
    assert.equal(res.compensation.monthlySalary.toString(), "18000");
    assert.equal(res.commissionRule.percentage.toString(), "15");
  });

  test("4. Business Owner creates Salary + Incentive staff (₹20,000 + ₹5,000 after 100 appts)", async () => {
    const caller = { userId: bizOwnerA.id, role: "BUSINESS" };
    const res = await compService.setStaffCompensation(
      businessA.id,
      staffD.id,
      {
        compensationType: "SALARY_INCENTIVE",
        monthlySalary: 20000,
      },
      caller
    );
    assert.equal(res.compensation.compensationType, "SALARY_INCENTIVE");

    const inc = await compService.createIncentiveRule(
      businessA.id,
      {
        staffId: staffD.id,
        name: "100 Appointments Milestone",
        metric: "APPOINTMENT_COUNT",
        target: 100,
        rewardType: "FIXED_BONUS",
        rewardAmount: 5000,
        period: "MONTHLY",
        startDate: new Date().toISOString(),
      },
      caller
    );

    assert.equal(inc.name, "100 Appointments Milestone");
    assert.equal(inc.rewardAmount.toString(), "5000");
  });

  test("5. Business Owner creates Salary + Commission + Incentive staff (₹22,000 + 10% + ₹3,000 after ₹50k sales)", async () => {
    const caller = { userId: bizOwnerA.id, role: "BUSINESS" };
    const res = await compService.setStaffCompensation(
      businessA.id,
      staffE.id,
      {
        compensationType: "SALARY_COMMISSION_INCENTIVE",
        monthlySalary: 22000,
        commission: {
          type: "PERCENTAGE",
          percentage: 10,
          calculationBasis: "COMPLETED_AND_PAID",
          serviceIds: [serviceHaircut.id, serviceSpa.id],
        },
      },
      caller
    );

    assert.equal(res.compensation.compensationType, "SALARY_COMMISSION_INCENTIVE");
    assert.equal(res.commissionRule.percentage.toString(), "10");

    const inc = await compService.createIncentiveRule(
      businessA.id,
      {
        staffId: staffE.id,
        name: "₹50k Monthly Sales",
        metric: "TOTAL_REVENUE",
        target: 50000,
        rewardAmount: 3000,
        period: "MONTHLY",
        startDate: new Date().toISOString(),
      },
      caller
    );

    assert.equal(inc.metric, "TOTAL_REVENUE");
    assert.equal(inc.rewardAmount.toString(), "3000");
  });

  // ── 2. Staff-Specific Service Pricing & Fallback ─────────────────────────────
  test("6. Service Pricing: Business Owner sets staff-specific price override", async () => {
    const caller = { userId: bizOwnerA.id, role: "BUSINESS" };
    // Base Haircut price is 300. Set Staff B's price to 400.
    const override = await compService.setStaffServicePrice(
      businessA.id,
      serviceHaircut.id,
      staffB.id,
      { price: 400, isActive: true },
      caller
    );

    assert.equal(override.price.toString(), "400");
  });

  test("7. Price Resolution: Staff B performs haircut → ₹400 (override)", async () => {
    const resolvedPrice = await compService.resolveServicePrice(businessA.id, serviceHaircut.id, staffB.id);
    assert.equal(resolvedPrice.toString(), "400");
  });

  test("8. Price Resolution Fallback: Staff A performs haircut → ₹300 (base fallback)", async () => {
    const resolvedPrice = await compService.resolveServicePrice(businessA.id, serviceHaircut.id, staffA.id);
    assert.equal(resolvedPrice.toString(), "300");
  });

  test("9. Booking Price Security: Customer booking resolves authoritative backend price", async () => {
    const callerCustomer = { userId: customerUser.id, role: "CUSTOMER" };

    // Booking with Staff B (override ₹400)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const dateStr = futureDate.toISOString().split("T")[0];

    const appt = await apptService.createAppointment(
      {
        businessId: businessA.id,
        staffId: staffB.id,
        appointmentDate: dateStr,
        startTime: "10:00",
        serviceIds: [serviceHaircut.id],
      },
      callerCustomer
    );

    assert.equal(appt.appointment.totalAmount, 400);
    assert.equal(appt.appointment.appointmentServices[0].priceAtBooking, 400);
  });

  // ── 3. Commission Lifecycle & Immutability ────────────────────────────────────
  test("10. Commission: Booked appointment does NOT generate commission yet", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateStr = futureDate.toISOString().split("T")[0];

    const appt = await apptService.createAppointment(
      {
        businessId: businessA.id,
        staffId: staffC.id, // 15% commission on completion
        appointmentDate: dateStr,
        startTime: "11:00",
        serviceIds: [serviceHaircut.id],
      },
      { userId: customerUser.id, role: "CUSTOMER" }
    );

    const ledgers = await prisma.compensationLedger.findMany({
      where: { appointmentId: appt.appointment.id },
    });
    assert.equal(ledgers.length, 0, "No commission should be created on booking");
  });

  test("11. Commission: Completed appointment creates exact commission in ledger", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 4);
    const dateStr = futureDate.toISOString().split("T")[0];

    const appt = await apptService.createAppointment(
      {
        businessId: businessA.id,
        staffId: staffC.id, // 15% commission on completion
        appointmentDate: dateStr,
        startTime: "12:00",
        serviceIds: [serviceHaircut.id], // base price ₹300
      },
      { userId: customerUser.id, role: "CUSTOMER" }
    );

    // Business completes appointment
    await apptService.completeAppointment(appt.appointment.id, { userId: bizOwnerA.id, role: "BUSINESS" });

    const ledgers = await prisma.compensationLedger.findMany({
      where: { appointmentId: appt.appointment.id, type: "COMMISSION" },
    });

    assert.equal(ledgers.length, 1);
    // 15% of ₹300 = ₹45.00
    assert.equal(ledgers[0].amount.toString(), "45");
    assert.equal(ledgers[0].calculationSnapshot.commissionRate, "15%");
    assert.equal(ledgers[0].calculationSnapshot.priceAtBooking, "300");
  });

  test("12. Idempotency: Completing/retrying appointment completion does NOT duplicate commission", async () => {
    // Find previously completed appointment
    const appt = await prisma.appointment.findFirst({
      where: { businessId: businessA.id, staffId: staffC.id, status: "COMPLETED" },
    });

    // Manually trigger commission evaluation again
    await compService.evaluateAppointmentCommission(appt.id);

    const ledgers = await prisma.compensationLedger.findMany({
      where: { appointmentId: appt.id, type: "COMMISSION" },
    });

    assert.equal(ledgers.length, 1, "Must maintain exactly 1 ledger record; no duplicates allowed.");
  });

  test("13. Historical Immutability: Changing commission rate later does NOT change old ledger record", async () => {
    // Find existing ledger record for staff C
    const priorLedger = await prisma.compensationLedger.findFirst({
      where: { staffId: staffC.id, type: "COMMISSION" },
    });
    const priorAmount = priorLedger.amount.toString();

    // Business Owner updates commission rate to 25%
    const caller = { userId: bizOwnerA.id, role: "BUSINESS" };
    await compService.setStaffCompensation(
      businessA.id,
      staffC.id,
      {
        compensationType: "SALARY_COMMISSION",
        monthlySalary: 18000,
        commission: {
          type: "PERCENTAGE",
          percentage: 25,
          calculationBasis: "COMPLETED",
        },
      },
      caller
    );

    // Verify existing ledger amount is unchanged
    const ledgerAfter = await prisma.compensationLedger.findUnique({
      where: { id: priorLedger.id },
    });
    assert.equal(ledgerAfter.amount.toString(), priorAmount, "Past commission calculation snapshot must remain immutable!");
  });

  // ── 4. Refunds & Reversals ──────────────────────────────────────────────────
  test("14. Reversal: Cancelling an appointment generates a REVERSAL ledger entry", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split("T")[0];

    const appt = await apptService.createAppointment(
      {
        businessId: businessA.id,
        staffId: staffC.id,
        appointmentDate: dateStr,
        startTime: "14:00",
        serviceIds: [serviceHaircut.id],
      },
      { userId: customerUser.id, role: "CUSTOMER" }
    );

    await apptService.completeAppointment(appt.appointment.id, { userId: bizOwnerA.id, role: "BUSINESS" });

    // Commission created:
    const ledgersBefore = await prisma.compensationLedger.findMany({
      where: { appointmentId: appt.appointment.id },
    });
    assert.equal(ledgersBefore.length, 1);

    // Now appointment is cancelled/reversed
    await compService.handleAppointmentCancellation(appt.appointment.id);

    const reversals = await prisma.compensationLedger.findMany({
      where: { appointmentId: appt.appointment.id, type: "REVERSAL" },
    });

    assert.equal(reversals.length, 1);
    assert.equal(reversals[0].amount.toString(), `-${ledgersBefore[0].amount.toString()}`);
  });

  // ── 5. Security & RBAC ──────────────────────────────────────────────────────
  test("15. RBAC: Staff role CANNOT modify compensation (throws 403)", async () => {
    const callerStaff = { userId: staffUserA.id, role: "STAFF" };
    await assert.rejects(
      async () => {
        await compService.setStaffCompensation(
          businessA.id,
          staffA.id,
          { compensationType: "SALARY", monthlySalary: 99999 },
          callerStaff
        );
      },
      (err) => err.statusCode === 403
    );
  });

  test("16. Privacy: Staff A CANNOT view Staff B's compensation (throws 403)", async () => {
    const callerStaffA = { userId: staffUserA.id, role: "STAFF" };
    await assert.rejects(
      async () => {
        await compService.getStaffCompensation(businessA.id, staffB.id, callerStaffA);
      },
      (err) => err.statusCode === 403
    );
  });

  test("17. Privacy: Staff A CAN view own compensation", async () => {
    const callerStaffA = { userId: staffUserA.id, role: "STAFF" };
    const res = await compService.getStaffCompensation(businessA.id, staffA.id, callerStaffA);
    assert.equal(res.staffId, staffA.id);
  });

  test("18. Security: Customer CANNOT access compensation endpoints (throws 403)", async () => {
    const callerCustomer = { userId: customerUser.id, role: "CUSTOMER" };
    await assert.rejects(
      async () => {
        await compService.getStaffCompensation(businessA.id, staffA.id, callerCustomer);
      },
      (err) => err.statusCode === 403
    );
  });

  // ── 6. Multi-Tenant Isolation ───────────────────────────────────────────────
  test("19. Tenant Isolation: Business B CANNOT view or edit Business A compensation (throws 403)", async () => {
    const callerBizB = { userId: bizOwnerB.id, role: "BUSINESS" };
    await assert.rejects(
      async () => {
        await compService.getStaffCompensation(businessA.id, staffA.id, callerBizB);
      },
      (err) => err.statusCode === 403
    );
  });

  test("20. Tenant Isolation: Business B CANNOT view Business A payroll summary (throws 403)", async () => {
    const callerBizB = { userId: bizOwnerB.id, role: "BUSINESS" };
    await assert.rejects(
      async () => {
        await compService.getBusinessPayrollSummary(businessA.id, callerBizB);
      },
      (err) => err.statusCode === 403
    );
  });

  test("21. Tenant Isolation: Business B CANNOT set service prices in Business A (throws 403)", async () => {
    const callerBizB = { userId: bizOwnerB.id, role: "BUSINESS" };
    await assert.rejects(
      async () => {
        await compService.setStaffServicePrice(
          businessA.id,
          serviceHaircut.id,
          staffA.id,
          { price: 999 },
          callerBizB
        );
      },
      (err) => err.statusCode === 403
    );
  });

  // ── 7. Business Dashboard Payroll Summary ───────────────────────────────────
  test("22. Dashboard Payroll Summary: Aggregates real DB salaries, commissions, and counts", async () => {
    const caller = { userId: bizOwnerA.id, role: "BUSINESS" };
    const summary = await compService.getBusinessPayrollSummary(businessA.id, caller);

    // Sum of Staff A (25000) + Staff C (18000) + Staff D (20000) + Staff E (22000) = 85,000
    assert.equal(summary.totalStaffCost, "85000");
    assert.ok(Number(summary.totalCommission) > 0, "Total commission should be calculated from real ledgers");
    assert.equal(summary.staffCount, 5);
  });
});
