"use client";

import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getLiveQueueApi, 
  callQueueEntryApi, 
  serveQueueEntryApi, 
  completeQueueEntryApi, 
  skipQueueEntryApi 
} from "@/lib/api/queue";
import { useSocket } from "@/context/socket-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  PhoneCall, 
  Play, 
  CheckCircle2, 
  SkipForward, 
  Clock, 
  Radio, 
  RefreshCw,
  Layers,
  UserCheck
} from "lucide-react";

export default function QueuePage() {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const { data: queueEntries = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["live-queue"],
    queryFn: () => getLiveQueueApi(),
    refetchInterval: 8000,
  });

  // Real-time Socket.IO synchronization
  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["live-queue"] });
      queryClient.invalidateQueries({ queryKey: ["business", "dashboard"] });
    };

    socket.on("queue:joined", handleQueueUpdate);
    socket.on("queue:entry_updated", handleQueueUpdate);
    socket.on("queue:left", handleQueueUpdate);
    socket.on("queue:called", handleQueueUpdate);
    socket.on("queue:serving", handleQueueUpdate);
    socket.on("queue:completed", handleQueueUpdate);
    socket.on("queue:skipped", handleQueueUpdate);

    return () => {
      socket.off("queue:joined", handleQueueUpdate);
      socket.off("queue:entry_updated", handleQueueUpdate);
      socket.off("queue:left", handleQueueUpdate);
      socket.off("queue:called", handleQueueUpdate);
      socket.off("queue:serving", handleQueueUpdate);
      socket.off("queue:completed", handleQueueUpdate);
      socket.off("queue:skipped", handleQueueUpdate);
    };
  }, [socket, queryClient]);

  const callMutation = useMutation({
    mutationFn: callQueueEntryApi,
    onSuccess: () => {
      toast.success("Customer called to counter");
      queryClient.invalidateQueries({ queryKey: ["live-queue"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to call customer");
    },
  });

  const serveMutation = useMutation({
    mutationFn: serveQueueEntryApi,
    onSuccess: () => {
      toast.success("Service started");
      queryClient.invalidateQueries({ queryKey: ["live-queue"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to start service");
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeQueueEntryApi,
    onSuccess: () => {
      toast.success("Queue service completed");
      queryClient.invalidateQueries({ queryKey: ["live-queue"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to complete entry");
    },
  });

  const skipMutation = useMutation({
    mutationFn: skipQueueEntryApi,
    onSuccess: () => {
      toast.warning("Customer marked as skipped");
      queryClient.invalidateQueries({ queryKey: ["live-queue"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to skip entry");
    },
  });

  const servingEntries = queueEntries.filter((e) => e.status === "SERVING");
  const calledEntries = queueEntries.filter((e) => e.status === "CALLED");
  const waitingEntries = queueEntries.filter((e) => e.status === "WAITING");
  const completedCount = queueEntries.filter((e) => e.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Live Queue Counter
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isConnected
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              {isConnected ? "Realtime Connected" : "Polling Active"}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dedicated operational counter workspace: token calls, service starts, and walk-in flows.
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

      {/* Operational Counter KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 tracking-wider uppercase">
            Now Serving
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {servingEntries.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-blue-700 tracking-wider uppercase">
            Called / Next
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {calledEntries.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 tracking-wider uppercase">
            Waiting Line
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {waitingEntries.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Completed Today
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {completedCount}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: NOW SERVING */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Now Serving
              </h2>
            </div>

            {servingEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <p className="text-xs font-semibold text-slate-600">
                  No customer currently being served.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Call the next waiting customer from the queue below to start service.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {servingEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border-2 border-emerald-500/80 bg-white p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Active at Counter
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Position #{entry.position || 1}
                        </span>
                      </div>

                      <div className="mt-3">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                          Token #{entry.tokenNumber}
                        </h3>
                        <p className="text-sm font-bold text-slate-800 mt-1">
                          {entry.customerName || entry.customer?.user?.displayName || "Walk-in Guest"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Service: {entry.serviceName || entry.service?.name || "General Service"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold h-9"
                        isLoading={completeMutation.isPending}
                        onClick={() => completeMutation.mutate(entry.id)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Complete Service
                      </Button>
                      <Button
                        variant="outline"
                        className="border-amber-300 text-amber-800 hover:bg-amber-50 gap-1 text-xs h-9 px-3"
                        isLoading={skipMutation.isPending}
                        onClick={() => skipMutation.mutate(entry.id)}
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        Skip
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: UP NEXT / CALLED */}
          {calledEntries.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                Up Next / Called to Counter ({calledEntries.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calledEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Called
                      </span>
                      <h4 className="text-2xl font-black text-slate-900 mt-1">
                        Token #{entry.tokenNumber}
                      </h4>
                      <p className="text-xs font-bold text-slate-800">
                        {entry.customerName || entry.customer?.user?.displayName || "Walk-in Guest"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {entry.serviceName || entry.service?.name || "General Service"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs h-8"
                        isLoading={serveMutation.isPending}
                        onClick={() => serveMutation.mutate(entry.id)}
                      >
                        <Play className="w-3.5 h-3.5" />
                        Start
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-amber-700 hover:bg-amber-100/50 text-xs h-8 px-2"
                        isLoading={skipMutation.isPending}
                        onClick={() => skipMutation.mutate(entry.id)}
                      >
                        Skip
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: WAITING LIST */}
          <Card className="rounded-2xl border-slate-200/80 overflow-hidden shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Waiting Line ({waitingEntries.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {waitingEntries.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                    <Layers className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    No customers are currently waiting.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Walk-in clients will automatically appear here upon scanning your QR code.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Position</th>
                        <th className="px-5 py-3">Token</th>
                        <th className="px-5 py-3">Customer</th>
                        <th className="px-5 py-3">Service</th>
                        <th className="px-5 py-3">Est. Wait</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {waitingEntries.map((entry, idx) => (
                        <tr key={entry.id} className="hover:bg-slate-50/75 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-400">
                            #{entry.position || idx + 1}
                          </td>
                          <td className="px-5 py-3.5 font-black text-emerald-800 text-sm">
                            Token #{entry.tokenNumber}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {entry.customerName || entry.customer?.user?.displayName || "Walk-in Guest"}
                          </td>
                          <td className="px-5 py-3.5 text-slate-700">
                            {entry.serviceName || entry.service?.name || "Service"}
                          </td>
                          <td className="px-5 py-3.5 text-slate-400">
                            {entry.estimatedWaitTime ? `${entry.estimatedWaitTime} mins` : "Next in line"}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-7.5 px-2.5 gap-1 text-xs font-semibold"
                                isLoading={callMutation.isPending}
                                onClick={() => callMutation.mutate(entry.id)}
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                Call
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-amber-600 hover:bg-amber-50 h-7.5 px-2 text-xs"
                                isLoading={skipMutation.isPending}
                                onClick={() => skipMutation.mutate(entry.id)}
                              >
                                Skip
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}