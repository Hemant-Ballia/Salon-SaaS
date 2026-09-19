/**
 * src/modules/admin/admin.service.js
 *
 * Platform Super-Admin Dashboard Aggregations
 * Sourced directly from PostgreSQL via Prisma.
 */

import { getDB } from "../../config/db.js";
import logger from "../../utils/logger.js";

/**
 * Calculate time intervals based on selected period
 */
const getPeriodDateRange = (period = "7D") => {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setHours(23, 59, 59, 999);

  const periodStart = new Date(now);
  const prevPeriodStart = new Date(now);

  switch (period) {
    case "30D": {
      periodStart.setDate(periodStart.getDate() - 30);
      periodStart.setHours(0, 0, 0, 0);
      prevPeriodStart.setDate(prevPeriodStart.getDate() - 60);
      prevPeriodStart.setHours(0, 0, 0, 0);
      break;
    }
    case "3M": {
      periodStart.setMonth(periodStart.getMonth() - 3);
      periodStart.setHours(0, 0, 0, 0);
      prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 6);
      prevPeriodStart.setHours(0, 0, 0, 0);
      break;
    }
    case "12M": {
      periodStart.setFullYear(periodStart.getFullYear() - 1);
      periodStart.setHours(0, 0, 0, 0);
      prevPeriodStart.setFullYear(prevPeriodStart.getFullYear() - 2);
      prevPeriodStart.setHours(0, 0, 0, 0);
      break;
    }
    case "7D":
    default: {
      periodStart.setDate(periodStart.getDate() - 7);
      periodStart.setHours(0, 0, 0, 0);
      prevPeriodStart.setDate(prevPeriodStart.getDate() - 14);
      prevPeriodStart.setHours(0, 0, 0, 0);
      break;
    }
  }

  return { periodStart, periodEnd, prevPeriodStart };
};

/**
 * Safe percentage change calculation
 */
