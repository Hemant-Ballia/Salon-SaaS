"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPaymentsApi } from "@/lib/api/payments";
import { Payment } from "@/types/models";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { 
  CreditCard, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  AlertCircle 
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

  const totalAmount = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payments & Transactions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor your customer transactions, online settlements, and payment statuses.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Settled</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Successful Transactions</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {payments.filter((p) => p.status === "SUCCESS").length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-100">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Pending / Processing</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">
              {payments.filter((p) => p.status === "PENDING").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by Payment ID or Order ID..."
            />
          </div>
          <div className="w-full sm:w-48">
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
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
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
              ? "No transactions match your current search and filter settings."
              : "Completed appointment and counter payments will be listed here."
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Transaction Ref</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="font-mono text-xs font-semibold text-slate-900">
                              {p.razorpayPaymentId || p.id.slice(0, 12)}
                            </p>
                            {p.razorpayOrderId && (
                              <p className="font-mono text-xs text-slate-400 mt-0.5">
                                Order: {p.razorpayOrderId.slice(0, 14)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                        {formatCurrency(p.amount)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs uppercase font-semibold text-slate-600 px-2 py-0.5 bg-slate-100 rounded">
                          {p.method || "RAZORPAY"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={p.status} />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(p.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}