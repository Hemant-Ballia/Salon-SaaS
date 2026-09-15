"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
  getDashboardMetrics,
  getStaffListApi,
  getCustomersApi,
  getAuditLogsApi,
} from "@/lib/api/admin";
import { ErrorState } from "@/components/ui/error-state";
import { getErrorMessage } from "@/lib/api/client";

export default function DashboardPage() {
  const {
    data: metrics,
    
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getDashboardMetrics,
  });

  const { data: staffData } = useQuery({
    queryKey: ["admin", "staff-count"],
    queryFn: () => getStaffListApi({ limit: 1 }),
  });

  const { data: customerData } = useQuery({
    queryKey: ["admin", "customer-count"],
    queryFn: () => getCustomersApi({ limit: 1 }),
  });

  const { data: auditData, isLoading: isAuditLoading } = useQuery({
    queryKey: ["admin", "recent-activity"],
    queryFn: () => getAuditLogsApi({ limit: 5 }),
  });

  if (metricsError) {
    return (
      <AdminLayout title="Dashboard">
        <ErrorState
          title="Could not load dashboard metrics"
          message={getErrorMessage(metricsError)}
          onRetry={() => refetchMetrics()}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Platform Dashboard">
      <div className="space-y-6">
        {/* Metric Cards */}
        <MetricsGrid
          metrics={metrics}
          staffCount={staffData?.meta?.total}
          customersCount={customerData?.meta?.total}
        />

        {/* Recharts Graphical Overview */}
        <OverviewCharts
          metrics={metrics}
          staffCount={staffData?.meta?.total}
          customersCount={customerData?.meta?.total}
        />

        {/* Real-time Audit Activity */}
        <RecentActivity logs={auditData?.data} isLoading={isAuditLoading} />
      </div>
    </AdminLayout>
  );
}
