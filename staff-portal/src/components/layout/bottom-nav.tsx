"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Radio, Calendar, Clock, User } from "lucide-react";

const MOBILE_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/queue", label: "Queue", icon: Radio },
  { href: "/appointments", label: "Bookings", icon: Calendar },
  { href: "/schedule", label: "Shift", icon: Clock },
  { href: "/profile", label: "Profile", icon: User },
];

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-2 shadow-lg">
      <div className="flex items-center justify-around">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive ? "text-emerald-600 font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};