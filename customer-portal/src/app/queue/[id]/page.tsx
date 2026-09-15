"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Clock,
  MapPin,
  Sparkles,
  ArrowLeft,
  Bell,
  CheckCircle2,
  AlertCircle,
  Radio,
  Volume2,
  XCircle,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/context/auth-context";
import { useSocket } from "@/context/socket-context";
import { getQueueEntryByIdApi, leaveQueueApi } from "@/lib/api/queues";
import { formatTime } from "@/lib/utils";

const STEPS = [
  { key: "WAITING", label: "Waiting in Line" },
  { key: "CALLED", label: "Ready / Called" },
  { key: "SERVING", label: "In Service" },
  { key: "COMPLETED", label: "Completed" },
];

export default function QueueTrackerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [hasAlertedCall, setHasAlertedCall] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["queue-entry", id],
    queryFn: () => getQueueEntryByIdApi(id),
    enabled: !!id && isAuthenticated,
    refetchInterval: 10000, // Poll fallback every 10s
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveQueueApi(id),
    onSuccess: () => {
      toast.success("You have left the queue");
      queryClient.invalidateQueries({ queryKey: ["queue-entry", id] });
      router.push("/queue");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to leave queue");
    },
  });

  const entry = data?.entry;
  const position = data?.position ?? 1;

  // Real-time socket listeners
  useEffect(() => {
    if (!socket || !id) return;

    const handleQueueUpdate = (payload: any) => {
      if (payload?.entryId === id || payload?.id === id || payload?.entry?.id === id) {
        queryClient.invalidateQueries({ queryKey: ["queue-entry", id] });

        if (payload?.status === "CALLED" && !hasAlertedCall) {
          setHasAlertedCall(true);
          toast.success("🎉 You have been called! Please proceed to the counter or styling chair!", {
            duration: 10000,
          });
        }
      }
    };

    socket.on("queue:called", handleQueueUpdate);
    socket.on("queue:served", handleQueueUpdate);
    socket.on("queue:completed", handleQueueUpdate);
    socket.on("queue:skipped", handleQueueUpdate);
    socket.on("queue:updated", handleQueueUpdate);

    return () => {
      socket.off("queue:called", handleQueueUpdate);
      socket.off("queue:served", handleQueueUpdate);
      socket.off("queue:completed", handleQueueUpdate);
      socket.off("queue:skipped", handleQueueUpdate);
      socket.off("queue:updated", handleQueueUpdate);
    };
  }, [socket, id, queryClient, hasAlertedCall]);

  if (authLoading || isLoading) {
    return (
      <CustomerLayout>
        <div className="max-w-xl mx-auto space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </CustomerLayout>
    );
  }

  if (error || !entry) {
    return (
      <CustomerLayout>
        <div className="max-w-md mx-auto py-16 text-center">
          <Card className="p-8">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Queue Ticket Not Found
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              This ticket may have expired, completed, or been cancelled.
            </p>
            <Link href="/queue">
              <Button>Back to Queue Board</Button>
            </Link>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  const isCalled = entry.status === "CALLED";
  const isServing = entry.status === "SERVING";
  const isCompleted = entry.status === "COMPLETED";
  const isCancelled = entry.status === "CANCELLED" || entry.status === "SKIPPED";
  const canLeave = entry.status === "WAITING" || entry.status === "CALLED";

  const currentStepIndex =
    entry.status === "WAITING"
      ? 0
      : entry.status === "CALLED"
      ? 1
      : entry.status === "SERVING"
      ? 2
      : entry.status === "COMPLETED"
      ? 3
      : -1;

  return (
    <CustomerLayout>
      <div className="max-w-xl mx-auto space-y-6">
        {/* Navigation */}
        <Link
          href="/queue"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Queue Hub
        </Link>

        {/* Live Call Banner */}
        {isCalled && (
          <div className="p-4 rounded-2xl bg-amber-500 text-white flex items-center justify-between gap-3 shadow-lg shadow-amber-500/25 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Your turn has arrived!</h3>
                <p className="text-xs text-white/90">Please proceed directly to the styling chair.</p>
              </div>
            </div>
            <span className="text-xs bg-white text-amber-700 font-bold px-3 py-1 rounded-full uppercase">
              Called
            </span>
          </div>
        )}

        {/* Main Ticket Card */}
        <Card className="overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/50">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -left-8 -top-8 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold uppercase tracking-wider mb-4">
              <Radio className="w-3.5 h-3.5 animate-spin" />
              Live Virtual Ticket
            </div>

            <p className="text-xs text-indigo-100 font-medium">YOUR TOKEN NUMBER</p>
            <h1 className="text-6xl sm:text-7xl font-black font-mono tracking-tight my-2 drop-shadow-sm">
              #{entry.tokenNumber}
            </h1>

            <p className="text-sm font-semibold text-indigo-100 mt-1">
              {entry.queue?.name || "Main Walk-in Line"}
            </p>

            <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-center gap-4 text-xs text-indigo-200">
              <span>Joined at {formatTime(entry.joinedAt)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Sync
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Status Steps Progression */}
            {!isCancelled ? (
              <div className="relative">
                <div className="flex items-center justify-between">
                  {STEPS.map((step, idx) => {
                    const isDone = currentStepIndex > idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <div key={step.key} className="flex flex-col items-center z-10">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isDone
                              ? "bg-emerald-500 text-white"
                              : isCurrent
                              ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950/60"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs font-medium mt-1.5 text-center ${
                            isCurrent
                              ? "text-indigo-600 dark:text-indigo-400 font-bold"
                              : isDone
                              ? "text-neutral-700 dark:text-neutral-300"
                              : "text-neutral-400"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Connecting bar */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-200 dark:bg-neutral-800 -z-0" />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                <XCircle className="w-6 h-6 text-rose-500 mx-auto mb-1" />
                <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                  Ticket {entry.status}
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                  This queue ticket is no longer active.
                </p>
              </div>
            )}

            {/* Position and Wait Stats */}
            {!isCompleted && !isCancelled && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-center">
                  <span className="text-xs text-neutral-500 flex items-center justify-center gap-1 mb-1">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    Queue Position
                  </span>
                  <p className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
                    {position}
                  </p>
                  <span className="text-[11px] text-neutral-400">
                    {position === 1 ? "Next in line!" : `${position - 1} ahead of you`}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-center">
                  <span className="text-xs text-neutral-500 flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    Est. Wait Time
                  </span>
                  <p className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
                    ~{entry.estimatedWaitMinutes || 15}
                  </p>
                  <span className="text-[11px] text-neutral-400">minutes</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="text-xs"
              >
                Refresh Status
              </Button>

              {canLeave && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  onClick={() => setIsLeaveDialogOpen(true)}
                >
                  Leave Queue
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Leave Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isLeaveDialogOpen}
          title="Leave Queue"
          description="Are you sure you want to give up your spot in line? You will lose token #"
          confirmLabel="Yes, Leave Queue"
          cancelLabel="Stay in Line"
          isDanger
          onConfirm={() => leaveMutation.mutate()}
          onCancel={() => setIsLeaveDialogOpen(false)}
        />
      </div>
    </CustomerLayout>
  );
}