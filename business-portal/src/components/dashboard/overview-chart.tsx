"use client";

import React from "react";
import { BusinessThemeConfig } from "@/config/business-theme";
import { ChartDataPoint } from "@/types/models";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface OverviewChartProps {
  data: ChartDataPoint[];
  period: "7D" | "30D" | "3M";
  onPeriodChange: (period: "7D" | "30D" | "3M") => void;
  theme: BusinessThemeConfig;
  isLoading?: boolean;
}

export const OverviewChart: React.FC<OverviewChartProps> = ({
  data,
  period,
  onPeriodChange,
  theme,
  isLoading = false,
}) => {
  const isRevenue = theme.chart.metricKey === "revenue";
  const dataKey = isRevenue ? "revenue" : "bookings";

  const formatYAxis = (val: number) => {
    if (val === 0) return "0";
    if (isRevenue) {
      if (val >= 1000) return `${Math.round(val / 1000)}K`;
      return `${val}`;
    }
    return `${val}`;
  };

  const periodSubtitle =
    period === "7D" ? "Last 7 days" : period === "30D" ? "Last 30 days" : "Last 3 months";

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {theme.chart.title}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{periodSubtitle}</p>
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100/80 p-0.5 self-start sm:self-auto border border-slate-200/50">
          {(["7D", "30D", "3M"] as const).map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {isLoading ? (
          <div className="h-full w-full rounded-xl bg-slate-50 animate-pulse flex items-center justify-center">
            <span className="text-xs text-slate-400 font-medium">Loading overview data...</span>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
            No booking activity recorded for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${theme.themeKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.chart.accentColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={theme.chart.accentColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
              />

              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
                allowDecimals={false}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0].value as number;
                    return (
                      <div className="rounded-lg bg-slate-900 px-3 py-2 text-white shadow-lg text-xs">
                        <div className="font-bold text-sm">
                          {isRevenue ? formatCurrency(value) : `${value} Bookings`}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">{label}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={theme.chart.accentColor}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#gradient-${theme.themeKey})`}
                dot={{
                  r: 3,
                  fill: theme.chart.accentColor,
                  strokeWidth: 2,
                  stroke: "#ffffff",
                }}
                activeDot={{
                  r: 5,
                  fill: theme.chart.accentColor,
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
