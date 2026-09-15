"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { getMyAppointmentsApi } from "@/lib/api/appointments";
import { getBusinessesApi } from "@/lib/api/businesses";
import { getServicesApi } from "@/lib/api/services";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Clock, 
  Radio, 
  Store, 
  Scissors, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  MapPin 
} from "lucide-react";

export default function CustomerHomePage() {
  const { user } = useAuth();

  const { data: apptData, isLoading: apptLoading } = useQuery({
    queryKey: ["customer-home-appointments"],
    queryFn: () => getMyAppointmentsApi({ limit: 5 }),
  });

  const { data: bizData, isLoading: bizLoading } = useQuery({
    queryKey: ["customer-home-businesses"],
    queryFn: () => getBusinessesApi({ limit: 4 }),
  });

  const { data: svcData, isLoading: svcLoading } = useQuery({
    queryKey: ["customer-home-services"],
    queryFn: () => getServicesApi({ limit: 4 }),
  });

  const appointments = apptData?.data || [];
  const upcoming = appointments.find((a) => a.status === "CONFIRMED" || a.status === "PENDING");
  const businesses = bizData?.data || [];
  const services = svcData?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-emerald-600 via-emerald-700 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-emerald-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customer Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.displayName || user?.name || "Friend"}!
          </h1>
          <p className="text-emerald-100 text-sm max-w-md">
            Check your upcoming beauty sessions, discover new parlours, or join a walk-in queue.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 self-start sm:self-auto">
          <Link href="/businesses">
            <Button className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold shadow-sm">
              Book Appointment
            </Button>
          </Link>
          <Link href="/queue">
            <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 font-bold gap-1.5">
              <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
              Live Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Upcoming Appointment Highlight */}
      {upcoming ? (
        <Card className="border-2 border-emerald-500/30 bg-emerald-50/20 shadow-md">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Upcoming Appointment
                  </span>
                  <StatusBadge status={upcoming.status} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {upcoming.service?.name || upcoming.appointmentServices?.[0]?.service?.name || "Salon Treatment"}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    {upcoming.business?.name || "Salon Partner"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(upcoming.appointmentDate)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatTime(upcoming.startTime)}
                  </span>
                </div>
              </div>

              <Link href={`/appointments/${upcoming.id}`}>
                <Button className="gap-2 font-bold w-full sm:w-auto shadow-sm">
                  View Booking
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/businesses" className="block group">
          <Card className="p-4 sm:p-5 hover:border-emerald-400 transition-all text-center h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-900 text-sm">Find Salons</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Explore businesses</p>
          </Card>
        </Link>

        <Link href="/services" className="block group">
          <Card className="p-4 sm:p-5 hover:border-emerald-400 transition-all text-center h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Scissors className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-900 text-sm">Treatments</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Hair, spa & facials</p>
          </Card>
        </Link>

        <Link href="/appointments" className="block group">
          <Card className="p-4 sm:p-5 hover:border-emerald-400 transition-all text-center h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-900 text-sm">My Bookings</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Manage schedule</p>
          </Card>
        </Link>

        <Link href="/queue" className="block group">
          <Card className="p-4 sm:p-5 hover:border-emerald-400 transition-all text-center h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Radio className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-900 text-sm">Live Queue</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Virtual walk-in line</p>
          </Card>
        </Link>
      </div>

      {/* Featured Salons Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            Salons Near You
          </h2>
          <Link href="/businesses" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
            See all
          </Link>
        </div>

        {bizLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {businesses.map((biz) => (
              <Link key={biz.id} href={`/businesses/${biz.id}`} className="block group">
                <Card className="h-full hover:border-emerald-400 transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-sm shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        {biz.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-700">
                          {biz.name}
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1 truncate mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {biz.city || "Nearby"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Popular Treatments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-emerald-600" />
            Trending Treatments
          </h2>
          <Link href="/services" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
            See all
          </Link>
        </div>

        {svcLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((svc) => (
              <Link key={svc.id} href={`/services/${svc.id}`} className="block group">
                <Card className="h-full hover:border-emerald-400 transition-all flex flex-col justify-between">
                  <CardContent className="p-4 space-y-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {svc.category || "General"}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-emerald-700">
                      {svc.name}
                    </h4>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-400">{svc.durationMinutes} mins</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(svc.price)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}