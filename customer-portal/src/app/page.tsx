"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBusinessesApi } from "@/lib/api/businesses";
import { getServicesApi } from "@/lib/api/services";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sparkles, 
  Search, 
  MapPin, 
  Scissors, 
  Store, 
  ArrowRight, 
  Clock, 
  Star, 
  ShieldCheck, 
  Radio 
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data: businessesData, isLoading: bizLoading } = useQuery({
    queryKey: ["landing-businesses"],
    queryFn: () => getBusinessesApi({ limit: 6 }),
  });

  const { data: servicesData, isLoading: svcLoading } = useQuery({
    queryKey: ["landing-services"],
    queryFn: () => getServicesApi({ limit: 6 }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      router.push(`/businesses?search=${encodeURIComponent(searchTerm)}`);
    } else {
      router.push("/businesses");
    }
  };

  const businesses = businessesData?.data || [];
  const services = servicesData?.data || [];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-emerald-900 via-emerald-800 to-teal-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-200 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Real-time salon appointments & live walk-in queue</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Your next salon visit, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-200 to-teal-100">
              made simple
            </span>
          </h1>

          <p className="text-emerald-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Discover top-rated beauty salons, barbershops, and spas. Check live slot availability, book with your favorite specialist, or join the line virtually.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto bg-white p-2 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="flex items-center gap-3 px-3 w-full sm:flex-1 text-slate-800">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search salons, haircuts, massages, facial..."
                className="w-full py-2.5 text-sm focus:outline-none placeholder:text-slate-400 font-medium"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto font-bold shadow-md shadow-emerald-700/30 px-6"
            >
              Explore Salons
            </Button>
          </form>

          {/* Feature Highlights */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-emerald-200/90 font-semibold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-300" />
              Instant Booking Confirmation
            </span>
            <span className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-300" />
              Live Walk-in Queue Tracker
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              Verified Stylists & Salons
            </span>
          </div>
        </div>
      </section>

      {/* Featured Businesses Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Explore Salons
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Popular Beauty Parlours & Salons
            </h2>
          </div>
          <Link
            href="/businesses"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Browse all salons
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {bizLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No salons currently listed.
          </div>
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
                      {biz.description || "Premium salon providing quality grooming and treatments."}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{biz.city || biz.address || "Main Street"}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Popular Treatments Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Menu Highlights
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Popular Treatments & Services
            </h2>
          </div>
          <Link
            href="/services"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Browse all services
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {svcLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((svc) => (
              <Link key={svc.id} href={`/services/${svc.id}`} className="block group">
                <Card className="hover:border-emerald-400 hover:shadow-md transition-all h-full flex flex-col justify-between">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {svc.category || "General"}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(svc.durationMinutes)}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {svc.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-8">
                      {svc.description || "Expert grooming and styling service."}
                    </p>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                      <span className="text-xs font-medium text-slate-400">
                        {svc.business?.name || "Verified Salon"}
                      </span>
                      <span className="text-base font-black text-emerald-700">
                        {formatCurrency(svc.price)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="rounded-3xl bg-linear-to-r from-emerald-600 to-teal-700 text-white p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ready to Skip the Waiting Room?
          </h2>
          <p className="text-emerald-100 text-sm sm:text-base max-w-xl mx-auto">
            Join a live salon queue or lock in your appointment with top-rated stylists today.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/businesses">
              <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold shadow-md">
                Find Your Salon
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-bold">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}