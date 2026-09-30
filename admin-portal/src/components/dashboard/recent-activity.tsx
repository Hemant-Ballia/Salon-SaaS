import React from "react";
import NextLink from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { AuditLog } from "@/types/models";
import { formatDateTime } from "@/lib/utils";
import { ArrowRight, Activity } from "lucide-react";

interface RecentActivityProps {
  logs: AuditLog[] | undefined;
  isLoading?: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ logs, isLoading = false }) => {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs p-4 sm:p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Recent Activity
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit log of administrative actions, status transitions, and platform events
          </p>
        </div>
        <NextLink
          href="/audit-logs"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0"
        >
          View audit logs
          <ArrowRight className="h-3 w-3" />
        </NextLink>
      </div>

      <div className="pt-1">
        {isLoading ? (
          <div className="space-y-2 py-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
            <Activity className="h-6 w-6 text-slate-300 mb-1" />
            No administrative events recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.slice(0, 6).map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {log.action.replace(/_/g, " ").toUpperCase()}
                      {log.entity && (
                        <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                          ({log.entity})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {log.user?.name || log.user?.email || "Platform Admin"}
                      {log.metadata?.status ? ` · Status: ${log.metadata.status}` : ""}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 shrink-0 whitespace-nowrap text-right">
                  {formatDateTime(log.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
