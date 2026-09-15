"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  Radio,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/context/auth-context";
import { useSocket } from "@/context/socket-context";
import { getBusinessesApi } from "@/lib/api/businesses";
import { joinQueueApi, getLiveQueueApi } from "@/lib/api/queues";
import { formatTime } from "@/lib/utils";
import { Business } from "@/types/models";

export default function QueueOverviewPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { isConnected } = useSocket();
  const queryClient = useQueryClient();

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [activeBoardBizId, setActiveBoardBizId] = useState("");

  // Get active businesses
  const { data: businessesData, isLoading: bizLoading } = useQuery({
    queryKey: ["businesses-queue-picker"],
    queryFn: () => getBusinessesApi({ limit: 50 }),
  });

  // Get live queue for selected board
  const {
    data: liveQueueData,
    isLoading: boardLoading,
    refetch: refetchBoard,
  } = useQuery({
    queryKey: ["live-queue-board", activeBoardBizId],
    queryFn: () => getLiveQueueApi(activeBoardBizId),
    enabled: !!activeBoardBizId,
  });

  const joinMutation = useMutation({
    mutationFn: (bizId: string) => joinQueueApi({ businessId: bizId }),
    onSuccess: (res) => {
      toast.success(`Joined queue! Your token number is #${res.entry.tokenNumber}`);
      setIsJoinModalOpen(false);
      router.push(`/queue/${res.entry.id}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to join queue");
    },
  });

  const businesses: Business[] = businessesData?.data || [];

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
              </span>
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {isConnected ? "Real-time sync active" : "Connecting..."}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Virtual Queue & Live Tokens
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Skip the crowded waiting room. Join line remotely and get notified when it is your turn.
            </p>
          </div>

          <Button
            onClick={() => {
              if (!isAuthenticated) {
                router.push("/login?redirect=/queue");
                return;
              }
              setIsJoinModalOpen(true);
            }}
            className="gap-2 shrink-0 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Join a Salon Queue
          </Button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 border-l-4 border-l-indigo-600">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-3">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Live Token Tracking
            </h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Watch your position count down in real-time without refreshing the page.
            </p>
          </Card>

          <Card className="p-5 border-l-4 border-l-emerald-600">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Accurate Wait Times
            </h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Dynamically calculated wait time estimates based on active staff and service durations.
            </p>
          </Card>

          <Card className="p-5 border-l-4 border-l-amber-600">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Instant Call Alerts
            </h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Receive sound cues and app notifications the exact second your stylist calls your ticket.
            </p>
          </Card>
        </div>

        {/* Public Live Queue Board Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Salon Live Boards
              </h2>
              <p className="text-xs text-neutral-500">
                Select a salon to inspect their current live token counter
              </p>
            </div>

            {/* Select Salon Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={activeBoardBizId}
                onChange={(e) => setActiveBoardBizId(e.target.value)}
                className="text-xs sm:text-sm px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose a Salon --</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>

              {activeBoardBizId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetchBoard()}
                  className="px-2.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {activeBoardBizId ? (
            boardLoading ? (
              <Card className="p-8">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                </div>
                <Skeleton className="h-40 w-full rounded-xl" />
              </Card>
            ) : liveQueueData ? (
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {liveQueueData.queueName || "Main Walk-in Queue"}
                    </span>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                      {liveQueueData.business}
                    </h3>
                  </div>

                  {/* Stats Badges */}
                  <div className="flex items-center gap-3">
                    <div className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-center">
                      <span className="text-xs text-neutral-500 block">Total Active</span>
                      <span className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                        {liveQueueData.stats.total}
                      </span>
                    </div>
                    <div className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-center">
                      <span className="text-xs text-amber-700 dark:text-amber-400 block">Waiting</span>
                      <span className="text-lg font-extrabold text-amber-700 dark:text-amber-300">
                        {liveQueueData.stats.waiting}
                      </span>
                    </div>
                    <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-center">
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 block">Serving</span>
                      <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                        {liveQueueData.stats.serving}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Queue list table */}
                <div className="mt-6">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                    Currently In Line
                  </h4>

                  {liveQueueData.entries.length === 0 ? (
                    <p className="text-sm text-neutral-500 py-6 text-center">
                      Queue is currently clear! No customers are currently waiting.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {liveQueueData.entries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between ${
                            entry.status === "SERVING"
                              ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                              : entry.status === "CALLED"
                              ? "bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800 animate-pulse"
                              : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-extrabold text-neutral-800 dark:text-neutral-200 font-mono text-base">
                              #{entry.tokenNumber}
                            </div>
                            <div>
                              <StatusBadge status={entry.status} />
                              <span className="text-xs text-neutral-400 block mt-1">
                                Est. {entry.estimatedWaitMinutes} mins
                              </span>
                            </div>
                          </div>

                          <span className="text-xs text-neutral-400">
                            {formatTime(entry.joinedAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ) : null
          ) : (
            <Card className="p-8 text-center bg-neutral-50 dark:bg-neutral-900/40 border-dashed">
              <Users className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Select any salon above to see their live waiting queue
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Check wait times before stepping out the door
              </p>
            </Card>
          )}
        </div>

        {/* Join Queue Modal */}
        <Modal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          title="Join Salon Virtual Queue"
          description="Select which salon you want to get in line for"
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Select Salon
              </label>
              <select
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose a Salon --</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">How it works:</p>
              <p>• You will be assigned the next available token number instantly.</p>
              <p>• You can monitor live queue movement right from your phone.</p>
              <p>• Please arrive at the salon at least 5 minutes before your turn.</p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <Button variant="outline" onClick={() => setIsJoinModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedBusinessId) {
                    joinMutation.mutate(selectedBusinessId);
                  }
                }}
                disabled={!selectedBusinessId || joinMutation.isPending}
              >
                {joinMutation.isPending ? "Joining..." : "Join Queue Now"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </CustomerLayout>
  );
}