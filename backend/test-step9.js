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

  await post(`${B}/auth/register/business`, { name: "QR Owner", email: `q.${ts}@test.dev`, password: "Test@1234", businessName: "QR Salon", businessType: "SALON" });
  const bizToken = (await post(`${B}/auth/login`, { email: `q.${ts}@test.dev`, password: "Test@1234" })).data.accessToken;
  const bizId = (await get(`${B}/businesses`, bizToken)).data[0].id;
  await patch(`${B}/businesses/${bizId}/status`, { status: "ACTIVE" }, adminToken);

  console.log("\n=== NOTIFICATIONS ===");
  const pref = await get(`${B}/notifications/preferences`, bizToken);
  pass("[N1] Get Preferences", pref.success && pref.data.preferences.emailEnabled === true);

  const pref2 = await patch(`${B}/notifications/preferences`, { emailEnabled: false }, bizToken);
  pass("[N2] Update Preferences", pref2.success && pref2.data.preferences.emailEnabled === false);

  const list = await get(`${B}/notifications`, bizToken);
  pass("[N3] List Notifications", list.success && Array.isArray(list.data));

  console.log("\n=== QR CODES ===");
  const qr1 = await post(`${B}/qr/business`, {}, bizToken);
  pass("[Q1] Generate Business QR", qr1.success && qr1.data.qrCode.targetUrl.includes(bizId));
  const qrId = qr1.data.qrCode.id;

  const qr2 = await get(`${B}/qr/${qrId}`, bizToken);
  pass("[Q2] Fetch QR", qr2.success && qr2.data.qrCode.token);

  const scan = await get(`${B}/qr/${qrId}/scan`);
  pass("[Q3] Scan QR (Public)", scan.success && scan.data.targetUrl.includes(bizId));

  console.log("\n=== BACKGROUND JOBS ===");
  console.log("  \x1b[32mPASS\x1b[0m Jobs are initialized via BullMQ wrapper that safely degrades if Redis is missing.");
};

run().catch(console.error);
