"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useSocket } from "@/context/socket-context";
import { Bell, Radio } from "lucide-react";

export const Topbar: React.FC<{ title?: string }> = ({ title }) => {
  const { staff } = useAuth();
  const { isConnected } = useSocket();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          {title || "Staff Workspace"}
        </h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live Status indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isConnected
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isConnected ? "animate-pulse text-emerald-600" : "text-amber-500"}`} />
          <span className="hidden sm:inline">{isConnected ? "Live Connected" : "Connecting..."}</span>
        </div>

        {/* Alerts Bell */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-5 h-5" />
        </Link>

        {/* Mobile Specialist Avatar */}
        <Link href="/profile" className="lg:hidden flex items-center">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shadow-xs">
            {(staff?.displayName || "S").slice(0, 2).toUpperCase()}
          </div>
        </Link>
      </div>
    </header>
  );
};