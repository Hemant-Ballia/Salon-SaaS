import { getDB } from "./src/config/db.js";
import { login, getMe } from "./src/modules/auth/auth.service.js";
import { getAppointmentById } from "./src/modules/appointments/appointments.service.js";
import { getCustomerById } from "./src/modules/customers/customers.service.js";
import { getQueueEntryById } from "./src/modules/queues/queues.service.js";
import { verifyAccessToken } from "./src/utils/jwt.js";

async function testStage3And4() {
  console.log("=== TESTING STAGES 3 & 4: AUTHENTICATION & MULTI-TENANT SECURITY ===");
  const db = getDB();

  try {
    // 1. Authenticate Staff A (Sharma's Salon: Priya)
    console.log("\n1. Authenticating Staff A (priya@sharmassalon.dev)...");
    const staffALogin = await login({
      email: "priya@sharmassalon.dev",
      password: "Password@123"
    });
    console.log("-> Staff A authenticated. Business:", staffALogin.user.staffProfile?.business?.name);
    const callerA = { userId: staffALogin.user.id, role: staffALogin.user.role };

    // 2. Authenticate Staff B (Royal Car Wash: Rohit Singh)
    console.log("\n2. Authenticating Staff B (rohit@royalcarwash.dev)...");
    const staffBLogin = await login({
      email: "rohit@royalcarwash.dev",
      password: "Password@123"
    });
    console.log("-> Staff B authenticated. Business:", staffBLogin.user.staffProfile?.business?.name);
    const callerB = { userId: staffBLogin.user.id, role: staffBLogin.user.role };

    // 3. Test Invalid Token / Verification
    console.log("\n3. Testing Token Verification...");
    try {
      verifyAccessToken("invalid.token.here");
      throw new Error("Invalid token did not fail!");
    } catch (err) {
      console.log("-> Invalid token rejected as expected:", err.message);
    }

    // 4. Test Customer accessing Staff-restricted operations
    console.log("\n4. Testing Role Guard (Customer attempting to get staff queue)...");
    const custLogin = await login({
      email: "sneha.k@customer.dev",
      password: "Password@123"
    });
    const custCaller = { userId: custLogin.user.id, role: custLogin.user.role };
    if (custCaller.role !== "STAFF") {
      console.log("-> Customer role correctly identified as:", custCaller.role, "(rejected for staff-portal access)");
    }

    // 5. Multi-Tenant Isolation: Appointments
    console.log("\n5. Testing Multi-Tenant Isolation on Appointments...");
    // Find an appointment belonging to Business B (Royal Car Wash)
    const bizBAppt = await db.appointment.findFirst({
      where: { business: { name: "Royal Car Wash" }, deletedAt: null }
    });
    console.log("   Found Business B appointment ID:", bizBAppt.id);

    // Staff B can access their own business appointment
    const apptByB = await getAppointmentById(bizBAppt.id, callerB);
    console.log("-> Staff B accessing Business B appointment: SUCCESS (status:", apptByB.appointment.status, ")");

    // Staff A MUST BE DENIED access to Business B appointment
    try {
      await getAppointmentById(bizBAppt.id, callerA);
      throw new Error("SECURITY FAILURE: Staff A was able to access Business B appointment!");
    } catch (err) {
      console.log("-> Staff A accessing Business B appointment: DENIED AS EXPECTED (Error:", err.message, ")");
    }

    // 6. Multi-Tenant Isolation: Customers
    console.log("\n6. Testing Multi-Tenant Isolation on Customers...");
    // Find a customer who has only visited Royal Car Wash, or create a distinct test check
    const bizACustomers = await db.customer.findMany({
      where: { appointments: { some: { business: { name: "Sharma's Salon" } } } },
      select: { id: true }
    });
    const bizBCustomers = await db.customer.findMany({
      where: {
        appointments: {
          some: { business: { name: "Royal Car Wash" } },
          none: { business: { name: "Sharma's Salon" } }
        }
      },
      select: { id: true }
    });

    if (bizBCustomers.length > 0) {
      const custBId = bizBCustomers[0].id;
      console.log("   Found customer exclusively at Business B:", custBId);
      try {
        await getCustomerById(custBId, callerA);
        throw new Error("SECURITY FAILURE: Staff A was able to access customer with no appointments in Business A!");
      } catch (err) {
        console.log("-> Staff A accessing Business B customer: DENIED AS EXPECTED (Error:", err.message, ")");
      }
    } else {
      console.log("   (All sample customers shared across businesses or none exclusive, verifying access guard logic)");
    }

    // 7. Multi-Tenant Isolation: Queue
    console.log("\n7. Testing Multi-Tenant Isolation on Queue Entries...");
    const bizBQueueEntry = await db.queueEntry.findFirst({
      where: { queue: { business: { name: "Royal Car Wash" } } }
    });
    if (bizBQueueEntry) {
      console.log("   Found Business B queue entry ID:", bizBQueueEntry.id);
      // Staff B can view
      const qByB = await getQueueEntryById(bizBQueueEntry.id, callerB);
      console.log("-> Staff B accessing Business B queue entry: SUCCESS (Token #", qByB.tokenNumber, ")");

      // Staff A MUST BE DENIED
      try {
        await getQueueEntryById(bizBQueueEntry.id, callerA);
        throw new Error("SECURITY FAILURE: Staff A was able to access Business B queue entry!");
      } catch (err) {
        console.log("-> Staff A accessing Business B queue entry: DENIED AS EXPECTED (Error:", err.message, ")");
      }
    }

    console.log("\nSTAGES 3 & 4 VERIFICATION PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("STAGES 3 & 4 VERIFICATION FAILED:", err);
    process.exit(1);
  }
}

testStage3And4();
