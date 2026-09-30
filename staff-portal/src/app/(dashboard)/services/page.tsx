"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getServicesApi } from "@/lib/api/services";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Scissors, Clock, Tag } from "lucide-react";

export default function StaffServicesPage() {
  const [search, setSearch] = useState("");

  const { data: services = [], isLoading, error, refetch } = useQuery({
    queryKey: ["staff-services-catalog"],
    queryFn: () => getServicesApi(),
  });

  const filtered = services.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Services
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Treatment catalog — durations, pricing, and active status for client bookings.
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search service name, category, or description..."
        />
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load services"
          description="Could not fetch service menu from server."
          onRetry={() => refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="No services found"
          description={
            search
              ? "No services match your search query."
              : "No services are currently configured for your business."
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Service Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((svc) => (
                  <tr key={svc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{svc.name}</p>
                      {svc.description && (
                        <p className="text-[11px] text-slate-400 truncate max-w-sm">{svc.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {svc.category || "General"}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {formatDuration(svc.durationMinutes)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(svc.price)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        svc.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${svc.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {svc.isActive ? "Active" : "Paused"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100 rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
            {filtered.map((svc) => (
              <div key={svc.id} className="p-4 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{svc.name}</p>
                    <p className="text-slate-400 text-[11px]">{svc.category || "General"}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    svc.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {svc.isActive ? "Active" : "Paused"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500">{formatDuration(svc.durationMinutes)}</span>
                  <span className="font-bold text-slate-900 text-sm">{formatCurrency(svc.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}