"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Store, 
  Scissors, 
  Calendar, 
  Radio, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  CreditCard,
  Search
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { href: isAuthenticated ? "/home" : "/", label: "Home" },
    { href: "/businesses", label: "Explore Salons" },
    { href: "/services", label: "Treatments" },
    ...(isAuthenticated
      ? [
          { href: "/appointments", label: "My Bookings" },
          { href: "/queue", label: "Live Queue" },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <Link
          href={isAuthenticated ? "/home" : "/"}
          className="flex items-center gap-2.5 group transition-transform active:scale-95"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:bg-emerald-700 transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
              Salon<span className="text-emerald-600">Direct</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Customer Portal
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/businesses"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search</span>
          </Link>

          <Link
            href={isAuthenticated ? "/appointments" : "/login?redirect=/appointments"}
            className="text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            Appointments
          </Link>
        </div>

        {/* Right: Notification & Profile / Auth CTAs */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Notification icon */}
              <Link
                href="/notifications"
                className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors hidden sm:block"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
              </Link>

              {/* Profile Avatar & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  aria-expanded={isDropdownOpen}
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                    {(user?.displayName || user?.name || "C").slice(0, 2).toUpperCase()}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:inline" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200/80 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user?.displayName || user?.name || "Customer"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>
                      <Link
                        href="/appointments"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-slate-400" />
                        My Bookings
                      </Link>
                      <Link
                        href="/queue"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <Radio className="w-4 h-4 text-slate-400" />
                        Live Queue
                      </Link>
                      <Link
                        href="/payments"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        Payment History
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Settings
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={async () => {
                          setIsDropdownOpen(false);
                          await logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-bold text-xs text-slate-700">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-bold text-xs shadow-sm shadow-emerald-700/20">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub-Header Search Bar */}
      <div className="md:hidden px-4 pb-3 pt-0.5 border-t border-slate-100/80 bg-white">
        <Link
          href="/businesses"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors"
        >
          <Search className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="truncate">Search services, salons, or businesses...</span>
        </Link>
      </div>
    </header>
  );
};