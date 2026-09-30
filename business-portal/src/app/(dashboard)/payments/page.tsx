"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPaymentsApi } from "@/lib/api/payments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { 
  CreditCard, 
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["payments", statusFilter, page],
    queryFn: () => getPaymentsApi({
      page,
      limit: 30,
      status: statusFilter === "ALL" ? undefined : statusFilter,
    }),
  });

  const payments = (data?.data || []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const orderId = p.razorpayOrderId || "";
    const pId = p.id || "";
    return orderId.toLowerCase().includes(q) || pId.toLowerCase().includes(q);
  });

  const successPayments = payments.filter((p) => p.status === "SUCCESS");
  const pendingPayments = payments.filter((p) => p.status === "PENDING");
  const failedPayments = payments.filter((p) => p.status === "FAILED");
  const totalAmount = successPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const summaryCards = [
    {
      label: "Total Settled",
      value: formatCurrency(totalAmount),
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      valueColor: "text-emerald-900",
      border: "border-emerald-100",
      bg: "bg-emerald-50/40",
    },
    {
      label: "Successful",
      value: successPayments.length.toString(),
      icon: CheckCircle2,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      valueColor: "text-slate-900",
      border: "border-slate-100",
      bg: "bg-white",
    },
    {
      label: "Pending",
      value: pendingPayments.length.toString(),
      icon: Clock,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      valueColor: "text-slate-900",
      border: "border-amber-100",
      bg: "bg-amber-50/30",
    },
    {
      label: "Failed",
      value: failedPayments.length.toString(),
      icon: AlertCircle,
      iconColor: "text-rose-600",
      iconBg: "bg-rose-50",
      valueColor: "text-slate-900",
      border: "border-rose-100",
      bg: "bg-rose-50/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payments & Transactions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor customer transactions, online settlements, and payment statuses.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-xl border p-4 ${card.border} ${card.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
                <div className={`h-7 w-7 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-20 rounded" />
              ) : (
                <p className={`text-xl font-bold ${card.valueColor}`}>{card.value}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by Payment ID or Order ID..."
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "ALL", label: "All Statuses" },
              { value: "SUCCESS", label: "Success" },
              { value: "PENDING", label: "Pending" },
              { value: "FAILED", label: "Failed" },
              { value: "REFUNDED", label: "Refunded" },
            ]}
          />
        </div>
      </div>

      {/* Transaction Table */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load payments"
          description="Could not connect to payment records."
          onRetry={() => refetch()}
        />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments recorded"
          description={
            search || statusFilter !== "ALL"
              ? "No transactions match your current filters."
              : "Completed appointment and counter payments will be listed here."
          }
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                    Method
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-mono text-xs font-semibold text-slate-900">
                            {p.razorpayPaymentId || p.id.slice(0, 14)}
                          </p>
                          {p.razorpayOrderId && (
                            <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                              {p.razorpayOrderId.slice(0, 16)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900">
                        {formatCurrency(p.amount)}
                      </span>
                    </td>

                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 uppercase">
                        {p.method || "ONLINE"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={p.status} />
                    </td>

                    <td className="px-5 py-4 hidden md:table-cell text-xs text-slate-400">
                      {formatDate(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing {payments.length} transaction{payments.length !== 1 ? "s" : ""}
            </p>
            {payments.length >= 30 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-slate-600">Page {page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={payments.length < 30}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}