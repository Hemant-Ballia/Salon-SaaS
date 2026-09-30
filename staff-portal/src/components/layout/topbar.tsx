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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 shrink-0">
      {/* Left: Title + Business Context */}
      <div className="flex items-center gap-2.5 min-w-0">
        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
          {title || "Staff Workspace"}
        </h2>
        {staff?.business?.name && (
          <span className="hidden sm:inline-flex items-center text-xs text-slate-400 font-medium truncate">
            <span className="mx-1.5 text-slate-300">•</span>
            {staff.business.name}
          </span>
        )}
      </div>

      {/* Right: Shift status + Alerts + Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Current Shift / Realtime Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>On Shift</span>
        </div>

        {/* Alerts Bell */}
        <Link
          href="/notifications"
          className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </Link>

        {/* Profile Avatar */}
        <Link href="/profile" className="flex items-center gap-2 pl-1 group">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-2xs group-hover:bg-emerald-700 transition-colors">
            {(staff?.displayName || "S").slice(0, 2).toUpperCase()}
          </div>
        </Link>
      </div>
    </header>
  );
};