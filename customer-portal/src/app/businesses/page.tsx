"use client";

import React, { useState, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBusinessesApi } from "@/lib/api/businesses";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { BusinessCover } from "@/components/ui/business-cover";
import { 
  Store, 
  MapPin, 
  ArrowRight, 
  Star, 
  SlidersHorizontal, 
  Calendar, 
  Radio, 
  X,
  Scissors,
  Sparkles,
  UserCheck,
  Heart,
  Palette,
  Car
} from "lucide-react";

const CATEGORIES = [
  { id: "ALL", label: "All Categories", icon: Store },
  { id: "Hair", label: "Hair Salons", icon: Scissors },
  { id: "Beauty", label: "Beauty & Skin", icon: Sparkles },
  { id: "Barber", label: "Barbershops", icon: UserCheck },
  { id: "Spa", label: "Spa & Wellness", icon: Heart },
  { id: "Nails", label: "Nails & Art", icon: Palette },
  { id: "Car Care", label: "Car Care & Wash", icon: Car },
];

function BusinessesContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "ALL";
  const initialCity = searchParams.get("city") || "";

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [cityFilter, setCityFilter] = useState(initialCity);
  const [sortBy, setSortBy] = useState<"featured" | "name" | "city">("featured");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["businesses-catalog-full"],
    queryFn: () => getBusinessesApi({ limit: 100 }),
  });

  const businesses = useMemo(() => {
    let list = data?.data || [];

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.city?.toLowerCase().includes(q) ||
          b.address?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.businessType?.toLowerCase().includes(q)
      );
    }

    // Filter by city
    if (cityFilter.trim()) {
      const c = cityFilter.toLowerCase();
      list = list.filter((b) => b.city?.toLowerCase().includes(c));
    }

    // Filter by category
    if (selectedCategory !== "ALL") {
      const cat = selectedCategory.toLowerCase();
      list = list.filter(
        (b) =>
          b.businessType?.toLowerCase().includes(cat) ||
          b.description?.toLowerCase().includes(cat) ||
          b.name.toLowerCase().includes(cat)
      );
    }

    // Sort
    if (sortBy === "name") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "city") {
      return [...list].sort((a, b) => (a.city || "").localeCompare(b.city || ""));
    }

    return list;
  }, [data, search, cityFilter, selectedCategory, sortBy]);

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setCityFilter("");
    setSortBy("featured");
  };

  const hasActiveFilters = search || selectedCategory !== "ALL" || cityFilter;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
            Local Discovery
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-0.5">
            Find your next appointment
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover verified salons, spas, barbers, and local businesses near you.
          </p>
        </div>

        {/* Results Counter & Mobile Filter Button */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-2xs">
            {businesses.length} {businesses.length === 1 ? "salon" : "salons"} found
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden gap-1.5 text-xs font-bold"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters {hasActiveFilters && "•"}
          </Button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-emerald-700 text-white shadow-xs shadow-emerald-700/20"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-emerald-600"}`} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search & Location Bar */}
      <Card className="p-3 bg-white shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-6">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by salon name, specialty, or description..."
            />
          </div>

          <div className="sm:col-span-4 relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Filter by city or area..."
              className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="featured">Featured</option>
              <option value="name">Name (A-Z)</option>
              <option value="city">City</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="px-2 text-slate-400 hover:text-slate-700 shrink-0"
                title="Reset filters"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load salons"
          description="Failed to connect to the business catalog. Please check your internet connection."
          onRetry={() => refetch()}
        />
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No salons found"
          description={
            hasActiveFilters
              ? "No salons match your search criteria. Try adjusting your filters or clearing search terms."
              : "No salons are currently listed in the directory."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={resetFilters} className="mt-2 text-xs font-bold">
                Clear all filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz) => (
            <Card
              key={biz.id}
              className="overflow-hidden hover:border-emerald-400 hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                {/* Business Cover Header */}
                <BusinessCover business={biz} aspectRatio="card" />

                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {biz.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {biz.businessType || "Salon & Grooming"}
                      </p>
                    </div>
                    <Badge variant="success">Open</Badge>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 min-h-8 leading-relaxed">
                    {biz.description || "Expert salon and grooming services provided by verified stylists."}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{biz.city || biz.address || "Local area"}</span>
                  </div>
                </CardContent>
              </div>

              {/* Bottom Card Action Bar */}
              <div className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-400">
                  Appointments & Queue
                </span>
                <Link href={`/businesses/${biz.id}`}>
                  <Button size="sm" className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs cursor-pointer">
                    View Salon
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BusinessesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading directory...</div>}>
      <BusinessesContent />
    </Suspense>
  );
}