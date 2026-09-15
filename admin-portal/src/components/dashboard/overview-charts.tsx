"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DashboardMetrics } from "@/types/models";

interface OverviewChartsProps {
  metrics: DashboardMetrics | undefined;
  staffCount?: number;
  customersCount?: number;
}

export const OverviewCharts: React.FC<OverviewChartsProps> = ({
  metrics,
  staffCount = 0,
  customersCount = 0,
}) => {
  const barData = [
    { name: "Users", count: metrics?.users ?? 0 },
    { name: "Businesses", count: metrics?.businesses ?? 0 },
    { name: "Staff", count: staffCount },
    { name: "Customers", count: customersCount },
    { name: "Appointments", count: metrics?.appointments ?? 0 },
  ];

  const pieData = [
    { name: "Businesses", value: metrics?.businesses ?? 0, color: "#059669" }, // emerald-600
    { name: "Staff", value: staffCount, color: "#10b981" }, // emerald-500
    { name: "Customers", value: customersCount, color: "#34d399" }, // emerald-400
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Platform Scale Bar Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Platform Scale Overview</CardTitle>
          <CardDescription>Live counts across all entities in the database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Breakdown Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Demographics</CardTitle>
          <CardDescription>Composition of tenant users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-medium">
                  {item.name}: <span className="text-slate-900">{item.value}</span>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
