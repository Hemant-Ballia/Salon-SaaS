import { getDB } from "./src/config/db.js";

const B = "http://localhost:5000/api/v1";

const post = async (url, body, token) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await r.json();
  return { status: r.status, data };
};

const get = async (url, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(url, { headers });
  const data = await r.json();
  return { status: r.status, data };
};

const pass = (label, cond, extra = "") => {
  if (cond) {
    console.log(`  \x1b[32mPASS\x1b[0m ${label}${extra ? ` -> ${extra}` : ""}`);
  } else {
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}${extra ? ` -> ${extra}` : ""}`);
    throw new Error(`Assertion failed: ${label}`);
  }
};

const run = async () => {
  console.log("==========================================================");
  console.log("      VEYRA SAAS — ADMIN PORTAL DASHBOARD VERIFICATION     ");
  console.log("==========================================================");

  const prisma = getDB();

  // 1. Direct DB baseline check
  console.log("\n[1] Checking PostgreSQL Direct Counts...");
  const [dbUsers, dbBiz, dbStaff, dbCust, dbAppt, dbPaySum, dbSub] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.business.count({ where: { deletedAt: null } }),
    prisma.staff.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.appointment.count({ where: { deletedAt: null } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
  ]);
  const expectedRevenue = Number(dbPaySum._sum.amount || 0);
  console.log(`  DB Counts -> Users: ${dbUsers}, Businesses: ${dbBiz}, Staff: ${dbStaff}, Clients: ${dbCust}, Appointments: ${dbAppt}, Revenue: ₹${expectedRevenue}, Subscriptions: ${dbSub}`);

  // 2. Admin Authentication
  console.log("\n[2] Authenticating Platform Admin...");
  const adminLogin = await post(`${B}/auth/login`, {
    email: "admin@salonsaas.dev",
    password: "Password@123",
  });
  pass("Admin Login (200)", adminLogin.status === 200 && !!adminLogin.data?.data?.accessToken);
  const adminToken = adminLogin.data.data.accessToken;

  // 3. Admin Dashboard API 7D
  console.log("\n[3] Testing Admin Dashboard API (7D Period)...");
  const dash7D = await get(`${B}/admin/dashboard?period=7D`, adminToken);
  pass("Dashboard API responds 200 OK", dash7D.status === 200 && dash7D.data.success);
  const d7 = dash7D.data.data.dashboard;

  // Verify Metrics Match Database Exactly
  pass("Total Users matches DB", d7.overview.totalUsers === dbUsers, `Users: ${d7.overview.totalUsers}`);
  pass("Total Businesses matches DB", d7.overview.totalBusinesses === dbBiz, `Businesses: ${d7.overview.totalBusinesses}`);
  pass("Active Businesses matches DB", d7.overview.activeBusinesses === dbBiz, `Active: ${d7.overview.activeBusinesses}`);
  pass("Total Customers matches DB", d7.overview.totalCustomers === dbCust, `Clients: ${d7.overview.totalCustomers}`);
  pass("Total Staff matches DB", d7.overview.totalStaff === dbStaff, `Staff: ${d7.overview.totalStaff}`);
  pass("Total Appointments matches DB", d7.overview.totalAppointments === dbAppt, `Appointments: ${d7.overview.totalAppointments}`);
  pass("Total Revenue matches DB", d7.overview.totalRevenue === expectedRevenue, `Revenue: ₹${d7.overview.totalRevenue}`);
  pass("Active Subscriptions matches DB", d7.overview.activeSubscriptions === dbSub, `Subscriptions: ${d7.overview.activeSubscriptions}`);

  // Verify Time-Series Chart Data
  pass("7D Chart contains 7 daily points", Array.isArray(d7.chartData) && d7.chartData.length === 7);
  const totalChartAppts = d7.chartData.reduce((s, p) => s + p.appointments, 0);
  pass("Chart appointments are realistic", totalChartAppts >= 0 && totalChartAppts <= dbAppt);

  // Verify Operational Tables & Breakdown
  pass("Recent Businesses populated", Array.isArray(d7.recentBusinesses) && d7.recentBusinesses.length === dbBiz);
  pass("Recent Appointments populated", Array.isArray(d7.recentAppointments) && d7.recentAppointments.length > 0);
  pass("Payments Summary accurate", d7.paymentsSummary.paidVolume === expectedRevenue);
  pass("Subscriptions Summary active count matches", d7.subscriptionsSummary.active === dbSub);
  pass("Recent Activity populated", Array.isArray(d7.recentActivity));

  // 4. Test Period Filtering (30D, 3M, 12M)
  console.log("\n[4] Testing Period Filtering...");
  const dash30D = await get(`${B}/admin/dashboard?period=30D`, adminToken);
  pass("30D Period returns 30 points", dash30D.status === 200 && dash30D.data.data.dashboard.chartData.length === 30);

  const dash3M = await get(`${B}/admin/dashboard?period=3M`, adminToken);
  pass("3M Period returns 3 monthly points", dash3M.status === 200 && dash3M.data.data.dashboard.chartData.length === 3);

  const dash12M = await get(`${B}/admin/dashboard?period=12M`, adminToken);
  pass("12M Period returns 12 monthly points", dash12M.status === 200 && dash12M.data.data.dashboard.chartData.length === 12);

  // 5. RBAC & Multi-Tenant Security Enforcement
  console.log("\n[5] Testing RBAC Security Boundaries...");
  const bizLogin = await post(`${B}/auth/login`, {
    email: "owner@sharmassalon.dev",
    password: "Password@123",
  });
  const bizToken = bizLogin.data.data.accessToken;

  const crossRoleRes = await get(`${B}/admin/dashboard`, bizToken);
  pass(
    "Business Owner denied Admin Dashboard access (403)",
    crossRoleRes.status === 403 && crossRoleRes.data.error?.code === "INSUFFICIENT_ROLE"
  );

  const noAuthRes = await get(`${B}/admin/dashboard`);
  pass(
    "Unauthenticated request denied Admin Dashboard access (401)",
    noAuthRes.status === 401 && noAuthRes.data.error?.code === "TOKEN_MISSING"
  );

  console.log("\n==========================================================");
  console.log("   ALL ADMIN DASHBOARD VERIFICATION ASSERTIONS PASSED!    ");
  console.log("==========================================================");
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
