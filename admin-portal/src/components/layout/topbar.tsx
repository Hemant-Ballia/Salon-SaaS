"use client";

import React from "react";
import { Menu, Shield } from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, title }) => {
  

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
        {/* Backend API Health indicator */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          API Connected (v1)
        </div>

        {/* Role Pill */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
          <Shield className="h-3.5 w-3.5 text-emerald-600" />
          <span className="hidden md:inline text-slate-500">Role:</span>
          <span className="font-semibold text-slate-900">ADMIN</span>
        </div>
      </div>
    </header>
  );
};
