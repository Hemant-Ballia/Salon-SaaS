"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCustomersApi } from "@/lib/api/customers";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Users, Mail, Phone, Calendar } from "lucide-react";

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
    const name = c.user?.displayName || "";
    const email = c.user?.email || "";
    const phone = c.user?.phone || "";
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || phone.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Directory</h1>
        <p className="text-sm text-slate-500 mt-1">
          View your client base, contact history, and booking activity.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by customer name, email address, or phone..."
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Contact Details</th>
                  <th className="px-6 py-3.5">Total Bookings</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const name = c.user?.displayName || "Guest Customer";
                  const email = c.user?.email || "No email";
                  const phone = c.user?.phone || "No phone";
                  const appointmentsCount = c._count?.appointments ?? 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center text-sm">
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{name}</p>
                            <span className="text-xs text-slate-400">ID: {c.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{email}</span>
                          </div>
                          {phone !== "No phone" && (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {appointmentsCount} {appointmentsCount === 1 ? "booking" : "bookings"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(c.createdAt)}
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