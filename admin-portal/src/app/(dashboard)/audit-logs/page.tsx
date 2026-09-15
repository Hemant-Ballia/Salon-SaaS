"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { getAuditLogsApi } from "@/lib/api/admin";
import { AuditLog } from "@/types/models";
import { formatDateTime } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-logs", { page }],
    queryFn: () => getAuditLogsApi({ page, limit: 20 }),
  });

  const filtered = (data?.data ?? []).filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q) ||
      (log.entityId && log.entityId.toLowerCase().includes(q)) ||
      (log.userId && log.userId.toLowerCase().includes(q))
    );
  });

  const columns: Column<AuditLog>[] = [
    {
      header: "Action",
      accessorKey: "action",
      cell: (l) => (
        <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
          {l.action.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      header: "Resource / Entity",
      cell: (l) => (
        <div className="flex items-center gap-1.5">
          <Badge variant="default" className="text-[11px]">
            {l.entity}
          </Badge>
          {l.entityId && (
            <span className="font-mono text-[11px] text-slate-400">
              {l.entityId.slice(0, 8)}...
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Actor (User ID)",
      accessorKey: "userId",
      cell: (l) => (
        <span className="font-mono text-xs text-slate-600">
          {l.userId ? `${l.userId.slice(0, 8)}...` : "System / Automated"}
        </span>
      ),
    },
    {
      header: "Metadata",
      cell: (l) => {
        if (!l.metadata || Object.keys(l.metadata).length === 0) {
          return <span className="text-slate-400 text-xs">-</span>;
        }
        // Exclude internal passwords/secrets if any leaked
        const safeMeta = { ...l.metadata };
        delete (safeMeta as Record<string, unknown>).password;
        delete (safeMeta as Record<string, unknown>).token;
        delete (safeMeta as Record<string, unknown>).otp;
        delete (safeMeta as Record<string, unknown>).secret;

        return (
          <span
            className="font-mono text-[11px] text-slate-600 max-w-xs truncate block"
            title={JSON.stringify(safeMeta, null, 2)}
          >
            {JSON.stringify(safeMeta)}
          </span>
        );
      },
    },
    {
      header: "Timestamp",
      accessorKey: "createdAt",
      cell: (l) => <span className="text-xs text-slate-500">{formatDateTime(l.createdAt)}</span>,
    },
  ];

  return (
    <AdminLayout title="Audit Logs">
      <div className="space-y-4">
        {/* Notice */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <SearchInput
            placeholder="Search action, entity or actor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            className="w-full sm:w-80"
          />

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Immutable security log * All events cryptographically tracked</span>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          emptyTitle="No audit logs found"
          emptyDescription="Audit logs will appear here as administrative actions occur on the platform."
          pagination={{
            page,
            totalPages: data?.meta?.totalPages ?? 1,
            totalCount: data?.meta?.total,
            limit: data?.meta?.limit ?? 20,
            onPageChange: (p) => setPage(p),
          }}
        />
      </div>
    </AdminLayout>
  );
}
