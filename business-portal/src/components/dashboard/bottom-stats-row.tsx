"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Users, Calendar, UserCheck, CreditCard, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BottomStatsRowProps {
  totalCustomers?: number;
  totalBookings?: number;
  activeStaff?: number;
  totalRevenue?: number;
  hasSubscriptionBanner?: boolean;
}

export const BottomStatsRow: React.FC<BottomStatsRowProps> = ({
  totalCustomers = 0,
  totalBookings = 0,
  activeStaff = 0,
  totalRevenue = 0,
  hasSubscriptionBanner = true,
}) => {
  const stats = [
    {
      label: "Lifetime Customers",
      value: totalCustomers.toLocaleString("en-IN"),
      icon: Users,
      iconBg: "bg-slate-50 text-slate-700",
    },
    {
      label: "Total Bookings",
      value: totalBookings.toLocaleString("en-IN"),
      icon: Calendar,
      iconBg: "bg-slate-50 text-slate-700",
    },
    {
      label: "Active Staff",
      value: activeStaff.toString(),
      icon: UserCheck,
      iconBg: "bg-slate-50 text-slate-700",
    },
    {
      label: "Lifetime Revenue",
      value: formatCurrency(totalRevenue),
      icon: CreditCard,
      iconBg: "bg-slate-50 text-slate-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch mt-4">
      {/* 4 Lifetime Stat Cards */}
      <div className="xl:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="rounded-xl bg-white border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg border border-slate-100 ${item.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-500 truncate">
                  {item.label}
                </span>
              </div>

              <div>
                <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {item.value}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Verified system record
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription Tier Info Card */}
      {hasSubscriptionBanner && (
        <div className="xl:col-span-4">
          <div className="h-full rounded-xl bg-slate-900 border border-slate-800 text-white p-5 shadow-2xs flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Plan & Features
              </span>
              <h3 className="text-sm font-bold tracking-tight text-white">
                Business Operating Plan
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                Manage your subscription, staff quotas, and automated client notifications.
              </p>
              <div>
                <Link
                  href="/subscription"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition shadow-2xs"
                >
                  Manage Subscription <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
