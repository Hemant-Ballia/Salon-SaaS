"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPaymentsApi } from "@/lib/api/admin";
import { Payment } from "@/types/models";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payments", { page, statusFilter }],
    queryFn: () =>
      getPaymentsApi({
        page,
        limit: 15,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
  });

  const filtered = (data?.data ?? []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      (p.razorpayOrderId && p.razorpayOrderId.toLowerCase().includes(q)) ||
      (p.razorpayPaymentId && p.razorpayPaymentId.toLowerCase().includes(q)) ||
      p.businessId.toLowerCase().includes(q)
    );
  });

  const columns: Column<Payment>[] = [
    {
      header: "Payment ID",
      accessorKey: "id",
      cell: (p) => <span className="font-mono text-xs text-slate-700">{p.id.slice(0, 8)}...</span>,
    },
    {
      header: "Razorpay Order ID",
      accessorKey: "razorpayOrderId",
      cell: (p) => (
        <span className="font-mono text-xs text-slate-500">
          {p.razorpayOrderId || "-"}
        </span>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (p) => (
        <span className="font-semibold text-slate-900 text-xs">
          {formatCurrency(p.amount)}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (p) => <StatusBadge status={p.status} />,
    },
    {
      header: "Payment Method",
      accessorKey: "method",
      cell: (p) => (
        <span className="text-xs text-slate-600 uppercase font-medium">
          {p.method || "ONLINE"}
        </span>
      ),
    },
    {
      header: "Timestamp",
      accessorKey: "createdAt",
      cell: (p) => <span className="text-xs text-slate-400">{formatDateTime(p.createdAt)}</span>,
    },
  ];

  return (
    <AdminLayout title="Platform Payments">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <SearchInput
            placeholder="Search payment ID or Razorpay order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            className="w-full sm:w-80"
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "ALL", label: "All Statuses" },
              { value: "PAID", label: "Paid" },
              { value: "CREATED", label: "Created" },
              { value: "PENDING", label: "Pending" },
              { value: "FAILED", label: "Failed" },
              { value: "REFUNDED", label: "Refunded" },
            ]}
          />
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          emptyTitle="No payments found"
          emptyDescription="There are no transaction records matching the specified criteria."
          pagination={{
            page,
            totalPages: data?.meta?.totalPages ?? 1,
            totalCount: data?.meta?.total,
            limit: data?.meta?.limit ?? 15,
            onPageChange: (p) => setPage(p),
          }}
        />
      </div>
    </AdminLayout>
  );
}
