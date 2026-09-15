"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStaffListApi, createStaffApi, updateStaffStatusApi, deleteStaffApi } from "@/lib/api/staff";
import { Staff, StaffStatus } from "@/types/models";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Trash2, 
  Power, 
  Mail, 
  Briefcase,
  ChevronRight
} from "lucide-react";

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [designation, setDesignation] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["staff", statusFilter, page],
    queryFn: () => getStaffListApi({
      page,
      limit: 20,
      status: statusFilter === "ALL" ? undefined : statusFilter,
    }),
  });

  const createMutation = useMutation({
    mutationFn: createStaffApi,
    onSuccess: () => {
      toast.success("Staff member added successfully");
      setIsAddModalOpen(false);
      setDisplayName("");
      setEmail("");
      setPassword("");
      setDesignation("");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to add staff member");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StaffStatus }) =>
      updateStaffStatusApi(id, status),
    onSuccess: () => {
      toast.success("Staff status updated");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStaffApi,
    onSuccess: () => {
      toast.success("Staff member removed");
      setStaffToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete staff");
    },
  });

  const staffList = (data?.data || []).filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.displayName?.toLowerCase().includes(q) ||
      s.user?.displayName?.toLowerCase().includes(q) ||
      s.user?.email?.toLowerCase().includes(q) ||
      s.designation?.toLowerCase().includes(q)
    );
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email) {
      toast.error("Name and email are required");
      return;
    }
    createMutation.mutate({
      displayName,
      email,
      password: password || undefined,
      designation: designation || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your service specialists, working schedules, and performance.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name, email, or designation..."
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "ON_LEAVE", label: "On Leave" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load staff list"
          description="Please ensure your backend service is running and try again."
          onRetry={() => refetch()}
        />
      ) : staffList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff members found"
          description={
            search || statusFilter !== "ALL"
              ? "Try adjusting your search filters or status selection."
              : "Get started by adding your first team member or specialist."
          }
          action={
            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add Staff
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Staff Member</th>
                  <th className="px-6 py-3.5">Designation</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Joined</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((member) => {
                  const name = member.displayName || member.user?.displayName || "Unnamed Staff";
                  const email = member.user?.email || member.email || "No email";
                  const isAct = member.status === "ACTIVE";

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center text-sm">
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3.5 h-3.5" />
                              {email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span>{member.designation || "Specialist"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={member.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            title={isAct ? "Deactivate Staff" : "Activate Staff"}
                            onClick={() =>
                              statusMutation.mutate({
                                id: member.id,
                                status: isAct ? "INACTIVE" : "ACTIVE",
                              })
                            }
                            className={isAct ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Link href={`/staff/${member.id}`}>
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              Schedule
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => setStaffToDelete(member)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Staff Member"
        description="Create an account for your service specialist to assign appointments and track schedules."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Temporary Password (Optional)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank or set temporary password"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Designation / Role
            </label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Master Stylist, Colorist, Nail Artist"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Staff Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!staffToDelete}
        title="Remove Staff Member"
        description={`Are you sure you want to remove ${staffToDelete?.displayName || staffToDelete?.user?.displayName || "this staff member"}? This action cannot be undone.`}
        confirmLabel="Delete Staff"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (staffToDelete) {
            deleteMutation.mutate(staffToDelete.id);
          }
        }}
        onCancel={() => setStaffToDelete(null)}
      />
    </div>
  );
}