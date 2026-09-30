"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "./navbar";
import { BottomNav } from "./bottom-nav";
import { Sparkles, ShieldCheck, Clock, Radio, Heart } from "lucide-react";

export const CustomerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-900 flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-12">{children}</main>

      {/* Consumer-First SaaS Footer */}
      <footer className="border-t border-slate-200/80 bg-white text-slate-600 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-slate-900 text-base">
                  Salon<span className="text-emerald-600">Direct</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your seamless gateway to local salons, barbershops, and beauty spas. Book appointments in seconds and skip physical waiting rooms.
              </p>
            </div>

            {/* Quick Discover */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">Discover</p>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link href="/businesses" className="hover:text-emerald-600 transition-colors">
                    Explore Salons & Parlours
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="hover:text-emerald-600 transition-colors">
                    Trending Treatments
                  </Link>
                </li>
                <li>
                  <Link href="/booking" className="hover:text-emerald-600 transition-colors">
                    Book an Appointment
                  </Link>
                </li>
                <li>
                  <Link href="/queue" className="hover:text-emerald-600 transition-colors">
                    Virtual Walk-in Queue
                  </Link>
                </li>
              </ul>
            </div>

            {/* Account & Security */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">My Account</p>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link href="/appointments" className="hover:text-emerald-600 transition-colors">
                    My Bookings
                  </Link>
                </li>
                <li>
                  <Link href="/payments" className="hover:text-emerald-600 transition-colors">
                    Receipts & Payments
                  </Link>
                </li>
                <li>
                  <Link href="/notifications" className="hover:text-emerald-600 transition-colors">
                    Live Alerts
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="hover:text-emerald-600 transition-colors">
                    Profile & Password
                  </Link>
                </li>
              </ul>
            </div>

            {/* Platform Guarantees */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">Customer Promise</p>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified salons & stylists</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-time slot availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Live remote queue sync</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} SalonDirect Platform. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Crafted for effortless grooming & salon experiences
            </p>
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
};