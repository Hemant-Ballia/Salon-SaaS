"use client";

import React from "react";
import { Menu, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useSocket } from "@/context/socket-context";
import { StatusBadge } from "@/components/ui/status-badge";

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, title }) => {
  const { business } = useAuth();
  const { isConnected } = useSocket();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {title && (
          <h1 className="text-base font-semibold text-slate-900 tracking-tight sm:text-lg">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
            isConnected
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          {isConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <Wifi className="h-3 w-3" />
              <span className="hidden sm:inline">Live Queue Sync</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span className="hidden sm:inline">Reconnecting...</span>
            </>
          )}
        </div>

        {business && (
          <div className="flex items-center gap-2">
            <StatusBadge status={business.status} />
          </div>
        )}
      </div>
    </header>
  );
};
