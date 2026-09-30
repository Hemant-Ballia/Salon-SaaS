"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  CreditCard,
  Users,
  Shield,
  Info,
  Clock,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/context/auth-context";
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from "@/lib/api/notifications";
import { formatDate, formatTime } from "@/lib/utils";
import { Notification } from "@/types/models";

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotificationsApi({ limit: 50 }),
    enabled: isAuthenticated,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationReadApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsReadApi(),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update notifications");
    },
  });

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <Bell className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Sign In to View Notifications
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Stay updated with real-time booking confirmations, queue announcements, and receipts.
          </p>
          <Link href="/login?redirect=/notifications">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-xs">
              Sign In to Continue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const allNotifications: Notification[] = data?.data || [];
  const notifications = filterUnreadOnly
    ? allNotifications.filter((n) => !n.isRead)
    : allNotifications;
  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "APPOINTMENT_CREATED":
      case "APPOINTMENT_CONFIRMED":
      case "APPOINTMENT_CANCELLED":
      case "APPOINTMENT_RESCHEDULED":
      case "APPOINTMENT_REMINDER":
        return <Calendar className="w-5 h-5 text-emerald-600" />;
      case "QUEUE_UPDATE":
        return <Users className="w-5 h-5 text-amber-600" />;
      case "PAYMENT_SUCCESS":
      case "PAYMENT_FAILED":
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time updates regarding your bookings, queue calls, and payments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filterUnreadOnly
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"
            }`}
          >
            {filterUnreadOnly ? "Showing Unread" : "Show Unread Only"}
          </button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="gap-1.5 text-xs rounded-xl border-slate-200 hover:border-emerald-400 font-semibold text-slate-700"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications Feed */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center shadow-xs">
          <EmptyState
            icon={Bell}
            title={filterUnreadOnly ? "No unread alerts" : "You are all caught up!"}
            description="Booking updates, live queue announcements, and receipts will appear here automatically."
            action={
              filterUnreadOnly ? (
                <Button variant="outline" onClick={() => setFilterUnreadOnly(false)} className="mt-2 rounded-xl">
                  Show All Notifications
                </Button>
              ) : (
                <Link href="/appointments">
                  <Button className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
                    Check My Appointments
                  </Button>
                </Link>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (!item.isRead) markReadMutation.mutate(item.id);
              }}
              className={`p-4 sm:p-5 rounded-2xl border flex items-start justify-between gap-4 transition-all cursor-pointer ${
                !item.isRead
                  ? "bg-emerald-50/40 border-emerald-200 shadow-xs"
                  : "bg-white border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  {getIcon(item.type)}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {item.title}
                    </h4>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(item.createdAt)} {formatTime(item.createdAt)}</span>
                    <span>•</span>
                    <span className="capitalize">{item.channel.toLowerCase()}</span>
                  </div>
                </div>
              </div>

              {!item.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markReadMutation.mutate(item.id);
                  }}
                  title="Mark read"
                  className="text-slate-400 hover:text-emerald-700 p-1 shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}