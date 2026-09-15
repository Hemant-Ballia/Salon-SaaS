"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getNotificationsApi, 
  markNotificationReadApi, 
  markAllNotificationsReadApi 
} from "@/lib/api/notifications";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { Bell, CheckCheck, Clock } from "lucide-react";

export default function StaffNotificationsPage() {
  const queryClient = useQueryClient();
  const [page] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["staff-notifications", page],
    queryFn: () => getNotificationsApi({ page, limit: 30 }),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["staff-notifications"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to mark all as read");
    },
  });

  const notifications = data?.data || [];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Workspace Alerts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Appointment schedules, queue token alerts and client activity.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            isLoading={markAllMutation.isPending}
            className="gap-2 text-xs font-bold self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
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
          description="You have no unread notifications or new messages."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                n.isRead
                  ? "bg-white border-slate-200 text-slate-600"
                  : "bg-emerald-50/40 border-emerald-300 text-slate-900 shadow-xs"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.isRead ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(n.createdAt)}
                  </p>
                </div>
              </div>

              {!n.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markReadMutation.mutate(n.id)}
                  className="text-xs text-emerald-700 hover:bg-emerald-100/50 font-bold h-7 px-2"
                >
                  Mark read
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}