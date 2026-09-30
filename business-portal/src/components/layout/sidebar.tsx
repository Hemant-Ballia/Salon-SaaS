"use client";

import React from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users2,
  Users,
  Layers,
  QrCode,
  Crown,
  Bell,
  Settings,
  LogOut,
  X,
  Store,
  Award,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getBusinessDashboardApi } from "@/lib/api/business";
import { getBusinessTheme } from "@/config/business-theme";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, business, logout } = useAuth();
  const theme = getBusinessTheme(business?.businessType);

  // Fetch light counts for badges
  const { data: dashData } = useQuery({
    queryKey: ["business", "dashboard", business?.id, "sidebar"],
    queryFn: () => (business?.id ? getBusinessDashboardApi(business.id) : null),
    enabled: !!business?.id,
    staleTime: 60 * 1000,
  });

  const apptBadge = dashData?.stats?.todayAppointments || 0;
  const queueBadge = dashData?.stats?.activeQueueCount || 0;

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      label: "Appointments",
      href: "/appointments",
      icon: Calendar,
      badge: apptBadge > 0 ? apptBadge : undefined,
    },
    {
      label: "Queue",
      href: "/queue",
      icon: Layers,
      badge: queueBadge > 0 ? queueBadge : undefined,
    },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Staff", href: "/staff", icon: Users2 },
    {
      label: "Services",
      href: "/services",
      icon: Scissors,
    },
    { label: "QR Booking", href: "/qr", icon: QrCode },
    { label: "Staff Compensation", href: "/incentives", icon: Award },
    {
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
    },
    { label: "Subscription", href: "/subscription", icon: Crown },
  ];

  const businessDisplayId =
    dashData?.qrCode?.token ||
    (business?.id ? business.id.slice(0, 8).toUpperCase() : "PORTAL");

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-200 transition-transform duration-200 lg:static lg:translate-x-0 select-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top Brand Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800">
          <NextLink href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <Store className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-sm block leading-tight">
                SalonSaaS
              </span>
              <span className="text-[10px] font-medium text-emerald-400 block leading-tight uppercase tracking-wider">
                {theme.categoryLabel}
              </span>
            </div>
          </NextLink>

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <NextLink
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all group",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/10 text-slate-400 group-hover:text-white"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </NextLink>
            );
          })}
        </div>

        {/* Bottom utility links: Settings & Profile */}
        <div className="px-3 py-2 border-t border-slate-800/80 space-y-0.5">
          <NextLink
            href="/settings"
            onClick={onClose}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
              pathname.startsWith("/settings")
                ? "bg-emerald-500/15 text-emerald-400 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </NextLink>

          <NextLink
            href="/profile"
            onClick={onClose}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
              pathname.startsWith("/profile")
                ? "bg-emerald-500/15 text-emerald-400 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>Profile</span>
          </NextLink>
        </div>

        {/* Bottom Business Profile Card */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center justify-between rounded-lg p-2 text-xs bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-emerald-700 border border-emerald-600/30 flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden">
                {business?.name ? business.name.charAt(0).toUpperCase() : "B"}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white truncate max-w-[100px] text-xs">
                    {business?.name || "My Business"}
                  </span>
                  <span className="rounded bg-emerald-500/20 text-emerald-400 px-1 py-0.2 text-[9px] font-semibold border border-emerald-500/30">
                    Active
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate font-mono">
                  ID: {businessDisplayId}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded transition-colors cursor-pointer"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
