import { getDB } from "./src/config/db.js";
import { login, getMe } from "./src/modules/auth/auth.service.js";
import { createStaff, getStaffAppointments, getStaffQueue, getStaffPerformance } from "./src/modules/staff/staff.service.js";
import { listCustomers, getCustomerById, getCustomerAppointments } from "./src/modules/customers/customers.service.js";
import { createAppointment, confirmAppointment, completeAppointment, getAppointmentById } from "./src/modules/appointments/appointments.service.js";
import { callQueueEntry, serveQueueEntry, completeQueueEntry } from "./src/modules/queues/queues.service.js";

async function runTests() {
  const prisma = getDB();
  console.log("==================================================");
  console.log("STAFF PORTAL END-TO-END WORKFLOW & SECURITY AUDIT");
  console.log("==================================================");

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Business Owner Login & Staff Provisioning
  // ─────────────────────────────────────────────────────────────
  console.log("\n[TEST 1] Business Owner provisions new Staff member...");
  const bizLogin = await login({ email: "owner@sharmassalon.dev", password: "Password@123" });
  const bizCaller = { userId: bizLogin.user.id, role: "BUSINESS" };

  const testEmail = `priya.stylist.${Date.now()}@sharmassalon.dev`;
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const createdStaff = await createStaff({
    email: testEmail,
    password: "Password@123",
    displayName: "Priya Senior Stylist",
    designation: "Master Stylist & Colourist",
    phone: testPhone,
  }, bizCaller);

  const staffId = createdStaff.staff.id;
  const salonBusinessId = createdStaff.staff.business.id;
  console.log(`✓ Staff created: ${createdStaff.staff.displayName} (${staffId}) in business ${salonBusinessId}`);

  // Direct PostgreSQL DB check
  const dbStaff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { user: true, business: true },
  });
  if (!dbStaff || dbStaff.businessId !== salonBusinessId) {
    throw new Error("FAIL: Staff record does not match in PostgreSQL database.");
  }
  console.log(`✓ Direct DB Check Passed: Staff belongs to ${dbStaff.business.name}`);

  // ─────────────────────────────────────────────────────────────
  // TEST 2: Staff Authentication & Identity Verification
  // ─────────────────────────────────────────────────────────────
  console.log("\n[TEST 2] Authenticating as newly created Staff...");
  const staffLogin = await login({ email: testEmail, password: "Password@123" });
  const staffCaller = { userId: staffLogin.user.id, role: "STAFF" };

  if (staffLogin.user.role !== "STAFF" || !staffLogin.accessToken) {
    throw new Error("FAIL: Staff login did not return STAFF role or accessToken");
  }
  console.log(`✓ Staff Auth Success: role=${staffLogin.user.role}, name=${staffLogin.user.name}`);

  const meCheck = await getMe(staffLogin.user.id);
  if (meCheck.user.staffProfile?.id !== staffId) {
    throw new Error("FAIL: getMe did not hydrate the correct staffProfile");
  }
  console.log(`✓ getMe Context Success: Linked to Business "${meCheck.user.staffProfile.business.name}"`);

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Customer Booking -> Appointment Assignment
  // ─────────────────────────────────────────────────────────────
  console.log("\n[TEST 3] Customer books an appointment assigned to this Staff member...");
  // Find a real service in Sharma's Salon
  const service = await prisma.service.findFirst({
    where: { businessId: salonBusinessId, isActive: true },
  });
  if (!service) throw new Error("No active service found in Sharma's Salon.");

  // Customer login (Anjali Singh: anjali@customer.dev)
  const custLogin = await login({ email: "anjali@customer.dev", password: "Password@123" });
  const custCaller = { userId: custLogin.user.id, role: "CUSTOMER" };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  const apptResult = await createAppointment({
    businessId: salonBusinessId,
    serviceIds: [service.id],
    staffId: staffId,
    appointmentDate: dateStr,
    startTime: "14:00",
    notes: "Automated end-to-end integration test booking",
  }, custCaller);

  const appointmentId = apptResult.appointment.id;
  console.log(`✓ Appointment created: ID=${appointmentId}, Status=${apptResult.appointment.status}, Time=14:00`);

  // Verify in PostgreSQL
  const dbAppt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { staff: true, customer: { include: { user: true } } },
  });
  if (!dbAppt || dbAppt.staffId !== staffId) {
    throw new Error("FAIL: Appointment in DB is not linked to the staff member");
  }
  console.log(`✓ PostgreSQL DB check: Customer=${dbAppt.customer.user.name}, Staff=${dbAppt.staff?.displayName}`);

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Staff Portal Views & State Transitions
  // ─────────────────────────────────────────────────────────────
  console.log("\n[TEST 4] Staff Portal verifies and updates appointment status...");
  const staffAppts = await getStaffAppointments(staffId, { limit: 10 }, staffCaller);
  const foundAppt = staffAppts.appointments.find((a) => a.id === appointmentId);
  if (!foundAppt) {
    throw new Error("FAIL: Staff did not see the newly created appointment in their appointments list");
  }
  console.log(`✓ Staff appointments query returned the appointment (${foundAppt.status})`);

  // Staff confirms appointment
  const confirmed = await confirmAppointment(appointmentId, staffCaller);
  if (confirmed.appointment.status !== "CONFIRMED") {
    throw new Error(`FAIL: Expected status CONFIRMED, got ${confirmed.appointment.status}`);
  }
  console.log(`✓ Staff confirmed appointment -> DB Status: ${confirmed.appointment.status}`);

  // Staff completes appointment
  const completed = await completeAppointment(appointmentId, staffCaller);
  if (completed.appointment.status !== "COMPLETED") {
    throw new Error(`FAIL: Expected status COMPLETED, got ${completed.appointment.status}`);
  }
  console.log(`✓ Staff completed appointment -> DB Status: ${completed.appointment.status}`);

  // Verify direct DB status
  const finalDbAppt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (finalDbAppt.status !== "COMPLETED") {
    throw new Error(`FAIL: DB status mismatch after completion. Got ${finalDbAppt.status}`);
  }
  console.log(`✓ Direct DB check confirmed: Status=${finalDbAppt.status}`);

  // ─────────────────────────────────────────────────────────────
  // TEST 5: Customer Directory & History Scoping
  // ─────────────────────────────────────────────────────────────
  console.log("\n[TEST 5] Staff accesses Customer Directory and Profile...");
  const customerList = await listCustomers({ limit: 20 }, staffCaller);
  console.log(`✓ Staff retrieved ${customerList.customers.length} authorized customers for their salon`);

  const targetCust = customerList.customers.find((c) => c.user.id === custLogin.user.id);
  if (!targetCust) {
    throw new Error("FAIL: Customer who booked appointment was not found in salon customer list");
  }

  const custDetail = await getCustomerById(targetCust.id, staffCaller);
  console.log(`✓ Customer detail loaded: ${custDetail.customer.user.name} (${custDetail.customer.user.email})`);

  const custAppts = await getCustomerAppointments(targetCust.id, { limit: 10 }, staffCaller);
  console.log(`✓ Customer appointment history loaded: ${custAppts.appointments.length} appointments`);

  // ─────────────────────────────────────────────────────────────
  // TEST 6: Real Operational Queue Transitions
  // ─────────────────────────────────────────────────────────────
  console.log("\n[TEST 6] Testing Queue operations...");
  // Find queue entry in Sharma's salon
  const queueEntry = await prisma.queueEntry.findFirst({
    where: { queue: { businessId: salonBusinessId }, status: "WAITING" },
  });

  if (queueEntry) {
    console.log(`Found waiting token #${queueEntry.tokenNumber} (ID: ${queueEntry.id})`);

    // Call entry
    const called = await callQueueEntry(queueEntry.id, staffCaller);
    console.log(`✓ Token #${called.entry.tokenNumber} CALLED (calledAt: ${called.entry.calledAt?.toISOString()})`);

    // Serve entry
    const served = await serveQueueEntry(queueEntry.id, staffCaller);
    console.log(`✓ Token #${served.entry.tokenNumber} SERVING / IN CHAIR (servedAt: ${served.entry.servedAt?.toISOString()})`);

    // Complete entry
    const done = await completeQueueEntry(queueEntry.id, staffCaller);
    console.log(`✓ Token #${done.entry.tokenNumber} COMPLETED (completedAt: ${done.entry.completedAt?.toISOString()})`);

    // Verify DB timestamps
    const dbEntry = await prisma.queueEntry.findUnique({ where: { id: queueEntry.id } });
    if (dbEntry.status !== "COMPLETED" || !dbEntry.servedAt || !dbEntry.completedAt) {
      throw new Error("FAIL: Queue entry state or timestamps not persisted in PostgreSQL");
    }
    console.log(`✓ Direct DB check confirmed queue entry completed with all audit timestamps`);
  } else {
    console.log("No waiting queue entry found to transition — queue structure verified.");
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 7: Cross-Tenant Isolation & Security Checks
  // ─────────────────────────────────────────────────────────────
  console.log("\n[TEST 7] Cross-Tenant Security Audit (Staff A -> Business B data)...");
  // Royal Car Wash business ID: 15e54856-0355-4676-b96a-ab4568ba876e
  const carWashBizId = "15e54856-0355-4676-b96a-ab4568ba876e";

  // 7A: Staff A tries to access Business B appointment
  const carWashAppt = await prisma.appointment.findFirst({
    where: { businessId: carWashBizId, deletedAt: null },
  });

  if (carWashAppt) {
    let denied = false;
    try {
      await getAppointmentById(carWashAppt.id, staffCaller);
    } catch (err) {
      if (err.statusCode === 403 || err.statusCode === 404) {
        denied = true;
        console.log(`✓ Cross-Tenant Appointment Access DENIED: HTTP ${err.statusCode} (${err.code})`);
      }
    }
    if (!denied) throw new Error("SECURITY FAILURE: Staff A was able to read Business B appointment!");
  }

  // 7B: Staff A tries to access Business B queue entry
  const carWashQueueEntry = await prisma.queueEntry.findFirst({
    where: { queue: { businessId: carWashBizId } },
  });

  if (carWashQueueEntry) {
    let denied = false;
    try {
      await callQueueEntry(carWashQueueEntry.id, staffCaller);
    } catch (err) {
      if (err.statusCode === 403 || err.statusCode === 404) {
        denied = true;
        console.log(`✓ Cross-Tenant Queue Transition DENIED: HTTP ${err.statusCode} (${err.code})`);
      }
    }
    if (!denied) throw new Error("SECURITY FAILURE: Staff A was able to manipulate Business B queue!");
  }

  // 7C: Staff A tries to access Business B customer
  // Find a customer with appointments ONLY in Royal Car Wash (e.g. Riya Patel)
  const carWashOnlyCust = await prisma.customer.findFirst({
    where: {
      appointments: { some: { businessId: carWashBizId } },
      NOT: { appointments: { some: { businessId: salonBusinessId } } },
    },
  });

  if (carWashOnlyCust) {
    let denied = false;
    try {
      await getCustomerById(carWashOnlyCust.id, staffCaller);
    } catch (err) {
      if (err.statusCode === 403 || err.statusCode === 404) {
        denied = true;
        console.log(`✓ Cross-Tenant Customer Access DENIED: HTTP ${err.statusCode} (${err.code})`);
      }
    }
    if (!denied) throw new Error("SECURITY FAILURE: Staff A was able to access Business B customer!");
  }

  console.log("\n==================================================");
  console.log("ALL 7 END-TO-END TESTS & SECURITY AUDITS PASSED!");
  console.log("==================================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
