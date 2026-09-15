"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Calendar, 
  Radio, 
  Store, 
  Bell, 
  User, 
  LogIn 
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const isHomeOrLanding = pathname === "/" || pathname === "/home";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href={isAuthenticated ? "/home" : "/"} className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
              SalonDirect
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              Customer Hub
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {isAuthenticated && (
            <Link
              href="/home"
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                pathname === "/home"
                  ? "text-emerald-700 bg-emerald-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Dashboard
            </Link>
          )}

          <Link
            href="/businesses"
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
              pathname.startsWith("/businesses")
                ? "text-emerald-700 bg-emerald-50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Find Salons
          </Link>

          <Link
            href="/services"
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
              pathname.startsWith("/services")
                ? "text-emerald-700 bg-emerald-50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Treatments
          </Link>

          {isAuthenticated && (
            <>
              <Link
                href="/appointments"
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                  pathname.startsWith("/appointments")
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                My Bookings
              </Link>

              <Link
                href="/queue"
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                  pathname.startsWith("/queue")
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Live Queue
              </Link>
            </>
          )}
        </nav>

        {/* User / Auth CTAs */}
        <div className="flex items-center gap-2.5">
          {isAuthenticated ? (
            <>
              <Link
                href="/notifications"
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative"
              >
                <Bell className="w-5 h-5" />
              </Link>

              <Link href="/profile" className="flex items-center gap-2 pl-2">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs shadow-xs border border-emerald-200">
                  {(user?.displayName || user?.name || "C").slice(0, 2).toUpperCase()}
                </div>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-bold text-xs">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-bold text-xs shadow-sm shadow-emerald-700/20">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};