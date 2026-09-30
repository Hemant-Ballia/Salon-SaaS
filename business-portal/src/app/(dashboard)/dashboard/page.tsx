"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { useSocket } from "@/context/socket-context";
import { getBusinessDashboardApi } from "@/lib/api/business";
import { getBusinessTheme } from "@/config/business-theme";

import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardKpis } from "@/components/dashboard/dashboard-kpis";
import { CompensationKpis } from "@/components/dashboard/compensation-kpis";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { StatusDonutChart } from "@/components/dashboard/status-donut-chart";
import { RecentAppointmentsTable } from "@/components/dashboard/recent-appointments-table";
import { TopServicesCard } from "@/components/dashboard/top-services-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { QrWidget } from "@/components/dashboard/qr-widget";
import { LiveQueueWidget } from "@/components/dashboard/live-queue-widget";
import { BottomStatsRow } from "@/components/dashboard/bottom-stats-row";

export default function DashboardPage() {
  const { business, user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<"7D" | "30D" | "3M">("7D");

  const theme = getBusinessTheme(business?.businessType);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["business", "dashboard", business?.id, period],
    queryFn: () => (business?.id ? getBusinessDashboardApi(business.id, period) : null),
    enabled: !!business?.id,
    staleTime: 30 * 1000,
  });

  // Real-time Socket.IO live synchronisation
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["business", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["business", "queue"] });
    };

    socket.on("appointment:created", handleUpdate);
    socket.on("appointment:updated", handleUpdate);
    socket.on("appointment:cancelled", handleUpdate);
    socket.on("appointment:status_changed", handleUpdate);
    socket.on("queue:joined", handleUpdate);
    socket.on("queue:entry_updated", handleUpdate);
    socket.on("queue:updated", handleUpdate);
    socket.on("queue:left", handleUpdate);
    socket.on("payment:success", handleUpdate);
    socket.on("notification:received", handleUpdate);

    return () => {
      socket.off("appointment:created", handleUpdate);
      socket.off("appointment:updated", handleUpdate);
      socket.off("appointment:cancelled", handleUpdate);
      socket.off("appointment:status_changed", handleUpdate);
      socket.off("queue:joined", handleUpdate);
      socket.off("queue:entry_updated", handleUpdate);
      socket.off("queue:updated", handleUpdate);
      socket.off("queue:left", handleUpdate);
      socket.off("payment:success", handleUpdate);
      socket.off("notification:received", handleUpdate);
    };
  }, [socket, queryClient]);

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
        <h3 className="font-bold text-base">Unable to load dashboard data</h3>
        <p className="text-xs text-rose-600 mt-1">
          An error occurred while communicating with the business server.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-3 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Hero Greeting Section */}
      <DashboardHero
        userName={user?.name}
        businessName={business?.name}
        theme={theme}
      />

      {/* 2. Top KPI Cards Matrix */}
      <DashboardKpis
        stats={data?.stats}
        theme={theme}
        isLoading={isLoading}
      />

      {/* Real-time DB Staff Compensation & Payroll Summary */}
      <CompensationKpis businessId={business?.id} />

      {/* 3. Main Operational Grid: Left & Center (8 cols) + Right Contextual (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left & Center Main Stream (8 cols) */}
        <div className="xl:col-span-8 space-y-5">
          {/* Row A: Overview Chart (7 cols) + Donut Breakdown (5 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            <div className="md:col-span-7">
              <OverviewChart
                data={data?.chartData || []}
                period={period}
                onPeriodChange={setPeriod}
                theme={theme}
                isLoading={isLoading}
              />
            </div>

            <div className="md:col-span-5">
              <StatusDonutChart
                theme={theme}
                statusBreakdown={data?.statusBreakdown || []}
                servicePopularity={data?.servicePopularity || []}
                totalCount={
                  theme.donut.mode === "status"
                    ? data?.stats?.todayAppointments ?? 0
                    : data?.stats?.totalAppointments ?? 0
                }
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Row B: Recent Appointments Table (7 cols) + Top Services (5 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            <div className="md:col-span-7">
              <RecentAppointmentsTable
                appointments={data?.recentAppointments || []}
                theme={theme}
                isLoading={isLoading}
              />
            </div>

            <div className="md:col-span-5">
              <TopServicesCard
                services={data?.topServices || []}
                theme={theme}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Right Side Column (4 cols) */}
        <div className="xl:col-span-4 space-y-5">
          {/* Live Operational Queue Widget (Prompt Section 14) */}
          <LiveQueueWidget
            businessId={business?.id}
            theme={theme}
            fallbackCount={data?.stats?.activeQueueCount}
          />

          {/* QR Widget (rendered when theme or business has QR code enabled) */}
          {theme.hasQrWidget && (
            <QrWidget
              businessId={business?.id}
              businessName={business?.name}
              categoryLabel={theme.categoryLabel}
              token={data?.qrCode?.token}
              qrImageUrl={data?.qrCode?.qrImageUrl}
              targetUrl={data?.qrCode?.targetUrl}
              isLoading={isLoading}
            />
          )}

          {/* Quick Actions Card */}
          <QuickActions theme={theme} />

          {/* Recent Activity Card */}
          <RecentActivityCard
            activities={data?.recentActivity || []}
            theme={theme}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 4. Bottom Lifetime Statistics Banner */}
      {theme.hasBottomStats && (
        <BottomStatsRow
          totalCustomers={data?.stats?.totalCustomers || 0}
          totalBookings={data?.stats?.totalAppointments || 0}
          activeStaff={data?.stats?.activeStaff || 0}
          totalRevenue={data?.stats?.totalRevenue || 0}
          hasSubscriptionBanner={true}
        />
      )}
    </div>
  );
}
