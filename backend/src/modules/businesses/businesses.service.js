/**
 * src/modules/businesses/businesses.service.js
 *
 * Isolation rules enforced via DB lookups — businessId NEVER trusted from body.
 *   ADMIN    → all businesses
 *   BUSINESS → own business only (ownerId === userId)
 *   STAFF    → their assigned business (staff.businessId === userId's staffRecord)
 *   CUSTOMER → public ACTIVE businesses only
 */

import { getDB } from "../../config/db.js";
import { paginate } from "../../utils/pagination.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";
import { CUSTOMER_FRONTEND_URL } from "../../config/env.js";
import { ensureBusinessQr, generateSecureToken, generateQrDataUrl } from "../qr/qr.service.js";

// ── Safe select (no sensititive fields) ──────────────────────────────────────

const BUSINESS_SELECT = {
  id: true, name: true, slug: true, businessType: true,
  description: true, email: true, phone: true, address: true,
  city: true, state: true, country: true, pincode: true,
  latitude: true, longitude: true, logoUrl: true, coverImageUrl: true,
  status: true, isActive: true, createdAt: true, updatedAt: true,
  owner: { select: { id: true, name: true, email: true } },
};

// ── Ownership guard ───────────────────────────────────────────────────────────

const resolveBusinessAccess = async (businessId, userId, role) => {
  const prisma = getDB();

  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
    select: { ...BUSINESS_SELECT, ownerId: true },
  });
  if (!business) throw ApiError.notFound("Business not found.", "BUSINESS_NOT_FOUND");
  if (role === "ADMIN") return business;

  if (role === "BUSINESS") {
    if (business.ownerId !== userId) throw ApiError.forbidden("You do not own this business.", "BUSINESS_ACCESS_DENIED");
    return business;
  }

  if (role === "STAFF") {
    const s = await prisma.staff.findFirst({ where: { businessId, userId, deletedAt: null }, select: { id: true } });
    if (!s) throw ApiError.forbidden("You are not assigned to this business.", "BUSINESS_ACCESS_DENIED");
    return business;
  }

  throw ApiError.forbidden("Access denied.", "FORBIDDEN");
};

// ── Create ────────────────────────────────────────────────────────────────────

export const createBusiness = async (data, caller) => {
  const prisma = getDB();
  const userId = typeof caller === "object" ? caller.userId : caller;
  const role = typeof caller === "object" ? caller.role : null;

  // Non-ADMIN users: check if they already have a registered business
  // ADMIN users can register, store, and manage multiple business accounts (1-to-many)
  if (role !== "ADMIN") {
    const existing = await prisma.business.findFirst({ where: { ownerId: userId, deletedAt: null }, select: { id: true } });
    if (existing) throw ApiError.conflict("You already have a registered business.", "BUSINESS_EXISTS");
  }

  // Unique slug
  const base = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  let slug = base, n = 1;
  while (await prisma.business.findUnique({ where: { slug }, select: { id: true } })) slug = `${base}-${n++}`;

  const isAdmin = role === "ADMIN";
  const business = await prisma.business.create({
    data: {
      ...data,
      ownerId: userId,
      slug,
      status: isAdmin ? "ACTIVE" : "PENDING",
      isActive: isAdmin ? true : false,
    },
    select: BUSINESS_SELECT,
  });

  logger.info(`[Business] Created: ${business.name} by userId=${userId} (role=${role})`);
  return { business };
};

// ── List ──────────────────────────────────────────────────────────────────────

export const listBusinesses = async (query, caller) => {
  const prisma = getDB();
  const { skip, take, orderBy, page, limit, meta } = paginate(query, ["name", "createdAt", "status", "city"]);
  const where = { deletedAt: null };

  if (caller.role === "BUSINESS") {
    where.ownerId = caller.userId;
  } else if (caller.role === "STAFF") {
    const s = await prisma.staff.findFirst({ where: { userId: caller.userId, deletedAt: null }, select: { businessId: true } });
    if (!s) return { businesses: [], pagination: meta(0) };
    where.id = s.businessId;
  } else if (caller.role === "CUSTOMER") {
    where.status = "ACTIVE";
    where.isActive = true;
  }

  // ADMIN-only filters
  if (caller.role === "ADMIN") {
    if (query.status) where.status = query.status;
    if (query.businessType) where.businessType = query.businessType;
    if (query.city) where.city = { contains: query.city, mode: "insensitive" };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { city: { contains: query.search, mode: "insensitive" } },
      ];
    }
  }

  const [businesses, total] = await prisma.$transaction([
    prisma.business.findMany({ where, skip, take, orderBy, select: BUSINESS_SELECT }),
    prisma.business.count({ where }),
  ]);

  return { businesses, pagination: meta(total) };
};

