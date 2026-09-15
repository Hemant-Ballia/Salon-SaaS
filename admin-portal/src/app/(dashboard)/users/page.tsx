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
import { getUsersApi, updateUserStatusApi } from "@/lib/api/admin";
import { User } from "@/types/models";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import NextLink from "next/link";
import { Eye, Power } from "lucide-react";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", { page, roleFilter, statusFilter }],
    queryFn: () =>
      getUsersApi({
        page,
        limit: 15,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        isActive: statusFilter !== "ALL" ? statusFilter === "ACTIVE" : undefined,
      }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUserStatusApi(id, isActive),
    onSuccess: (updatedUser) => {
      toast.success(
        `User ${updatedUser.isActive ? "activated" : "deactivated"} successfully.`
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setSelectedUser(null);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err) || "Failed to update user status.");
    },
  });

  // Client-side search filtering over fetched items
  const filteredUsers = (data?.data ?? []).filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  const columns: Column<User>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (user) => (
        <div>
          <span className="font-semibold text-slate-900">{user.name}</span>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (user) => <span className="text-slate-600">{user.email}</span>,
    },
    {
      header: "Role",
      accessorKey: "role",
      cell: (user) => <StatusBadge status={user.role} />,
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (user) => <StatusBadge status={user.isActive} />,
    },
    {
      header: "Registered",
      accessorKey: "createdAt",
      cell: (user) => (
        <span className="text-slate-500 text-xs">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      header: "Actions",
      cell: (user) => (
        <div className="flex items-center gap-2">
          <NextLink href={`/users/${user.id}`}>
            <Button variant="outline" size="sm" className="h-8 px-2.5">
              <Eye className="h-3.5 w-3.5 mr-1" />
              View
            </Button>
          </NextLink>
          <Button
            variant={user.isActive ? "destructive" : "outline"}
            size="sm"
            className="h-8 px-2.5"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(user);
            }}
          >
            <Power className="h-3.5 w-3.5 mr-1" />
            {user.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="User Management">
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <SearchInput
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            className="w-full sm:w-72"
          />

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "All Roles" },
                { value: "ADMIN", label: "ADMIN" },
                { value: "BUSINESS", label: "BUSINESS" },
                { value: "STAFF", label: "STAFF" },
                { value: "CUSTOMER", label: "CUSTOMER" },
              ]}
            />

            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "All Status" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
            />
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredUsers}
          isLoading={isLoading}
          emptyTitle="No users found"
          emptyDescription="Try adjusting your search filters or page parameters."
          pagination={{
            page,
            totalPages: data?.meta?.totalPages ?? 1,
            totalCount: data?.meta?.total,
            limit: data?.meta?.limit ?? 15,
            onPageChange: (p) => setPage(p),
          }}
        />

        {/* Confirmation Dialog */}
        {selectedUser && (
          <ConfirmDialog
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
            title={selectedUser.isActive ? "Deactivate User Account" : "Activate User Account"}
            message={`Are you sure you want to ${
              selectedUser.isActive ? "deactivate" : "activate"
            } the account for ${selectedUser.name} (${selectedUser.email})?`}
            confirmText={selectedUser.isActive ? "Deactivate" : "Activate"}
            variant={selectedUser.isActive ? "destructive" : "primary"}
            isLoading={toggleStatusMutation.isPending}
            onConfirm={() =>
              toggleStatusMutation.mutate({
                id: selectedUser.id,
                isActive: !selectedUser.isActive,
              })
            }
          />
        )}
      </div>
    </AdminLayout>
  );
}
