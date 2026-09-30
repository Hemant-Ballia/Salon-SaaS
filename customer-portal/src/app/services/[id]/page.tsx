"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getServiceByIdApi } from "@/lib/api/services";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { 
  Scissors, 
  Clock, 
  Store, 
  ArrowLeft, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  MapPin
} from "lucide-react";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const { data: service, isLoading, error } = useQuery({
    queryKey: ["service-detail-view", serviceId],
    queryFn: () => getServiceByIdApi(serviceId),
    enabled: !!serviceId,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorState
          title="Service not found"
          description="The treatment you selected does not exist or has been removed."
          onRetry={() => router.push("/services")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-8">
      <Link
        href="/services"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Treatments
      </Link>

      {/* Main Service Card */}
      <Card className="overflow-hidden border-slate-200/80 shadow-sm">
        {/* Cover Header */}
        <div className="h-36 sm:h-44 bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 sm:p-8 flex items-end justify-between text-white relative">
          <div className="relative z-10 flex items-center gap-2 text-xs font-bold bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Professional Treatment</span>
          </div>
          <span className="relative z-10 text-xs font-bold text-emerald-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(service.durationMinutes)}
          </span>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 uppercase tracking-wider border border-emerald-100">
                {service.category || "General Treatment"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {service.name}
              </h1>
              <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
                {service.description || "Professional beauty and grooming treatment performed by certified salon specialists using premium products."}
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Standard Price
              </span>
              <span className="text-3xl font-black text-emerald-700 block mt-0.5">
                {formatCurrency(service.price)}
              </span>
            </div>
          </div>

          {/* Treatment Highlights */}
          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Instant slot reservation</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sterilized salon equipment</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Duration: {formatDuration(service.durationMinutes)}</span>
            </div>
          </div>

          {/* Offering Salon Partner */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {service.business ? (
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                  {service.business.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Available at</p>
                  <Link
                    href={`/businesses/${service.businessId}`}
                    className="font-bold text-slate-900 hover:text-emerald-700 text-sm transition-colors"
                  >
                    {service.business.name}
                  </Link>
                  {service.business.city && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {service.business.city}
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            <Link
              href={`/booking?businessId=${service.businessId}&serviceId=${service.id}`}
              className="w-full sm:w-auto"
            >
              <Button size="lg" className="w-full sm:w-auto font-bold gap-2 shadow-md shadow-emerald-700/20 px-8">
                <Calendar className="w-4 h-4" />
                Book This Treatment
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">TOTAL PRICE</span>
          <span className="text-lg font-black text-emerald-700">{formatCurrency(service.price)}</span>
        </div>
        <Link href={`/booking?businessId=${service.businessId}&serviceId=${service.id}`} className="flex-1">
          <Button size="sm" className="w-full font-bold text-xs gap-1.5 shadow-md shadow-emerald-700/20">
            <Calendar className="w-3.5 h-3.5" />
            Book Slot
          </Button>
        </Link>
      </div>
    </div>
  );
}