"use client";

import { getErrorMessage } from "@/lib/api/client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getUserByIdApi, updateUserStatusApi } from "@/lib/api/admin";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, UserCircle, Mail, Phone, Calendar, Power } from "lucide-react";
import { toast } from "sonner";
import NextLink from "next/link";

export default function UserDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["admin", "users", id],
    queryFn: () => getUserByIdApi(id),
    enabled: !!id,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (isActive: boolean) => updateUserStatusApi(id, isActive),
    onSuccess: (updated) => {
      toast.success(`User status updated to ${updated.isActive ? "Active" : "Inactive"}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "users", id] });
      setConfirmOpen(false);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err) || "Failed to update user status.");
    },
  });

  if (isLoading) {
    return (
      <AdminLayout title="User Details">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout title="User Details">
        <ErrorState
          title="User not found"
          message="Could not locate the requested user record."
          onRetry={() => router.push("/users")}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`User: ${user.name}`}>
      <div className="space-y-6">
        {/* Back Link */}
        <NextLink
          href="/users"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all users
        </NextLink>

        {/* Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <UserCircle className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                <StatusBadge status={user.role} />
                <StatusBadge status={user.isActive} />
              </div>
              <p className="text-xs text-slate-500 mt-1">User ID: {user.id}</p>
            </div>
          </div>

          <Button
            variant={user.isActive ? "destructive" : "primary"}
            size="sm"
            onClick={() => setConfirmOpen(true)}
          >
            <Power className="h-4 w-4 mr-1.5" />
            {user.isActive ? "Deactivate Account" : "Activate Account"}
          </Button>
        </div>

        {/* User Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Email Address</div>
                  <div className="text-sm font-medium text-slate-900">{user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Phone Number</div>
                  <div className="text-sm font-medium text-slate-900">
                    {user.phone || "Not provided"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Account Created</div>
                  <div className="text-sm font-medium text-slate-900">
                    {formatDateTime(user.createdAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security & Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-slate-500">Platform Role</div>
                <div className="mt-1">
                  <StatusBadge status={user.role} />
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Operational Status</div>
                <div className="mt-1">
                  <StatusBadge status={user.isActive} />
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Authentication Protocol</div>
                <div className="text-xs font-mono text-slate-600 mt-1">
                  Bcrypt Password Hash (Never Exposed) * JWT Session
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title={user.isActive ? "Deactivate Account" : "Activate Account"}
          message={`Are you sure you want to ${
            user.isActive ? "deactivate" : "activate"
          } the user account for ${user.name}?`}
          confirmText={user.isActive ? "Deactivate" : "Activate"}
          variant={user.isActive ? "destructive" : "primary"}
          isLoading={toggleStatusMutation.isPending}
          onConfirm={() => toggleStatusMutation.mutate(!user.isActive)}
        />
      </div>
    </AdminLayout>
  );
}
