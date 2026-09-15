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
import { QueueEntry } from "@/types/models";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { 
  Users, 
  PhoneCall, 
  Play, 
  CheckCircle2, 
  SkipForward, 
  Clock, 
  Radio, 
  AlertCircle,
  RefreshCw
} from "lucide-react";

export default function QueuePage() {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const { data: queueEntries = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["live-queue"],
    queryFn: () => getLiveQueueApi(),
    refetchInterval: 10000, // Poll fallback every 10 seconds
  });

  // Socket.IO real-time event listeners
  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["live-queue"] });
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
      toast.error(err?.response?.data?.message || "Failed to call entry");
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
      toast.success("Queue entry completed");
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
  const pastEntries = queueEntries.filter((e) => e.status === "COMPLETED" || e.status === "SKIPPED");

  return (
    <div className="space-y-6">
      {/* Header & Live Connection Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live Queue System</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
              {isConnected ? "Live Connected (Socket.IO)" : "Polling (10s)"}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time walk-in queue management, token callouts, and service counter controls.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          isLoading={isRefetching}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Queue Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Now Serving</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{servingEntries.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Called / Boarding</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{calledEntries.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-100">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Waiting</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">{waitingEntries.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Served Today</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {pastEntries.filter((e) => e.status === "COMPLETED").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Serving Section */}
          {servingEntries.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                Active Counter Service
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {servingEntries.map((entry) => (
                  <Card key={entry.id} className="border-emerald-300 bg-emerald-50/30">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                            Counter Serving
                          </span>
                          <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
                            Token #{entry.tokenNumber}
                          </h3>
                          <p className="font-semibold text-slate-800 text-sm mt-1">
                            {entry.customerName || entry.customer?.user?.displayName || "Walk-in Guest"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Service: {entry.serviceName || entry.service?.name || "General Service"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-4 mt-4 border-t border-emerald-200/60">
                        <Button
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-sm"
                          isLoading={completeMutation.isPending}
                          onClick={() => completeMutation.mutate(entry.id)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Complete Service
                        </Button>
                        <Button
                          variant="outline"
                          className="border-amber-300 text-amber-800 hover:bg-amber-50 gap-1 text-sm"
                          isLoading={skipMutation.isPending}
                          onClick={() => skipMutation.mutate(entry.id)}
                        >
                          <SkipForward className="w-4 h-4" />
                          Skip
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}

          {/* Called Section */}
          {calledEntries.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-800 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-blue-600" />
                Called Customers (Waiting at Desk)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calledEntries.map((entry) => (
                  <Card key={entry.id} className="border-blue-200 bg-blue-50/20">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Called
                        </span>
                        <h4 className="text-2xl font-bold text-slate-900 mt-1">
                          Token #{entry.tokenNumber}
                        </h4>
                        <p className="text-sm font-medium text-slate-800">
                          {entry.customerName || entry.customer?.user?.displayName || "Walk-in Guest"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                          isLoading={serveMutation.isPending}
                          onClick={() => serveMutation.mutate(entry.id)}
                        >
                          <Play className="w-3.5 h-3.5" />
                          Start Serving
                        </Button>
                        <Button
                          size="sm"
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
                ))}
              </div>
            </div>
          )}

          {/* Waiting Queue Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Waiting Line ({waitingEntries.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {waitingEntries.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No customers currently waiting in line.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Position</th>
                        <th className="px-6 py-3">Token</th>
                        <th className="px-6 py-3">Customer</th>
                        <th className="px-6 py-3">Service</th>
                        <th className="px-6 py-3">Est. Wait</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {waitingEntries.map((entry, idx) => (
                        <tr key={entry.id} className="hover:bg-slate-50/75 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-slate-500">
                            #{entry.position || idx + 1}
                          </td>
                          <td className="px-6 py-3.5 font-extrabold text-emerald-700">
                            Token #{entry.tokenNumber}
                          </td>
                          <td className="px-6 py-3.5 font-medium text-slate-900">
                            {entry.customerName || entry.customer?.user?.displayName || "Walk-in Guest"}
                          </td>
                          <td className="px-6 py-3.5 text-slate-600">
                            {entry.serviceName || entry.service?.name || "Service"}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-slate-500">
                            {entry.estimatedWaitTime ? `${entry.estimatedWaitTime} mins` : "Next in line"}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8 gap-1 text-xs"
                                isLoading={callMutation.isPending}
                                onClick={() => callMutation.mutate(entry.id)}
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                Call
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-amber-600 hover:bg-amber-50 h-8 px-2 text-xs"
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