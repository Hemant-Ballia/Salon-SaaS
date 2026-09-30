"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getLiveQueueApi } from "@/lib/api/queue";
import { BusinessThemeConfig } from "@/config/business-theme";
import { Layers, ArrowRight, User, Clock, Radio } from "lucide-react";

interface LiveQueueWidgetProps {
  businessId?: string;
  theme: BusinessThemeConfig;
  fallbackCount?: number;
}

export const LiveQueueWidget: React.FC<LiveQueueWidgetProps> = ({
  businessId,
  theme,
}) => {
  const { data: queueEntries = [], isLoading } = useQuery({
    queryKey: ["live-queue", businessId],
    queryFn: () => getLiveQueueApi(businessId),
    enabled: !!businessId,
    refetchInterval: 10000,
  });

  const serving = queueEntries.find((e) => e.status === "SERVING");
  const waiting = queueEntries.filter((e) => e.status === "WAITING");
  const nextInLine = waiting[0];

  const hasActivity = serving || waiting.length > 0;

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
              Live Queue
            </h2>
          </div>
        </div>

        <Link
          href="/queue"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 transition-colors"
        >
          Open Queue <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Content */}
      <div className="py-4">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-10 bg-slate-100 rounded-lg" />
            <div className="h-8 bg-slate-100 rounded-lg" />
          </div>
        ) : !hasActivity ? (
          <div className="py-5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
              <Layers className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No customers waiting.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Walk-in guests who scan your QR code will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 text-center">
            {/* Now Serving */}
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-2.5 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Now Serving
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-900 mt-0.5 tracking-tight">
                {serving ? `#${serving.tokenNumber}` : "—"}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium truncate mt-0.5">
                {serving
                  ? serving.customerName || serving.customer?.user?.displayName || "Guest"
                  : "Desk open"}
              </span>
            </div>

            {/* Waiting Count */}
            <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-2.5 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                Waiting
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-900 mt-0.5 tracking-tight">
                {waiting.length}
              </span>
              <span className="text-[10px] text-amber-700 font-medium truncate mt-0.5">
                In line
              </span>
            </div>

            {/* Next in Line */}
            <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-2.5 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                Next
              </span>
              <span className="text-xl sm:text-2xl font-black text-blue-900 mt-0.5 tracking-tight">
                {nextInLine ? `#${nextInLine.tokenNumber}` : "—"}
              </span>
              <span className="text-[10px] text-blue-700 font-medium truncate mt-0.5">
                {nextInLine ? "Ready" : "Queue clear"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick link action button */}
      <div>
        <Link
          href="/queue"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
        >
          Manage Live Queue <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};
