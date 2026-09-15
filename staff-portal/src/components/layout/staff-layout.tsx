"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { Topbar } from "./topbar";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

export const StaffLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({
  children,
  title,
}) => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-slate-500">Checking staff credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased">
      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0 pb-16 lg:pb-0">
        <Topbar title={title} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
};