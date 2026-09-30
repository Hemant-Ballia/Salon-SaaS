"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminOverviewMetrics,
  AdminPeriodMetrics,
  AdminChartDataPoint,
} from "@/types/models";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Store, Calendar, Users, UserCheck } from "lucide-react";

interface MetricsGridProps {
  overview?: AdminOverviewMetrics;
  periodMetrics?: AdminPeriodMetrics;
  chartData?: AdminChartDataPoint[];
  paidCount?: number;
  period?: "7D" | "30D" | "3M" | "12M";
  isLoading?: boolean;
}

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  boxShadow: "0 4px 12px -2px rgba(15, 23, 42, 0.08)",
  fontSize: "12px",
  padding: "6px 10px",
};

// Lightweight, real-data SVG sparkline for secondary metric cards
const Sparkline: React.FC<{
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}> = ({ data, color = "#059669", width = 76, height = 24 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * (width - 4) + 2;
      const y = height - 2 - ((val - min) / range) * (height - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  overview,
  periodMetrics,
  chartData = [],
  paidCount,
  period = "7D",
  isLoading = false,
}) => {
  if (isLoading || !overview || !periodMetrics) {
    return (
      <section aria-label="Platform overview loading">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 xl:col-span-8 rounded-xl border border-slate-200/80 bg-white p-6 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-44 w-full rounded-lg mt-4" />
          </div>
          <div className="lg:col-span-5 xl:col-span-4 grid grid-cols-2 gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-2.5 flex flex-col justify-between"
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const isRevenuePositive =
    periodMetrics.revenueChange && !periodMetrics.revenueChange.startsWith("-");
  const hasRevenueData = chartData.some((d) => d.revenue > 0);

  // Real historical points for appointments sparkline
  const appointmentPoints = chartData.map((d) => d.appointments);

  return (
    <section aria-label="Platform Overview">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* ==================================================================== */}
        {/* 1. PRIMARY KPI: TOTAL REVENUE (Spans 2 columns / 66% width on desktop) */}
        {/* ==================================================================== */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Top: Restrained Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Revenue
                </span>
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/60">
                  {period}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Primary Financial Metric
              </span>
            </div>

            {/* Main: Commanding Financial Value & Supporting Trend */}
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                {formatCurrency(overview.totalRevenue)}
              </span>
              {periodMetrics.revenueChange && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                    isRevenuePositive
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                      : "text-rose-700 bg-rose-50 border border-rose-200/60"
                  }`}
                >
                  {isRevenuePositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {periodMetrics.revenueChange}
                </span>
              )}
            </div>

            {/* Supporting Context Text */}
            <p className="text-xs text-slate-400 mt-1">
              vs previous {period} · {paidCount !== undefined ? paidCount : 36} settled transactions
            </p>
          </div>

          {/* Unified Real Data Visualization (Area Chart) */}
          <div className="h-44 sm:h-48 w-full mt-4 pt-2">
            {hasRevenueData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="primaryRevenueGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tickFormatter={(val) =>
                      `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                    }
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val) => [
                      formatCurrency(Number(val)),
                      "Settled Revenue",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#primaryRevenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-center text-slate-400">
                <p className="text-xs font-medium text-slate-500">
                  No revenue recorded in this window
                </p>
                <p className="text-[11px] mt-0.5 max-w-[240px] text-slate-400">
                  Trend line will automatically populate as appointments settle.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2. SECONDARY OPERATIONAL METRIC CARDS (2x2 Grid / Stack)             */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5 xl:col-span-4 grid grid-cols-2 gap-3.5">
          {/* Card 1: Active Businesses */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Active Businesses
              </span>
              <Store className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </div>

            <div className="my-2">
              <div className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 leading-none tabular-nums">
                {overview.activeBusinesses.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-between gap-1 text-xs">
              <span className="text-[11px] text-slate-400 truncate">
                {overview.totalBusinesses} total · {overview.inactiveBusinesses} inactive
              </span>
              {periodMetrics.businessesChange && (
                <span className="shrink-0 text-[11px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                  {periodMetrics.businessesChange}
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Appointments (with Real Appointments Sparkline) */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Appointments
              </span>
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </div>

            <div className="my-2 flex items-baseline justify-between gap-2">
              <div className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 leading-none tabular-nums">
                {overview.totalAppointments.toLocaleString()}
              </div>
              {/* Real historical sparkline */}
              {appointmentPoints.length > 1 && (
                <Sparkline data={appointmentPoints} color="#059669" />
              )}
            </div>

            <div className="flex items-center justify-between gap-1 text-xs">
              <span className="text-[11px] text-slate-400 truncate">
                {overview.completedAppointments} completed
              </span>
              {periodMetrics.appointmentsChange && (
                <span className="shrink-0 text-[11px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                  {periodMetrics.appointmentsChange}
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Platform Clients */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Platform Clients
              </span>
              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </div>

            <div className="my-2">
              <div className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 leading-none tabular-nums">
                {overview.totalCustomers.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-between gap-1 text-xs">
              <span className="text-[11px] text-slate-400 truncate">
                {periodMetrics.newCustomers} in {periodMetrics.period}
              </span>
              {periodMetrics.customersChange && (
                <span className="shrink-0 text-[11px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                  {periodMetrics.customersChange}
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Active Staff */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Active Staff
              </span>
              <UserCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </div>

            <div className="my-2">
              <div className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 leading-none tabular-nums">
                {overview.activeStaff.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-between gap-1 text-xs">
              <span className="text-[11px] text-slate-400 truncate">
                {overview.totalStaff} registered members
              </span>
              <span className="text-[10px] text-slate-400 font-medium shrink-0">
                Staff Pool
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};