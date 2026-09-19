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
import QRCode from "qrcode";

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

  // ── 10. QR Code for Salon ───────────────────────────────────────────────
  console.log("  Creating QR code for Salon...");
  const salonTargetUrl = "http://localhost:3000/book/BLUSH-0427";
  const salonQrDataUrl = await QRCode.toDataURL(salonTargetUrl, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#0f172a", light: "#ffffff" },
  });
  await prisma.qrCode.create({
    data: {
      businessId: business.id,
      type: "BUSINESS",
      token: "BLUSH-0427",
      targetUrl: salonTargetUrl,
      qrImageUrl: salonQrDataUrl,
      isActive: true,
      scanCount: 142,
    },
  });

  // ── 11. Additional Salon Appointments & Payments (Past 7 Days + Today) ──
  console.log("  Creating rich Salon appointments and payments...");
  const svcHairSpa = await prisma.service.create({
    data: { businessId: business.id, name: "Hair Spa", durationMinutes: 60, price: 1200.0, category: "Haircare", isActive: true },
  });
  const svcFacial = await prisma.service.create({
    data: { businessId: business.id, name: "Facial", durationMinutes: 45, price: 800.0, category: "Skincare", isActive: true },
  });
  const svcBridal = await prisma.service.create({
    data: { businessId: business.id, name: "Bridal Makeup", durationMinutes: 120, price: 5000.0, category: "Makeup", isActive: true },
  });
  const svcThreading = await prisma.service.create({
    data: { businessId: business.id, name: "Threading", durationMinutes: 15, price: 100.0, category: "Eyebrows", isActive: true },
  });

  // Create extra customers
  const extraCustData = [
    { name: "Anjali Verma", phone: "+919876543210", email: "anjali.v@customer.dev" },
    { name: "Riya Patel", phone: "+918765432109", email: "riya.p@customer.dev" },
    { name: "Sneha Kapoor", phone: "+919123456789", email: "sneha.k@customer.dev" },
    { name: "Meera Joshi", phone: "+919988766554", email: "meera.j@customer.dev" },
    { name: "Tanya Sharma", phone: "+918877766550", email: "tanya.s@customer.dev" },
  ];

  const createdCustomers = [];
  for (const c of extraCustData) {
    const u = await prisma.user.create({
      data: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        passwordHash,
        role: "CUSTOMER",
        isActive: true,
      },
    });
    const cp = await prisma.customer.create({ data: { userId: u.id } });
    createdCustomers.push({ user: u, customer: cp });
  }

  // Create appointments for today matching screenshot times
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const salonTodayAppts = [
    { custIdx: 0, svc: svcBridal, staff: staff1, time: "10:30", status: "CONFIRMED", amt: 5000 },
    { custIdx: 1, svc: svcHairSpa, staff: staff2, time: "11:15", status: "CONFIRMED", amt: 1200 },
    { custIdx: 2, svc: svcFacial, staff: staff1, time: "12:00", status: "CONFIRMED", amt: 800 },
    { custIdx: 3, svc: svcThreading, staff: staff2, time: "13:30", status: "PENDING", amt: 100 },
    { custIdx: 4, svc: serviceHaircut, staff: staff1, time: "15:00", status: "CONFIRMED", amt: 250 },
  ];

  for (const a of salonTodayAppts) {
    const apt = await prisma.appointment.create({
      data: {
        businessId: business.id,
        customerId: createdCustomers[a.custIdx].customer.id,
        staffId: a.staff.id,
        appointmentDate: todayDate,
        startTime: a.time,
        endTime: "16:00",
        status: a.status,
        totalAmount: a.amt,
      },
    });
    if (a.svc) {
      await prisma.appointmentService.create({
        data: {
          appointmentId: apt.id,
          serviceId: a.svc.id,
          quantity: 1,
          priceAtBooking: a.amt,
        },
      });
    }
    // Create payment for confirmed/completed
    if (a.status === "CONFIRMED" || a.status === "COMPLETED") {
      await prisma.payment.create({
        data: {
          businessId: business.id,
          customerId: createdCustomers[a.custIdx].customer.id,
          appointmentId: apt.id,
          amount: a.amt,
          status: "PAID",
          method: "UPI",
          currency: "INR",
        },
      });
    }
  }

  // Historical appointments for the last 6 days for chart
  for (let i = 1; i <= 6; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const count = 2;
    for (let j = 0; j < count; j++) {
      const apt = await prisma.appointment.create({
        data: {
          businessId: business.id,
          customerId: createdCustomers[j % createdCustomers.length].customer.id,
          staffId: j % 2 === 0 ? staff1.id : staff2.id,
          appointmentDate: d,
          startTime: "10:00",
          endTime: "11:00",
          status: j % 5 === 0 ? "CANCELLED" : "COMPLETED",
          totalAmount: 1200 + (j * 150),
        },
      });
      await prisma.payment.create({
        data: {
          businessId: business.id,
          customerId: createdCustomers[j % createdCustomers.length].customer.id,
          appointmentId: apt.id,
          amount: 1200 + (j * 150),
          status: "PAID",
          method: "RAZORPAY",
          createdAt: d,
          currency: "INR",
        },
      });
    }
  }

  // ── 12. CAR WASH Business + Owner + Services + Staff + Appointments ─────
  console.log("  Creating CAR WASH business and owner...");
  const carWashUser = await prisma.user.create({
    data: {
      name: "Rahul Sharma",
      email: "owner@royalcarwash.dev",
      phone: "+910000000088",
      passwordHash,
      role: "BUSINESS",
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  await prisma.notificationPreference.create({
    data: { userId: carWashUser.id },
  });

  const carWashBiz = await prisma.business.create({
    data: {
      ownerId: carWashUser.id,
      name: "Royal Car Wash",
      slug: "royal-car-wash",
      businessType: "CAR_WASH",
      description: "Delivering the best car wash experience with modern technology and expert care.",
      email: "contact@royalcarwash.dev",
      phone: "+910000000077",
      address: "Sector 18, Commercial Auto Hub",
      city: "Gurugram",
      state: "Haryana",
      country: "IN",
      pincode: "122001",
      status: "ACTIVE",
      isActive: true,
    },
  });

  // Car Wash subscription
  await prisma.subscription.create({
    data: {
      businessId: carWashBiz.id,
      plan: "PREMIUM",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      renewalDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      provider: "razorpay",
    },
  });

  // Car Wash QR
  const carWashTargetUrl = "http://localhost:3000/book/BWK-0427";
  const carWashQrDataUrl = await QRCode.toDataURL(carWashTargetUrl, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#0f172a", light: "#ffffff" },
  });
  await prisma.qrCode.create({
    data: {
      businessId: carWashBiz.id,
      type: "BUSINESS",
      token: "BWK-0427",
      targetUrl: carWashTargetUrl,
      qrImageUrl: carWashQrDataUrl,
      isActive: true,
      scanCount: 346,
    },
  });

  // Car Wash Services
  const svcCwFull = await prisma.service.create({
    data: { businessId: carWashBiz.id, name: "Full Wash", durationMinutes: 45, price: 650.0, category: "Wash", isActive: true },
  });
  const svcCwInterior = await prisma.service.create({
    data: { businessId: carWashBiz.id, name: "Interior Cleaning", durationMinutes: 30, price: 450.0, category: "Cleaning", isActive: true },
  });
  const svcCwExterior = await prisma.service.create({
    data: { businessId: carWashBiz.id, name: "Exterior Wash", durationMinutes: 20, price: 350.0, category: "Wash", isActive: true },
  });
  const svcCwPremium = await prisma.service.create({
    data: { businessId: carWashBiz.id, name: "Premium Wash", durationMinutes: 60, price: 950.0, category: "Detailing", isActive: true },
  });
  await prisma.service.create({
    data: { businessId: carWashBiz.id, name: "Others", durationMinutes: 15, price: 200.0, category: "Addons", isActive: true },
  });

  // Car Wash Staff
  const cwStaffUsers = [
    { name: "Rohit Singh", email: "rohit@royalcarwash.dev", phone: "+910000000061" },
    { name: "Vikram Yadav", email: "vikram@royalcarwash.dev", phone: "+910000000062" },
    { name: "Aman Khan", email: "aman@royalcarwash.dev", phone: "+910000000063" },
  ];

  const cwStaffRecords = [];
  for (const s of cwStaffUsers) {
    const su = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        phone: s.phone,
        passwordHash,
        role: "STAFF",
        isActive: true,
      },
    });
    const sr = await prisma.staff.create({
      data: {
        userId: su.id,
        businessId: carWashBiz.id,
        displayName: s.name,
        designation: "Wash Specialist",
        status: "ACTIVE",
      },
    });
    cwStaffRecords.push(sr);
  }

  // Car Wash Queue
  const cwQueue = await prisma.queue.create({
    data: {
      businessId: carWashBiz.id,
      name: "Bay 1 Express Queue",
      isActive: true,
      maxCapacity: 15,
    },
  });

  await prisma.queueEntry.create({
    data: {
      queueId: cwQueue.id,
      customerId: createdCustomers[0].customer.id,
      tokenNumber: 1,
      status: "SERVING",
      estimatedWaitMinutes: 5,
    },
  });

  await prisma.queueEntry.create({
    data: {
      queueId: cwQueue.id,
      customerId: createdCustomers[1].customer.id,
      tokenNumber: 2,
      status: "WAITING",
      estimatedWaitMinutes: 15,
    },
  });

  await prisma.queueEntry.create({
    data: {
      queueId: cwQueue.id,
      customerId: createdCustomers[2].customer.id,
      tokenNumber: 3,
      status: "WAITING",
      estimatedWaitMinutes: 30,
    },
  });

  // Car Wash Today's Appointments matching screenshot
  const cwTodayAppts = [
    { custIdx: 0, svc: svcCwFull, staff: cwStaffRecords[0], time: "10:30 AM", status: "COMPLETED", amt: 650 },
    { custIdx: 1, svc: svcCwInterior, staff: cwStaffRecords[1], time: "11:15 AM", status: "CONFIRMED", amt: 450 },
    { custIdx: 2, svc: svcCwExterior, staff: cwStaffRecords[2], time: "12:00 PM", status: "CONFIRMED", amt: 350 },
    { custIdx: 3, svc: svcCwPremium, staff: cwStaffRecords[0], time: "01:30 PM", status: "PENDING", amt: 950 },
    { custIdx: 4, svc: svcCwInterior, staff: cwStaffRecords[1], time: "03:00 PM", status: "CONFIRMED", amt: 450 },
  ];

  for (const a of cwTodayAppts) {
    const apt = await prisma.appointment.create({
      data: {
        businessId: carWashBiz.id,
        customerId: createdCustomers[a.custIdx].customer.id,
        staffId: a.staff.id,
        appointmentDate: todayDate,
        startTime: a.time,
        endTime: "04:00 PM",
        status: a.status,
        totalAmount: a.amt,
      },
    });
    if (a.svc) {
      await prisma.appointmentService.create({
        data: {
          appointmentId: apt.id,
          serviceId: a.svc.id,
          quantity: 1,
          priceAtBooking: a.amt,
        },
      });
    }
    if (a.status === "COMPLETED" || a.status === "CONFIRMED") {
      await prisma.payment.create({
        data: {
          businessId: carWashBiz.id,
          customerId: createdCustomers[a.custIdx].customer.id,
          appointmentId: apt.id,
          amount: a.amt,
          status: "PAID",
          method: "RAZORPAY",
          currency: "INR",
        },
      });
    }
  }

  // Car Wash Historical data (past 6 days) for Booking Overview chart
  for (let i = 1; i <= 6; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const count = 2;
    for (let j = 0; j < count; j++) {
      const apt = await prisma.appointment.create({
        data: {
          businessId: carWashBiz.id,
          customerId: createdCustomers[j % createdCustomers.length].customer.id,
          staffId: cwStaffRecords[j % cwStaffRecords.length].id,
          appointmentDate: d,
          startTime: "09:30 AM",
          endTime: "10:30 AM",
          status: "COMPLETED",
          totalAmount: 550,
        },
      });
      await prisma.payment.create({
        data: {
          businessId: carWashBiz.id,
          customerId: createdCustomers[j % createdCustomers.length].customer.id,
          appointmentId: apt.id,
          amount: 550,
          status: "PAID",
          method: "RAZORPAY",
          createdAt: d,
          currency: "INR",
        },
      });
    }
  }

  // Car Wash Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: carWashUser.id,
        businessId: carWashBiz.id,
        type: "APPOINTMENT_CREATED",
        channel: "IN_APP",
        title: "New booking received",
        message: "Amit Kumar booked Full Wash for 10:30 AM",
        isRead: false,
      },
      {
        userId: carWashUser.id,
        businessId: carWashBiz.id,
        type: "PAYMENT_SUCCESS",
        channel: "IN_APP",
        title: "Payment received",
        message: "₹550 via Razorpay from Amit Kumar",
        isRead: false,
      },
      {
        userId: carWashUser.id,
        businessId: carWashBiz.id,
        type: "QUEUE_UPDATE",
        channel: "IN_APP",
        title: "Staff checked in",
        message: "Rohit Singh started service",
        isRead: false,
      },
    ],
  });

  // ── 13. Audit Logs ────────────────────────────────────────────────────────
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
        userId: adminUser.id,
        action: "BUSINESS_APPROVED",
        entity: "Business",
        entityId: carWashBiz.id,
        metadata: { reason: "Seed — development approval" },
        ipAddress: "127.0.0.1",
      },
    ],
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n=== Seed complete ===\n");
  console.log("Development credentials (Password: Password@123):");
  console.log("  ADMIN         : admin@salonsaas.dev");
  console.log("  SALON OWNER   : owner@sharmassalon.dev (Sharma's Salon - SALON)");
  console.log("  CAR WASH OWNER: owner@royalcarwash.dev (Royal Car Wash - CAR_WASH)");
  console.log("  STAFF         : priya@sharmassalon.dev");
  console.log("  STAFF         : rohit@royalcarwash.dev");
  console.log("  CUSTOMER      : anjali@customer.dev");
  console.log("\nWARNING: These are development-only credentials. Never use in production.");
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

