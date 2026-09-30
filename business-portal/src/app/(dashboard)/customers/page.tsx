"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getCustomersApi } from "@/lib/api/customers";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Users, Mail, Phone, Calendar, ArrowRight, UserPlus } from "lucide-react";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["customers", page],
    queryFn: () => getCustomersApi({ page, limit: 30 }),
  });

  const customers = (data?.data || []).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = c.user?.displayName || c.user?.name || "";
    const email = c.user?.email || "";
    const phone = c.user?.phone || "";
    return (
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lightweight client directory: contact details, visit history, and bookings.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <Card className="border-slate-200/80">
        <CardContent className="p-3.5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search customer by name, email, or phone number..."
          />
        </CardContent>
      </Card>

      {/* CRM Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load customers"
          description="Could not fetch customer directory."
          onRetry={() => refetch()}
        />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description={
            search
              ? "No clients match your search query."
              : "Customers who book appointments or join your queue will appear here."
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Total Visits</th>
                  <th className="px-5 py-3.5">Member Since</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const name = c.user?.displayName || c.user?.name || "Guest Customer";
                  const email = c.user?.email || "—";
                  const phone = c.user?.phone || "—";
                  const appointmentsCount = c._count?.appointments ?? 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/75 transition-colors">
                      {/* Customer Name */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs shrink-0">
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {c.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 font-mono">
                          {phone !== "—" && <Phone className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{phone}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          {email !== "—" && <Mail className="w-3.5 h-3.5 text-slate-400" />}
                          <span className="truncate max-w-[200px]">{email}</span>
                        </div>
                      </td>

                      {/* Total Visits */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {appointmentsCount} {appointmentsCount === 1 ? "visit" : "visits"}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                        {formatDate(c.createdAt)}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <Link href={`/appointments?customer=${c.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-slate-600 hover:text-slate-900 h-7.5 px-2.5">
                            View Bookings
                            <ArrowRight className="w-3 h-3 ml-1" />
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
          <div className="sm:hidden divide-y divide-slate-100">
            {customers.map((c) => {
              const name = c.user?.displayName || c.user?.name || "Guest Customer";
              const email = c.user?.email || "";
              const phone = c.user?.phone || "";
              const appointmentsCount = c._count?.appointments ?? 0;

              return (
                <div key={c.id} className="p-4 space-y-2 hover:bg-slate-50/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs">
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{phone || email}</p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {appointmentsCount} visits
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}