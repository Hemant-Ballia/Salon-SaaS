import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuditLog } from "@/types/models";
import { formatDateTime } from "@/lib/utils";
import { Activity, Clock } from "lucide-react";
import NextLink from "next/link";

interface RecentActivityProps {
  logs: AuditLog[] | undefined;
  isLoading?: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ logs, isLoading = false }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Recent Administrative Actions</CardTitle>
          <CardDescription>Live audit events and security actions recorded by the backend</CardDescription>
        </div>
        <NextLink
          href="/audit-logs"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          View all logs â
        </NextLink>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No audit activities logged yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {log.action.replace(/_/g, " ").toUpperCase()}
                      </span>
                      <Badge variant="default" className="text-[10px] py-0 px-1.5">
                        {log.entity}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Actor: {log.user?.name || log.user?.email || "System"} â¢{" "}
                      {log.metadata?.status ? `Status: ${log.metadata.status}` : ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDateTime(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
