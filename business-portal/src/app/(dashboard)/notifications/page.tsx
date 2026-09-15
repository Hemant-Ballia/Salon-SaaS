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
  CheckCircle2, 
  Clock 
} from "lucide-react";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => getNotificationsApi({ page, limit: 25 }),
  });

  const { data: prefData } = useQuery({
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            System activity alerts, appointment updates, and customer messaging channel preferences.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            isLoading={markAllMutation.isPending}
            className="gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications Feed */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
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
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="All caught up!"
              description="You have no notifications or alerts at this moment."
            />
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-colors flex items-start justify-between gap-4 ${
                    notif.isRead
                      ? "bg-white border-slate-200 text-slate-600"
                      : "bg-emerald-50/40 border-emerald-200 text-slate-900"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.isRead
                          ? "bg-slate-100 text-slate-500"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{notif.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(notif.createdAt)}
                      </p>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markReadMutation.mutate(notif.id)}
                      className="text-xs text-emerald-700 hover:bg-emerald-100/50 h-7 px-2"
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Channel Preferences Card */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-emerald-600" />
              Delivery Channels
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Select which channels are active for customer appointment confirmations and queue alerts.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">In-App Alerts</p>
                  <p className="text-xs text-slate-400">Dashboard bell notifications</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.inAppEnabled}
                onChange={() => handlePrefToggle("inAppEnabled")}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Email Notifications</p>
                  <p className="text-xs text-slate-400">Booking receipts and calendar invites</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.emailEnabled}
                onChange={() => handlePrefToggle("emailEnabled")}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">SMS Alerts</p>
                  <p className="text-xs text-slate-400">SMS reminders to client phone numbers</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.smsEnabled}
                onChange={() => handlePrefToggle("smsEnabled")}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">WhatsApp Dispatch</p>
                  <p className="text-xs text-slate-400">Instant WhatsApp queue updates</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.whatsappEnabled}
                onChange={() => handlePrefToggle("whatsappEnabled")}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}