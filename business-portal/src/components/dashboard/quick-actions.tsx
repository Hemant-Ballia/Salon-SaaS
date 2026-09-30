"use client";

import React from "react";
import Link from "next/link";
import { BusinessThemeConfig } from "@/config/business-theme";
import {
  Calendar,
  UserPlus,
  Scissors,
  Droplets,
  Layers,
  QrCode,
  ArrowRight,
  Zap,
} from "lucide-react";

interface QuickActionsProps {
  theme: BusinessThemeConfig;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ theme }) => {
  const isSalon = theme.themeKey === "salon";

  const actions = [
    {
      label: "Add Staff Member",
      description: "Invite or register staff",
      href: "/staff",
      icon: UserPlus,
      color: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      label: "Add Service",
      description: "Configure new offerings & prices",
      href: "/services",
      icon: isSalon ? Scissors : Droplets,
      color: "bg-rose-50 text-rose-700 border-rose-100",
    },
    {
      label: "View Appointments",
      description: "Schedule & booking calendar",
      href: "/appointments",
      icon: Calendar,
      color: "bg-amber-50 text-amber-700 border-amber-100",
    },
    {
      label: "Open Live Queue",
      description: "Counter callouts & tokens",
      href: "/queue",
      icon: Layers,
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    {
      label: "Manage QR Code",
      description: "Storefront & print signage",
      href: "/qr",
      icon: QrCode,
      color: "bg-purple-50 text-purple-700 border-purple-100",
    },
  ];

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Zap className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
          Quick Actions
        </h2>
      </div>

      <div className="space-y-2">
        {actions.map((action, idx) => {
          const Icon = action.icon;

          return (
            <Link
              key={idx}
              href={action.href}
              className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 hover:border-slate-300 hover:bg-slate-50/80 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 ${action.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors truncate">
                    {action.label}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                    {action.description}
                  </div>
                </div>
              </div>

              <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
