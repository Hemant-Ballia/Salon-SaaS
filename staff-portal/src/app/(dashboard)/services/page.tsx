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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Services Catalog
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore treatments, duration, and prices available for your clients.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search service name, category, or description..."
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((svc) => (
            <Card key={svc.id} className="hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    <Tag className="w-3 h-3 text-slate-400" />
                    {svc.category || "General"}
                  </span>
                  <Badge variant={svc.isActive ? "success" : "neutral"}>
                    {svc.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base line-clamp-1 mb-1">
                  {svc.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 min-h-8 mb-4">
                  {svc.description || "Specialist treatment provided at salon."}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDuration(svc.durationMinutes)}
                  </div>
                  <div className="text-base font-black text-emerald-700">
                    {formatCurrency(svc.price)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}