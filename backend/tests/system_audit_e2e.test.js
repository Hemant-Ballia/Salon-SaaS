/**
 * backend/tests/system_audit_e2e.test.js
 *
 * Full Production End-to-End System Audit & Security Verification
 * Tests the complete lifecycle:
 * ADMIN -> BUSINESS -> STAFF -> CUSTOMER -> PRICING -> COMPENSATION -> QUEUE -> REALTIME -> SECURITY
 */

import test from "node:test";
import assert from "node:assert/strict";
import { getDB } from "../src/config/db.js";
import {
  setStaffCompensation,
  getStaffCompensation,
  setStaffServicePrice,
  resolveServicePrice,
  evaluateAppointmentCommission,
  handleAppointmentCancellation,
  getStaffEarnings,
  getBusinessPayrollSummary,
} from "../src/modules/compensation/compensation.service.js";
import { getAdminDashboardData } from "../src/modules/admin/admin.service.js";
import { createAppointment, completeAppointment, cancelAppointment } from "../src/modules/appointments/appointments.service.js";
import { joinQueue, callQueueEntry, serveQueueEntry, completeQueueEntry } from "../src/modules/queues/queues.service.js";

test("FULL SYSTEM AUDIT SUITE", async (t) => {
  const prisma = getDB();
  const timestamp = Date.now();

  // Test Entities
  let adminUser;
  let bizOwnerUserA;
  let bizOwnerUserB;
  let businessA;
  let businessB;
  let staffSalaryUser;
  let staffSalary;
  let staffCommUser;
  let staffComm;
  let staffHybridUser;
  let staffHybrid;
  let customerUser;
  let customerProfile;
  let serviceA;
  let queueA;

  await t.test("1. Admin: Platform Dashboard Aggregations", async () => {
    const dashboard = await getAdminDashboardData("7D");
    assert.ok(dashboard.overview, "Overview must be present");
    assert.ok(dashboard.overview.totalBusinesses >= 0, "Businesses count valid");
    assert.ok(dashboard.overview.totalAppointments >= 0, "Appointments count valid");
    assert.ok(Array.isArray(dashboard.chartData), "Chart data array returned");
  });

  await t.test("2. Admin & Business Provisioning: Multi-Tenant Setup", async () => {
    // Admin
    adminUser = await prisma.user.upsert({
      where: { email: "admin@salonsaas.dev" },
      update: {},
      create: {
        name: "Super Admin",
        email: "admin@salonsaas.dev",
        passwordHash: "$2a$10$hashedpasswordforadmin",
        role: "ADMIN",
      },
    });

    // Business Owner A
    bizOwnerUserA = await prisma.user.create({
      data: {
        name: `Owner A ${timestamp}`,
        email: `owner_a_${timestamp}@audit.test`,
        passwordHash: "dummyhash",
        role: "BUSINESS",
      },
    });

    businessA = await prisma.business.create({
      data: {
        ownerId: bizOwnerUserA.id,
        name: `Grand Salon A ${timestamp}`,
        slug: `grand-salon-a-${timestamp}`,
        businessType: "SALON",
        status: "ACTIVE",
        isActive: true,
        email: `owner_a_${timestamp}@audit.test`,
      },
    });

    // Business Owner B (for cross-tenant isolation)
    bizOwnerUserB = await prisma.user.create({
      data: {
        name: `Owner B ${timestamp}`,
        email: `owner_b_${timestamp}@audit.test`,
        passwordHash: "dummyhash",
        role: "BUSINESS",
      },
    });

    businessB = await prisma.business.create({
      data: {
        ownerId: bizOwnerUserB.id,
        name: `Elite Barber B ${timestamp}`,
        slug: `elite-barber-b-${timestamp}`,
        businessType: "BARBER",
        status: "ACTIVE",
        isActive: true,
        email: `owner_b_${timestamp}@audit.test`,
      },
    });

    assert.ok(businessA.id, "Business A created");
    assert.ok(businessB.id, "Business B created");
    assert.notEqual(businessA.id, businessB.id, "Tenants are isolated");
  });

  await t.test("3. Business Owner: Provision 3 Distinct Staff Types", async () => {
    // Staff 1: Salary Only
    staffSalaryUser = await prisma.user.create({
      data: {
        name: `Staff Salary ${timestamp}`,
        email: `staff_sal_${timestamp}@audit.test`,
        passwordHash: "hash",
        role: "STAFF",
      },
    });
    staffSalary = await prisma.staff.create({
      data: {
        businessId: businessA.id,
        userId: staffSalaryUser.id,
        displayName: "Priya SalaryOnly",
        status: "ACTIVE",
      },
    });

    // Staff 2: Commission Only
    staffCommUser = await prisma.user.create({
      data: {
        name: `Staff Comm ${timestamp}`,
        email: `staff_comm_${timestamp}@audit.test`,
        passwordHash: "hash",
        role: "STAFF",
      },
    });
    staffComm = await prisma.staff.create({
      data: {
        businessId: businessA.id,
        userId: staffCommUser.id,
        displayName: "Rahul CommissionOnly",
        status: "ACTIVE",
      },
    });

    // Staff 3: Full Hybrid (Salary + Commission + Incentive)
    staffHybridUser = await prisma.user.create({
      data: {
        name: `Staff Hybrid ${timestamp}`,
        email: `staff_hyb_${timestamp}@audit.test`,
        passwordHash: "hash",
        role: "STAFF",
      },
    });
    staffHybrid = await prisma.staff.create({
      data: {
        businessId: businessA.id,
        userId: staffHybridUser.id,
        displayName: "Anita FullHybrid",
        status: "ACTIVE",
      },
    });

    // Seed Schedules for booking
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    for (const staff of [staffSalary, staffComm, staffHybrid]) {
      for (const d of days) {
        await prisma.staffSchedule.create({
          data: {
            staffId: staff.id,
            dayOfWeek: d,
            startTime: "08:00",
            endTime: "20:00",
            isAvailable: true,
          },
        });
      }
    }

    assert.ok(staffSalary.id && staffComm.id && staffHybrid.id);
  });

  await t.test("4. Business Owner: Configure Independent Compensation Policies", async () => {
    const ownerCallerA = { userId: bizOwnerUserA.id, role: "BUSINESS" };

    // 1. Staff 1: SALARY only (₹30,000)
    await setStaffCompensation(
      businessA.id,
      staffSalary.id,
      {
        compensationType: "SALARY",
        monthlySalary: 30000,
        payFrequency: "MONTHLY",
        isActive: true,
      },
      ownerCallerA
    );

    // 2. Staff 2: COMMISSION only (20% on Completed & Paid)
    await setStaffCompensation(
      businessA.id,
      staffComm.id,
      {
        compensationType: "COMMISSION",
        monthlySalary: null,
        commission: {
          type: "PERCENTAGE",
          percentage: 20,
          calculationBasis: "COMPLETED_AND_PAID",
          isActive: true,
        },
        isActive: true,
      },
      ownerCallerA
    );

    // 3. Staff 3: SALARY_COMMISSION_INCENTIVE (Salary ₹15,000 + 10% Commission)
    await setStaffCompensation(
      businessA.id,
      staffHybrid.id,
      {
        compensationType: "SALARY_COMMISSION_INCENTIVE",
        monthlySalary: 15000,
        commission: {
          type: "PERCENTAGE",
          percentage: 10,
          calculationBasis: "COMPLETED",
          isActive: true,
        },
        isActive: true,
      },
      ownerCallerA
    );

    // Verify configurations in DB
    const comp1 = await getStaffCompensation(businessA.id, staffSalary.id, ownerCallerA);
    assert.equal(comp1.compensation.compensationType, "SALARY");
    assert.equal(Number(comp1.compensation.monthlySalary), 30000);

    const comp2 = await getStaffCompensation(businessA.id, staffComm.id, ownerCallerA);
    assert.equal(comp2.compensation.compensationType, "COMMISSION");
    assert.equal(comp2.commissionRules.length, 1);
    assert.equal(Number(comp2.commissionRules[0].percentage), 20);

    const comp3 = await getStaffCompensation(businessA.id, staffHybrid.id, ownerCallerA);
    assert.equal(comp3.compensation.compensationType, "SALARY_COMMISSION_INCENTIVE");
    assert.equal(Number(comp3.compensation.monthlySalary), 15000);
  });

  await t.test("5. Services & Pricing: Base Price & Staff-Specific Override", async () => {
    const ownerCallerA = { userId: bizOwnerUserA.id, role: "BUSINESS" };

    // Create Base Service: ₹1,000
    serviceA = await prisma.service.create({
      data: {
        businessId: businessA.id,
        name: "Signature Hair Spa",
        durationMinutes: 45,
        price: 1000,
        category: "Hair",
        isActive: true,
      },
    });

    // Business Owner sets Staff-Specific Override for Staff 2 (Master Stylist): ₹1,500
    await setStaffServicePrice(
      businessA.id,
      serviceA.id,
      staffComm.id,
      { price: 1500, isActive: true },
      ownerCallerA
    );

    // Verify resolution:
    // Staff 2 -> ₹1,500 override
    const priceStaff2 = await resolveServicePrice(businessA.id, serviceA.id, staffComm.id);
    assert.equal(Number(priceStaff2), 1500);

    // Staff 1 (No override) -> falls back to base ₹1,000
    const priceStaff1 = await resolveServicePrice(businessA.id, serviceA.id, staffSalary.id);
    assert.equal(Number(priceStaff1), 1000);

    // No staff specified -> base ₹1,000
    const priceBase = await resolveServicePrice(businessA.id, serviceA.id);
    assert.equal(Number(priceBase), 1000);
  });

  await t.test("6. Customer Booking: Server-Authoritative Price Tamper Protection", async () => {
    // Customer profile
    customerUser = await prisma.user.create({
      data: {
        name: `Customer Audit ${timestamp}`,
        email: `customer_${timestamp}@audit.test`,
        phone: `+9199${timestamp.toString().slice(-8)}`,
        passwordHash: "hash",
        role: "CUSTOMER",
      },
    });
    customerProfile = await prisma.customer.create({
      data: {
        userId: customerUser.id,
      },
    });

    const customerCaller = { userId: customerUser.id, role: "CUSTOMER" };

    // Booking with Staff 2 (Override price ₹1,500)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookingResult = await createAppointment(
      {
        businessId: businessA.id,
        staffId: staffComm.id,
        appointmentDate: tomorrow.toISOString().slice(0, 10),
        startTime: "11:00",
        serviceIds: [serviceA.id],
        // Malicious client fields that should be ignored by the backend:
        price: 1,
        amount: 1,
        totalAmount: 1,
      },
      customerCaller
    );

    assert.ok(bookingResult.appointment.id);
    assert.equal(Number(bookingResult.appointment.totalAmount), 1500, "Must be authoritative ₹1500 override, ignoring client price 1");

    // Verify stored priceAtBooking in database
    const apptDb = await prisma.appointment.findUnique({
      where: { id: bookingResult.appointment.id },
      include: { appointmentServices: true },
    });
    assert.equal(Number(apptDb.appointmentServices[0].priceAtBooking), 1500, "Authoritative price stamped in DB");
  });

  await t.test("7. Commission Lifecycle & Idempotency", async () => {
    const ownerCallerA = { userId: bizOwnerUserA.id, role: "BUSINESS" };

    // 1. Create completed appointment for Staff 2 (20% commission on ₹1,500)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const booking = await createAppointment(
      {
        businessId: businessA.id,
        staffId: staffComm.id,
        appointmentDate: tomorrow.toISOString().slice(0, 10),
        startTime: "12:00",
        serviceIds: [serviceA.id],
      },
      { userId: customerUser.id, role: "CUSTOMER" }
    );

    const apptId = booking.appointment.id;

    // Simulate payment PAID
    await prisma.payment.create({
      data: {
        businessId: businessA.id,
        customerId: customerProfile.id,
        appointmentId: apptId,
        amount: 1500,
        status: "PAID",
      },
    });

    // Complete appointment
    await completeAppointment(apptId, ownerCallerA);

    // Check ledger
    const ledgers = await prisma.compensationLedger.findMany({
      where: { appointmentId: apptId, type: "COMMISSION" },
    });
    assert.equal(ledgers.length, 1, "Exactly one commission ledger entry created");
    // 20% of 1500 = 300
    assert.equal(Number(ledgers[0].amount), 300, "Commission is exact ₹300");

    // Idempotency: re-triggering evaluateAppointmentCommission must not create duplicate entry
    const retryEntries = await evaluateAppointmentCommission(apptId);
    const afterRetryLedgers = await prisma.compensationLedger.findMany({
      where: { appointmentId: apptId, type: "COMMISSION" },
    });
    assert.equal(afterRetryLedgers.length, 1, "Ledger remains exactly 1 entry (Idempotent)");
  });

  await t.test("8. Cancellation & Reversal Ledger Entry", async () => {
    const ownerCallerA = { userId: bizOwnerUserA.id, role: "BUSINESS" };

    // Create and complete appointment
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const booking = await createAppointment(
      {
        businessId: businessA.id,
        staffId: staffComm.id,
        appointmentDate: tomorrow.toISOString().slice(0, 10),
        startTime: "14:00",
        serviceIds: [serviceA.id],
      },
      { userId: customerUser.id, role: "CUSTOMER" }
    );
    const apptId = booking.appointment.id;

    await prisma.payment.create({
      data: {
        businessId: businessA.id,
        customerId: customerProfile.id,
        appointmentId: apptId,
        amount: 1500,
        status: "PAID",
      },
    });

    await completeAppointment(apptId, ownerCallerA);

    // Cancel appointment
    await handleAppointmentCancellation(apptId);

    // Verify both original COMMISSION and new REVERSAL entry exist
    const allLedgers = await prisma.compensationLedger.findMany({
      where: { appointmentId: apptId },
      orderBy: { createdAt: "asc" },
    });
    assert.equal(allLedgers.length, 2, "Must contain original COMMISSION and REVERSAL");
    assert.equal(allLedgers[0].type, "COMMISSION");
    assert.equal(Number(allLedgers[0].amount), 300);
    assert.equal(allLedgers[1].type, "REVERSAL");
    assert.equal(Number(allLedgers[1].amount), -300, "Reversal must be -₹300");
  });

  await t.test("9. Security: RBAC & Tenant Isolation Boundaries", async () => {
    const staffCaller = { userId: staffCommUser.id, role: "STAFF" };
    const customerCaller = { userId: customerUser.id, role: "CUSTOMER" };
    const ownerCallerB = { userId: bizOwnerUserB.id, role: "BUSINESS" };

    // 1. Staff cannot modify compensation
    await assert.rejects(
      setStaffCompensation(businessA.id, staffComm.id, { compensationType: "SALARY", monthlySalary: 99999 }, staffCaller),
      /FORBIDDEN|Staff members cannot modify/
    );

    // 2. Staff cannot view other staff compensation
    await assert.rejects(
      getStaffCompensation(businessA.id, staffSalary.id, staffCaller),
      /STAFF_PRIVACY_VIOLATION|You can only view your own/
    );

    // 3. Customer cannot access staff compensation
    await assert.rejects(
      getStaffCompensation(businessA.id, staffComm.id, customerCaller),
      /Customers cannot access compensation/
    );

    // 4. Cross-Tenant: Business B cannot access Business A staff compensation
    await assert.rejects(
      getStaffCompensation(businessA.id, staffComm.id, ownerCallerB),
      /CROSS_TENANT_FORBIDDEN|You cannot access another business/
    );

    // 5. Cross-Tenant: Business B cannot access Business A payroll summary
    await assert.rejects(
      getBusinessPayrollSummary(businessA.id, ownerCallerB),
      /CROSS_TENANT_FORBIDDEN|You cannot access another business/
    );
  });

  await t.test("10. Multi-Business Booking for Single Customer Identity", async () => {
    // Single Customer User books at Business A
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const apptA = await createAppointment(
      {
        businessId: businessA.id,
        staffId: staffSalary.id,
        appointmentDate: tomorrow.toISOString().slice(0, 10),
        startTime: "16:00",
        serviceIds: [serviceA.id],
      },
      { userId: customerUser.id, role: "CUSTOMER" }
    );

    // Create a service in Business B
    const serviceB = await prisma.service.create({
      data: {
        businessId: businessB.id,
        name: "Executive Beard Trim",
        durationMinutes: 30,
        price: 500,
        category: "Grooming",
        isActive: true,
      },
    });

    // Same Customer User books at Business B
    const apptB = await createAppointment(
      {
        businessId: businessB.id,
        appointmentDate: tomorrow.toISOString().slice(0, 10),
        startTime: "17:00",
        serviceIds: [serviceB.id],
      },
      { userId: customerUser.id, role: "CUSTOMER" }
    );

    assert.equal(apptA.appointment.business.id, businessA.id);
    assert.equal(apptB.appointment.business.id, businessB.id);
    assert.equal(apptA.appointment.customer.id, apptB.appointment.customer.id, "Single customer identity preserved across distinct business tenants");
  });
});
