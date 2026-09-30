"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { 
  Home, 
  Store, 
  Calendar, 
  Radio, 
  User 
} from "lucide-react";

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const NAV_ITEMS = [
    { href: isAuthenticated ? "/home" : "/", label: "Home", icon: Home },
    { href: "/businesses", label: "Explore", icon: Store },
    { href: isAuthenticated ? "/appointments" : "/login?redirect=/appointments", label: "Bookings", icon: Calendar },
    { href: isAuthenticated ? "/queue" : "/login?redirect=/queue", label: "Queue", icon: Radio },
    { href: isAuthenticated ? "/profile" : "/login", label: isAuthenticated ? "Profile" : "Sign In", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 shadow-lg pb-safe">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && item.href !== "/home" && pathname.startsWith(item.href.split("?")[0]));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
                isActive
                  ? "text-emerald-700 font-bold"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? "bg-emerald-50 text-emerald-600 scale-105" : ""
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.2]" : "stroke-[1.8]"}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};