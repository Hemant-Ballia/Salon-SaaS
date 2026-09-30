"use client";

import React, { useState, useRef, useEffect } from "react";
import { Menu, Bell, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { usePathname } from "next/navigation";
import NextLink from "next/link";

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

function getInitials(name?: string | null): string {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  // Contextual title
  const currentSection = pathname.split("/")[1] || "dashboard";
  const displayTitle =
    title ||
    (currentSection === "dashboard"
      ? "Dashboard"
      : currentSection.charAt(0).toUpperCase() + currentSection.slice(1).replace(/-/g, " "));

  const initials = getInitials(user?.name);

  return (
    <header className="shrink-0 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6 z-30 select-none">
      {/* Left: Contextual Page Information */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-sm sm:text-base font-semibold tracking-tight text-slate-900 truncate">
          {displayTitle}
        </h1>
      </div>

      {/* Right: Utility Controls (Notifications & Minimal Profile Avatar) */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Notifications Icon */}
        <NextLink
          href="/notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />
        </NextLink>

        {/* Profile Avatar Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            ref={triggerRef}
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white font-semibold text-xs tracking-wider border border-slate-800 shadow-xs hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 transition-colors cursor-pointer select-none"
            aria-expanded={profileOpen}
            aria-haspopup="true"
            aria-label="Open account menu"
          >
            {initials}
          </button>

          {/* Minimal Production Dropdown Menu */}
          {profileOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              aria-label="Account options"
              className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-md p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-75"
            >
              <NextLink
                href="/settings"
                role="menuitem"
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50 focus:text-slate-900 focus:outline-none transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-slate-400" />
                Settings
              </NextLink>

              <button
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50/70 focus:bg-rose-50/70 focus:outline-none transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-500" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
