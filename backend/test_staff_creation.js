import { getDB } from "./src/config/db.js";
import { login, getMe } from "./src/modules/auth/auth.service.js";
import { createStaff } from "./src/modules/staff/staff.service.js";

async function run() {
  const prisma = getDB();
  console.log("=== STEP 1: Business Owner Login ===");
  // Sharma's Salon owner: owner@sharmassalon.dev / Password@123
  const bizLogin = await login({ email: "owner@sharmassalon.dev", password: "Password@123" });
  console.log("Logged in as Business Owner:", bizLogin.user.name, "Role:", bizLogin.user.role);

  const callerBiz = { userId: bizLogin.user.id, role: "BUSINESS" };

  console.log("\n=== STEP 2: Create New Staff Member via Business Owner ===");
  const testStaffEmail = `kavita.test.${Date.now()}@sharmassalon.dev`;
  const newStaff = await createStaff({
    email: testStaffEmail,
    password: "Password@123",
    displayName: "Kavita Sharma",
    designation: "Senior Hair Stylist",
    phone: "9876543210",
  }, callerBiz);

  console.log("Created Staff ID:", newStaff.staff.id);
  console.log("Staff Display Name:", newStaff.staff.displayName);
  console.log("Staff Business ID:", newStaff.staff.business.id, newStaff.staff.business.name);
  console.log("Staff Linked User Email:", newStaff.staff.user.email);

  console.log("\n=== STEP 3: Verify PostgreSQL Record ===");
  const dbStaff = await prisma.staff.findUnique({
    where: { id: newStaff.staff.id },
    include: { user: true, business: true },
  });
  if (!dbStaff || dbStaff.user.email !== testStaffEmail) {
    throw new Error("DB verification failed: Staff record not found or email mismatch");
  }
  console.log("DB Record Confirmed: Staff ID " + dbStaff.id + " in " + dbStaff.business.name);

  console.log("\n=== STEP 4: Authenticate as the New Staff Member ===");
  const staffLogin = await login({ email: testStaffEmail, password: "Password@123" });
  console.log("Staff Authenticated:", staffLogin.user.name, "Role:", staffLogin.user.role);
  console.log("Staff Profile on Login:", staffLogin.user.staffProfile?.displayName, "Business:", staffLogin.user.staffProfile?.business?.name);

  console.log("\n=== STEP 5: Verify getMe for Staff ===");
  const meRes = await getMe(staffLogin.user.id);
  console.log("getMe displayName:", meRes.user.staffProfile?.displayName);
  console.log("getMe business:", meRes.user.staffProfile?.business?.name);

  if (meRes.user.staffProfile?.id !== newStaff.staff.id) {
    throw new Error("getMe failed: staffProfile ID mismatch");
  }

  console.log("\n>>> ALL 5 STEPS PASSED SUCCESSFULLY! <<<");
  process.exit(0);
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
