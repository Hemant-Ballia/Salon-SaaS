"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getBusinessTheme } from "@/config/business-theme";
import {
  Menu,
  Search,
  Bell,
  Calendar as CalendarIcon,
  ChevronDown,
  User as UserIcon,
  Settings,
  LogOut,
} from "lucide-react";
import NextLink from "next/link";

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { user, business, logout } = useAuth();
  const theme = getBusinessTheme(business?.businessType);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const dayStr = today.toLocaleDateString("en-US", { weekday: "long" });

  const ownerName = user?.name || "Business Owner";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/70 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile Menu & Business Identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
                {business?.name || "My Business"}
              </h1>
              <span className="hidden sm:inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200/60">
                {theme.categoryLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 sm:hidden">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-600">
                {theme.categoryLabel}
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Open
          </span>
        </div>
      </div>

      {/* Right: Notifications, Date Widget, Profile Menu */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Notification Bell */}
        <NextLink
          href="/notifications"
          className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </NextLink>

        {/* Date Display (Visible on SM screens and up) */}
        <div className="hidden md:flex items-center gap-2 border-l border-slate-200/70 pl-4 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <CalendarIcon className="h-3.5 w-3.5" />
          </div>
          <div className="leading-tight">
            <div className="text-xs font-bold text-slate-900">{dateStr}</div>
            <div className="text-[10px] text-slate-400 font-medium">{dayStr}</div>
          </div>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative border-l border-slate-200/70 pl-3 sm:pl-4" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-slate-100/70 transition"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300">
              {ownerName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-bold text-slate-900">{ownerName}</div>
              <div className="text-[10px] text-slate-400 font-medium">Business Owner</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white p-1.5 shadow-lg border border-slate-100 z-50 text-xs text-slate-700 space-y-0.5">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">{ownerName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <NextLink
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50 transition font-medium"
              >
                <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                Profile
              </NextLink>

              <NextLink
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50 transition font-medium"
              >
                <Settings className="h-3.5 w-3.5 text-slate-400" />
                Business Settings
              </NextLink>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50 transition font-medium"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
