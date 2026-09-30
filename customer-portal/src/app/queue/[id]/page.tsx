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
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
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
          toast.success("🎉 You have been called! Please proceed to the styling chair!", {
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
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Queue Ticket Not Found
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            This ticket may have expired, completed, or been cancelled.
          </p>
          <Link href="/queue">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
              Back to Queue Board
            </Button>
          </Link>
        </div>
      </div>
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
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Navigation */}
      <Link
        href="/queue"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Queue Hub
      </Link>

      {/* Live Call Alert Banner */}
      {isCalled && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500 text-white flex items-center justify-between gap-3 shadow-lg shadow-amber-500/25 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">You are being called!</h3>
              <p className="text-xs text-white/90">Please proceed directly to the stylist station.</p>
            </div>
          </div>
          <span className="text-xs bg-white text-amber-700 font-extrabold px-3 py-1 rounded-full uppercase shrink-0">
            Called
          </span>
        </div>
      )}

      {/* Main Ticket Card */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs">
        {/* Ticket Header */}
        <div className="bg-slate-900 p-7 text-white text-center border-b border-slate-800">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] font-semibold uppercase tracking-wider text-emerald-400 mb-3 border border-slate-700">
            <Radio className="w-3 h-3 animate-pulse" />
            Live Queue Ticket
          </div>

          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Your Token Number</p>
          <h1 className="text-5xl sm:text-6xl font-black font-mono tracking-tight my-2 text-white">
            #{entry.tokenNumber}
          </h1>

          <p className="text-xs font-semibold text-slate-300">
            {entry.queue?.name || "Main Walk-in Line"}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center gap-3 text-xs text-slate-400 font-medium">
            <span>Joined at {formatTime(entry.joinedAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Connected
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Status Steps Progression */}
          {!isCancelled ? (
            <div className="relative pt-2">
              <div className="flex items-center justify-between relative z-10">
                {STEPS.map((step, idx) => {
                  const isDone = currentStepIndex > idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? "bg-emerald-600 text-white shadow-xs"
                            : isCurrent
                            ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[11px] font-semibold mt-1.5 text-center ${
                          isCurrent
                            ? "text-emerald-700 font-bold"
                            : isDone
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Connecting bar */}
              <div className="absolute top-6.5 left-5 right-5 h-0.5 bg-slate-200 -z-0" />
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
              <XCircle className="w-6 h-6 text-rose-500 mx-auto mb-1" />
              <p className="text-sm font-bold text-rose-700">
                Ticket {entry.status}
              </p>
              <p className="text-xs text-rose-600 mt-0.5">
                This queue ticket is no longer active.
              </p>
            </div>
          )}

          {/* Position and Wait Stats */}
          {!isCompleted && !isCancelled && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-center">
                <span className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1 mb-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  Queue Position
                </span>
                <p className="text-3xl font-black text-slate-900">
                  {position}
                </p>
                <span className="text-[11px] text-slate-400 font-medium">
                  {position === 1 ? "Next in line!" : `${position - 1} ahead of you`}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-center">
                <span className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Est. Wait Time
                </span>
                <p className="text-3xl font-black text-slate-900">
                  ~{entry.estimatedWaitMinutes || 15}
                </p>
                <span className="text-[11px] text-slate-400 font-medium">minutes</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs rounded-xl border-slate-200 hover:border-emerald-400 gap-1.5 font-semibold text-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Status
            </Button>

            {canLeave && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold rounded-xl"
                onClick={() => setIsLeaveDialogOpen(true)}
              >
                Leave Queue
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Leave Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isLeaveDialogOpen}
        title="Leave Queue"
        description={`Are you sure you want to give up your spot in line? You will forfeit token #${entry.tokenNumber}.`}
        confirmLabel="Yes, Leave Queue"
        cancelLabel="Stay in Line"
        isDanger
        onConfirm={() => leaveMutation.mutate()}
        onCancel={() => setIsLeaveDialogOpen(false)}
      />
    </div>
  );
}