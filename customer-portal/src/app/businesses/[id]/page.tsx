"use client";

import React from "react";
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
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Scissors, 
  Clock, 
  Calendar, 
  Radio, 
  ArrowLeft 
} from "lucide-react";

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;

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
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          href="/businesses"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Salons
        </Link>

        {/* Salon Header Hero */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-xl shrink-0 shadow-md shadow-emerald-700/20">
              {business.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {business.name}
                </h1>
                <Badge variant="success">Verified Salon</Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
                {business.description || "Expert salon offering haircuts, styling, facials, and treatments."}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 font-medium">
                {business.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {business.address}, {business.city}
                  </span>
                )}
                {business.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {business.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <Link href={`/booking?businessId=${business.id}`}>
              <Button size="lg" className="w-full font-bold gap-2 shadow-md shadow-emerald-700/20">
                <Calendar className="w-4 h-4" />
                Book Appointment
              </Button>
            </Link>
            <Link href={`/queue?businessId=${business.id}`}>
              <Button size="lg" variant="outline" className="w-full font-bold gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                Join Live Queue
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Services Menu Catalog */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Scissors className="w-5 h-5 text-emerald-600" />
          Treatment Menu & Pricing
        </h2>

        {svcLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500 text-sm">
              No services currently listed for this salon.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => (
              <Card key={svc.id} className="hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {svc.category || "General"}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(svc.durationMinutes)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{svc.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {svc.description || "Quality treatment performed by certified specialists."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-base font-black text-emerald-700">
                      {formatCurrency(svc.price)}
                    </span>
                    <Link href={`/booking?businessId=${business.id}&serviceId=${svc.id}`}>
                      <Button size="sm" className="font-bold text-xs">
                        Book
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}