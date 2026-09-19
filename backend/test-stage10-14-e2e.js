import { getDB } from "./src/config/db.js";
import { login } from "./src/modules/auth/auth.service.js";
import { resolveQrToken } from "./src/modules/qr/qr.service.js";
import { createAppointment, getAppointmentById, getAvailability } from "./src/modules/appointments/appointments.service.js";
import { getStaffAppointments, getStaffQueue } from "./src/modules/staff/staff.service.js";
import { joinQueue, callQueueEntry, serveQueueEntry, completeQueueEntry, getQueueEntryById } from "./src/modules/queues/queues.service.js";

async function testEndToEndIntegration() {
  console.log("=== TESTING STAGES 10-14: END-TO-END WORKFLOW ===");
  const db = getDB();

  try {
    // 1. Business & QR Check
    console.log("\n1. Resolving Business & QR Code...");
    const business = await db.business.findFirst({
      where: { name: "Sharma's Salon", deletedAt: null },
      include: { qrCodes: true, services: true, staff: true }
    });
    if (!business) throw new Error("Sharma's Salon not found");
    console.log(`-> Found business: "${business.name}" (${business.id}) with ${business.services.length} services and ${business.staff.length} staff.`);

    // Check QR code
    let qrToken = business.qrCodes[0]?.token;
    if (!qrToken) {
      // Create a test QR code for the business if none
      const createdQr = await db.qrCode.create({
        data: {
          businessId: business.id,
          codeType: "BUSINESS",
          token: `qr-biz-${Date.now()}`,
          qrImageUrl: "https://example.com/qr.png"
        }
      });
      qrToken = createdQr.token;
    }
    console.log("   Using QR token:", qrToken);
    const resolvedQr = await resolveQrToken(qrToken);
    console.log("-> QR Resolution Success: Business Name =", resolvedQr.business?.name);

    // 2. Customer Authentication
    console.log("\n2. Authenticating Customer (sneha.k@customer.dev)...");
    const custLogin = await login({
      email: "sneha.k@customer.dev",
      password: "Password@123"
    });
    console.log("-> Customer authenticated. User ID:", custLogin.user.id);
    const customerCaller = { userId: custLogin.user.id, role: custLogin.user.role };

    // Find staff: Priya
    const staffMember = await db.staff.findFirst({
      where: { businessId: business.id, displayName: { contains: "Priya" }, deletedAt: null }
    });
    console.log(`-> Target Staff: "${staffMember.displayName}" (${staffMember.id})`);

    // Target service: Haircut
    const service = business.services[0];
    console.log(`-> Target Service: "${service.name}" (Price: ${service.price}, Duration: ${service.durationMinutes}m)`);

    // 3. Availability Check for next working day
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 1);
    while (bookingDate.getDay() === 0) { // Skip Sunday when staff is off
      bookingDate.setDate(bookingDate.getDate() + 1);
    }
    const dateStr = bookingDate.toISOString().split("T")[0];
    console.log(`\n3. Checking availability for working date: ${dateStr}...`);
    const avail = await getAvailability({
      businessId: business.id,
      date: dateStr,
      staffId: staffMember.id,
      serviceIds: service.id
    });
    console.log("-> Availability check:", avail.available ? "AVAILABLE" : "NOT AVAILABLE", "Slots count:", avail.slots?.length || 0);

    // Choose an available slot or 14:00
    const chosenSlot = avail.slots?.find(s => s.available)?.startTime || "14:00";
    console.log("-> Selected Slot:", chosenSlot);

    // 4. Create Real Appointment in PostgreSQL
    console.log("\n4. Customer booking appointment...");
    const bookingResult = await createAppointment({
      businessId: business.id,
      staffId: staffMember.id,
      appointmentDate: dateStr,
      startTime: chosenSlot,
      serviceIds: [service.id],
      notes: "Testing production E2E staff portal flow"
    }, customerCaller);

    const appt = bookingResult.appointment;
    console.log("-> Appointment Created Successfully in DB! ID:", appt.id);
    console.log("   - Date:", appt.appointmentDate, "Time:", appt.startTime, "-", appt.endTime);
    console.log("   - Status:", appt.status);
    console.log("   - Amount:", appt.totalAmount);
    console.log("   - Staff:", appt.staff?.displayName);

    // 5. Staff Portal: Staff checks their appointments
    console.log("\n5. Staff Portal: Verifying Staff receives the appointment...");
    const staffUser = await db.user.findUnique({ where: { id: staffMember.userId } });
    const staffCaller = { userId: staffUser.id, role: "STAFF" };

    const staffAppts = await getStaffAppointments(staffMember.id, { page: 1, limit: 30 }, staffCaller);
    const foundAppt = staffAppts.appointments.find(a => a.id === appt.id);
    if (!foundAppt) {
      throw new Error(`Staff ${staffMember.displayName} could not find appointment ${appt.id} in their list!`);
    }
    console.log("-> Staff Portal verified: Staff sees appointment in list! Status:", foundAppt.status);

    // 6. Queue Connection: Customer joins Queue with this appointment
    console.log("\n6. Customer checks into Queue with appointment...");
    const queueResult = await joinQueue({
      businessId: business.id,
      appointmentId: appt.id
    }, customerCaller);

    const qEntry = queueResult.entry;
    console.log(`-> Customer in queue! Entry ID: ${qEntry.id}, Token: #${qEntry.tokenNumber}, Status: ${qEntry.status}`);

    // 7. Staff sees customer in Queue
    console.log("\n7. Staff checks live queue...");
    const staffQueue = await getStaffQueue(staffMember.id, staffCaller);
    const foundQueueEntry = staffQueue.queue.find(e => e.id === qEntry.id);
    if (!foundQueueEntry) {
      throw new Error(`Queue entry ${qEntry.id} not found in staff queue!`);
    }
    console.log(`-> Staff sees customer in queue! Token #${foundQueueEntry.tokenNumber}, Customer: ${foundQueueEntry.customerName}, Service: ${foundQueueEntry.serviceName}`);

    // 8. Staff Calls Customer: WAITING -> CALLED
    console.log("\n8. Staff calls token (WAITING -> CALLED)...");
    const callRes = await callQueueEntry(qEntry.id, staffCaller);
    console.log(`-> Token #${callRes.entry.tokenNumber} status updated to: ${callRes.entry.status}`);
    if (callRes.entry.status !== "CALLED") throw new Error("Expected status CALLED");

    // 9. Staff Serves Customer: CALLED -> SERVING
    console.log("\n9. Staff starts service (CALLED -> SERVING)...");
    const serveRes = await serveQueueEntry(qEntry.id, staffCaller);
    console.log(`-> Token #${serveRes.entry.tokenNumber} status updated to: ${serveRes.entry.status}`);
    if (serveRes.entry.status !== "SERVING") throw new Error("Expected status SERVING");

    // 10. Staff Completes Service: SERVING -> COMPLETED
    console.log("\n10. Staff completes service (SERVING -> COMPLETED)...");
    const completeRes = await completeQueueEntry(qEntry.id, staffCaller);
    console.log(`-> Token #${completeRes.entry.tokenNumber} status updated to: ${completeRes.entry.status}`);
    if (completeRes.entry.status !== "COMPLETED") throw new Error("Expected status COMPLETED");

    // 11. Verify Database State Sync
    console.log("\n11. Verifying Database Synchronization...");
    const finalAppt = await db.appointment.findUnique({
      where: { id: appt.id },
      include: { customer: { include: { user: true } }, staff: true, queueEntry: true }
    });
    console.log("-> Final Appointment Status in PostgreSQL:", finalAppt.status);
    console.log("-> Linked Queue Entry Status in PostgreSQL:", finalAppt.queueEntry?.status);
    console.log("-> Queue Entry Completed At:", finalAppt.queueEntry?.completedAt);

    if (finalAppt.status !== "COMPLETED") {
      throw new Error(`Expected final appointment status COMPLETED, got: ${finalAppt.status}`);
    }

    console.log("\n=== ALL STAGES 10-14 E2E TESTS PASSED SUCCESSFULLY! ===");
    process.exit(0);
  } catch (err) {
    console.error("\nE2E TEST FAILED:", err);
    process.exit(1);
  }
}

testEndToEndIntegration();
