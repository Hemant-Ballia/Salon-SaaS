"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBusinessByIdApi, getBusinessServicesApi } from "@/lib/api/businesses";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { BusinessCover } from "@/components/ui/business-cover";
import { ServiceImage } from "@/components/ui/service-image";
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Scissors, 
  Clock, 
  Calendar, 
  Radio, 
  ArrowLeft,
  Star,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Info
} from "lucide-react";

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const { data: business, isLoading: bizLoading, error: bizError } = useQuery({
    queryKey: ["business-detail", businessId],
    queryFn: () => getBusinessByIdApi(businessId),
    enabled: !!businessId,
  });

  const { data: services = [], isLoading: svcLoading } = useQuery({
    queryKey: ["business-services", businessId],
    queryFn: () => getBusinessServicesApi(businessId),
    enabled: !!businessId,
  });

  if (bizLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-80 md:col-span-2 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (bizError || !business) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorState
          title="Salon not found"
          description="The business you requested does not exist or has been removed."
          onRetry={() => router.push("/businesses")}
        />
      </div>
    );
  }

  // Extract distinct service categories
  const categories = ["ALL", ...Array.from(new Set(services.map((s) => s.category || "General")))];

  const filteredServices = selectedCategory === "ALL"
    ? services
    : services.filter((s) => (s.category || "General") === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-24 md:pb-8">
      {/* Back button */}
      <Link
        href="/businesses"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all salons
      </Link>

      {/* Hero Banner & Business Info */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        {/* Realistic Cover Photography */}
        <BusinessCover business={business} aspectRatio="banner" className="h-56 sm:h-72" />

        {/* Info & Booking CTAs Bar */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 -mt-12 sm:-mt-16 rounded-2xl bg-white border-4 border-white text-emerald-800 font-black flex items-center justify-center text-xl sm:text-2xl shadow-xl shrink-0 ring-1 ring-slate-100 z-20">
                {business.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {business.name}
                  </h1>
                  <Badge variant="success">Open Today</Badge>
                  {business.businessType && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {business.businessType}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                  {business.description || "Expert salon providing high-quality haircuts, styling, treatments, and grooming services."}
                </p>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-500 pt-2 font-medium">
                  {(business.address || business.city) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      {business.address ? `${business.address}, ` : ""}{business.city || "Local area"}
                    </span>
                  )}
                  {business.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      {business.phone}
                    </span>
                  )}
                  {business.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                      {business.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 w-64">
              <Link href={`/booking?businessId=${business.id}`}>
                <Button size="lg" className="w-full font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-700/20 cursor-pointer">
                  <Calendar className="w-4 h-4" />
                  Book Appointment
                </Button>
              </Link>
              <Link href={`/queue?businessId=${business.id}`}>
                <Button size="lg" variant="outline" className="w-full font-bold gap-2 rounded-xl cursor-pointer">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  Join Live Queue
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Treatments Menu & Business Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Treatments Catalog */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Scissors className="w-5 h-5 text-emerald-600" />
                Treatments Menu & Pricing
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your preferred service to schedule a slot
              </p>
            </div>

            <span className="text-xs font-bold text-slate-500">
              {filteredServices.length} {filteredServices.length === 1 ? "treatment" : "treatments"}
            </span>
          </div>

          {/* Category Filter Tabs */}
          {categories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-emerald-700 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat === "ALL" ? "All Services" : cat}
                </button>
              ))}
            </div>
          )}

          {/* Services List */}
          {svcLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-500 text-xs">
                No services found under this category.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredServices.map((svc) => (
                <div
                  key={svc.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <ServiceImage service={svc} size="md" />

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          {svc.category || "Treatment"}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(svc.durationMinutes)}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors truncate">
                        {svc.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {svc.description || "Expert salon service provided by qualified specialists."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="text-lg sm:text-xl font-black text-emerald-700">
                      {formatCurrency(svc.price)}
                    </span>
                    <Link href={`/booking?businessId=${business.id}&serviceId=${svc.id}`}>
                      <Button size="sm" className="font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs px-5 cursor-pointer">
                        Book
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: About & Details */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600" />
              About this salon
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {business.description || "Committed to delivering clean, professional, and trendsetting beauty and wellness experiences."}
            </p>

            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span className="font-medium text-slate-400">Status</span>
                <span className="font-bold text-emerald-700">Verified & Active</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium text-slate-400">Online Queue</span>
                <span className="font-bold text-emerald-700">Supported</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium text-slate-400">Advance Booking</span>
                <span className="font-bold text-emerald-700">Instant Confirmation</span>
              </div>
            </div>
          </Card>

          {/* Location & Contact Card */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Location & Contact
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              {business.address && (
                <p className="font-medium text-slate-900">{business.address}</p>
              )}
              {business.city && (
                <p className="text-slate-500">{business.city}, {business.state || ""}</p>
              )}
              {business.phone && (
                <p className="text-emerald-700 font-semibold pt-1">Tel: {business.phone}</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky Mobile Booking Bottom Bar */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg flex items-center gap-2">
        <Link href={`/queue?businessId=${business.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full font-bold text-xs gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            Live Queue
          </Button>
        </Link>
        <Link href={`/booking?businessId=${business.id}`} className="flex-1">
          <Button size="sm" className="w-full font-bold text-xs gap-1.5 shadow-md shadow-emerald-700/20">
            <Calendar className="w-3.5 h-3.5" />
            Book Slot
          </Button>
        </Link>
      </div>
    </div>
  );
}