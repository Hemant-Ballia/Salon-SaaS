"use client";

import { getErrorMessage } from "@/lib/api/client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getBusinessesApi,
  approveBusinessApi,
  rejectBusinessApi,
  updateBusinessStatusApi,
} from "@/lib/api/admin";
import { Business } from "@/types/models";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import NextLink from "next/link";
import { Eye, CheckCircle2, XCircle, AlertTriangle, Plus } from "lucide-react";
import { CreateBusinessModal } from "@/components/businesses/create-business-modal";

export default function BusinessesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<{
    business: Business;
    action: "approve" | "reject" | "suspend" | "activate";
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "businesses", { page, statusFilter }],
    queryFn: () =>
      getBusinessesApi({
        page,
        limit: 15,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: "approve" | "reject" | "suspend" | "activate";
    }) => {
      if (action === "approve") return approveBusinessApi(id);
      if (action === "reject") return rejectBusinessApi(id);
      if (action === "suspend") return updateBusinessStatusApi(id, "SUSPENDED");
      return updateBusinessStatusApi(id, "ACTIVE");
    },
    onSuccess: (_, variables) => {
      toast.success(`Business ${variables.action}d successfully.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "businesses"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setActiveAction(null);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err) || "Operation failed.");
    },
  });

  const filteredBusinesses = (data?.data ?? []).filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.owner?.email?.toLowerCase().includes(q) ||
      b.city?.toLowerCase().includes(q)
    );
  });

  const columns: Column<Business>[] = [
    {
      header: "Business Name",
      accessorKey: "name",
      cell: (b) => (
        <div>
          <div className="font-semibold text-slate-900">{b.name}</div>
          <div className="text-xs text-slate-400">/{b.slug}</div>
        </div>
      ),
    },
    {
      header: "Type",
      accessorKey: "businessType",
      cell: (b) => (
        <span className="text-xs font-medium text-slate-600">
          {b.businessType.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (b) => <StatusBadge status={b.status} />,
    },
    {
      header: "Owner Email",
      cell: (b) => <span className="text-slate-600 text-xs">{b.owner?.email || "-"}</span>,
    },
    {
      header: "Location",
      cell: (b) => (
        <span className="text-slate-500 text-xs">
          {b.city ? `${b.city}, ${b.state || ""}` : "-"}
        </span>
      ),
    },
    {
      header: "Registered",
      accessorKey: "createdAt",
      cell: (b) => <span className="text-slate-500 text-xs">{formatDate(b.createdAt)}</span>,
    },
    {
      header: "Actions",
      cell: (b) => (
        <div className="flex items-center gap-1.5">
          <NextLink href={`/businesses/${b.id}`}>
            <Button variant="outline" size="sm" className="h-8 px-2.5">
              <Eye className="h-3.5 w-3.5 mr-1" />
              Manage
            </Button>
          </NextLink>

          {b.status === "PENDING" && (
            <>
              <Button
                variant="primary"
                size="sm"
                className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setActiveAction({ business: b, action: "approve" })}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 px-2.5"
                onClick={() => setActiveAction({ business: b, action: "reject" })}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Reject
              </Button>
            </>
          )}

          {b.status === "ACTIVE" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-amber-700 hover:bg-amber-50"
              onClick={() => setActiveAction({ business: b, action: "suspend" })}
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              Suspend
            </Button>
          )}

          {b.status === "SUSPENDED" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-emerald-700 hover:bg-emerald-50"
              onClick={() => setActiveAction({ business: b, action: "activate" })}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Business Management">
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <SearchInput
            placeholder="Search business name, owner email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            className="w-full sm:w-80"
          />

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "PENDING", label: "Pending Approval" },
                { value: "ACTIVE", label: "Active" },
                { value: "SUSPENDED", label: "Suspended" },
                { value: "REJECTED", label: "Rejected" },
              ]}
            />

            <NextLink href="/businesses/new">
              <Button
                variant="outline"
                size="sm"
                className="h-9.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-slate-200 shrink-0 gap-1.5 cursor-pointer"
              >
                Registration Wizard
              </Button>
            </NextLink>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-9.5 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shrink-0 gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Register Business
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredBusinesses}
          isLoading={isLoading}
          emptyTitle="No businesses found"
          emptyDescription="No businesses match the specified search and status filter."
          pagination={{
            page,
            totalPages: data?.meta?.totalPages ?? 1,
            totalCount: data?.meta?.total,
            limit: data?.meta?.limit ?? 15,
            onPageChange: (p) => setPage(p),
          }}
        />

        {/* Confirmation Dialog */}
        {activeAction && (
          <ConfirmDialog
            isOpen={!!activeAction}
            onClose={() => setActiveAction(null)}
            title={`${activeAction.action.toUpperCase()} Business`}
            message={`Are you sure you want to ${activeAction.action} the business "${activeAction.business.name}"? This action will immediately update access permissions for the business and its staff.`}
            confirmText={
              activeAction.action === "reject" || activeAction.action === "suspend"
                ? "Proceed"
                : "Confirm"
            }
            variant={
              activeAction.action === "reject" || activeAction.action === "suspend"
                ? "destructive"
                : "primary"
            }
            isLoading={actionMutation.isPending}
            onConfirm={() =>
              actionMutation.mutate({
                id: activeAction.business.id,
                action: activeAction.action,
              })
            }
          />
        )}

        {/* Create Business Modal */}
        <CreateBusinessModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </AdminLayout>
  );
}
