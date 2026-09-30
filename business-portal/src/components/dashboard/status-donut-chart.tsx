"use client";

import React from "react";
import { BusinessThemeConfig } from "@/config/business-theme";
import { StatusBreakdownItem, ServicePopularityItem } from "@/types/models";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface StatusDonutChartProps {
  theme: BusinessThemeConfig;
  statusBreakdown?: StatusBreakdownItem[];
  servicePopularity?: ServicePopularityItem[];
  totalCount?: number;
  isLoading?: boolean;
}

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  theme,
  statusBreakdown = [],
  servicePopularity = [],
  totalCount = 0,
  isLoading = false,
}) => {
  const isStatusMode = theme.donut.mode === "status";

  // Data selection
  const rawData = isStatusMode ? statusBreakdown : servicePopularity;

  // Filter out 0 counts if there are items, otherwise show empty slice
  const chartData =
    rawData.length > 0
      ? rawData.filter((d) => d.count > 0 || d.percentage > 0)
      : [{ name: "No data", count: 1, percentage: 100, color: "#e2e8f0" }];

  const totalDisplay =
    totalCount > 0
      ? totalCount
      : chartData.reduce((acc, curr) => acc + (curr.count || 0), 0);

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-xs flex flex-col justify-between h-full overflow-hidden">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          {theme.donut.title}
        </h2>
      </div>

      {isLoading ? (
        <div className="h-56 w-full flex items-center justify-center animate-pulse bg-slate-50 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Loading breakdown...</span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 xl:gap-4 my-auto pt-2">
          {/* Donut Chart with Centered Metric */}
          <div className="relative h-32 w-32 shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={36}
                  outerRadius={50}
                  paddingAngle={3}
                  dataKey={isStatusMode ? "count" : "percentage"}
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[8.5px] uppercase font-semibold text-slate-400 tracking-wider">
                {isStatusMode ? "Total" : "Total Bookings"}
              </span>
              <span className="text-lg font-bold text-slate-900 leading-tight">
                {totalDisplay}
              </span>
              {theme.donut.centerSubtitle && isStatusMode && (
                <span className="text-[8.5px] text-slate-400 font-medium">
                  {theme.donut.centerSubtitle}
                </span>
              )}
            </div>
          </div>

          {/* Right-Side Legend with exact labels & percentages */}
          <div className="flex-1 min-w-0 space-y-1.5 w-full pl-1">
            {rawData.map((item, idx) => {
              const label = "label" in item ? item.label : item.name;
              const countVal = item.count ?? 0;
              const pctVal = item.percentage ?? 0;

              return (
                <div key={idx} className="flex items-center justify-between text-[11px] gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-slate-700 truncate">{label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-right">
                    {isStatusMode && (
                      <span className="font-semibold text-slate-900 min-w-3 text-right">{countVal}</span>
                    )}
                    <span className="font-medium text-slate-400 min-w-6 text-right">
                      {pctVal}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
