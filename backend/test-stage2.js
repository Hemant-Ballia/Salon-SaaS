import { getDB } from "./src/config/db.js";
import { login } from "./src/modules/auth/auth.service.js";
import { createStaff } from "./src/modules/staff/staff.service.js";

async function testStage2() {
  console.log("=== TESTING STAGE 2: BUSINESS -> STAFF CREATION ===");
  const db = getDB();

  try {
    // 1. Business Owner Login
    console.log("1. Logging in as Business Owner (owner@sharmassalon.dev)...");
    const loginResult = await login({
      email: "owner@sharmassalon.dev",
      password: "Password@123"
    });
    console.log("-> Login successful. User ID:", loginResult.user.id, "Role:", loginResult.user.role);

    // 2. Create Staff Member through existing workflow
    const testEmail = `staff.test.${Date.now()}@sharmassalon.dev`;
    console.log(`2. Creating staff member with email: ${testEmail}...`);
    const caller = { userId: loginResult.user.id, role: loginResult.user.role };
    
    const createResult = await createStaff({
      displayName: "Rohan Varma",
      email: testEmail,
      designation: "Hair & Beard Stylist",
      password: "Password@123",
      phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`
    }, caller);

    const createdStaff = createResult.staff;
    console.log("-> Staff created via service. Staff ID:", createdStaff.id, "Display Name:", createdStaff.displayName);

    // 3. Verify directly in PostgreSQL
    console.log("3. Verifying record directly in PostgreSQL...");
    const dbStaff = await db.staff.findUnique({
      where: { id: createdStaff.id },
      include: {
        user: true,
        business: true,
        schedules: true,
      }
    });

    if (!dbStaff) {
      throw new Error("Staff record not found in PostgreSQL!");
    }

    console.log("-> Verified in PostgreSQL:");
    console.log("   - Staff ID:", dbStaff.id);
    console.log("   - User ID:", dbStaff.userId, "Role:", dbStaff.user.role, "Email:", dbStaff.user.email);
    console.log("   - Business ID:", dbStaff.businessId, "Business Name:", dbStaff.business.name);
    console.log("   - Schedules count:", dbStaff.schedules.length);

    if (dbStaff.user.role !== "STAFF") {
      throw new Error(`Expected user role STAFF, got: ${dbStaff.user.role}`);
    }

    if (dbStaff.business.name !== "Sharma's Salon") {
      throw new Error(`Expected business Sharma's Salon, got: ${dbStaff.business.name}`);
    }

    // 4. Test staff authentication with the newly created staff credentials
    console.log("4. Testing staff authentication with new credentials...");
    const staffLoginResult = await login({
      email: testEmail,
      password: "Password@123"
    });

    console.log("-> Staff login successful!");
    console.log("   - User ID:", staffLoginResult.user.id);
    console.log("   - Role:", staffLoginResult.user.role);
    console.log("   - Staff Profile ID:", staffLoginResult.user.staffProfile?.id);
    console.log("   - Business:", staffLoginResult.user.staffProfile?.business?.name);

    console.log("\nSTAGE 2 VERIFICATION PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("STAGE 2 VERIFICATION FAILED:", err);
    process.exit(1);
  }
}

testStage2();
