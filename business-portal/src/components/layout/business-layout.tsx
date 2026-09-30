"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useAuth } from "@/context/auth-context";
import { getBusinessTheme } from "@/config/business-theme";
import { Loader2 } from "lucide-react";

interface BusinessLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const BusinessLayout: React.FC<BusinessLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { business, isLoading, isAuthenticated } = useAuth();
  const theme = getBusinessTheme(business?.businessType);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Loading business portal session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className={`flex min-h-screen font-sans text-slate-900 antialiased ${theme.main.bgClass}`}
    >
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1540px] w-full mx-auto">
          {children}
        </main>

        {/* Footer status matching Car Wash screenshot */}
        <footer className="px-6 py-4 border-t border-slate-200/50 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2 max-w-[1540px] w-full mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">SalonSaaS</span>
            <span>|</span>
            <span>{theme.categoryLabel} Management Platform</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>System Online</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