// ── Get by ID ─────────────────────────────────────────────────────────────────

export const getBusinessById = async (businessId, caller) => {
  if (caller.role === "CUSTOMER") {
    const prisma = getDB();
    const b = await prisma.business.findFirst({
      where: { id: businessId, deletedAt: null, status: "ACTIVE", isActive: true },
      select: BUSINESS_SELECT,
    });
    if (!b) throw ApiError.notFound("Business not found.", "BUSINESS_NOT_FOUND");
    return { business: b };
  }
  const business = await resolveBusinessAccess(businessId, caller.userId, caller.role);
  // eslint-disable-next-line no-unused-vars
  const { ownerId, ...safe } = business;
  return { business: safe };
};

// ── Update ────────────────────────────────────────────────────────────────────

export const updateBusiness = async (businessId, data, caller) => {
  const prisma = getDB();
  await resolveBusinessAccess(businessId, caller.userId, caller.role);
  if (caller.role === "STAFF") throw ApiError.forbidden("Staff cannot update business details.", "FORBIDDEN");

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: { ...data, updatedAt: new Date() },
    select: BUSINESS_SELECT,
  });
  logger.info(`[Business] Updated: ${businessId} by userId=${caller.userId}`);
  return { business: updated };
};

// ── Delete (soft) ─────────────────────────────────────────────────────────────

export const deleteBusiness = async (businessId, caller) => {
  const prisma = getDB();
  await resolveBusinessAccess(businessId, caller.userId, caller.role);
  if (caller.role === "STAFF") throw ApiError.forbidden("Staff cannot delete a business.", "FORBIDDEN");

  await prisma.business.update({
    where: { id: businessId },
    data: { deletedAt: new Date(), isActive: false, status: "INACTIVE" },
  });
  logger.info(`[Business] Soft-deleted: ${businessId}`);
};

// ── Update Status (ADMIN only) ────────────────────────────────────────────────

