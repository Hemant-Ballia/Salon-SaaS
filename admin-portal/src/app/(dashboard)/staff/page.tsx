"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { getStaffListApi } from "@/lib/api/admin";
import { Staff } from "@/types/models";
import { formatDate } from "@/lib/utils";
import NextLink from "next/link";
import { Eye, Store } from "lucide-react";

export default function StaffPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "staff", { page }],
    queryFn: () => getStaffListApi({ page, limit: 15 }),
  });

  const filteredStaff = (data?.data ?? []).filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.displayName?.toLowerCase().includes(q) ||
      s.designation?.toLowerCase().includes(q) ||
      s.business?.name?.toLowerCase().includes(q) ||
      s.user?.email?.toLowerCase().includes(q)
    );
  });

  const columns: Column<Staff>[] = [
    {
      header: "Staff Name",
      accessorKey: "displayName",
      cell: (s) => (
        <div>
          <span className="font-semibold text-slate-900">{s.displayName}</span>
          {s.designation && <div className="text-xs text-slate-400">{s.designation}</div>}
        </div>
      ),
    },
    {
      header: "Assigned Business",
      cell: (s) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
          <Store className="h-3.5 w-3.5 text-emerald-600" />
          {s.business?.name || "Unassigned"}
        </div>
      ),
    },
    {
      header: "User Email",
      cell: (s) => <span className="text-xs text-slate-600">{s.user?.email || "-"}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (s) => <StatusBadge status={s.status} />,
    },
    {
      header: "Joined",
      accessorKey: "createdAt",
      cell: (s) => <span className="text-xs text-slate-500">{formatDate(s.createdAt)}</span>,
    },
    {
      header: "Actions",
      cell: (s) => (
        <NextLink href={`/staff/${s.id}`}>
          <Button variant="outline" size="sm" className="h-8 px-2.5">
            <Eye className="h-3.5 w-3.5 mr-1" />
            Profile
          </Button>
        </NextLink>
      ),
    },
  ];

  return (
    <AdminLayout title="Staff Directory">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <SearchInput
            placeholder="Search staff name, designation, business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            className="w-full sm:w-80"
          />
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredStaff}
          isLoading={isLoading}
          emptyTitle="No staff members found"
          emptyDescription="There are no staff profiles matching your criteria."
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
