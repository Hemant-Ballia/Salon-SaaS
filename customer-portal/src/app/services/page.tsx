"use client";

import React, { useState, useMemo } from "react";
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
import { ServiceImage } from "@/components/ui/service-image";
import { 
  Scissors, 
  Clock, 
  Store, 
  Tag, 
  ArrowRight, 
  Sparkles, 
  Filter,
  CheckCircle2
} from "lucide-react";

const CATEGORIES = ["ALL", "Hair", "Beauty", "Barber", "Spa", "Nails", "Car Care"];

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"default" | "price-asc" | "price-desc">("default");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["services-catalog-all"],
    queryFn: () => getServicesApi({ limit: 100 }),
  });

  const services = useMemo(() => {
    let list = data?.data || [];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.business?.name?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "ALL") {
      const cat = selectedCategory.toLowerCase();
      list = list.filter(
        (s) =>
          (s.category || "").toLowerCase().includes(cat) ||
          s.name.toLowerCase().includes(cat)
      );
    }

    if (sortOrder === "price-asc") {
      return [...list].sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price-desc") {
      return [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [data, search, selectedCategory, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
            Treatments & Grooming
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-0.5">
            Beauty & Grooming Services
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Compare prices, service durations, and book directly with top stylists.
          </p>
        </div>

        <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-2xs self-start sm:self-auto">
          {services.length} treatments listed
        </span>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {cat === "ALL" ? "All Treatments" : cat}
            </button>
          );
        })}
      </div>

      {/* Search & Sort Controls */}
      <Card className="p-3 bg-white shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-8">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search treatments by name, salon, or category..."
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="default">Sort: Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
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
            search || selectedCategory !== "ALL"
              ? "No treatments match your search criteria. Try selecting another category or clearing search terms."
              : "No services are currently listed."
          }
          action={
            search || selectedCategory !== "ALL" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("ALL");
                }}
                className="mt-2 text-xs font-bold"
              >
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between group p-4 sm:p-5 space-y-4"
            >
              <div className="flex gap-3.5 items-start">
                <ServiceImage service={svc} size="md" />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/60">
                      {svc.category || "Treatment"}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(svc.durationMinutes)}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {svc.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {svc.description || "Expert salon service delivered by qualified stylists."}
                  </p>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-0.5">
                    <Store className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{svc.business?.name || "Verified Salon"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-lg sm:text-xl font-black text-emerald-700">
                  {formatCurrency(svc.price)}
                </span>
                <Link href={`/booking?businessId=${svc.businessId}&serviceId=${svc.id}`}>
                  <Button size="sm" className="font-bold text-xs gap-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs px-4 cursor-pointer">
                    Book Slot
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}