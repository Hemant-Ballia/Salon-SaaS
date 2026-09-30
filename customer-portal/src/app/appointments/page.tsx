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
  Users,
  Search,
  Tag
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BusinessCover } from "@/components/ui/business-cover";
import { ServiceImage } from "@/components/ui/service-image";
import { StaffAvatar } from "@/components/ui/staff-avatar";
import { useAuth } from "@/context/auth-context";
import { getMyAppointmentsApi, cancelAppointmentApi } from "@/lib/api/appointments";
import { joinQueueApi } from "@/lib/api/queues";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { Appointment } from "@/types/models";

const STATUS_FILTERS = [
  { label: "All Bookings", value: "ALL" },
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
      toast.success(`Joined live queue! Token #${res.entry.tokenNumber}`);
      router.push(`/queue/${res.entry.id}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to join queue");
    },
  });

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-xs">
            <Calendar className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Sign In to View Appointments
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Track your upcoming visits, manage reservations, join virtual queues, and view receipt summaries.
          </p>
          <Link href="/login?redirect=/appointments">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-xs">
              Sign In to Continue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const appointments: Appointment[] = (data?.data as Appointment[]) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <Calendar className="w-3.5 h-3.5" />
            My Bookings
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Appointments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track confirmed time slots, reschedule visits, or join the walk-in live queue.
          </p>
        </div>
        <Link href="/booking">
          <Button className="shrink-0 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs">
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
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all whitespace-nowrap ${
                isActive
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:border-emerald-300 hover:text-emerald-700"
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
          <Skeleton className="h-44 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center shadow-xs">
          <EmptyState
            icon={Calendar}
            title={selectedFilter === "ALL" ? "No appointments yet" : `No ${selectedFilter.toLowerCase()} appointments`}
            description="Explore our curated directory of salons, barbers, and spas to reserve your next look in minutes."
            action={
              <Link href="/booking">
                <Button className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs">
                  Book Your First Appointment
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Priority Upcoming Feature Card (shown on ALL or CONFIRMED) */}
          {(selectedFilter === "ALL" || selectedFilter === "CONFIRMED") && (() => {
            const nextUpcoming = appointments.find(
              (a) => a.status === "CONFIRMED" || a.status === "PENDING"
            );
            if (!nextUpcoming) return null;

            const servicesItems = nextUpcoming.services || nextUpcoming.appointmentServices || [];
            const servicesNames =
              servicesItems.map((s) => s.service?.name).filter(Boolean).join(", ") ||
              nextUpcoming.service?.name ||
              "Salon Service";
            const staffName = nextUpcoming.staff?.user?.name || nextUpcoming.staff?.displayName;

            return (
              <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xs">
                <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-emerald-50">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Next Upcoming Appointment
                  </div>
                  <StatusBadge status={nextUpcoming.status} />
                </div>

                <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-4 rounded-2xl overflow-hidden shadow-xs">
                    <BusinessCover business={nextUpcoming.business} aspectRatio="video" className="h-36 w-full" />
                  </div>

                  <div className="md:col-span-5 space-y-2">
                    <h3 className="text-xl font-black text-slate-900">
                      {nextUpcoming.business?.name || "Partner Salon"}
                    </h3>
                    <p className="text-sm font-bold text-emerald-700">
                      {servicesNames}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        {formatDate(nextUpcoming.appointmentDate)}
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {formatTime(nextUpcoming.startTime)}
                      </div>
                      {staffName && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <StaffAvatar name={staffName} size="xs" />
                          <span className="font-semibold">{staffName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-3 flex flex-col md:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-200/60">
                    <div className="md:text-right">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total</span>
                      <span className="text-2xl font-black text-slate-900">
                        {formatCurrency(nextUpcoming.totalAmount || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      {nextUpcoming.status === "CONFIRMED" && nextUpcoming.businessId && (
                        <Button
                          size="sm"
                          className="flex-1 md:flex-initial gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                          onClick={() =>
                            joinQueueMutation.mutate({
                              businessId: nextUpcoming.businessId,
                              appointmentId: nextUpcoming.id,
                            })
                          }
                          disabled={joinQueueMutation.isPending}
                        >
                          <Users className="w-3.5 h-3.5" />
                          Join Queue
                        </Button>
                      )}
                      <Link href={`/appointments/${nextUpcoming.id}`} className="flex-1 md:flex-initial">
                        <Button size="sm" variant="outline" className="w-full gap-1 text-xs border-slate-300 font-bold rounded-xl hover:border-emerald-500">
                          View Details
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* List of Appointments */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              All Bookings ({appointments.length})
            </h2>

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
                <div
                  key={app.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 hover:border-emerald-300 transition-all shadow-xs hover:shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Thumbnail + Info */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 shadow-2xs border border-slate-100">
                        <BusinessCover business={app.business} aspectRatio="square" className="w-full h-full" />
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={app.status} />
                          <span className="text-[11px] text-slate-400 font-mono">
                            #{app.id.slice(0, 8)}
                          </span>
                          {app.paymentStatus && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                app.paymentStatus === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {app.paymentStatus}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {app.business?.name || "Partner Salon"}
                          </h3>
                          <p className="text-xs font-semibold text-emerald-700 truncate">
                            {servicesNames}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1 font-medium text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{formatDate(app.appointmentDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatTime(app.startTime)} ({app.totalDurationMinutes || 30}m)</span>
                          </div>
                          {staffName && (
                            <div className="flex items-center gap-1 text-slate-600">
                              <StaffAvatar name={staffName} size="xs" />
                              <span className="truncate">{staffName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Quick Action */}
                    <div className="flex sm:flex-col sm:items-end justify-between items-center gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="sm:text-right">
                        <span className="text-lg font-black text-slate-900">
                          {formatCurrency(app.totalAmount || 0)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {canJoinQueue && app.businessId && (
                          <Button
                            size="sm"
                            className="gap-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl"
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
                          <Button size="sm" variant="outline" className="gap-1 text-xs border-slate-200 hover:border-emerald-400 hover:text-emerald-700 font-bold rounded-xl">
                            Details
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>

                        {canCancel && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold rounded-xl"
                            onClick={() => setCancellingAppointmentId(app.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
  );
}