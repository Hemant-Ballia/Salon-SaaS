import { getDB } from "./src/config/db.js";
import { login } from "./src/modules/auth/auth.service.js";
import { getAppointmentById, completeAppointment } from "./src/modules/appointments/appointments.service.js";
import { getCustomerById, deleteCustomer } from "./src/modules/customers/customers.service.js";
import { getQueueEntryById, callQueueEntry, serveQueueEntry } from "./src/modules/queues/queues.service.js";

async function runNegativeTests() {
  console.log("=== TESTING STAGE 24: NEGATIVE TESTS SUITE ===");
  const db = getDB();
  let passedCount = 0;
  let totalCount = 0;

  const assertThrows = async (testName, fn, expectedErrSubstring) => {
    totalCount++;
    try {
      await fn();
      console.error(`❌ FAILED: ${testName} (Expected exception, but succeeded)`);
    } catch (err) {
      if (expectedErrSubstring && !err.message.includes(expectedErrSubstring) && !err.code?.includes(expectedErrSubstring)) {
        console.error(`❌ FAILED: ${testName} (Expected message containing "${expectedErrSubstring}", got "${err.message}" [${err.code}])`);
      } else {
        passedCount++;
        console.log(`✅ PASSED: ${testName} -> [Error correctly caught: ${err.message}]`);
      }
    }
  };

  try {
    // 1. Staff A from Sharma's Salon
    const staffALogin = await login({ email: "priya@sharmassalon.dev", password: "Password@123" });
    const callerA = { userId: staffALogin.user.id, role: staffALogin.user.role };

    // 2. Staff B from Royal Car Wash
    const staffBLogin = await login({ email: "rohit@royalcarwash.dev", password: "Password@123" });
    const callerB = { userId: staffBLogin.user.id, role: staffBLogin.user.role };

    // 3. Customer
    const custLogin = await login({ email: "sneha.k@customer.dev", password: "Password@123" });
    const callerCust = { userId: custLogin.user.id, role: custLogin.user.role };

    // Find sample records for Royal Car Wash (Business B)
    const bizBAppt = await db.appointment.findFirst({
      where: { business: { name: "Royal Car Wash" }, deletedAt: null }
    });
    const bizBQueueEntry = await db.queueEntry.findFirst({
      where: { queue: { business: { name: "Royal Car Wash" } } }
    });

    // TEST 1: Wrong Role: Customer attempting to complete appointment
    await assertThrows(
      "Customer cannot complete appointment",
      () => completeAppointment(bizBAppt.id, callerCust),
      "Customers cannot complete appointments"
    );

    // TEST 2: Staff A accessing Business B appointment (cross-tenant)
    await assertThrows(
      "Staff A cannot access Business B appointment",
      () => getAppointmentById(bizBAppt.id, callerA),
      "This appointment belongs to a different business"
    );

    // TEST 3: Staff A accessing non-existent / modified appointment UUID
    await assertThrows(
      "Modified non-existent appointment ID",
      () => getAppointmentById("00000000-0000-0000-0000-000000000000", callerA),
      "Appointment not found"
    );

    // TEST 4: Staff A accessing Business B queue entry (cross-tenant)
    if (bizBQueueEntry) {
      await assertThrows(
        "Staff A cannot access Business B queue entry",
        () => getQueueEntryById(bizBQueueEntry.id, callerA),
        "This entry belongs to a different business"
      );
    }

    // TEST 5: Modified / Non-existent queue entry ID
    await assertThrows(
      "Modified non-existent queue entry ID",
      () => getQueueEntryById("00000000-0000-0000-0000-000000000000", callerA),
      "Queue entry not found"
    );

    // TEST 6: Modified / Non-existent customer ID
    await assertThrows(
      "Modified non-existent customer ID",
      () => getCustomerById("00000000-0000-0000-0000-000000000000", callerA),
      "Customer not found"
    );

    // TEST 7: Invalid appointment state transition (Complete a CANCELLED or COMPLETED appointment)
    const completedAppt = await db.appointment.findFirst({
      where: { business: { name: "Sharma's Salon" }, status: "COMPLETED", deletedAt: null }
    });
    if (completedAppt) {
      await assertThrows(
        "Cannot complete an already COMPLETED appointment",
        () => completeAppointment(completedAppt.id, callerA),
        "Cannot complete a COMPLETED appointment"
      );
    }

    // TEST 8: Invalid queue transition (Serve an entry that is not CALLED or already completed)
    const completedQueue = await db.queueEntry.findFirst({
      where: { queue: { business: { name: "Sharma's Salon" } }, status: "COMPLETED" }
    });
    if (completedQueue) {
      await assertThrows(
        "Cannot serve a COMPLETED queue entry",
        () => serveQueueEntry(completedQueue.id, callerA),
        "Cannot transition from COMPLETED"
      );
    }

    // TEST 9: Staff cannot delete customer profile
    const aCustomer = await db.customer.findFirst({
      where: { appointments: { some: { business: { name: "Sharma's Salon" } } }, deletedAt: null }
    });
    if (aCustomer) {
      await assertThrows(
        "Staff cannot delete customer account",
        () => deleteCustomer(aCustomer.id, callerA),
        "Only the customer or an admin can delete a customer account"
      );
    }

    console.log(`\nNEGATIVE TESTS RESULT: ${passedCount}/${totalCount} tests passed.`);
    if (passedCount === totalCount) {
      console.log("=== ALL NEGATIVE TESTS PASSED! ===");
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("Negative test suite error:", err);
    process.exit(1);
  }
}

runNegativeTests();
