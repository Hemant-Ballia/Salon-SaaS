"use client";

import React from "react";
import Link from "next/link";
import { ActivityEvent } from "@/types/models";
import { BusinessThemeConfig } from "@/config/business-theme";
import {
  ArrowRight,
  Calendar,
  CreditCard,
  UserCheck,
  Star,
  CheckCircle2,
  Bell,
} from "lucide-react";

interface RecentActivityCardProps {
  activities?: ActivityEvent[];
  theme: BusinessThemeConfig;
  isLoading?: boolean;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  activities = [],
  theme,
  isLoading = false,
}) => {
  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case "payment":
        return {
          icon: CreditCard,
          bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
        };
      case "staff":
        return {
          icon: UserCheck,
          bg: "bg-sky-50 text-sky-600 border-sky-100",
        };
      case "feedback":
        return {
          icon: Star,
          bg: "bg-amber-50 text-amber-500 border-amber-100",
        };
      case "appointment":
        return {
          icon: Calendar,
          bg:
            theme.themeKey === "salon"
              ? "bg-rose-50 text-rose-500 border-rose-100"
              : "bg-blue-50 text-blue-600 border-blue-100",
        };
      default:
        return {
          icon: Bell,
          bg: "bg-purple-50 text-purple-600 border-purple-100",
        };
    }
  };

  const formatEventTime = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffHours < 48) {
      return "Yesterday";
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Activity</h2>
        <Link
          href="/notifications"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-start gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3.5 w-24 rounded bg-slate-100" />
                <div className="h-3 w-36 rounded bg-slate-100" />
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No recent activity recorded yet.
          </div>
        ) : (
          activities.map((act) => {
            const { icon: Icon, bg } = getActivityIcon(act.iconType);

            return (
              <div key={act.id} className="flex items-start gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${bg}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate pr-2">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {formatEventTime(act.createdAt)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5 truncate">
                    {act.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
