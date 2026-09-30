"use client";

import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { useSocket } from "@/context/socket-context";
import { 
  getStaffQueueApi 
} from "@/lib/api/staff";
import { 
  callQueueEntryApi, 
  serveQueueEntryApi, 
  completeQueueEntryApi, 
  skipQueueEntryApi 
} from "@/lib/api/queue";
import { QueueEntry } from "@/types/models";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Radio, 
  PhoneCall, 
  Play, 
  CheckCircle2, 
  SkipForward, 
  Clock, 
  Users, 
  Sparkles, 
  RefreshCw 
} from "lucide-react";

export default function StaffQueuePage() {
  const queryClient = useQueryClient();
  const { staffId, staff, user } = useAuth();
  const { socket, isConnected } = useSocket();

  const { data: queue = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["staff-queue-live", staffId],
    queryFn: () => (staffId ? getStaffQueueApi(staffId) : []),
    enabled: !!staffId,
    refetchInterval: 10000,
  });

  // Socket.IO event listeners for real-time queue synchronization
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["staff-queue-live"] });
      queryClient.invalidateQueries({ queryKey: ["staff-queue"] });
    };

    socket.on("queue:joined", handleUpdate);
    socket.on("queue:entry_updated", handleUpdate);
    socket.on("queue:called", handleUpdate);
    socket.on("queue:serving", handleUpdate);
    socket.on("queue:completed", handleUpdate);
    socket.on("queue:skipped", handleUpdate);
    socket.on("queue:left", handleUpdate);

    return () => {
      socket.off("queue:joined", handleUpdate);
      socket.off("queue:entry_updated", handleUpdate);
      socket.off("queue:called", handleUpdate);
      socket.off("queue:serving", handleUpdate);
      socket.off("queue:completed", handleUpdate);
      socket.off("queue:skipped", handleUpdate);
      socket.off("queue:left", handleUpdate);
    };
  }, [socket, queryClient]);

  const callMutation = useMutation({
    mutationFn: callQueueEntryApi,
    onSuccess: () => {
      toast.success("Customer called to counter");
      queryClient.invalidateQueries({ queryKey: ["staff-queue-live"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to call entry");
    },
  });

  const serveMutation = useMutation({
    mutationFn: serveQueueEntryApi,
    onSuccess: () => {
      toast.success("Treatment started");
      queryClient.invalidateQueries({ queryKey: ["staff-queue-live"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to start service");
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeQueueEntryApi,
    onSuccess: () => {
      toast.success("Service completed!");
      queryClient.invalidateQueries({ queryKey: ["staff-queue-live"] });
      queryClient.invalidateQueries({ queryKey: ["staff-performance"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to complete entry");
    },
  });

  const skipMutation = useMutation({
    mutationFn: skipQueueEntryApi,
    onSuccess: () => {
      toast.warning("Customer marked as skipped");
      queryClient.invalidateQueries({ queryKey: ["staff-queue-live"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to skip entry");
    },
  });

  const servingEntries = queue.filter((e) => e.status === "SERVING");
  const calledEntries = queue.filter((e) => e.status === "CALLED");
  const waitingEntries = queue.filter((e) => e.status === "WAITING");

  const upNextEntries = waitingEntries.slice(0, 2);
  const remainingWaiting = waitingEntries.slice(2);

  const businessName = staff?.business?.name || user?.staffProfile?.business?.name || "Floor Counter";

  return (
    <div className="space-y-6">
      {/* Top Header & Connection Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Live Queue
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isConnected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              {isConnected ? "Live Counter Sync" : "Connecting..."}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {businessName} • Operational floor queue and client seating console.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          isLoading={isRefetching}
          className="gap-1.5 self-start sm:self-auto text-xs font-medium h-9 text-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. NOW SERVING (High-Impact Operational Hero) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Now Serving
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {servingEntries.length} Active in Chair
              </span>
            </div>

            {servingEntries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {servingEntries.map((entry) => {
                  const clientName =
                    entry.customerName ||
                    entry.customer?.user?.displayName ||
                    entry.customer?.user?.name ||
                    "Walk-in Guest";

                  return (
                    <div
                      key={entry.id}
                      className="p-5 rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/40 shadow-xs flex flex-col justify-between space-y-5"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                            In Chair
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            Token Assigned
                          </span>
                        </div>

                        <div className="mt-3">
                          <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                            #{entry.tokenNumber}
                          </div>
                          <h2 className="text-lg font-bold text-slate-800 mt-1">
                            {clientName}
                          </h2>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            {entry.serviceName || entry.service?.name || "General Treatment"}
                          </p>
                        </div>
                      </div>

                      {/* State-driven actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-emerald-200/60">
                        <Button
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9 gap-1.5 shadow-xs"
                          isLoading={completeMutation.isPending}
                          onClick={() => completeMutation.mutate(entry.id)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Complete Service
                        </Button>
                        <Button
                          variant="outline"
                          className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium h-9 px-3"
                          isLoading={skipMutation.isPending}
                          onClick={() => skipMutation.mutate(entry.id)}
                        >
                          Skip
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1 shadow-xs">
                <p className="font-bold text-slate-800 text-sm">Chair is Available</p>
                <p className="text-xs text-slate-500">
                  Call the next guest from the waiting line below to begin service.
                </p>
              </div>
            )}
          </div>

          {/* 2. CALLED GUESTS (Waiting to be seated) */}
          {calledEntries.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                Called Guests (Proceeding to Chair)
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {calledEntries.map((entry) => {
                  const clientName =
                    entry.customerName ||
                    entry.customer?.user?.displayName ||
                    entry.customer?.user?.name ||
                    "Walk-in Guest";

                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded-2xl border border-sky-200 bg-sky-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-slate-900">
                            #{entry.tokenNumber}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-200 text-sky-800">
                            Called
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{clientName}</p>
                        <p className="text-xs text-slate-500">
                          {entry.serviceName || entry.service?.name || "General Service"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          className="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs h-8 px-3 gap-1.5"
                          isLoading={serveMutation.isPending}
                          onClick={() => serveMutation.mutate(entry.id)}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Start Service
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-slate-800 text-xs h-8 px-2"
                          isLoading={skipMutation.isPending}
                          onClick={() => skipMutation.mutate(entry.id)}
                        >
                          Skip
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. UP NEXT (First 1-2 in line) */}
          {upNextEntries.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Up Next
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upNextEntries.map((entry) => {
                  const clientName =
                    entry.customerName ||
                    entry.customer?.user?.displayName ||
                    entry.customer?.user?.name ||
                    "Walk-in Guest";

                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 font-black flex items-center justify-center text-sm shrink-0 border border-amber-200/60">
                          #{entry.tokenNumber}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{clientName}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {entry.serviceName || entry.service?.name || "General Service"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-8 px-3 gap-1"
                          isLoading={callMutation.isPending}
                          onClick={() => callMutation.mutate(entry.id)}
                        >
                          <PhoneCall className="w-3 h-3" />
                          Call
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-slate-700 text-xs h-8 px-2"
                          isLoading={skipMutation.isPending}
                          onClick={() => skipMutation.mutate(entry.id)}
                        >
                          Skip
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. WAITING QUEUE TABLE / LIST */}
          <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                Waiting Line ({waitingEntries.length})
              </span>
              <span className="text-xs text-slate-400">Realtime FIFO order</span>
            </div>

            {waitingEntries.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No customers are currently waiting in the lobby queue.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {waitingEntries.map((entry, idx) => {
                  const clientName =
                    entry.customerName ||
                    entry.customer?.user?.displayName ||
                    entry.customer?.user?.name ||
                    "Walk-in Guest";

                  return (
                    <div
                      key={entry.id}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="w-6 text-center text-slate-400 font-semibold text-[11px]">
                          {idx + 1}
                        </span>
                        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs shrink-0">
                          #{entry.tokenNumber}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{clientName}</p>
                          <p className="text-slate-500 text-xs">
                            {entry.serviceName || entry.service?.name || "Treatment"}
                            {entry.estimatedWaitMinutes ? (
                              <span className="text-slate-400 ml-2">
                                • ~{entry.estimatedWaitMinutes}m wait
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-medium h-7 px-2.5 gap-1"
                          isLoading={callMutation.isPending}
                          onClick={() => callMutation.mutate(entry.id)}
                        >
                          <PhoneCall className="w-3 h-3" />
                          Call Token
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-slate-700 text-xs h-7 px-2"
                          isLoading={skipMutation.isPending}
                          onClick={() => skipMutation.mutate(entry.id)}
                        >
                          Skip
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}