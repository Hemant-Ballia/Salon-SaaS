"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getServicesApi } from "@/lib/api/services";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Scissors, Clock, Store, Tag, ArrowRight } from "lucide-react";

export default function ServicesPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["services-catalog-all"],
    queryFn: () => getServicesApi({ limit: 60 }),
  });

  const services = (data?.data || []).filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.business?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Beauty & Grooming Services
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore treatments, hair styling, skin care, and massage services across salons.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by treatment, category, or salon..."
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load services"
          description="Failed to connect to the treatment catalog."
          onRetry={() => refetch()}
        />
      ) : services.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="No services found"
          description={
            search
              ? "No treatments match your search."
              : "No services are currently listed."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((svc) => (
            <Card key={svc.id} className="hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    <Tag className="w-3 h-3 inline mr-1 text-slate-400" />
                    {svc.category || "General"}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(svc.durationMinutes)}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{svc.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-8">
                    {svc.description || "Expert salon service delivered by qualified stylists."}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                  <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{svc.business?.name || "Salon Partner"}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-lg font-black text-emerald-700">
                    {formatCurrency(svc.price)}
                  </span>
                  <Link href={`/booking?businessId=${svc.businessId}&serviceId=${svc.id}`}>
                    <Button size="sm" className="font-bold text-xs gap-1">
                      Book Slot
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}