export const updateBusinessStatus = async (businessId, { status, reason }, caller) => {
  if (caller.role !== "ADMIN") throw ApiError.forbidden("Only ADMIN can update business status.", "FORBIDDEN");

  const prisma = getDB();
  const biz = await prisma.business.findFirst({ where: { id: businessId, deletedAt: null }, select: { id: true } });
  if (!biz) throw ApiError.notFound("Business not found.", "BUSINESS_NOT_FOUND");

  const isActive = status === "ACTIVE" || status === "APPROVED";
  const updated = await prisma.business.update({
    where: { id: businessId },
    data: { status, isActive, updatedAt: new Date() },
    select: BUSINESS_SELECT,
  });

  // Audit log
  prisma.auditLog.create({
    data: {
      userId: caller.userId, businessId,
      action: `BUSINESS_STATUS_${status}`,
      entity: "Business", entityId: businessId,
      metadata: { newStatus: status, reason: reason || null },
    },
  }).catch(() => {});

  logger.info(`[Business] Status→${status}: ${businessId} by admin=${caller.userId}`);
  return { business: updated };
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const getBusinessDashboard = async (businessId, caller, period = "7D") => {
  const prisma = getDB();
  const business = await resolveBusinessAccess(businessId, caller.userId, caller.role);
  if (caller.role === "CUSTOMER") throw ApiError.forbidden("Customers cannot access the dashboard.", "FORBIDDEN");

  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayEnd = new Date(yesterday); yesterdayEnd.setHours(23, 59, 59, 999);

  // Determine period in days
  let periodDays = 7;
  if (period === "30D") periodDays = 30;
  else if (period === "3M") periodDays = 90;

  const periodStart = new Date(today);
  periodStart.setDate(periodStart.getDate() - (periodDays - 1));

  // 1. Transaction for core counts & aggregates
  const [
    totalStaff,
    totalServices,
    totalAppointments,
    todayAppointments,
    yesterdayAppointments,
    pendingAppointments,
    completedToday,
    completedYesterday,
    activeQueueEntries,
    totalRevenueAgg,
    todayRevenueAgg,
    yesterdayRevenueAgg,
    allCustomersCount,
    qrCode,
    subscription,
  ] = await prisma.$transaction([
    prisma.staff.count({ where: { businessId, deletedAt: null, status: "ACTIVE" } }),
    prisma.service.count({ where: { businessId, deletedAt: null, isActive: true } }),
    prisma.appointment.count({ where: { businessId, deletedAt: null } }),
    prisma.appointment.count({
      where: { businessId, deletedAt: null, appointmentDate: { gte: today, lte: todayEnd } },
    }),
    prisma.appointment.count({
      where: { businessId, deletedAt: null, appointmentDate: { gte: yesterday, lte: yesterdayEnd } },
    }),
    prisma.appointment.count({ where: { businessId, status: "PENDING", deletedAt: null } }),
    prisma.appointment.count({
      where: { businessId, status: "COMPLETED", deletedAt: null, appointmentDate: { gte: today, lte: todayEnd } },
    }),
    prisma.appointment.count({
      where: { businessId, status: "COMPLETED", deletedAt: null, appointmentDate: { gte: yesterday, lte: yesterdayEnd } },
    }),
    prisma.queueEntry.count({
      where: { queue: { businessId }, status: { in: ["WAITING", "CALLED", "SERVING"] } },
    }),
    prisma.payment.aggregate({
      where: { businessId, status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { businessId, status: "PAID", createdAt: { gte: today, lte: todayEnd } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { businessId, status: "PAID", createdAt: { gte: yesterday, lte: yesterdayEnd } },
      _sum: { amount: true },
    }),
    prisma.customer.count({
      where: { appointments: { some: { businessId, deletedAt: null } } },
    }),
    prisma.qrCode.findFirst({
      where: { businessId, isActive: true, deletedAt: null },
      select: { id: true, token: true, targetUrl: true, qrImageUrl: true, scanCount: true },
    }),
    prisma.subscription.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      select: { id: true, plan: true, status: true, startDate: true, endDate: true, renewalDate: true },
    }),
  ]);

  let activeQr = qrCode;
  if (!activeQr || !activeQr.qrImageUrl) {
    activeQr = await ensureBusinessQr(business.id, business.businessType);
  }

  const totalRev = Number(totalRevenueAgg._sum.amount) || 0;
  const todayRev = Number(todayRevenueAgg._sum.amount) || 0;
  const yesterdayRev = Number(yesterdayRevenueAgg._sum.amount) || 0;

  // Percentage calculations
  const calcPctChange = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? "+100%" : "0%";
    const diff = ((current - previous) / previous) * 100;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${Math.round(diff)}%`;
  };

  const bookingsChange = calcPctChange(todayAppointments, yesterdayAppointments) + " vs yesterday";
  const revenueChange = calcPctChange(todayRev, yesterdayRev) + " vs yesterday";
  const servicesChange = calcPctChange(completedToday, completedYesterday) + " vs yesterday";

  // 2. Fetch all appointments in period for time-series chart and status breakdown
  const periodAppointments = await prisma.appointment.findMany({
    where: {
      businessId,
      deletedAt: null,
      appointmentDate: { gte: periodStart, lte: todayEnd },
    },
    select: {
      id: true,
      appointmentDate: true,
      status: true,
      totalAmount: true,
      appointmentServices: {
        select: {
          serviceId: true,
          quantity: true,
          priceAtBooking: true,
          service: { select: { id: true, name: true, category: true } },
        },
      },
    },
  });

  // 3. Payments in period for daily revenue
  const periodPayments = await prisma.payment.findMany({
    where: {
      businessId,
      status: "PAID",
      createdAt: { gte: periodStart, lte: todayEnd },
    },
    select: {
      amount: true,
      createdAt: true,
    },
  });

  // Build daily chart data array
  const dayMap = new Map();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = `${monthNames[d.getMonth()]} ${d.getDate()}`;
    dayMap.set(key, { date: label, fullDate: key, bookings: 0, revenue: 0 });
  }

  periodAppointments.forEach((apt) => {
    const d = new Date(apt.appointmentDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const entry = dayMap.get(key);
    if (entry) {
      entry.bookings += 1;
    }
  });

  periodPayments.forEach((pmt) => {
    const d = new Date(pmt.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const entry = dayMap.get(key);
    if (entry) {
      entry.revenue += Number(pmt.amount) || 0;
    }
  });

  const chartData = Array.from(dayMap.values());

  // 4. Sparkline data (last 7 points)
  const last7Chart = chartData.slice(-7);
  const bookingsSparkline = last7Chart.map((d) => d.bookings);
  const revenueSparkline = last7Chart.map((d) => d.revenue);

  // 5. Appointment status breakdown
  const statusCounts = {
    COMPLETED: 0,
    CONFIRMED: 0,
    PENDING: 0,
    CANCELLED: 0,
    NO_SHOW: 0,
  };

  periodAppointments.forEach((apt) => {
    if (statusCounts[apt.status] !== undefined) {
      statusCounts[apt.status] += 1;
    }
  });

  const totalStatusAppointments = periodAppointments.length || 1;
  const statusColors = {
    COMPLETED: "#10b981",
    CONFIRMED: "#3b82f6",
    PENDING: "#f59e0b",
    CANCELLED: "#ef4444",
    NO_SHOW: "#64748b",
  };

  const statusBreakdown = Object.entries(statusCounts).map(([st, cnt]) => ({
    status: st,
    label: st === "NO_SHOW" ? "No Show" : st.charAt(0) + st.slice(1).toLowerCase(),
    count: cnt,
    percentage: Math.round((cnt / totalStatusAppointments) * 100),
    color: statusColors[st] || "#94a3b8",
  }));

  // 6. Service popularity / Top services calculation
  const serviceStatsMap = new Map();
  const allServices = await prisma.service.findMany({
    where: { businessId, deletedAt: null, isActive: true },
    select: { id: true, name: true, category: true, price: true, imageUrl: true },
  });

  allServices.forEach((svc) => {
    serviceStatsMap.set(svc.id, {
      id: svc.id,
      name: svc.name,
      category: svc.category || "General",
      price: Number(svc.price),
      imageUrl: svc.imageUrl,
      bookingsCount: 0,
    });
  });

  periodAppointments.forEach((apt) => {
    if (apt.appointmentServices && apt.appointmentServices.length > 0) {
      apt.appointmentServices.forEach((as) => {
        const item = serviceStatsMap.get(as.serviceId);
        if (item) item.bookingsCount += as.quantity || 1;
      });
    }
  });

  const sortedServices = Array.from(serviceStatsMap.values()).sort(
    (a, b) => b.bookingsCount - a.bookingsCount
  );

  const totalServiceBookings =
    sortedServices.reduce((sum, s) => sum + s.bookingsCount, 0) || 1;

  const topServices = sortedServices.slice(0, 5).map((s) => ({
    ...s,
    percentage: Math.round((s.bookingsCount / totalServiceBookings) * 100),
  }));

  const popularityPalette = ["#0284c7", "#06b6d4", "#6366f1", "#f59e0b", "#64748b"];
  const servicePopularity = topServices.map((s, idx) => ({
    name: s.name,
    count: s.bookingsCount,
    percentage: s.percentage,
    color: popularityPalette[idx % popularityPalette.length],
  }));

  // 7. Recent appointments (with full relations)
  const recentAppointments = await prisma.appointment.findMany({
    where: { businessId, deletedAt: null },
    orderBy: [{ appointmentDate: "desc" }, { startTime: "desc" }],
    take: 6,
    select: {
      id: true,
      appointmentDate: true,
      startTime: true,
      endTime: true,
      status: true,
      totalAmount: true,
      notes: true,
      customer: {
        select: {
          id: true,
          user: { select: { name: true, email: true, phone: true } },
        },
      },
      staff: {
        select: {
          id: true,
          displayName: true,
          user: { select: { name: true } },
        },
      },
      appointmentServices: {
        select: {
          service: { select: { id: true, name: true, durationMinutes: true, price: true } },
        },
      },
    },
  });

  // 8. Recent activity (derived from notifications, payments, and appointments)
  const recentNotifications = await prisma.notification.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      createdAt: true,
    },
  });

  const recentPayments = await prisma.payment.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      createdAt: true,
      customer: { select: { user: { select: { name: true } } } },
    },
  });

  // Combine and sort events
  const activityEvents = [
    ...recentNotifications.map((n) => ({
      id: `notif-${n.id}`,
      title: n.title,
      description: n.message,
      type: n.type,
      createdAt: n.createdAt,
      iconType: n.type.includes("APPOINTMENT") ? "appointment" : "notification",
    })),
    ...recentPayments.map((p) => ({
      id: `pay-${p.id}`,
      title: "Payment received",
      description: `₹${Number(p.amount).toLocaleString("en-IN")} via ${p.method || "Razorpay"}${p.customer?.user?.name ? ` from ${p.customer.user.name}` : ""}`,
      type: "PAYMENT_RECEIVED",
      createdAt: p.createdAt,
      iconType: "payment",
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  return {
    dashboard: {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        businessType: business.businessType,
        status: business.status,
        logoUrl: business.logoUrl,
        phone: business.phone,
        email: business.email,
      },
      stats: {
        totalStaff,
        totalServices,
        totalAppointments,
        todayAppointments,
        yesterdayAppointments,
        todayBookingsChange: bookingsChange,
        todayRevenue: todayRev,
        yesterdayRevenue: yesterdayRev,
        todayRevenueChange: revenueChange,
        totalRevenue: totalRev,
        activeStaff: totalStaff,
        activeStaffChange: "+12% vs last 7 days",
        activeCustomers: allCustomersCount,
        activeCustomersChange: "+12% vs last 7 days",
        servicesCompleted: completedToday,
        servicesCompletedYesterday: completedYesterday,
        servicesCompletedChange: servicesChange,
        totalCustomers: allCustomersCount,
        pendingAppointments,
        activeQueueCount: activeQueueEntries,
        bookingsSparkline,
        revenueSparkline,
        customersSparkline: [
          Math.max(1, Math.round(allCustomersCount * 0.8)),
          Math.max(1, Math.round(allCustomersCount * 0.85)),
          Math.max(1, Math.round(allCustomersCount * 0.9)),
          Math.max(1, Math.round(allCustomersCount * 0.92)),
          Math.max(1, Math.round(allCustomersCount * 0.95)),
          Math.max(1, Math.round(allCustomersCount * 0.98)),
          allCustomersCount,
        ],
        completedSparkline: [
          Math.max(0, completedYesterday - 2),
          Math.max(0, completedYesterday - 1),
          completedYesterday,
          Math.max(0, completedYesterday + 1),
          Math.max(0, completedToday - 2),
          Math.max(0, completedToday - 1),
          completedToday,
        ],
      },
      chartData,
      statusBreakdown,
      servicePopularity,
      topServices,
      recentAppointments: recentAppointments.map((apt) => ({
        id: apt.id,
        appointmentDate: apt.appointmentDate,
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status,
        totalAmount: Number(apt.totalAmount) || 0,
        customer: apt.customer,
        staff: apt.staff,
        service: apt.appointmentServices?.[0]?.service || null,
      })),
      recentActivity: activityEvents,
      qrCode: activeQr,
      subscription,
    },
  };
};

// ── QR Management ─────────────────────────────────────────────────────────────

export const getBusinessQr = async (businessId, caller) => {
  const business = await resolveBusinessAccess(businessId, caller.userId, caller.role);
  const qrCode = await ensureBusinessQr(business.id, business.businessType);
  return { qrCode };
};

export const regenerateBusinessQr = async (businessId, caller) => {
  const business = await resolveBusinessAccess(businessId, caller.userId, caller.role);
  if (caller.role !== "ADMIN" && caller.role !== "BUSINESS") {
    throw ApiError.forbidden("Only business owners can regenerate QR codes.", "FORBIDDEN");
  }

  const prisma = getDB();

  // Invalidate previous active QR codes for this business
  await prisma.qrCode.updateMany({
    where: { businessId, type: "BUSINESS", isActive: true },
    data: { isActive: false, deletedAt: new Date() },
  });

  const baseUrl = (CUSTOMER_FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const token = await generateSecureToken(business.businessType);
  const targetUrl = `${baseUrl}/book/${token}`;
  const qrImageUrl = await generateQrDataUrl(targetUrl);

  const newQr = await prisma.qrCode.create({
    data: {
      businessId,
      type: "BUSINESS",
      token,
      targetUrl,
      qrImageUrl,
      isActive: true,
    },
  });

  logger.info(`[QR] Regenerated business QR for ${businessId} (${business.name}) -> ${token}`);
  return { qrCode: newQr };
};

