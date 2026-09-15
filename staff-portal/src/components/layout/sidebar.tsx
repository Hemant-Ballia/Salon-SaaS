"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { 
  LayoutDashboard, 
  Calendar, 
  Radio, 
  Clock, 
  Scissors, 
  User, 
  Bell, 
  LogOut, 
  Sparkles 
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/queue", label: "Live Queue", icon: Radio },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/schedule", label: "My Schedule", icon: Clock },
  { href: "/services", label: "Services", icon: Scissors },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { staff, logout } = useAuth();

  return (
    <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-200 bg-white p-5 shrink-0 min-h-screen">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight text-base leading-tight">
              SalonStaff
            </h1>
            <p className="text-[11px] font-medium text-slate-400">
              {staff?.business?.name || "Specialist Console"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Staff Card & Logout */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
            {(staff?.displayName || "S").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {staff?.displayName || "Staff Member"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {staff?.designation || "Service Specialist"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};