"use client";

import { getErrorMessage } from "@/lib/api/client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  getBusinessByIdApi,
  approveBusinessApi,
  rejectBusinessApi,
  updateBusinessStatusApi,
} from "@/lib/api/admin";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Store,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
} from "lucide-react";
import { toast } from "sonner";
import NextLink from "next/link";

export default function BusinessDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | "suspend" | "activate" | null
  >(null);

  const { data: business, isLoading, error } = useQuery({
    queryKey: ["admin", "businesses", id],
    queryFn: () => getBusinessByIdApi(id),
    enabled: !!id,
  });

  const actionMutation = useMutation({
    mutationFn: async (action: "approve" | "reject" | "suspend" | "activate") => {
      if (action === "approve") return approveBusinessApi(id);
      if (action === "reject") return rejectBusinessApi(id);
      if (action === "suspend") return updateBusinessStatusApi(id, "SUSPENDED");
      return updateBusinessStatusApi(id, "ACTIVE");
    },
    onSuccess: (_, action) => {
      toast.success(`Business ${action}d successfully.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "businesses", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "businesses"] });
      setConfirmAction(null);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err) || "Operation failed.");
    },
  });

  if (isLoading) {
    return (
      <AdminLayout title="Business Details">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !business) {
    return (
      <AdminLayout title="Business Details">
        <ErrorState
          title="Business not found"
          message="Could not retrieve the requested business tenant record."
          onRetry={() => router.push("/businesses")}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Business: ${business.name}`}>
      <div className="space-y-6">
        {/* Back navigation */}
        <NextLink
          href="/businesses"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all businesses
        </NextLink>

        {/* Header summary & action controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Store className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900">{business.name}</h2>
                <StatusBadge status={business.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Slug: <span className="font-mono text-slate-700">/{business.slug}</span> * Type:{" "}
                <span className="font-semibold text-slate-700">
                  {business.businessType.replace(/_/g, " ")}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {business.status === "PENDING" && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setConfirmAction("approve")}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Approve Business
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmAction("reject")}
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Reject Business
                </Button>
              </>
            )}

            {business.status === "ACTIVE" && (
              <Button
                variant="outline"
                size="sm"
                className="text-amber-700 hover:bg-amber-50"
                onClick={() => setConfirmAction("suspend")}
              >
                <AlertTriangle className="h-4 w-4 mr-1.5" />
                Suspend Business
              </Button>
            )}

            {business.status === "SUSPENDED" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setConfirmAction("activate")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Reactivate Business
              </Button>
            )}
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Business Contact Email</div>
                  <div className="text-sm font-medium text-slate-900">
                    {business.email || "Not specified"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Phone Number</div>
                  <div className="text-sm font-medium text-slate-900">
                    {business.phone || "Not specified"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Address & Location</div>
                  <div className="text-sm font-medium text-slate-900">
                    {business.address || "No address provided"}
                    {(business.city || business.state) && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {[business.city, business.state, business.postalCode]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Registration Date</div>
                  <div className="text-sm font-medium text-slate-900">
                    {formatDateTime(business.createdAt)}
                  </div>
                </div>
              </div>

              {business.description && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Description</div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {business.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Owner Account */}
          <Card>
            <CardHeader>
              <CardTitle>Business Owner (Tenant Lead)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Owner Name</div>
                  <div className="text-sm font-medium text-slate-900">
                    {business.owner?.name || "Registered Owner"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Owner Account Email</div>
                  <div className="text-sm font-medium text-slate-900">
                    {business.owner?.email || "-"}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">Owner User ID</div>
                <div className="font-mono text-xs text-slate-700 mt-1">
                  {business.ownerId}
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
                <span className="font-semibold text-slate-900">Multi-tenant Boundary:</span>{" "}
                This business is strictly isolated in the database. Staff, services, queues, and
                appointments registered under this tenant cannot be accessed by other businesses.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Confirmation Dialog */}
        {confirmAction && (
          <ConfirmDialog
            isOpen={!!confirmAction}
            onClose={() => setConfirmAction(null)}
            title={`${confirmAction.toUpperCase()} Business`}
            message={`Are you sure you want to ${confirmAction} "${business.name}"?`}
            confirmText={
              confirmAction === "reject" || confirmAction === "suspend"
                ? "Proceed"
                : "Confirm"
            }
            variant={
              confirmAction === "reject" || confirmAction === "suspend"
                ? "destructive"
                : "primary"
            }
            isLoading={actionMutation.isPending}
            onConfirm={() => actionMutation.mutate(confirmAction)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
