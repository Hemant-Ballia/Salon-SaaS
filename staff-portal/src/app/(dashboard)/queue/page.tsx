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
  const { staffId } = useAuth();
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

  return (
    <div className="space-y-6">
      {/* Header & Connection Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Counter Live Queue
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isConnected
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              {isConnected ? "Socket.IO Live" : "Polling"}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Tap call, serve, complete or skip to manage your floor operations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          isLoading={isRefetching}
          className="gap-2 self-start sm:self-auto text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Serving Section */}
          {servingEntries.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                Active Counter Client
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {servingEntries.map((entry) => {
                  const clientName =
                    entry.customerName || entry.customer?.user?.displayName || entry.customer?.user?.name || "Walk-in Guest";

                  return (
                    <Card key={entry.id} className="border-2 border-emerald-500 bg-emerald-50/40 shadow-md">
                      <CardContent className="p-6 flex flex-col justify-between h-full space-y-6">
                        <div>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-800">
                            Currently In Chair
                          </span>
                          <div className="mt-3">
                            <span className="text-3xl sm:text-4xl font-black text-slate-900">
                              Token #{entry.tokenNumber}
                            </span>
                            <h3 className="text-lg font-bold text-slate-800 mt-1">
                              {clientName}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Service: {entry.serviceName || entry.service?.name || "General Service"}
                            </p>
                          </div>
                        </div>

                        {/* Large Actionable Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-emerald-200/60">
                          <Button
                            size="lg"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-extrabold text-base gap-2 shadow-md shadow-emerald-700/20"
                            isLoading={completeMutation.isPending}
                            onClick={() => completeMutation.mutate(entry.id)}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            Finish & Complete
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            className="border-amber-300 text-amber-800 hover:bg-amber-50 font-bold text-base gap-2"
                            isLoading={skipMutation.isPending}
                            onClick={() => skipMutation.mutate(entry.id)}
                          >
                            <SkipForward className="w-5 h-5" />
                            Skip
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            /* No Client in Chair Alert */
            <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-2 shadow-xs">
              <p className="font-bold text-slate-900 text-base">Counter is Available</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Call the next customer from the waiting list below to start their treatment.
              </p>
            </div>
          )}

          {/* Called / Waiting At Desk Section */}
          {calledEntries.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-800 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-blue-600" />
                Called Guests (Waiting to Seat)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calledEntries.map((entry) => {
                  const clientName =
                    entry.customerName || entry.customer?.user?.displayName || entry.customer?.user?.name || "Walk-in Guest";

                  return (
                    <Card key={entry.id} className="border border-blue-300 bg-blue-50/30">
                      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            Called
                          </span>
                          <h4 className="text-2xl font-black text-slate-900 mt-1">
                            Token #{entry.tokenNumber}
                          </h4>
                          <p className="text-sm font-bold text-slate-800">{clientName}</p>
                          <p className="text-xs text-slate-500">
                            {entry.serviceName || entry.service?.name || "General Service"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 sm:pt-0">
                          <Button
                            size="lg"
                            className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
                            isLoading={serveMutation.isPending}
                            onClick={() => serveMutation.mutate(entry.id)}
                          >
                            <Play className="w-4 h-4" />
                            Start Service
                          </Button>
                          <Button
                            size="lg"
                            variant="ghost"
                            className="text-amber-700 hover:bg-amber-50"
                            isLoading={skipMutation.isPending}
                            onClick={() => skipMutation.mutate(entry.id)}
                          >
                            Skip
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Waiting Queue List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Waiting Line ({waitingEntries.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {waitingEntries.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No customers waiting in queue.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {waitingEntries.map((entry, idx) => {
                    const clientName =
                      entry.customerName || entry.customer?.user?.displayName || entry.customer?.user?.name || "Walk-in Guest";

                    return (
                      <div
                        key={entry.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 font-black flex items-center justify-center text-xs shrink-0">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-emerald-700">
                                Token #{entry.tokenNumber}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">
                                ({entry.estimatedWaitMinutes ? `${entry.estimatedWaitMinutes}m wait` : "Up next"})
                              </span>
                            </div>
                            <p className="font-bold text-slate-900 text-sm">{clientName}</p>
                            <p className="text-xs text-slate-500">
                              {entry.serviceName || entry.service?.name || "General Service"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button
                            size="md"
                            variant="outline"
                            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold gap-1.5"
                            isLoading={callMutation.isPending}
                            onClick={() => callMutation.mutate(entry.id)}
                          >
                            <PhoneCall className="w-4 h-4" />
                            Call Token
                          </Button>
                          <Button
                            size="md"
                            variant="ghost"
                            className="text-amber-700 hover:bg-amber-50 text-xs"
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}