"use client";

import React from "react";
import Link from "next/link";
import { BusinessThemeConfig } from "@/config/business-theme";
import { Calendar, Plus, Layers, Scissors, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeroProps {
  userName?: string;
  businessName?: string;
  theme: BusinessThemeConfig;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  userName,
  businessName,
  theme,
}) => {
  const currentHour = new Date().getHours();
  const timeOfDayGreeting =
    currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

  const displayName = businessName || (userName ? userName.split(" ")[0] : "Business");
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2 border-b border-slate-200/80 pb-5">
      {/* Left Column: Greeting & Intro */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Operations
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {theme.categoryLabel}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
          {timeOfDayGreeting}, {displayName}
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          {theme.hero.subtitle}
        </p>
      </div>

      {/* Right Column: Date & Primary Operational Actions */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 shadow-2xs">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>

        <Link href="/queue">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3.5 text-xs font-semibold text-slate-700 border-slate-200 bg-white hover:bg-slate-50 shadow-2xs gap-1.5"
          >
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            Floor Queue
          </Button>
        </Link>

        <Link href="/appointments">
          <Button
            size="sm"
            className="h-9 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            New Appointment
          </Button>
        </Link>
      </div>
    </div>
  );
};
