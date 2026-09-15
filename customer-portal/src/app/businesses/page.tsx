"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getBusinessesApi } from "@/lib/api/businesses";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Store, MapPin, ArrowRight } from "lucide-react";

export default function BusinessesPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["businesses-catalog"],
    queryFn: () => getBusinessesApi({ limit: 50 }),
  });

  const businesses = (data?.data || []).filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.city?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Find Beauty Salons & Spas
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore registered salons offering appointments and virtual queue check-ins.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by salon name, city, or area..."
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load salons"
          description="Failed to connect to the business directory."
          onRetry={() => refetch()}
        />
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No salons found"
          description={
            search
              ? "No salons match your search terms."
              : "No salons are currently listed in the directory."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz) => (
            <Link key={biz.id} href={`/businesses/${biz.id}`} className="block group">
              <Card className="h-full hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 font-extrabold flex items-center justify-center text-base shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      {biz.name.slice(0, 2).toUpperCase()}
                    </div>
                    <Badge variant="success">Open</Badge>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {biz.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-8">
                    {biz.description || "Premium beauty and grooming treatments provided by verified staff."}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{biz.city || biz.address || "Local Area"}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}