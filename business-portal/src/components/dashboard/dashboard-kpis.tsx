"use client";

import React from "react";
import { BusinessThemeConfig } from "@/config/business-theme";
import { BusinessDashboardStats } from "@/types/models";
import {
  Calendar,
  CreditCard,
  Users,
  UserCheck,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardKpisProps {
  stats?: BusinessDashboardStats;
  theme: BusinessThemeConfig;
  isLoading?: boolean;
}

export const DashboardKpis: React.FC<DashboardKpisProps> = ({
  stats,
  theme,
  isLoading = false,
}) => {
  const isSalon = theme.themeKey === "salon";

  const primaryKpis = [
    {
      label: "Today's Revenue",
      value: formatCurrency(stats?.todayRevenue ?? 0),
      trend: stats?.todayRevenueChange,
      icon: CreditCard,
      iconBg: isSalon
        ? "bg-rose-50 text-rose-600 border border-rose-100"
        : "bg-blue-50 text-blue-600 border border-blue-100",
    },
    {
      label: "Appointments Today",
      value: String(stats?.todayAppointments ?? 0),
      trend: stats?.todayBookingsChange,
      icon: Calendar,
      iconBg: isSalon
        ? "bg-amber-50 text-amber-600 border border-amber-100"
        : "bg-cyan-50 text-cyan-600 border border-cyan-100",
    },
    {
      label: "Total Customers",
      value: String(stats?.totalCustomers ?? stats?.activeCustomers ?? 0),
      trend: null,
      icon: Users,
      iconBg: isSalon
        ? "bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100"
        : "bg-indigo-50 text-indigo-600 border border-indigo-100",
    },
    {
      label: "Active Staff",
      value: String(stats?.activeStaff ?? stats?.totalStaff ?? 0),
      trend: null,
      icon: UserCheck,
      iconBg: isSalon
        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
        : "bg-sky-50 text-sky-600 border border-sky-100",
    },
  ];

  const secondaryStats = [
    {
      label: "Completed",
      value: stats?.servicesCompleted ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-700 bg-emerald-50 border-emerald-100",
    },
    {
      label: "Pending",
      value: stats?.pendingAppointments ?? 0,
      icon: Clock,
      color: "text-amber-700 bg-amber-50 border-amber-100",
    },
    {
      label: "Queue Waiting",
      value: stats?.activeQueueCount ?? 0,
      icon: Layers,
      color: "text-blue-700 bg-blue-50 border-blue-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-28 rounded-2xl bg-white border border-slate-100 p-4 shadow-xs animate-pulse flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-100" />
                <div className="h-4 w-24 rounded bg-slate-100" />
              </div>
              <div className="h-7 w-20 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 1. Primary Metrics (High visual prominence) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {primaryKpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          const isPositiveTrend = kpi.trend && !kpi.trend.startsWith("-");

          return (
            <div
              key={idx}
              className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                  {kpi.label}
                </span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-2xs ${kpi.iconBg}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {kpi.value}
                </span>

                {kpi.trend && (
                  <div
                    className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-md ${
                      isPositiveTrend
                        ? "text-emerald-700 bg-emerald-50"
                        : "text-rose-700 bg-rose-50"
                    }`}
                  >
                    {isPositiveTrend ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{kpi.trend}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Secondary Operational Indicators (Quieter, compact) */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
          Today&apos;s Status:
        </span>
        {secondaryStats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${item.color}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}:</span>
              <span className="font-extrabold">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
