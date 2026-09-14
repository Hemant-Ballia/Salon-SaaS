/**
 * prisma/seed.js
 *
 * Development seed — creates minimal safe data for local testing.
 *
 * Creates:
 *   - 1 ADMIN user
 *   - 1 BUSINESS user + Business record + 2 Services + 2 Staff + StaffSchedules
 *   - 1 CUSTOMER user + Customer profile
 *   - 1 sample Appointment + AppointmentService
 *   - 1 Queue + 1 QueueEntry
 *   - NotificationPreferences for all users
 *
 * Passwords: all set to "Password@123" (bcrypt hashed — never plaintext)
 *
 * WARNING: These are development-only credentials.
 *          NEVER use in production. NEVER use real data.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const hashPassword = async (plain) => bcrypt.hash(plain, 12);

const DEV_PASSWORD = "Password@123";

// ---------------------------------------------------------------------------
// Clean existing seed data (idempotent re-runs)
// ---------------------------------------------------------------------------

const cleanSeedData = async () => {
  console.log("  Cleaning existing seed data...");

  // Delete in dependency order (children before parents)
  await prisma.auditLog.deleteMany({});
  await prisma.qrCode.deleteMany({});
  await prisma.otpVerification.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.queueEntry.deleteMany({});
  await prisma.queue.deleteMany({});
  await prisma.appointmentService.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.staffSchedule.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.business.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("  Existing seed data cleared.");
};

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

const seed = async () => {
  console.log("\n=== Starting database seed ===\n");

  await cleanSeedData();

  const passwordHash = await hashPassword(DEV_PASSWORD);

  // ── 1. ADMIN User ─────────────────────────────────────────────────────────

  console.log("  Creating ADMIN user...");
  const adminUser = await prisma.user.create({
    data: {
      name: "Platform Admin",
      email: "admin@salonsaas.dev",
      phone: "+910000000001",
      passwordHash,
      role: "ADMIN",
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  await prisma.notificationPreference.create({
    data: { userId: adminUser.id },
  });

  console.log(`    Admin: ${adminUser.email}`);

  // ── 2. BUSINESS User + Business ───────────────────────────────────────────

  console.log("  Creating BUSINESS user and business...");
  const businessUser = await prisma.user.create({
    data: {
      name: "Ravi Sharma",
      email: "owner@sharmassalon.dev",
      phone: "+910000000002",
      passwordHash,
      role: "BUSINESS",
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  await prisma.notificationPreference.create({
    data: { userId: businessUser.id },
  });

  const business = await prisma.business.create({
    data: {
      ownerId: businessUser.id,
      name: "Sharma's Salon",
      slug: "sharmas-salon",
      businessType: "SALON",
      description:
        "Premium unisex salon offering haircuts, colour, and styling.",
      email: "contact@sharmassalon.dev",
      phone: "+910000000099",
      address: "12, MG Road",
      city: "Pune",
      state: "Maharashtra",
      country: "IN",
      pincode: "411001",
      status: "ACTIVE",
      isActive: true,
    },
  });

  console.log(`    Business: ${business.name} (slug: ${business.slug})`);

  // ── 3. Services ───────────────────────────────────────────────────────────

  console.log("  Creating services...");
  const serviceHaircut = await prisma.service.create({
    data: {
      businessId: business.id,
      name: "Men's Haircut",
      description: "Classic haircut with wash and blow-dry.",
      durationMinutes: 30,
      price: 250.0,
      category: "Haircut",
      isActive: true,
    },
  });

  const serviceColor = await prisma.service.create({
    data: {
      businessId: business.id,
      name: "Hair Colouring",
      description: "Global colour with professional products.",
      durationMinutes: 90,
      price: 1500.0,
      category: "Colour",
      isActive: true,
    },
  });

  console.log(
    `    Services: ${serviceHaircut.name}, ${serviceColor.name}`
  );

  // ── 4. Subscription ───────────────────────────────────────────────────────

  console.log("  Creating subscription...");
  await prisma.subscription.create({
    data: {
      businessId: business.id,
      plan: "PRO",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      provider: "razorpay",
    },
  });

  // ── 5. STAFF Users + Profiles + Schedules ────────────────────────────────

  console.log("  Creating STAFF users...");

  const staffUser1 = await prisma.user.create({
    data: {
      name: "Priya Nair",
      email: "priya@sharmassalon.dev",
      phone: "+910000000003",
      passwordHash,
      role: "STAFF",
      isActive: true,
      isEmailVerified: true,
    },
  });

  await prisma.notificationPreference.create({
    data: { userId: staffUser1.id },
  });

  const staff1 = await prisma.staff.create({
    data: {
      userId: staffUser1.id,
      businessId: business.id,
      displayName: "Priya",
      designation: "Senior Stylist",
      bio: "8 years experience in hair styling and colouring.",
      status: "ACTIVE",
      joiningDate: new Date("2022-01-15"),
    },
  });

  // Priya's schedule: Mon-Sat, 09:00-18:00
  const weekdays = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  await prisma.staffSchedule.createMany({
    data: weekdays.map((day) => ({
      staffId: staff1.id,
      dayOfWeek: day,
      startTime: "09:00",
      endTime: "18:00",
      isAvailable: true,
    })),
  });

  // Sunday off
  await prisma.staffSchedule.create({
    data: {
      staffId: staff1.id,
      dayOfWeek: "SUNDAY",
      startTime: "00:00",
      endTime: "00:00",
      isAvailable: false,
    },
  });

  const staffUser2 = await prisma.user.create({
    data: {
      name: "Amit Verma",
      email: "amit@sharmassalon.dev",
      phone: "+910000000004",
      passwordHash,
      role: "STAFF",
      isActive: true,
      isEmailVerified: true,
    },
  });

  await prisma.notificationPreference.create({
    data: { userId: staffUser2.id },
  });

  const staff2 = await prisma.staff.create({
    data: {
      userId: staffUser2.id,
      businessId: business.id,
      displayName: "Amit",
      designation: "Barber",
      bio: "Specialist in men's grooming and beard styling.",
      status: "ACTIVE",
      joiningDate: new Date("2023-06-01"),
    },
  });

  // Amit: Tue-Sun, 10:00-19:00
  const amitDays = [
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];
  await prisma.staffSchedule.createMany({
    data: amitDays.map((day) => ({
      staffId: staff2.id,
      dayOfWeek: day,
      startTime: "10:00",
      endTime: "19:00",
      isAvailable: true,
    })),
  });

  await prisma.staffSchedule.create({
    data: {
      staffId: staff2.id,
      dayOfWeek: "MONDAY",
      startTime: "00:00",
      endTime: "00:00",
      isAvailable: false,
    },
  });

  console.log(`    Staff: ${staff1.displayName}, ${staff2.displayName}`);

  // ── 6. CUSTOMER User + Profile ────────────────────────────────────────────

  console.log("  Creating CUSTOMER user...");
  const customerUser = await prisma.user.create({
    data: {
      name: "Anjali Singh",
      email: "anjali@customer.dev",
      phone: "+910000000005",
      passwordHash,
      role: "CUSTOMER",
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  await prisma.notificationPreference.create({
    data: { userId: customerUser.id },
  });

  const customer = await prisma.customer.create({
    data: {
      userId: customerUser.id,
      gender: "Female",
      preferences: {
        preferredStaff: staff1.id,
        notifications: { sms: true, email: true },
      },
    },
  });

  console.log(`    Customer: ${customerUser.email}`);

  // ── 7. Sample Appointment ─────────────────────────────────────────────────

  console.log("  Creating sample appointment...");
  const appointmentDate = new Date();
  appointmentDate.setDate(appointmentDate.getDate() + 3); // 3 days from now

  const appointment = await prisma.appointment.create({
    data: {
      businessId: business.id,
      customerId: customer.id,
      staffId: staff1.id,
      appointmentDate,
      startTime: "10:00",
      endTime: "11:30",
      status: "CONFIRMED",
      totalAmount: 1750.0, // haircut + colour
      notes: "First visit — prefers minimal fragrance products.",
    },
  });

  // AppointmentService records (preserving price at booking time)
  await prisma.appointmentService.createMany({
    data: [
      {
        appointmentId: appointment.id,
        serviceId: serviceHaircut.id,
        quantity: 1,
        priceAtBooking: 250.0,
      },
      {
        appointmentId: appointment.id,
        serviceId: serviceColor.id,
        quantity: 1,
        priceAtBooking: 1500.0,
      },
    ],
  });

  console.log(`    Appointment: ${appointment.id} (CONFIRMED, ₹1750)`);

  // ── 8. Queue + QueueEntry ─────────────────────────────────────────────────

  console.log("  Creating queue...");
  const queue = await prisma.queue.create({
    data: {
      businessId: business.id,
      name: "Main Queue",
      description: "General walk-in queue for Sharma's Salon.",
      isActive: true,
      maxCapacity: 20,
    },
  });

  await prisma.queueEntry.create({
    data: {
      queueId: queue.id,
      customerId: customer.id,
      tokenNumber: 1,
      status: "WAITING",
      estimatedWaitMinutes: 15,
      joinedAt: new Date(),
    },
  });

  console.log(`    Queue: ${queue.name}, Token #1 for ${customerUser.name}`);

  // ── 9. Sample Notifications ───────────────────────────────────────────────

  console.log("  Creating sample notifications...");
  await prisma.notification.createMany({
    data: [
      {
        userId: customerUser.id,
        businessId: business.id,
        type: "APPOINTMENT_CONFIRMED",
        channel: "IN_APP",
        title: "Appointment Confirmed",
        message: `Your appointment at Sharma's Salon on ${appointmentDate.toDateString()} at 10:00 AM is confirmed.`,
        isRead: false,
      },
      {
        userId: businessUser.id,
        businessId: business.id,
        type: "APPOINTMENT_CREATED",
        channel: "IN_APP",
        title: "New Appointment Booked",
        message: `Anjali Singh has booked an appointment for ${appointmentDate.toDateString()} at 10:00 AM.`,
        isRead: false,
      },
    ],
  });

  // ── 10. Audit Logs ────────────────────────────────────────────────────────

  console.log("  Creating audit logs...");
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: "BUSINESS_APPROVED",
        entity: "Business",
        entityId: business.id,
        metadata: { reason: "Seed — development approval" },
        ipAddress: "127.0.0.1",
      },
      {
        userId: customerUser.id,
        businessId: business.id,
        action: "APPOINTMENT_CREATED",
        entity: "Appointment",
        entityId: appointment.id,
        metadata: { totalAmount: 1750, services: 2 },
        ipAddress: "127.0.0.1",
      },
    ],
  });

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log("\n=== Seed complete ===\n");
  console.log("Development credentials (Password: Password@123):");
  console.log("  ADMIN    : admin@salonsaas.dev");
  console.log("  BUSINESS : owner@sharmassalon.dev");
  console.log("  STAFF    : priya@sharmassalon.dev");
  console.log("  STAFF    : amit@sharmassalon.dev");
  console.log("  CUSTOMER : anjali@customer.dev");
  console.log("\nWARNING: These are development-only credentials.");
  console.log("         Never use in production.");
};

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

seed()
  .catch((error) => {
    console.error("\nSeed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
