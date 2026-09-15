"use client";

import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BusinessLayout } from "@/components/layout/business-layout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useSocket } from "@/context/socket-context";
import { getBusinessDashboardApi } from "@/lib/api/business";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";
import {
  Calendar,
  Layers,
  CreditCard,
  Users2,
  Scissors,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import NextLink from "next/link";

export default function DashboardPage() {
  const { business } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["business", "dashboard", business?.id],
    queryFn: () => (business?.id ? getBusinessDashboardApi(business.id) : null),
    enabled: !!business?.id,
  });

  // Socket real-time invalidation
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["business", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["business", "queue"] });
    };

    socket.on("appointment:created", handleUpdate);
    socket.on("appointment:status_changed", handleUpdate);
    socket.on("queue:joined", handleUpdate);
    socket.on("queue:entry_updated", handleUpdate);
    socket.on("queue:left", handleUpdate);

    return () => {
      socket.off("appointment:created", handleUpdate);
      socket.off("appointment:status_changed", handleUpdate);
      socket.off("queue:joined", handleUpdate);
      socket.off("queue:entry_updated", handleUpdate);
      socket.off("queue:left", handleUpdate);
    };
  }, [socket, queryClient]);

  const stats = data?.stats;

  const chartData = [
    { name: "Today Appts", count: stats?.todayAppointments ?? 0 },
    { name: "Total Appts", count: stats?.totalAppointments ?? 0 },
    { name: "Active Queue", count: stats?.activeQueueCount ?? 0 },
    { name: "Active Staff", count: stats?.totalStaff ?? 0 },
    { name: "Services", count: stats?.totalServices ?? 0 },
  ];

  return (
    <BusinessLayout title="Salon Dashboard">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                {business?.businessType?.replace(/_/g, " ") || "Salon"} Operating Console
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {business?.name || "My Business"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time queue monitoring, booking operations, and daily performance
              </p>
            </div>

            <div className="flex items-center gap-2">
              <NextLink href="/queue">
                <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
                  <Layers className="h-4 w-4" />
                  Open Live Queue
                </Button>
              </NextLink>
              <NextLink href="/appointments">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Appointments
                </Button>
              </NextLink>
            </div>
          </div>
        </div>

        {/* Stats Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Appointments"
            value={isLoading ? "..." : stats?.todayAppointments ?? 0}
            icon={Calendar}
            description="Booked for today"
          />
          <StatCard
            title="Active Queue Count"
            value={isLoading ? "..." : stats?.activeQueueCount ?? 0}
            icon={Layers}
            description="Customers waiting or serving"
          />
          <StatCard
            title="Today's Revenue"
            value={isLoading ? "..." : formatCurrency(stats?.todayRevenue ?? 0)}
            icon={CreditCard}
            description="Paid appointments today"
          />
          <StatCard
            title="Active Staff Members"
            value={isLoading ? "..." : stats?.totalStaff ?? 0}
            icon={Users2}
            description="Ready for service"
          />
        </div>

        {/* Chart & Queue Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daily Operations Volume</CardTitle>
                <CardDescription>Live distribution of bookings, queue, and resources</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <TrendingUp className="h-4 w-4" />
                Live Sync Active
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9" }}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Metrics Card */}
          <Card>
            <CardHeader>
              <CardTitle>Salon Snapshot</CardTitle>
              <CardDescription>Catalogue and aggregate scale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-medium text-slate-600">Total Services Offered</span>
                <span className="text-sm font-bold text-slate-900">{stats?.totalServices ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-medium text-slate-600">Pending Appointments</span>
                <span className="text-sm font-bold text-amber-600">{stats?.pendingAppointments ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-medium text-slate-600">All-Time Bookings</span>
                <span className="text-sm font-bold text-slate-900">{stats?.totalAppointments ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-medium text-slate-600">All-Time Revenue</span>
                <span className="text-sm font-bold text-emerald-700">
                  {formatCurrency(stats?.totalRevenue ?? 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Appointments</CardTitle>
              <CardDescription>Latest bookings received for your salon</CardDescription>
            </div>
            <NextLink
              href="/appointments"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </NextLink>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 w-full animate-pulse bg-slate-100 rounded-lg" />
                ))}
              </div>
            ) : !data?.recentAppointments || data.recentAppointments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No appointments booked yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentAppointments.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between py-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-900">
                        {appt.customer?.user?.name || "Client"}
                      </span>
                      <div className="text-[11px] text-slate-500">
                        {formatDate(appt.appointmentDate)} at {appt.startTime}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-900">
                        {formatCurrency(appt.totalAmount)}
                      </span>
                      <StatusBadge status={appt.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BusinessLayout>
  );
}
