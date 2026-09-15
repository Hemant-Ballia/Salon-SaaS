"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getStaffByIdApi } from "@/lib/api/admin";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, UserCheck, Store, Mail, Calendar } from "lucide-react";
import NextLink from "next/link";

export default function StaffDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const { data: staff, isLoading, error } = useQuery({
    queryKey: ["admin", "staff", id],
    queryFn: () => getStaffByIdApi(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AdminLayout title="Staff Profile">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !staff) {
    return (
      <AdminLayout title="Staff Profile">
        <ErrorState
          title="Staff profile not found"
          message="Could not retrieve the requested staff record."
          onRetry={() => router.push("/staff")}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Staff: ${staff.displayName}`}>
      <div className="space-y-6">
        <NextLink
          href="/staff"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to staff directory
        </NextLink>

        {/* Profile Card */}
        <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <UserCheck className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900">{staff.displayName}</h2>
              <StatusBadge status={staff.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Designation: <span className="font-semibold text-slate-700">{staff.designation || "Staff Member"}</span>
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Store className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Assigned Business</div>
                  <div className="text-sm font-medium text-slate-900">
                    {staff.business?.name || staff.businessId}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Linked Account Email</div>
                  <div className="text-sm font-medium text-slate-900">
                    {staff.user?.email || "-"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Record Created</div>
                  <div className="text-sm font-medium text-slate-900">
                    {formatDateTime(staff.createdAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Linkage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-slate-500">Staff Profile ID</div>
                <div className="font-mono text-xs text-slate-700 mt-1">{staff.id}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Business Tenant ID</div>
                <div className="font-mono text-xs text-slate-700 mt-1">{staff.businessId}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">User Identity ID</div>
                <div className="font-mono text-xs text-slate-700 mt-1">{staff.userId}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
