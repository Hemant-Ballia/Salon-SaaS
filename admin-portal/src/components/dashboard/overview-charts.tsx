"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminChartDataPoint, AdminBusinessDistribution } from "@/types/models";
import { formatCurrency } from "@/lib/utils";

interface OverviewChartsProps {
  chartData?: AdminChartDataPoint[];
  distribution?: AdminBusinessDistribution;
  period?: string;
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

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#059669",
  PENDING: "#f59e0b",
  SUSPENDED: "#ef4444",
  REJECTED: "#94a3b8",
  INACTIVE: "#cbd5e1",
};

export const OverviewCharts: React.FC<OverviewChartsProps> = ({
  chartData = [],
  distribution,
  period = "7D",
  isLoading = false,
}) => {
  const [metricType, setMetricType] = useState<"appointments" | "revenue">("appointments");

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="lg:col-span-7 rounded-xl border border-slate-200/80 bg-white p-5 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-7 w-32" />
          </div>
          <Skeleton className="h-52 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-5 rounded-xl border border-slate-200/80 bg-white p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-52 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const hasChartData = chartData.some((d) =>
    metricType === "appointments" ? d.appointments > 0 : d.revenue > 0
  );

  // Business Status Data
  const statusData = (distribution?.byStatus || []).map((s) => ({
    name: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || "#059669",
  }));
  const totalBusinessesInStatus = statusData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
      {/* Platform Growth Chart */}
      <div className="lg:col-span-7 rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Platform Growth</h2>
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/60">
                {period}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {metricType === "appointments" ? "Appointment bookings" : "Settled revenue volume"} over the selected period
            </p>
          </div>

          {/* Metric Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setMetricType("appointments")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                metricType === "appointments"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Bookings
            </button>
            <button
              onClick={() => setMetricType("revenue")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                metricType === "revenue"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Revenue
            </button>
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-52 sm:h-56 w-full pt-2">
          {hasChartData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
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
                    metricType === "revenue"
                      ? `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                      : val
                  }
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val) => [
                    metricType === "revenue" ? formatCurrency(Number(val)) : `${val} bookings`,
                    metricType === "revenue" ? "Revenue" : "Appointments",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey={metricType}
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#growthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-center text-slate-400">
              <p className="text-xs font-medium text-slate-500">No {metricType} recorded in this window</p>
              <p className="text-[11px] mt-0.5 max-w-[240px] text-slate-400">
                Data will populate as customer bookings and payments occur.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tenant Status Donut Card */}
      <div className="lg:col-span-5 rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Tenant Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">Platform business activation state</p>
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
            {totalBusinessesInStatus} Total
          </span>
        </div>

        {/* Donut & Status Overview */}
        <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-4 flex-1">
          <div className="h-32 w-32 shrink-0 relative flex items-center justify-center">
            {totalBusinessesInStatus > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={54}
                      paddingAngle={statusData.filter((d) => d.value > 0).length > 1 ? 3 : 0}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold text-slate-900 leading-none">
                    {totalBusinessesInStatus}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">Tenants</span>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400">No data</div>
            )}
          </div>

          <div className="w-full sm:w-auto flex-1 space-y-2 min-w-0 max-w-[180px]">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium truncate capitalize">
                    {item.name.toLowerCase()}
                  </span>
                </div>
                <span className="font-bold text-slate-900 ml-2">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Active rate: {totalBusinessesInStatus > 0 ? Math.round(((statusData.find(s => s.name === "ACTIVE")?.value || 0) / totalBusinessesInStatus) * 100) : 100}%</span>
          <span className="text-emerald-600 font-medium">Healthy State</span>
        </div>
      </div>
    </div>
  );
};