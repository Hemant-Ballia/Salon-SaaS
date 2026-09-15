"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  CreditCard,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/context/auth-context";
import { getMyAppointmentsApi, cancelAppointmentApi } from "@/lib/api/appointments";
import { joinQueueApi } from "@/lib/api/queues";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { Appointment } from "@/types/models";

const STATUS_FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Upcoming", value: "CONFIRMED" },
  { label: "Pending", value: "PENDING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function AppointmentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-appointments", selectedFilter],
    queryFn: () =>
      getMyAppointmentsApi({
        status: selectedFilter === "ALL" ? undefined : selectedFilter,
        limit: 50,
      }),
    enabled: isAuthenticated,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelAppointmentApi(id, reason),
    onSuccess: () => {
      toast.success("Appointment cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      setCancellingAppointmentId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to cancel appointment");
    },
  });

  const joinQueueMutation = useMutation({
    mutationFn: ({ businessId, appointmentId }: { businessId: string; appointmentId: string }) =>
      joinQueueApi({ businessId, appointmentId }),
    onSuccess: (res) => {
      toast.success(`Joined queue! Token #${res.entry.tokenNumber}`);
      router.push(`/queue/${res.entry.id}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to join queue");
    },
  });

  if (authLoading) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </CustomerLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <CustomerLayout>
        <div className="max-w-md mx-auto py-16 text-center">
          <Card className="p-8">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <Calendar className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Sign In to View Appointments
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Track your upcoming salon appointments, check live status, and manage bookings in one place.
            </p>
            <Link href="/login?redirect=/appointments">
              <Button className="w-full">Sign In to Continue</Button>
            </Link>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  const appointments: Appointment[] = (data?.data as Appointment[]) || [];

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              My Appointments
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              View your booking history, upcoming slots, and manage reservations
            </p>
          </div>
          <Link href="/booking">
            <Button className="shrink-0 gap-2">
              <Sparkles className="w-4 h-4" />
              Book Appointment
            </Button>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {STATUS_FILTERS.map((f) => {
            const isActive = selectedFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setSelectedFilter(f.value)}
                className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
          </div>
        ) : appointments.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={Calendar}
              title={selectedFilter === "ALL" ? "No appointments yet" : `No ${selectedFilter.toLowerCase()} appointments`}
              description="Browse top salons and stylists, select services, and reserve your perfect time slot in seconds."
              action={
                <Link href="/booking">
                  <Button className="mt-2">Book Your First Appointment</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((app) => {
              const canCancel = app.status === "PENDING" || app.status === "CONFIRMED";
              const canJoinQueue = app.status === "CONFIRMED";
              const servicesItems = app.services || app.appointmentServices || [];
              const servicesNames =
                servicesItems.map((s) => s.service?.name).filter(Boolean).join(", ") ||
                app.service?.name ||
                "Salon Services";
              const staffName = app.staff?.user?.name || app.staff?.displayName;

              return (
                <Card
                  key={app.id}
                  className="p-5 sm:p-6 transition-all hover:border-indigo-300 dark:hover:border-indigo-800"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <StatusBadge status={app.status} />
                        <span className="text-xs text-neutral-400 font-mono">
                          #{app.id.slice(0, 8)}
                        </span>
                        {app.paymentStatus && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                              app.paymentStatus === "PAID"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}
                          >
                            Payment: {app.paymentStatus}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {app.business?.name || "Salon Partner"}
                        </h3>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {servicesNames}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          <span>{formatDate(app.appointmentDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-neutral-400" />
                          <span>{formatTime(app.startTime)} ({app.totalDurationMinutes || 30} mins)</span>
                        </div>
                        {staffName && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Stylist: {staffName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Price & Quick Action */}
                    <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                      <div className="sm:text-right">
                        <span className="text-xs text-neutral-500 block">Total Amount</span>
                        <span className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">
                          {formatCurrency(app.totalAmount || 0)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {canJoinQueue && app.businessId && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-1 text-xs"
                            onClick={() =>
                              joinQueueMutation.mutate({
                                businessId: app.businessId,
                                appointmentId: app.id,
                              })
                            }
                            disabled={joinQueueMutation.isPending}
                          >
                            <Users className="w-3.5 h-3.5" />
                            Join Queue
                          </Button>
                        )}

                        <Link href={`/appointments/${app.id}`}>
                          <Button size="sm" variant="outline" className="gap-1 text-xs">
                            View Details
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>

                        {canCancel && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            onClick={() => setCancellingAppointmentId(app.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Cancel Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!cancellingAppointmentId}
          title="Cancel Appointment"
          description="Are you sure you want to cancel this booking? This action cannot be undone."
          confirmLabel="Yes, Cancel Booking"
          cancelLabel="Keep Booking"
          isDanger
          onConfirm={() => {
            if (cancellingAppointmentId) {
              cancelMutation.mutate({ id: cancellingAppointmentId, reason: "Cancelled by customer" });
            }
          }}
          onCancel={() => setCancellingAppointmentId(null)}
        />
      </div>
    </CustomerLayout>
  );
}