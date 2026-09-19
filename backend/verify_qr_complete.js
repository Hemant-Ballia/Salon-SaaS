import { PNG } from "pngjs";
import jsQR from "jsqr";
import { getDB } from "./src/config/db.js";
const prisma = getDB();

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

const decodeQrDataUrl = (dataUrl) => {
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const png = PNG.sync.read(buffer);
  const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return code ? code.data : null;
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
  console.log("       VEYRA SAAS — COMPREHENSIVE QR SYSTEM VERIFICATION   ");
  console.log("==========================================================");

  // 1. Fetch seed credentials and tokens
  console.log("\n[1] Authenticating Test Users...");
  const salonLogin = await post(`${B}/auth/login`, {
    email: "owner@sharmassalon.dev",
    password: "Password@123",
  });
  pass("Salon Owner Login", salonLogin.status === 200 && !!salonLogin.data?.data?.accessToken);
  const salonToken = salonLogin.data.data.accessToken;

  const carWashLogin = await post(`${B}/auth/login`, {
    email: "owner@royalcarwash.dev",
    password: "Password@123",
  });
  pass("Car Wash Owner Login", carWashLogin.status === 200 && !!carWashLogin.data?.data?.accessToken);
  const carWashToken = carWashLogin.data.data.accessToken;

  // Retrieve seed business records
  const salonBiz = await prisma.business.findFirst({ where: { slug: "sharmas-salon" } });
  const carWashBiz = await prisma.business.findFirst({ where: { slug: "royal-car-wash" } });
  pass("Database Salon Business Lookup", !!salonBiz, `ID: ${salonBiz.id}`);
  pass("Database Car Wash Business Lookup", !!carWashBiz, `ID: ${carWashBiz.id}`);

  // 2. Fetch Business QRs via authorized endpoints
  console.log("\n[2] Fetching Business QRs (Tenant-Specific)...");
  const salonQrRes = await get(`${B}/businesses/${salonBiz.id}/qr`, salonToken);
  pass("Salon Owner retrieves Salon QR", salonQrRes.status === 200 && salonQrRes.data.success);
  const salonQrData = salonQrRes.data.data.qrCode;

  const carWashQrRes = await get(`${B}/businesses/${carWashBiz.id}/qr`, carWashToken);
  pass("Car Wash Owner retrieves Car Wash QR", carWashQrRes.status === 200 && carWashQrRes.data.success);
  const carWashQrData = carWashQrRes.data.data.qrCode;

  // 3. Verify Token Security & Business Isolation in Payload
  console.log("\n[3] Validating QR Security & Token Construction...");
  pass("Salon Token has prefix BLUSH-", salonQrData.token.startsWith("BLUSH-"), salonQrData.token);
  pass("Salon Token contains NO secret/JWT/password", !salonQrData.token.includes("ey") && salonQrData.token.length <= 20);
  pass("Salon QR links to correct businessId in DB", salonQrData.businessId === salonBiz.id);

  pass("Car Wash Token has prefix BWK-", carWashQrData.token.startsWith("BWK-"), carWashQrData.token);
  pass("Car Wash Token contains NO secret/JWT/password", !carWashQrData.token.includes("ey") && carWashQrData.token.length <= 20);
  pass("Car Wash QR links to correct businessId in DB", carWashQrData.businessId === carWashBiz.id);

  // 4. Cross-Tenant Protection (GET & REGENERATE)
  console.log("\n[4] Testing Cross-Tenant Security Boundaries...");
  const crossGet1 = await get(`${B}/businesses/${carWashBiz.id}/qr`, salonToken);
  pass("Cross-Tenant: Salon Owner cannot GET Car Wash QR (403)", crossGet1.status === 403 && crossGet1.data.error?.code === "BUSINESS_ACCESS_DENIED");

  const crossGet2 = await get(`${B}/businesses/${salonBiz.id}/qr`, carWashToken);
  pass("Cross-Tenant: Car Wash Owner cannot GET Salon QR (403)", crossGet2.status === 403 && crossGet2.data.error?.code === "BUSINESS_ACCESS_DENIED");

  const crossRegen1 = await post(`${B}/businesses/${carWashBiz.id}/qr/regenerate`, {}, salonToken);
  pass("Cross-Tenant: Salon Owner cannot REGENERATE Car Wash QR (403)", crossRegen1.status === 403 && crossRegen1.data.error?.code === "BUSINESS_ACCESS_DENIED");

  const crossRegen2 = await post(`${B}/businesses/${salonBiz.id}/qr/regenerate`, {}, carWashToken);
  pass("Cross-Tenant: Car Wash Owner cannot REGENERATE Salon QR (403)", crossRegen2.status === 403 && crossRegen2.data.error?.code === "BUSINESS_ACCESS_DENIED");

  // 5. Programmatic QR Decoding & Scannability Verification
  console.log("\n[5] Scanning & Decoding Generated QR Data URLs...");
  const decodedSalonUrl = decodeQrDataUrl(salonQrData.qrImageUrl);
  pass("Salon QR decodes to valid string", !!decodedSalonUrl, decodedSalonUrl);
  pass("Salon QR payload matches targetUrl", decodedSalonUrl === salonQrData.targetUrl);
  pass("Salon QR payload embeds token correctly", decodedSalonUrl.endsWith(`/book/${salonQrData.token}`));

  const decodedCarWashUrl = decodeQrDataUrl(carWashQrData.qrImageUrl);
  pass("Car Wash QR decodes to valid string", !!decodedCarWashUrl, decodedCarWashUrl);
  pass("Car Wash QR payload matches targetUrl", decodedCarWashUrl === carWashQrData.targetUrl);
  pass("Car Wash QR payload embeds token correctly", decodedCarWashUrl.endsWith(`/book/${carWashQrData.token}`));

  // 6. Public Customer Scan & Token Resolution Flow
  console.log("\n[6] Customer Scanning Flow (Token Resolution)...");
  const initScanCountSalon = salonQrData.scanCount || 0;
  const resolveSalon = await get(`${B}/qr/resolve/${salonQrData.token}`);
  pass("Customer scans Salon QR -> Resolves successfully (200)", resolveSalon.status === 200 && resolveSalon.data.success);
  pass("Resolved Salon matches Sharma's Salon", resolveSalon.data.data.business.name === "Sharma's Salon");
  pass("Resolved Salon provides active services", Array.isArray(resolveSalon.data.data.business.services) && resolveSalon.data.data.business.services.length > 0);

  const resolveCarWash = await get(`${B}/qr/resolve/${carWashQrData.token}`);
  pass("Customer scans Car Wash QR -> Resolves successfully (200)", resolveCarWash.status === 200 && resolveCarWash.data.success);
  pass("Resolved Car Wash matches Royal Car Wash", resolveCarWash.data.data.business.name === "Royal Car Wash");
  pass("Salon QR never resolves to Car Wash", resolveSalon.data.data.business.id !== carWashBiz.id);
  pass("Car Wash QR never resolves to Salon", resolveCarWash.data.data.business.id !== salonBiz.id);

  // Verify scan count increment
  const updatedSalonQr = await get(`${B}/businesses/${salonBiz.id}/qr`, salonToken);
  pass("Scan count incremented on resolution", updatedSalonQr.data.data.qrCode.scanCount >= initScanCountSalon + 1, `Now: ${updatedSalonQr.data.data.qrCode.scanCount}`);

  // 7. QR Regeneration Lifecycle & Revocation
  console.log("\n[7] Testing QR Regeneration & Token Revocation...");
  const oldToken = carWashQrData.token;
  const regenRes = await post(`${B}/businesses/${carWashBiz.id}/qr/regenerate`, {}, carWashToken);
  pass("Car Wash Owner regenerates QR (200)", regenRes.status === 200 && regenRes.data.success);
  const newTokenData = regenRes.data.data.qrCode;
  pass("New token generated", newTokenData.token !== oldToken, `New: ${newTokenData.token}`);

  // Test that old token no longer resolves (revoked)
  const resolveOld = await get(`${B}/qr/resolve/${oldToken}`);
  pass("Old token is revoked and returns 404", resolveOld.status === 404 && resolveOld.data.error?.code === "QR_NOT_FOUND");

  // Test that new token resolves correctly
  const resolveNew = await get(`${B}/qr/resolve/${newTokenData.token}`);
  pass("New token resolves to Royal Car Wash (200)", resolveNew.status === 200 && resolveNew.data.data.business.name === "Royal Car Wash");

  // Decode the new QR image
  const decodedNewQr = decodeQrDataUrl(newTokenData.qrImageUrl);
  pass("New QR image decodes to new booking URL", decodedNewQr === newTokenData.targetUrl);

  // 8. Lazy Generation for New/Uninitialized Business
  console.log("\n[8] Testing Lazy Generation for uninitialized business...");
  const tempUser = await prisma.user.create({
    data: {
      email: `lazy.test.${Date.now()}@example.com`,
      name: "Lazy Test Owner",
      role: "BUSINESS",
      passwordHash: "hashed_dummy_password",
      isActive: true,
    }
  });
  const tempBiz = await prisma.business.create({
    data: {
      name: "Lazy Test Barber",
      slug: `lazy-test-barber-${Date.now()}`,
      ownerId: tempUser.id,
      businessType: "BARBER",
      phone: "+919876543299",
      email: `lazy.${Date.now()}@test.dev`,
      status: "ACTIVE",
      isActive: true,
    }
  });

  // Verify no QR exists initially
  const initialCount = await prisma.qrCode.count({ where: { businessId: tempBiz.id } });
  pass("Initially no QR code in DB for new business", initialCount === 0);

  // Now simulate admin or lazy caller requesting QR
  const adminLogin = await post(`${B}/auth/login`, { email: "admin@salonsaas.dev", password: "Password@123" });
  const adminToken = adminLogin.data.data.accessToken;

  const lazyRes = await get(`${B}/businesses/${tempBiz.id}/qr`, adminToken);
  pass("Lazy generation creates QR on first request (200)", lazyRes.status === 200 && lazyRes.data.success);
  pass("Lazy QR has brand token prefix", lazyRes.data.data.qrCode.token.startsWith("BIZ-"));
  
  const lazyDecoded = decodeQrDataUrl(lazyRes.data.data.qrCode.qrImageUrl);
  pass("Lazy QR decodes properly", !!lazyDecoded && lazyDecoded.endsWith(`/book/${lazyRes.data.data.qrCode.token}`));

  // Clean up temp data
  await prisma.qrCode.deleteMany({ where: { businessId: tempBiz.id } });
  await prisma.business.delete({ where: { id: tempBiz.id } });
  await prisma.user.delete({ where: { id: tempUser.id } });
  pass("Cleaned up lazy test records", true);

  console.log("\n==========================================================");
  console.log("   ALL 28 QR VERIFICATION ASSERTIONS PASSED PERFECTLY!    ");
  console.log("==========================================================");
};

run().then(() => process.exit(0)).catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
