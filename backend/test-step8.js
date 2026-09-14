
import crypto from "crypto";

const B = "http://localhost:5000/api/v1";

const post = async (url, body, token) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  return r.json();
};

const get = async (url, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(url, { headers });
  return r.json();
};

const patch = async (url, body, token) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(body) });
  return r.json();
};

const pass = (label, cond) => {
  if (cond) console.log(`  \x1b[32mPASS\x1b[0m ${label}`);
  else console.log(`  \x1b[31mFAIL\x1b[0m ${label}`);
};

const run = async () => {
  const ts = Date.now();
  console.log("=== SETUP ===");
  const adminRes = await post(`${B}/auth/login`, { email: "admin@salonsaas.dev", password: "Password@123" });
  const adminToken = adminRes.data.accessToken;

  await post(`${B}/auth/register/business`, { name: "PayOwner", email: `p.biz.${ts}@test.dev`, password: "Test@1234", businessName: "Pay Salon", businessType: "SALON" });
  const bizToken = (await post(`${B}/auth/login`, { email: `p.biz.${ts}@test.dev`, password: "Test@1234" })).data.accessToken;
  const bizId = (await get(`${B}/businesses`, bizToken)).data[0].id;
  await patch(`${B}/businesses/${bizId}/status`, { status: "ACTIVE" }, adminToken);

  await post(`${B}/auth/register`, { name: "PayCust", email: `p.c.${ts}@test.dev`, password: "Test@1234" });
  const custToken = (await post(`${B}/auth/login`, { email: `p.c.${ts}@test.dev`, password: "Test@1234" })).data.accessToken;

  // Setup Service and Appointment
  const svc = await post(`${B}/services`, { name: "Haircut", price: 500, duration: 30, type: "SERVICE" }, bizToken);
  const apptRes = await post(`${B}/appointments`, { businessId: bizId, serviceIds: [svc.data.id], appointmentDate: "2026-10-01", startTime: "10:00" }, custToken);
  
  if (!apptRes.success) {
    console.log("Appt failed", apptRes);
    return;
  }
  const apptId = apptRes.data.appointment.id;
  pass("Setup complete", !!apptId);

  console.log("\n=== SUBSCRIPTIONS ===");
  const s1 = await post(`${B}/subscriptions`, { plan: "PRO" }, bizToken);
  pass("[S1] Create Subscription", s1.success && s1.data.subscription.plan === "PRO");

  const s2 = await get(`${B}/subscriptions/current`, bizToken);
  pass("[S2] Get Current Subscription", s2.success && s2.data.plan === "PRO");

  console.log("\n=== PAYMENTS ===");
  const p1 = await post(`${B}/payments/create-order`, { appointmentId: apptId }, custToken);
  pass("[P1] Create Order (Stub Mode)", p1.success && p1.data.razorpayOrderId.startsWith("order_stub_"));
  const rzOrderId = p1.data.razorpayOrderId;

  const p2 = await post(`${B}/payments/create-order`, { appointmentId: apptId }, custToken);
  pass("[P2] Create Order (Idempotent)", p2.success && p2.data.reused === true);

  const secret = "stub_secret";
  const fakePaymentId = `pay_stub_${ts}`;
  const sig = crypto.createHmac("sha256", secret).update(`${rzOrderId}|${fakePaymentId}`).digest("hex");

  const p3 = await post(`${B}/payments/verify`, { razorpayOrderId: rzOrderId, razorpayPaymentId: fakePaymentId, razorpaySignature: sig }, custToken);
  pass("[P3] Verify Payment", p3.success && p3.data.payment.status === "PAID");

  const p4 = await post(`${B}/payments/verify`, { razorpayOrderId: rzOrderId, razorpayPaymentId: fakePaymentId, razorpaySignature: "invalid" }, custToken);
  pass("[P4] Invalid Signature blocked", p4.success === false && p4.error.code === "SIGNATURE_MISMATCH");

  console.log("\n=== WEBHOOK ===");
  const whSecret = "stub_webhook_secret";
  const payloadStr = JSON.stringify({ event: "payment.failed", payload: { payment: { entity: { id: "pay_123", order_id: rzOrderId, error_description: "Test error" } } } });
  const whSig = crypto.createHmac("sha256", whSecret).update(payloadStr).digest("hex");

  const whRes = await fetch(`${B}/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-razorpay-signature": whSig },
    body: payloadStr
  });
  const whData = await whRes.json();
  pass("[P5] Webhook processed", whData.success && whData.data.received === true);
};

run().catch(console.error);
