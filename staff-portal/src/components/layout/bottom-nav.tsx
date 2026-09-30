"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Radio, Users, User } from "lucide-react";

const MOBILE_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/queue", label: "Queue", icon: Radio },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xs border-t border-slate-200/80 px-2 py-1.5 shadow-xs">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive ? "text-emerald-700 font-semibold" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? "stroke-[2.2]" : "stroke-2"}`} />
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};