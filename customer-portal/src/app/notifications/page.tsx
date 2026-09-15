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
import { CustomerLayout } from "@/components/layout/customer-layout";
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
      <CustomerLayout>
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </CustomerLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <CustomerLayout>
        <div className="max-w-md mx-auto py-16 text-center">
          <Card className="p-8">
            <Bell className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Sign In to View Notifications
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Stay updated with booking confirmations, live queue alerts, and exclusive salon offers.
            </p>
            <Link href="/login?redirect=/notifications">
              <Button className="w-full">Sign In to Continue</Button>
            </Link>
          </Card>
        </div>
      </CustomerLayout>
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
        return <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case "QUEUE_UPDATE":
        return <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case "PAYMENT_SUCCESS":
      case "PAYMENT_FAILED":
        return <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Info className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />;
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Real-time updates regarding your bookings, queue calls, and payments
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                filterUnreadOnly
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-300"
                  : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
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
                className="gap-1.5 text-xs"
              >
                <CheckCheck className="w-3.5 h-3.5" />
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
          <Card className="p-8">
            <EmptyState
              icon={Bell}
              title={filterUnreadOnly ? "No unread alerts" : "You are all caught up!"}
              description="Booking updates, live queue announcements, and receipts will appear here in real time."
              action={
                filterUnreadOnly ? (
                  <Button variant="outline" onClick={() => setFilterUnreadOnly(false)} className="mt-2">
                    Show All Notifications
                  </Button>
                ) : (
                  <Link href="/home">
                    <Button className="mt-2">Go to Dashboard</Button>
                  </Link>
                )
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <Card
                key={item.id}
                onClick={() => {
                  if (!item.isRead) markReadMutation.mutate(item.id);
                }}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-all cursor-pointer ${
                  !item.isRead
                    ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/80"
                    : "hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    {getIcon(item.type)}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(item.createdAt)} {formatTime(item.createdAt)}</span>
                      <span>â€¢</span>
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
                    className="text-neutral-400 hover:text-indigo-600 p-1 shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}