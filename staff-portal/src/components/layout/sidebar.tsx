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
  Users,
  LogOut, 
  Sparkles,
  Wallet 
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/queue", label: "Queue", icon: Radio },
  { href: "/services", label: "Services", icon: Scissors },
  { href: "/schedule", label: "Schedule", icon: Clock },
  { href: "/earnings", label: "My Earnings", icon: Wallet },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { staff, logout } = useAuth();

  return (
    <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-200 bg-white p-5 shrink-0 min-h-screen">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Scissors className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight text-sm leading-tight">
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
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-2 py-1.5 rounded-xl transition-colors ${
            pathname === "/profile" ? "bg-slate-100" : "hover:bg-slate-50"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
            {(staff?.displayName || "S").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">
              {staff?.displayName || "Staff Member"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {staff?.designation || "Profile & Settings"}
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50/60 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};