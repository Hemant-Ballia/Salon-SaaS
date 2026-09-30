"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { getSubscriptionsApi, getAdminDashboardApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils";
import NextLink from "next/link";
import {
  TrendingUp,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

interface SubscriptionItem {
  id: string;
  plan: "FREE" | "BASIC" | "PRO" | "PREMIUM";
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  provider?: string;
  business?: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [planFilter, setPlanFilter] = useState<string>("ALL");

  const { data: dashboardData } = useQuery({
    queryKey: ["admin", "dashboard", "7D"],
    queryFn: () => getAdminDashboardApi("7D"),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "subscriptions", { page, statusFilter, planFilter }],
    queryFn: () =>
      getSubscriptionsApi<SubscriptionItem>({
        page,
        limit: 15,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        plan: planFilter !== "ALL" ? planFilter : undefined,
      }),
  });

  const subsList: SubscriptionItem[] = data?.data || [];

  const filteredSubs = subsList.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.business?.name?.toLowerCase().includes(q) ||
      s.plan.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

  const columns: Column<SubscriptionItem>[] = [
    {
      header: "Business",
      accessorKey: "business",
      cell: (s) => (
        <div>
          <div className="font-semibold text-slate-900">
            {s.business?.name || "Independent"}
          </div>
          {s.business?.slug && (
            <div className="text-xs text-slate-400">/{s.business.slug}</div>
          )}
        </div>
      ),
    },
    {
      header: "Plan Tier",
      accessorKey: "plan",
      cell: (s) => {
        const colors: Record<string, string> = {
          FREE: "bg-slate-100 text-slate-700 border-slate-200",
          BASIC: "bg-blue-50 text-blue-700 border-blue-200",
          PRO: "bg-emerald-50 text-emerald-700 border-emerald-200",
          PREMIUM: "bg-purple-50 text-purple-700 border-purple-200",
        };
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
              colors[s.plan] || "bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            {s.plan}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (s) => <StatusBadge status={s.status} />,
    },
    {
      header: "Billing Cycle",
      cell: (s) => (
        <span className="text-xs text-slate-600">
          {s.startDate ? formatDate(s.startDate) : "-"}
        </span>
      ),
    },
    {
      header: "Renewal / Expiry",
      cell: (s) => (
        <span className="text-xs text-slate-600">
          {s.renewalDate ? formatDate(s.renewalDate) : s.endDate ? formatDate(s.endDate) : "Ongoing"}
        </span>
      ),
    },
    {
      header: "Provider",
      cell: (s) => (
        <span className="text-xs font-mono text-slate-500">
          {s.provider || "Direct / Internal"}
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (s) =>
        s.business?.id ? (
          <NextLink href={`/businesses/${s.business.id}`}>
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1">
              <Eye className="h-3.5 w-3.5" />
              Manage Business
            </Button>
          </NextLink>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        ),
    },
  ];

  return (
    <AdminLayout title="Subscription Plans & Billing">
      <div className="space-y-4 flex-1 flex flex-col min-h-0 pb-6">
        {/* KPI Cards Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Subscriptions
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {dashboardData?.subscriptionsSummary?.active ?? 0}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              Active paying & recurring tenants
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Subscriptions
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {dashboardData?.subscriptionsSummary?.total ?? 0}
            </div>
            <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
              All enrolled platform subscriptions
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pro & Premium Plans
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {(dashboardData?.subscriptionsSummary?.byPlan || [])
                .filter((p) => p.plan === "PRO" || p.plan === "PREMIUM")
                .reduce((acc, p) => acc + p.count, 0)}
            </div>
            <div className="text-[11px] text-purple-700 font-semibold mt-0.5">
              High tier business plans
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Free / Starter Plans
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {(dashboardData?.subscriptionsSummary?.byPlan || [])
                .filter((p) => p.plan === "FREE" || p.plan === "BASIC")
                .reduce((acc, p) => acc + p.count, 0)}
            </div>
            <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
              Standard tier subscriptions
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <SearchInput
            placeholder="Search business name or tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            className="w-full sm:w-80"
          />

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "All Plans" },
                { value: "FREE", label: "Free Tier" },
                { value: "BASIC", label: "Basic" },
                { value: "PRO", label: "Pro" },
                { value: "PREMIUM", label: "Premium" },
              ]}
              className="w-36"
            />

            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "TRIAL", label: "Trial" },
                { value: "PAST_DUE", label: "Past Due" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
              className="w-36"
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredSubs}
          isLoading={isLoading}
          emptyTitle="No subscriptions found"
          emptyDescription="No subscription records match your current criteria."
          pagination={{
            page,
            totalPages: data?.meta?.totalPages || 1,
            totalCount: data?.meta?.total || filteredSubs.length,
            onPageChange: (newPage) => setPage(newPage),
          }}
        />
      </div>
    </AdminLayout>
  );
}