const calcPctChange = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? "+100%" : "0%";
  }
  const diff = ((current - previous) / previous) * 100;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${Math.round(diff)}%`;
};

/**
 * Get comprehensive Admin Dashboard data
 */
export const getAdminDashboardData = async (period = "7D") => {
  const prisma = getDB();
  const { periodStart, periodEnd, prevPeriodStart } = getPeriodDateRange(period);

  // 1. Parallel High-Level Aggregations
  const [
    totalUsers,
    totalBusinesses,
    activeBusinesses,
    totalCustomers,
    totalStaff,
    activeStaff,
    totalAppointments,
    completedAppointments,
    totalPaymentsAgg,
    paidPaymentsAgg,
    pendingPaymentsAgg,
    failedPaymentsAgg,
    refundedPaymentsAgg,
    totalSubscriptions,
    activeSubscriptions,
    businessStatusGroups,
    businessTypeGroups,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.business.count({ where: { deletedAt: null } }),
    prisma.business.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.staff.count({ where: { deletedAt: null } }),
    prisma.staff.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.appointment.count({ where: { deletedAt: null } }),
    prisma.appointment.count({ where: { status: "COMPLETED", deletedAt: null } }),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: { id: true } }),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: { id: true }, where: { status: "PAID" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: { id: true }, where: { status: "PENDING" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: { id: true }, where: { status: "FAILED" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: { id: true }, where: { status: "REFUNDED" } }),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.business.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
    prisma.business.groupBy({
      by: ["businessType"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
  ]);

  // 2. Period Growth Deltas (Current vs Previous)
  const [
    currPeriodBusinesses,
    prevPeriodBusinesses,
    currPeriodCustomers,
    prevPeriodCustomers,
    currPeriodAppointments,
    prevPeriodAppointments,
    currPeriodRevenueAgg,
    prevPeriodRevenueAgg,
  ] = await Promise.all([
    prisma.business.count({
      where: { createdAt: { gte: periodStart, lte: periodEnd }, deletedAt: null },
    }),
    prisma.business.count({
      where: { createdAt: { gte: prevPeriodStart, lt: periodStart }, deletedAt: null },
    }),
    prisma.customer.count({
      where: { createdAt: { gte: periodStart, lte: periodEnd }, deletedAt: null },
    }),
    prisma.customer.count({
      where: { createdAt: { gte: prevPeriodStart, lt: periodStart }, deletedAt: null },
    }),
    prisma.appointment.count({
      where: { appointmentDate: { gte: periodStart, lte: periodEnd }, deletedAt: null },
    }),
    prisma.appointment.count({
      where: { appointmentDate: { gte: prevPeriodStart, lt: periodStart }, deletedAt: null },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", createdAt: { gte: periodStart, lte: periodEnd } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", createdAt: { gte: prevPeriodStart, lt: periodStart } },
    }),
  ]);

  const currRevenue = Number(currPeriodRevenueAgg._sum.amount || 0);
  const prevRevenue = Number(prevPeriodRevenueAgg._sum.amount || 0);

  // 3. Time-Series Chart Data Generation
  // Query all appointments & payments in the selected period to construct real time series
  const [periodAppointmentsList, periodPaymentsList] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        appointmentDate: { gte: periodStart, lte: periodEnd },
        deletedAt: null,
      },
      select: { appointmentDate: true, status: true, totalAmount: true },
    }),
    prisma.payment.findMany({
      where: {
        createdAt: { gte: periodStart, lte: periodEnd },
        status: "PAID",
      },
      select: { createdAt: true, amount: true },
    }),
  ]);

  // Construct chart buckets
  const chartData = [];
  if (period === "7D" || period === "30D") {
    const numDays = period === "7D" ? 7 : 30;
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const dayAppts = periodAppointmentsList.filter((a) => {
        const aptStr = a.appointmentDate instanceof Date
          ? a.appointmentDate.toISOString().split("T")[0]
          : String(a.appointmentDate).split("T")[0];
        return aptStr === dateStr;
      });

      const dayRev = periodPaymentsList
        .filter((p) => {
          const pStr = p.createdAt instanceof Date
            ? p.createdAt.toISOString().split("T")[0]
            : String(p.createdAt).split("T")[0];
          return pStr === dateStr;
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      chartData.push({
        date: dateStr,
        label,
        appointments: dayAppts.length,
        revenue: Math.round(dayRev),
      });
    }
  } else {
    // 3M or 12M: Monthly buckets
    const numMonths = period === "3M" ? 3 : 12;
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      const monthAppts = periodAppointmentsList.filter((a) => {
        const ad = new Date(a.appointmentDate);
        return ad.getFullYear() === year && ad.getMonth() === month;
      });

      const monthRev = periodPaymentsList
        .filter((p) => {
          const pd = new Date(p.createdAt);
          return pd.getFullYear() === year && pd.getMonth() === month;
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      chartData.push({
        date: `${year}-${String(month + 1).padStart(2, "0")}`,
        label,
        appointments: monthAppts.length,
        revenue: Math.round(monthRev),
      });
    }
  }

  // 4. Recent Businesses (Top 5)
  const recentBusinesses = await prisma.business.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      owner: {
        select: { id: true, name: true, email: true, phone: true },
      },
      _count: {
        select: { staff: true, services: true, appointments: true },
      },
    },
  });

  // 5. Recent Appointments (Top 6)
  const recentAppointments = await prisma.appointment.findMany({
    where: { deletedAt: null },
    orderBy: [{ appointmentDate: "desc" }, { startTime: "desc" }],
    take: 6,
    include: {
      business: { select: { id: true, name: true, slug: true, businessType: true } },
      customer: {
        select: {
          id: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      staff: { select: { id: true, displayName: true, designation: true } },
      appointmentServices: {
        take: 1,
        include: { service: { select: { id: true, name: true, category: true } } },
      },
    },
  });

  // 6. Subscriptions Breakdown
  const subscriptionsByPlan = await prisma.subscription.groupBy({
    by: ["plan"],
    _count: { id: true },
  });

  // 7. Recent System Audit Activity (Top 6)
  const recentActivity = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  // Assemble full structured response
  return {
    overview: {
      totalUsers,
      totalBusinesses,
      activeBusinesses,
      inactiveBusinesses: totalBusinesses - activeBusinesses,
      totalCustomers,
      totalStaff,
      activeStaff,
      totalAppointments,
      completedAppointments,
      totalRevenue: Number(paidPaymentsAgg._sum.amount || 0),
      totalSubscriptions,
      activeSubscriptions,
    },
    periodMetrics: {
      period,
      newBusinesses: currPeriodBusinesses,
      businessesChange: calcPctChange(currPeriodBusinesses, prevPeriodBusinesses),
      newCustomers: currPeriodCustomers,
      customersChange: calcPctChange(currPeriodCustomers, prevPeriodCustomers),
      appointments: currPeriodAppointments,
      appointmentsChange: calcPctChange(currPeriodAppointments, prevPeriodAppointments),
      revenue: currRevenue,
      revenueChange: calcPctChange(currRevenue, prevRevenue),
    },
    chartData,
    businessDistribution: {
      byStatus: businessStatusGroups.map((g) => ({
        status: g.status,
        count: g._count.id,
      })),
      byType: businessTypeGroups.map((g) => ({
        type: g.businessType,
        count: g._count.id,
      })),
    },
    recentBusinesses: recentBusinesses.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      businessType: b.businessType,
      status: b.status,
      createdAt: b.createdAt,
      owner: b.owner,
      counts: b._count,
    })),
    recentAppointments: recentAppointments.map((a) => ({
      id: a.id,
      appointmentDate: a.appointmentDate,
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
      totalAmount: Number(a.totalAmount || 0),
      business: a.business,
      customer: a.customer,
      staff: a.staff,
      service: a.appointmentServices?.[0]?.service || null,
    })),
    paymentsSummary: {
      totalVolume: Number(totalPaymentsAgg._sum.amount || 0),
      totalCount: totalPaymentsAgg._count.id,
      paidVolume: Number(paidPaymentsAgg._sum.amount || 0),
      paidCount: paidPaymentsAgg._count.id,
      pendingVolume: Number(pendingPaymentsAgg._sum.amount || 0),
      pendingCount: pendingPaymentsAgg._count.id,
      failedVolume: Number(failedPaymentsAgg._sum.amount || 0),
      failedCount: failedPaymentsAgg._count.id,
      refundedVolume: Number(refundedPaymentsAgg._sum.amount || 0),
      refundedCount: refundedPaymentsAgg._count.id,
    },
    subscriptionsSummary: {
      total: totalSubscriptions,
      active: activeSubscriptions,
      byPlan: subscriptionsByPlan.map((s) => ({
        plan: s.plan,
        count: s._count.id,
      })),
    },
    recentActivity,
  };
};
