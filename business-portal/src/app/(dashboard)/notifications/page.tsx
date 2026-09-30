"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getNotificationsApi, 
  markNotificationReadApi, 
  markAllNotificationsReadApi, 
  getNotificationPreferencesApi, 
  updateNotificationPreferencesApi 
} from "@/lib/api/notifications";
import { formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { 
  Bell, 
  CheckCheck, 
  Settings2, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Clock,
  CircleDot,
} from "lucide-react";

// Reusable toggle switch component
function ToggleSwitch({
  checked,
  onChange,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-emerald-500" : "bg-slate-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

const NOTIFICATION_TYPE_ICON: Record<string, string> = {
  appointment: "📅",
  queue: "🔢",
  payment: "💳",
  system: "⚙️",
  marketing: "📣",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterUnread, setFilterUnread] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => getNotificationsApi({ page, limit: 25 }),
  });

  const { data: prefData, isLoading: prefsLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => getNotificationPreferencesApi(),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to mark all as read");
    },
  });

  const updatePrefsMutation = useMutation({
    mutationFn: updateNotificationPreferencesApi,
    onSuccess: () => {
      toast.success("Notification preferences updated");
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update preferences");
    },
  });

  const notifications = data?.data || [];
  const displayedNotifications = filterUnread
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const prefs = prefData?.preferences || {
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: true,
    inAppEnabled: true,
  };

  const handlePrefToggle = (field: "emailEnabled" | "smsEnabled" | "whatsappEnabled" | "inAppEnabled") => {
    updatePrefsMutation.mutate({
      [field]: !prefs[field],
    });
  };

  const channels = [
    {
      key: "inAppEnabled" as const,
      label: "In-App Alerts",
      description: "Dashboard bell notifications",
      icon: Smartphone,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      key: "emailEnabled" as const,
      label: "Email Notifications",
      description: "Booking receipts and calendar invites",
      icon: Mail,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-50",
    },
    {
      key: "smsEnabled" as const,
      label: "SMS Alerts",
      description: "SMS reminders to client phone numbers",
      icon: MessageSquare,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
    },
    {
      key: "whatsappEnabled" as const,
      label: "WhatsApp Dispatch",
      description: "Instant WhatsApp queue updates",
      icon: MessageSquare,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            System alerts, appointment updates, and channel preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-600">
              <CircleDot className="w-3 h-3" />
              {unreadCount} unread
            </span>
          )}
          {notifications.some((n) => !n.isRead) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              isLoading={markAllMutation.isPending}
              className="gap-2 text-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications Feed */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filter Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setFilterUnread(false)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                !filterUnread
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterUnread(true)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                filterUnread
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Feed */}
          {isLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Failed to load notifications"
              description="Could not connect to notification service."
              onRetry={() => refetch()}
            />
          ) : displayedNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">
                {filterUnread ? "No unread alerts" : "All caught up!"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {filterUnread
                  ? "Switch to 'All' to view your notification history."
                  : "Appointment updates and system alerts will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`group flex items-start justify-between gap-4 rounded-xl border p-4 transition-colors ${
                    notif.isRead
                      ? "bg-white border-slate-100 hover:border-slate-200"
                      : "bg-emerald-50/50 border-emerald-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base mt-0.5 ${
                        notif.isRead ? "bg-slate-100" : "bg-emerald-100"
                      }`}
                    >
                      {NOTIFICATION_TYPE_ICON[
                        (notif as any).type?.toLowerCase() || "system"
                      ] || "🔔"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-semibold ${notif.isRead ? "text-slate-700" : "text-slate-900"}`}>
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(notif.createdAt)}
                      </p>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={() => markReadMutation.mutate(notif.id)}
                      className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 hover:bg-emerald-100 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Channel Preferences */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-emerald-600" />
              Delivery Channels
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Control which channels are used for customer alerts and appointment reminders.
            </p>
          </CardHeader>
          <CardContent className="space-y-1">
            {prefsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : (
              channels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <div
                    key={channel.key}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg ${channel.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${channel.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{channel.label}</p>
                        <p className="text-[11px] text-slate-400">{channel.description}</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      id={`toggle-${channel.key}`}
                      checked={prefs[channel.key]}
                      onChange={() => handlePrefToggle(channel.key)}
                      disabled={updatePrefsMutation.isPending}
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}