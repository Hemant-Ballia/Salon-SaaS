"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getCustomerByIdApi } from "@/lib/api/admin";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, User, Mail, Phone, Calendar } from "lucide-react";
import NextLink from "next/link";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ["admin", "customers", id],
    queryFn: () => getCustomerByIdApi(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AdminLayout title="Customer Profile">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !customer) {
    return (
      <AdminLayout title="Customer Profile">
        <ErrorState
          title="Customer not found"
          message="Could not retrieve the requested customer record."
          onRetry={() => router.push("/customers")}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Customer: ${customer.user?.name || "Client"}`}>
      <div className="space-y-6">
        <NextLink
          href="/customers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to customers
        </NextLink>

        {/* Profile Card */}
        <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {customer.user?.name || "Customer"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Profile ID: {customer.id}</p>
          </div>
        </div>

        {/* Details Grid */}
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
                  <div className="text-sm font-medium text-slate-900">
                    {customer.user?.email || "-"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Phone Number</div>
                  <div className="text-sm font-medium text-slate-900">
                    {customer.user?.phone || "Not provided"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Joined Platform</div>
                  <div className="text-sm font-medium text-slate-900">
                    {formatDateTime(customer.createdAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identity Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-slate-500">Customer Profile UUID</div>
                <div className="font-mono text-xs text-slate-700 mt-1">{customer.id}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Underlying User ID</div>
                <div className="font-mono text-xs text-slate-700 mt-1">{customer.userId}</div>
              </div>
              <div className="pt-2 text-xs text-slate-500">
                Customer appointments and payments can be tracked in the Appointments and Payments tabs.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
