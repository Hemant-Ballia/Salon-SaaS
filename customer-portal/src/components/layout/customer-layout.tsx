"use client";

import React from "react";
import { Navbar } from "./navbar";
import { BottomNav } from "./bottom-nav";

export const CustomerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-900 flex flex-col antialiased">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-8">{children}</main>
      <BottomNav />
    </div>
  );
};