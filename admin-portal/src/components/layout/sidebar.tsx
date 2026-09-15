"use client";

import React from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import {
  LayoutDashboard,
  Users,
  Store,
  UserCheck,
  UserPlus,
  Calendar,
  CreditCard,
  FileText,
  Settings,
  UserCircle,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Businesses", href: "/businesses", icon: Store },
  { label: "Staff", href: "/staff", icon: UserCheck },
  { label: "Customers", href: "/customers", icon: UserPlus },
  { label: "Appointments", href: "/appointments", icon: Calendar },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Audit Logs", href: "/audit-logs", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
          <NextLink href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-slate-900">SalonSaaS</span>
              <span className="ml-1.5 rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                ADMIN
              </span>
            </div>
          </NextLink>

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Platform Operations
          </div>
          {navItems.map((item) => {
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0",
                    isActive ? "text-emerald-600" : "text-slate-400"
                  )}
                />
                {item.label}
              </NextLink>
            );
          })}
        </div>

        {/* User Account / Footer */}
        <div className="border-t border-slate-100 p-3">
          <NextLink
            href="/profile"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg p-2 text-sm transition-colors hover:bg-slate-50",
              pathname === "/profile" ? "bg-slate-50" : ""
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <UserCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 truncate">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {user?.name || "Admin"}
              </div>
              <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
            </div>
          </NextLink>

          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};
