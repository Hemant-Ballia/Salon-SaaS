"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAppointmentsApi } from "@/lib/api/admin";
import { Appointment } from "@/types/models";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AppointmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "appointments", { page, statusFilter }],
    queryFn: () =>
      getAppointmentsApi({
        page,
        limit: 15,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
  });

  const filtered = (data?.data ?? []).filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.id.toLowerCase().includes(q) ||
      a.businessId.toLowerCase().includes(q) ||
      a.customerId.toLowerCase().includes(q) ||
      (a.notes && a.notes.toLowerCase().includes(q))
    );
  });

  const columns: Column<Appointment>[] = [
    {
      header: "Appointment ID",
      accessorKey: "id",
      cell: (a) => <span className="font-mono text-xs text-slate-700">{a.id.slice(0, 8)}...</span>,
    },
    {
      header: "Date & Time",
      cell: (a) => (
        <div>
          <div className="text-xs font-semibold text-slate-900">{formatDate(a.appointmentDate)}</div>
          <div className="text-[11px] text-slate-500">
            {a.startTime} - {a.endTime}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (a) => <StatusBadge status={a.status} />,
    },
    {
      header: "Total Amount",
      accessorKey: "totalAmount",
      cell: (a) => (
        <span className="font-semibold text-slate-900 text-xs">
          {formatCurrency(a.totalAmount)}
        </span>
      ),
    },
    {
      header: "Business Tenant ID",
      accessorKey: "businessId",
      cell: (a) => <span className="font-mono text-xs text-slate-500">{a.businessId.slice(0, 8)}...</span>,
    },
    {
      header: "Booked On",
      accessorKey: "createdAt",
      cell: (a) => <span className="text-xs text-slate-400">{formatDate(a.createdAt)}</span>,
    },
  ];

  return (
    <AdminLayout title="Appointments Ledger">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <SearchInput
            placeholder="Search appointment or tenant ID..."
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
              { value: "PENDING", label: "Pending" },
              { value: "CONFIRMED", label: "Confirmed" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
              { value: "RESCHEDULED", label: "Rescheduled" },
              { value: "NO_SHOW", label: "No Show" },
            ]}
          />
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          emptyTitle="No appointments found"
          emptyDescription="There are no appointment records matching the specified filters."
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
