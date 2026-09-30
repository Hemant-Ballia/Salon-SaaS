"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { getNotificationsApi, markNotificationsReadApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  RefreshCw,
  MailCheck,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("ALL");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "notifications", { filterType }],
    queryFn: () =>
      getNotificationsApi<NotificationItem>({
        limit: 30,
        type: filterType !== "ALL" ? filterType : undefined,
      }),
  });

  const markAllMutation = useMutation({
    mutationFn: markNotificationsReadApi,
    onSuccess: () => {
      toast.success("All notifications marked as read.");
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    },
    onError: () => {
      toast.error("Failed to mark notifications as read.");
    },
  });

  const notifications: NotificationItem[] = data?.data || [];

  return (
    <AdminLayout title="Notifications & System Alerts">
      <div className="max-w-4xl mx-auto space-y-4 pb-12">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Bell className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Platform Alerts & Activity</h3>
              <p className="text-xs text-slate-500">
                System events, critical tenant actions, and cross-platform notifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin text-emerald-600" : ""}`} />
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              isLoading={markAllMutation.isPending}
              className="h-8.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-slate-200 gap-1.5 cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
              Mark All as Read
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/70 overflow-x-auto">
          {[
            { id: "ALL", label: "All Alerts" },
            { id: "APPOINTMENT", label: "Appointments" },
            { id: "PAYMENT", label: "Payments & Invoices" },
            { id: "SECURITY", label: "Security & Logins" },
            { id: "SYSTEM", label: "System Maintenance" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                filterType === tab.id
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading alerts...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <MailCheck className="h-10 w-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No Notifications</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You&apos;re completely caught up! No unread platform alerts or events found.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex items-start gap-3.5 transition-colors ${
                  item.isRead ? "bg-white hover:bg-slate-50/50" : "bg-emerald-50/25 hover:bg-emerald-50/40"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    item.type === "SECURITY"
                      ? "bg-rose-50 text-rose-600"
                      : item.type === "PAYMENT"
                      ? "bg-purple-50 text-purple-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {item.type === "SECURITY" ? (
                    <ShieldAlert className="h-4 w-4" />
                  ) : item.type === "PAYMENT" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.title || "Notification"}
                    </h4>
                    <span className="text-[10.5px] text-slate-400 shrink-0 font-medium">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.message}
                  </p>
                </div>

                {!item.isRead && (
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
