"use client";

import React from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import {
  LayoutDashboard,
  Store,
  UserCheck,
  UserPlus,
  Calendar,
  CreditCard,
  Zap,
  Bell,
  FileText,
  User,
  Settings,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavGroup {
  group: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const navGroups: NavGroup[] = [
  {
    group: "DASHBOARD",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    group: "MANAGEMENT",
    items: [
      { label: "Businesses", href: "/businesses", icon: Store },
      { label: "Customers", href: "/customers", icon: UserPlus },
      { label: "Staff", href: "/staff", icon: UserCheck },
      { label: "Appointments", href: "/appointments", icon: Calendar },
    ],
  },
  {
    group: "FINANCE",
    items: [
      { label: "Payments", href: "/payments", icon: CreditCard },
      { label: "Subscriptions", href: "/subscriptions", icon: Zap },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Audit Logs", href: "/audit-logs", icon: FileText },
    ],
  },
  {
    group: "ACCOUNT",
    items: [
      { label: "Profile", href: "/profile", icon: User },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

function getInitials(name?: string | null): string {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const initials = getInitials(user?.name);
  const displayName = user?.name || "Administrator";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-60 h-full flex-col border-r border-[#13382D] bg-[#0A1F19] text-slate-200 transition-transform duration-200 lg:static lg:translate-x-0 shrink-0 select-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-5 border-b border-[#13382D] shrink-0 bg-[#081813]">
          <NextLink href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">
              SalonSaaS
            </span>
          </NextLink>

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2.5 py-4 space-y-4">
          {navGroups.map((grp) => (
            <div key={grp.group} className="space-y-0.5">
              <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500/50">
                {grp.group}
              </div>
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <NextLink
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300 font-semibold border-l-2 border-emerald-400 pl-2"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-emerald-400"
                          : "text-slate-400 group-hover:text-slate-200"
                      )}
                    />
                    {item.label}
                  </NextLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom User Card */}
        <div className="p-3 border-t border-[#13382D] bg-[#071612] shrink-0">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-[#0B231C] p-2 border border-[#143B2F]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white font-semibold text-xs border border-emerald-500/30 select-none">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {displayName}
                </div>
                <div className="text-[10px] font-medium text-emerald-400/80 truncate">
                  Administrator
                </div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              title="Sign out"
              className="rounded p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
