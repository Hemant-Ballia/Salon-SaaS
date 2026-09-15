"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { getCustomersApi } from "@/lib/api/admin";
import { Customer } from "@/types/models";
import { formatDate } from "@/lib/utils";
import NextLink from "next/link";
import { Eye } from "lucide-react";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers", { page }],
    queryFn: () => getCustomersApi({ page, limit: 15 }),
  });

  const filteredCustomers = (data?.data ?? []).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.user?.name?.toLowerCase().includes(q) ||
      c.user?.email?.toLowerCase().includes(q) ||
      c.user?.phone?.toLowerCase().includes(q)
    );
  });

  const columns: Column<Customer>[] = [
    {
      header: "Customer Name",
      cell: (c) => (
        <span className="font-semibold text-slate-900">{c.user?.name || "Customer"}</span>
      ),
    },
    {
      header: "Email Address",
      cell: (c) => <span className="text-xs text-slate-600">{c.user?.email || "-"}</span>,
    },
    {
      header: "Phone Number",
      cell: (c) => <span className="text-xs text-slate-600">{c.user?.phone || "-"}</span>,
    },
    {
      header: "Registered",
      accessorKey: "createdAt",
      cell: (c) => <span className="text-xs text-slate-500">{formatDate(c.createdAt)}</span>,
    },
    {
      header: "Actions",
      cell: (c) => (
        <NextLink href={`/customers/${c.id}`}>
          <Button variant="outline" size="sm" className="h-8 px-2.5">
            <Eye className="h-3.5 w-3.5 mr-1" />
            Profile
          </Button>
        </NextLink>
      ),
    },
  ];

  return (
    <AdminLayout title="Customers Directory">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <SearchInput
            placeholder="Search customer name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            className="w-full sm:w-80"
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredCustomers}
          isLoading={isLoading}
          emptyTitle="No customers found"
          emptyDescription="There are no customer accounts registered yet."
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
