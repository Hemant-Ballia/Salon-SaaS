"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import { RecentBusinessesTable } from "@/components/dashboard/recent-businesses-table";
import { RecentAppointmentsTable } from "@/components/dashboard/recent-appointments-table";
import { FinancialSummaryCard } from "@/components/dashboard/financial-summary-card";
import { SubscriptionDistributionCard } from "@/components/dashboard/subscription-distribution-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { getAdminDashboardApi } from "@/lib/api/admin";
import { ErrorState } from "@/components/ui/error-state";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { CreateBusinessModal } from "@/components/businesses/create-business-modal";
import { Plus, ArrowRight, RefreshCw } from "lucide-react";
import NextLink from "next/link";

const PERIODS: ("7D" | "30D" | "3M" | "12M")[] = ["7D", "30D", "3M", "12M"];

export default function DashboardPage() {
  const [period, setPeriod] = useState<"7D" | "30D" | "3M" | "12M">("7D");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin", "dashboard", period],
    queryFn: () => getAdminDashboardApi(period),
    refetchInterval: 30000, // Refresh periodically for live operational awareness
  });

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <ErrorState
          title="Could not load platform dashboard"
          message={getErrorMessage(error)}
          onRetry={() => refetch()}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-4 flex-1 flex flex-col min-h-0 pb-8">
        {/* Clean Page Introduction & Primary Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
              Platform Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Monitor multi-tenant operations, business onboarding, and platform financial settlements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Period Selector Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    period === p
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Refresh Indicator */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh Data"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/80 bg-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin text-emerald-600" : ""}`} />
            </button>

            <NextLink href="/businesses">
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 px-3 text-xs font-medium gap-1 text-slate-700 rounded-lg border-slate-200 bg-white hover:bg-slate-50 shadow-xs"
              >
                Businesses
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </Button>
            </NextLink>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-8.5 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Register Business
            </Button>
          </div>
        </div>

        {/* Master KPI Section: Dominant Total Revenue Anchor + Secondary Operational Metrics */}
        <MetricsGrid
          overview={dashboard?.overview}
          periodMetrics={dashboard?.periodMetrics}
          chartData={dashboard?.chartData}
          paidCount={dashboard?.paymentsSummary?.paidCount}
          period={period}
          isLoading={isLoading}
        />

        {/* Master Enterprise 8-col / 4-col Dual Rail Canvas */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* Left Canvas: Growth Trends, Charts, and Operational Tables (8 Cols) */}
          <div className="xl:col-span-8 space-y-4">
            {/* Side-by-side Growth Line/Area Chart & Tenant Status Donut */}
            <OverviewCharts
              chartData={dashboard?.chartData}
              distribution={dashboard?.businessDistribution}
              period={period}
              isLoading={isLoading}
            />

            {/* Operational Tables */}
            <RecentBusinessesTable
              businesses={dashboard?.recentBusinesses}
              isLoading={isLoading}
            />

            <RecentAppointmentsTable
              appointments={dashboard?.recentAppointments}
              isLoading={isLoading}
            />
          </div>

          {/* Right Rail: Settlement Status, Subscriptions & Activity (4 Cols) */}
          <div className="xl:col-span-4 space-y-4">
            {/* Financial Settlement Status */}
            <FinancialSummaryCard
              payments={dashboard?.paymentsSummary}
              isLoading={isLoading}
            />

            {/* Subscription Distribution & Category Mix */}
            <SubscriptionDistributionCard
              subscriptions={dashboard?.subscriptionsSummary}
              distribution={dashboard?.businessDistribution}
              isLoading={isLoading}
            />

            {/* Live Audit Log Feed */}
            <RecentActivity
              logs={dashboard?.recentActivity}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Add Business Modal */}
      <CreateBusinessModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </AdminLayout>
  );
}
