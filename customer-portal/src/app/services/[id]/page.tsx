"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getServiceByIdApi } from "@/lib/api/services";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Scissors, Clock, Store, ArrowLeft, Calendar } from "lucide-react";

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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorState
          title="Service not found"
          description="The treatment you selected does not exist or has been removed."
          onRetry={() => router.push("/services")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        href="/services"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Services
      </Link>

      <Card>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 uppercase tracking-wider">
                {service.category || "General Treatment"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {service.name}
              </h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                {service.description || "Professional grooming and beauty treatment provided by verified salon specialists."}
              </p>
            </div>

            <div className="text-right sm:text-right shrink-0">
              <span className="text-3xl font-black text-emerald-700 block">
                {formatCurrency(service.price)}
              </span>
              <span className="text-xs text-slate-400 flex items-center justify-end gap-1 mt-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(service.durationMinutes)}
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {service.business && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm">
                  {service.business.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Offered by</p>
                  <Link href={`/businesses/${service.businessId}`} className="font-bold text-slate-900 hover:text-emerald-700 text-sm">
                    {service.business.name}
                  </Link>
                </div>
              </div>
            )}

            <Link href={`/booking?businessId=${service.businessId}&serviceId=${service.id}`} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-bold gap-2 shadow-md shadow-emerald-700/20">
                <Calendar className="w-4 h-4" />
                Book This Treatment
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}