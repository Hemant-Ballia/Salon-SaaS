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
  ChevronRight,
  Zap,
  BellRing
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { BusinessCover } from "@/components/ui/business-cover";
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
  const selectedBoardBiz = businesses.find((b) => b.id === activeBoardBizId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
            </span>
            <span className="font-semibold">
              {isConnected ? "Real-time sync active" : "Connecting to live queue..."}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Virtual Walk-in Queue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Skip physical waiting lounges. Take a digital token remotely and track your position live.
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
          className="gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs py-2.5 px-4"
        >
          <Plus className="w-4 h-4" />
          Join a Salon Line
        </Button>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs border-l-4 border-l-emerald-600 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Live Token Counter
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Watch your queue position update in real-time without ever needing to refresh your screen.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs border-l-4 border-l-teal-600 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Dynamic Wait Times
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Calculated from active stylist stations and average treatment durations for high accuracy.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs border-l-4 border-l-emerald-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-900 flex items-center justify-center">
            <BellRing className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Instant Turn Alert
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Receive in-app visual and sound cues when your stylist flags your ticket as ready to serve.
          </p>
        </div>
      </div>

      {/* Public Live Queue Board Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Salon Live Status Board
            </h2>
            <p className="text-xs text-slate-500">
              Select any salon partner below to view their active queue tokens and estimated wait
            </p>
          </div>

          {/* Select Salon Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={activeBoardBizId}
              onChange={(e) => setActiveBoardBizId(e.target.value)}
              className="text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
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
                className="px-2.5 rounded-xl border-slate-200 hover:border-emerald-400"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              </Button>
            )}
          </div>
        </div>

        {activeBoardBizId ? (
          boardLoading ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-4">
              <Skeleton className="h-6 w-48 mb-4 rounded-lg" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
              <Skeleton className="h-36 w-full rounded-2xl" />
            </div>
          ) : liveQueueData ? (
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs space-y-0">
              {selectedBoardBiz && (
                <BusinessCover business={selectedBoardBiz} aspectRatio="banner" className="h-36 sm:h-44 w-full" />
              )}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      {liveQueueData.queueName || "Main Walk-in Queue"}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {liveQueueData.business}
                    </h3>
                  </div>

                  {/* Stats Badges */}
                  <div className="flex items-center gap-2.5">
                    <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200/70 text-center min-w-[70px]">
                      <span className="text-[11px] font-semibold text-slate-400 block">Total</span>
                      <span className="text-lg font-black text-slate-800">
                        {liveQueueData.stats.total}
                      </span>
                    </div>
                    <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200/60 text-center min-w-[70px]">
                      <span className="text-[11px] font-semibold text-amber-700 block">Waiting</span>
                      <span className="text-lg font-black text-amber-800">
                        {liveQueueData.stats.waiting}
                      </span>
                    </div>
                    <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-center min-w-[70px]">
                      <span className="text-[11px] font-semibold text-emerald-700 block">Serving</span>
                      <span className="text-lg font-black text-emerald-800">
                        {liveQueueData.stats.serving}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Queue list table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Currently In Line
                  </h4>

                  {liveQueueData.entries.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-sm font-semibold text-slate-700">The queue is clear right now!</p>
                      <p className="text-xs text-slate-400 mt-0.5">Join now to get immediate service upon arrival.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {liveQueueData.entries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                            entry.status === "SERVING"
                              ? "bg-emerald-50/70 border-emerald-300"
                              : entry.status === "CALLED"
                              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/40 animate-pulse"
                              : "bg-white border-slate-200/80"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black font-mono text-sm shadow-xs">
                              #{entry.tokenNumber}
                            </div>
                            <div>
                              <StatusBadge status={entry.status} />
                              <span className="text-xs text-slate-500 block mt-1">
                                ~{entry.estimatedWaitMinutes} mins est.
                              </span>
                            </div>
                          </div>

                          <span className="text-xs text-slate-400 font-mono">
                            {formatTime(entry.joinedAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-200/80">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-slate-800">
              Select a salon above to inspect their live waiting queue
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Check real-time wait times and available chairs before heading out.
            </p>
          </div>
        )}
      </div>

      {/* Join Queue Modal */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="Join Virtual Queue"
        description="Choose your desired salon partner to receive a digital token"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Salon
            </label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="">-- Choose a Salon --</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-emerald-900">Virtual Line Guidelines:</p>
            <p className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>You will receive an instant digital token number.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Keep your screen open or enable notifications to hear your call.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Please arrive 5 minutes before your estimated time.</span>
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsJoinModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
              onClick={() => {
                if (selectedBusinessId) {
                  joinMutation.mutate(selectedBusinessId);
                }
              }}
              disabled={!selectedBusinessId || joinMutation.isPending}
            >
              {joinMutation.isPending ? "Joining Line..." : "Join Queue Now"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}