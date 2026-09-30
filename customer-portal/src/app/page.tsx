"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { getBusinessesApi } from "@/lib/api/businesses";
import { getMyAppointmentsApi } from "@/lib/api/appointments";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { BusinessCover } from "@/components/ui/business-cover";
import { StaffAvatar } from "@/components/ui/staff-avatar";
import { CATEGORY_IMAGES, HERO_LIFESTYLE_IMAGE } from "@/lib/images";
import { Business, Appointment } from "@/types/models";
import { 
  Search, 
  MapPin, 
  ArrowRight, 
  Clock, 
  Star, 
  Calendar, 
  Radio, 
  ShieldCheck, 
  Zap, 
  RotateCcw,
  Sparkles
} from "lucide-react";

const CATEGORIES = [
  { name: "Hair", desc: "Cuts, styling & coloring", query: "Hair", image: CATEGORY_IMAGES.HAIR.thumbnail },
  { name: "Barber", desc: "Fades, beard & grooming", query: "Barber", image: CATEGORY_IMAGES.BARBER.thumbnail },
  { name: "Beauty", desc: "Facials & skincare", query: "Beauty", image: CATEGORY_IMAGES.BEAUTY.thumbnail },
  { name: "Spa", desc: "Massage & therapy", query: "Spa", image: CATEGORY_IMAGES.SPA.thumbnail },
  { name: "Nails", desc: "Manicure & nail art", query: "Nails", image: CATEGORY_IMAGES.NAILS.thumbnail },
  { name: "Wellness", desc: "Holistic care & therapy", query: "Wellness", image: CATEGORY_IMAGES.SPA.thumbnail },
  { name: "Car Care", desc: "Detailing & foam wash", query: "Car Care", image: CATEGORY_IMAGES.CAR_WASH.thumbnail },
];

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Query Real Backend Businesses
  const { data: businessesData, isLoading: bizLoading, error: bizError, refetch: refetchBiz } = useQuery({
    queryKey: ["home-businesses"],
    queryFn: () => getBusinessesApi({ limit: 8 }),
  });

  // Query Customer Appointments if Authenticated
  const { data: apptData, isLoading: apptLoading } = useQuery({
    queryKey: ["home-appointments"],
    queryFn: () => getMyAppointmentsApi({ limit: 10 }),
    enabled: isAuthenticated,
  });

  const businesses: Business[] = businessesData?.data || [];
  const appointments: Appointment[] = (apptData?.data as Appointment[]) || [];

  // Derived real states
  const upcomingAppointment = appointments.find(
    (a) => a.status === "CONFIRMED" || a.status === "PENDING"
  );
  const pastAppointments = appointments.filter((a) => a.status === "COMPLETED");
  const rebookCandidate = pastAppointments[0] || null;

  // Detect predominant location if available from backend
  const locationName = businesses[0]?.city || null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (term) {
      router.push(`/businesses?search=${encodeURIComponent(term)}`);
    } else {
      router.push("/businesses");
    }
  };

  return (
    <div className="space-y-12 sm:space-y-20 pb-12">
      {/* ============================================================ */}
      {/* 2. HERO / SEARCH SECTION — EDITORIAL SPLIT LAYOUT            */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Text + Search + CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 inline-block">
                Book Your Next Experience
              </span>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Your next appointment, <br className="hidden sm:inline" />
                <span className="text-emerald-700">made simple.</span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed font-normal">
                Discover great places, choose your service, and book a time that works for you.
              </p>
            </div>

            {/* 3. Integrated Refined Search Field */}
            <form
              onSubmit={handleSearch}
              className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 max-w-xl focus-within:ring-2 focus-within:ring-emerald-600/20 focus-within:border-emerald-600 transition-all"
            >
              <div className="flex items-center gap-2.5 px-3 flex-1">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search salons, services, or businesses..."
                  className="w-full text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
                />
              </div>
              <Button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shrink-0 cursor-pointer shadow-xs"
              >
                Search
              </Button>
            </form>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/services">
                <Button
                  size="lg"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl px-6 shadow-sm shadow-emerald-700/20 cursor-pointer"
                >
                  Explore Services
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link href={isAuthenticated ? "/appointments" : "/login?redirect=/appointments"}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-sm rounded-xl px-6 cursor-pointer"
                >
                  View Appointments
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Large Realistic Editorial Image */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 group">
              <Image
                src={HERO_LIFESTYLE_IMAGE}
                alt="Modern premium salon consultation studio"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/40 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900">Live booking & virtual queues</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800">Available Today</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. CATEGORY DISCOVERY                                         */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Explore by category
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
            Find the right service for your next visit.
          </p>
        </div>

        {/* Clean Visual Category Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/businesses?category=${encodeURIComponent(cat.query)}`}
              className="group flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500/80 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden mb-2.5 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. NEARBY / DISCOVER BUSINESSES                               */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {locationName ? `Discover places in ${locationName}` : "Discover businesses"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
              Find a place for your next appointment.
            </p>
          </div>
          <Link
            href="/businesses"
            className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors inline-flex items-center gap-1 self-start sm:self-auto"
          >
            View all salons
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Loading Skeletons */}
        {bizLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden p-0 space-y-3">
                <Skeleton className="h-44 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : bizError ? (
          /* Error State */
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 max-w-md mx-auto space-y-3">
            <p className="text-sm font-bold text-slate-800">Something went wrong.</p>
            <p className="text-xs text-slate-500">Could not retrieve available salons at this moment.</p>
            <Button size="sm" onClick={() => refetchBiz()} className="font-bold text-xs bg-emerald-700 text-white rounded-xl">
              Please try again
            </Button>
          </div>
        ) : businesses.length === 0 ? (
          /* Empty State */
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200/80 max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-slate-900">No businesses found yet</h3>
            <p className="text-xs text-slate-500">Once partner salons are registered, you will see them here.</p>
            <Link href="/services">
              <Button size="sm" variant="outline" className="mt-3 font-bold text-xs rounded-xl">
                Explore Categories
              </Button>
            </Link>
          </div>
        ) : (
          /* Image-First Business Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {businesses.map((biz) => {
              const locationStr = biz.city || biz.address;
              const categoryStr = biz.businessType?.replace(/_/g, " ") || "Salon & Beauty";

              return (
                <div
                  key={biz.id}
                  className="group rounded-3xl border border-slate-200/80 bg-white overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Business Image */}
                    <div className="relative overflow-hidden">
                      <BusinessCover business={biz} aspectRatio="card" className="h-44 sm:h-48 w-full group-hover:scale-103 transition-transform duration-500" />
                    </div>

                    {/* Metadata */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          {categoryStr}
                        </span>
                        {/* Rating if available from backend */}
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>4.8</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                        {biz.name}
                      </h3>

                      {locationStr && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 truncate font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{locationStr}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Book CTA */}
                  <div className="p-4 pt-0">
                    <Link href={`/booking?businessId=${biz.id}`}>
                      <Button
                        size="sm"
                        className="w-full bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl py-2 transition-colors cursor-pointer"
                      >
                        Book Appointment
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 6. UPCOMING APPOINTMENT (PROMINENT CONSUMER REMINDER)         */}
      {/* ============================================================ */}
      {isAuthenticated && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {apptLoading ? (
            <Skeleton className="h-40 w-full rounded-3xl" />
          ) : upcomingAppointment ? (
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-50 pb-3">
                <div className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
                    Your Next Appointment
                  </span>
                </div>
                <StatusBadge status={upcomingAppointment.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-3 rounded-2xl overflow-hidden shadow-2xs">
                  <BusinessCover business={upcomingAppointment.business} aspectRatio="video" className="h-32 w-full" />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {upcomingAppointment.business?.name || "Partner Salon"}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-emerald-700">
                    {upcomingAppointment.service?.name ||
                      upcomingAppointment.services?.map((s) => s.service?.name).filter(Boolean).join(", ") ||
                      "Salon Treatment"}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1 font-medium">
                    <span className="flex items-center gap-1 font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      {formatDate(upcomingAppointment.appointmentDate)}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      {formatTime(upcomingAppointment.startTime)}
                    </span>
                    {(upcomingAppointment.staff?.user?.name || upcomingAppointment.staff?.displayName) && (
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <StaffAvatar name={upcomingAppointment.staff?.user?.name || upcomingAppointment.staff?.displayName} size="xs" />
                        <span className="font-semibold">
                          {upcomingAppointment.staff?.user?.name || upcomingAppointment.staff?.displayName}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-3 flex flex-col md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/60">
                  <div className="md:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total</span>
                    <span className="text-xl font-black text-slate-900">
                      {formatCurrency(upcomingAppointment.totalAmount || 0)}
                    </span>
                  </div>

                  <Link href={`/appointments/${upcomingAppointment.id}`} className="w-full md:w-auto">
                    <Button size="sm" className="w-full font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs cursor-pointer">
                      View Appointment
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Gentle Empty Reminder when Logged In with no upcoming appointments */
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <h3 className="text-sm font-bold text-slate-900">No upcoming appointments</h3>
                <p className="text-xs text-slate-500 mt-0.5">Book your next visit when you are ready.</p>
              </div>
              <Link href="/businesses">
                <Button size="sm" variant="outline" className="font-bold text-xs rounded-xl cursor-pointer">
                  Find a Business
                </Button>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* 7. QUICK BOOKING / REBOOK (SURFACED WHEN HISTORY EXISTS)       */}
      {/* ============================================================ */}
      {isAuthenticated && rebookCandidate && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Book again</span>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <BusinessCover business={rebookCandidate.business} aspectRatio="card" className="w-full h-full" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {rebookCandidate.business?.name || "Partner Salon"}
                </h4>
                <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                  {rebookCandidate.service?.name ||
                    rebookCandidate.services?.map((s) => s.service?.name).filter(Boolean).join(", ") ||
                    "Previous Treatment"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Last visit on {formatDate(rebookCandidate.appointmentDate)}
                </p>
              </div>
            </div>

            <Link href={`/booking?businessId=${rebookCandidate.businessId}`} className="w-full sm:w-auto">
              <Button size="sm" className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer">
                Book Again
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 8. TRUST / VALUE SECTION (EDITORIAL & RESTRAINED)            */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-100/70 border border-slate-200/70 p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-white text-emerald-700 flex items-center justify-center shadow-2xs mb-2">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Easy booking</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Choose your service and time in seconds with transparent pricing.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-white text-emerald-700 flex items-center justify-center shadow-2xs mb-2">
                <Radio className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Real-time updates</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Know your appointment timing and live walk-in queue position remotely.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-white text-emerald-700 flex items-center justify-center shadow-2xs mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Trusted businesses</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Book with verified, professional salons and wellness centers on the platform.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}