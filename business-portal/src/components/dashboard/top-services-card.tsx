"use client";

import React from "react";
import Link from "next/link";
import { TopServiceItem } from "@/types/models";
import { BusinessThemeConfig } from "@/config/business-theme";
import { ArrowRight, Sparkles, Scissors, Car, ChevronDown } from "lucide-react";

interface TopServicesCardProps {
  services?: TopServiceItem[];
  theme: BusinessThemeConfig;
  isLoading?: boolean;
}

export const TopServicesCard: React.FC<TopServicesCardProps> = ({
  services = [],
  theme,
  isLoading = false,
}) => {
  const isSalon = theme.themeKey === "salon";

  const getServiceIcon = (category?: string) => {
    if (isSalon) {
      return Scissors;
    }
    return Car;
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Top Services</h2>

        {isSalon ? (
          <Link
            href="/services"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <div className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
            <span>This Month</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </div>
        )}
      </div>

      {/* List of Services */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 animate-pulse">
              <div className="h-10 w-10 rounded-lg bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-28 rounded bg-slate-100" />
                <div className="h-2 w-full rounded-full bg-slate-100" />
              </div>
              <div className="h-4 w-8 rounded bg-slate-100" />
            </div>
          ))
        ) : services.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No service booking data yet.
          </div>
        ) : (
          services.map((svc, idx) => {
            const Icon = getServiceIcon(svc.category);
            const barFillColor = isSalon ? "bg-[#be185d]" : "bg-[#1e293b]";

            return (
              <div key={svc.id || idx} className="flex items-center gap-3">
                {/* Thumbnail Icon/Photo */}
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border ${
                    isSalon
                      ? "bg-rose-50 border-rose-100 text-[#be185d]"
                      : "bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Name, Booking Count & Progress Bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate pr-2">
                      {svc.name}
                    </span>
                    <span className="text-xs font-bold text-slate-700 shrink-0">
                      {svc.percentage}%
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium mb-1">
                    {svc.bookingsCount} bookings
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barFillColor} transition-all duration-500`}
                      style={{ width: `${Math.max(5, svc.percentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
