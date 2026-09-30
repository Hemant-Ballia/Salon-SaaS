"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getCustomersListApi } from "@/lib/api/customers";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  ChevronRight, 
  Sparkles,
  ShieldCheck
} from "lucide-react";

export default function StaffCustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["staff-customers-list", search, page],
    queryFn: () => getCustomersListApi({
      page,
      limit: 30,
      search: search || undefined,
    }),
  });

  const customers = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Customers
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Directory of salon clients, visit records, and contact information.
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search customer by name, phone number, or email..."
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load customers"
          description="Could not connect to the customer service. Please try again."
          onRetry={() => refetch()}
        />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description={
            search
              ? `No clients matched "${search}". Try searching by a different name or phone.`
              : "No customers have booked appointments with your salon yet."
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const name = c.user?.displayName || c.user?.name || "Client";
                  const email = c.user?.email || "No email";
                  const phone = c.user?.phone || "—";
                  const initials = name.slice(0, 2).toUpperCase();

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{name}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">
                        {phone}
                      </td>

                      <td className="py-3 px-4 text-slate-500 truncate max-w-[180px]">
                        {email}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          c.user?.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.user?.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {c.user?.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(c.createdAt)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link href={`/customers/${c.id}`}>
                          <Button variant="outline" size="sm" className="text-xs font-medium h-7 px-2.5 text-slate-700 hover:bg-slate-50">
                            View Profile
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Rows */}
          <div className="md:hidden divide-y divide-slate-100 rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
            {customers.map((c) => {
              const name = c.user?.displayName || c.user?.name || "Client";
              const email = c.user?.email || "No email";
              const phone = c.user?.phone || "—";
              const initials = name.slice(0, 2).toUpperCase();

              return (
                <div key={c.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-900 truncate">{name}</p>
                        {c.user?.isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px] truncate mt-0.5">{phone}</p>
                    </div>
                  </div>

                  <Link href={`/customers/${c.id}`}>
                    <Button variant="outline" size="sm" className="text-xs font-medium h-8 px-2.5 text-slate-700">
                      Profile
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} clients)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

