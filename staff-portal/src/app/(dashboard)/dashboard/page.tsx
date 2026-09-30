"use client";

import React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { useSocket } from "@/context/socket-context";
import { getStaffAppointmentsApi, getStaffQueueApi, getStaffPerformanceApi } from "@/lib/api/staff";
import { confirmAppointmentApi, completeAppointmentApi } from "@/lib/api/appointments";
import { formatCurrency, formatTime, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Radio, 
  ArrowRight, 
  IndianRupee, 
  Sparkles, 
  Scissors,
  CheckCircle,
  Building2,
  CalendarDays,
  UserCheck
} from "lucide-react";

export default function StaffDashboardPage() {
  const queryClient = useQueryClient();
  const { user, staff, staffId } = useAuth();
  const { socket } = useSocket();

  // Socket.IO realtime listeners for automatic cache invalidation
  React.useEffect(() => {
    if (!socket) return;

    const handleApptUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["staff-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["staff-performance"] });
    };

    const handleQueueUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["staff-queue"] });
    };

    socket.on("appointment:created", handleApptUpdate);
    socket.on("appointment:new", handleApptUpdate);
    socket.on("appointment:updated", handleApptUpdate);
    socket.on("appointment:cancelled", handleApptUpdate);
    socket.on("queue:joined", handleQueueUpdate);
    socket.on("queue:entry_updated", handleQueueUpdate);
    socket.on("queue:called", handleQueueUpdate);
    socket.on("queue:serving", handleQueueUpdate);
    socket.on("queue:completed", handleQueueUpdate);
    socket.on("queue:skipped", handleQueueUpdate);
    socket.on("queue:updated", handleQueueUpdate);

    return () => {
      socket.off("appointment:created", handleApptUpdate);
      socket.off("appointment:new", handleApptUpdate);
      socket.off("appointment:updated", handleApptUpdate);
      socket.off("appointment:cancelled", handleApptUpdate);
      socket.off("queue:joined", handleQueueUpdate);
      socket.off("queue:entry_updated", handleQueueUpdate);
      socket.off("queue:called", handleQueueUpdate);
      socket.off("queue:serving", handleQueueUpdate);
      socket.off("queue:completed", handleQueueUpdate);
      socket.off("queue:skipped", handleQueueUpdate);
      socket.off("queue:updated", handleQueueUpdate);
    };
  }, [socket, queryClient]);

  // 1. Staff appointments
  const { data: apptData, isLoading: apptLoading } = useQuery({
    queryKey: ["staff-appointments", staffId],
    queryFn: () => (staffId ? getStaffAppointmentsApi(staffId, { limit: 20 }) : null),
    enabled: !!staffId,
  });

  // 2. Staff Queue
  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ["staff-queue", staffId],
    queryFn: () => (staffId ? getStaffQueueApi(staffId) : null),
    enabled: !!staffId,
  });

  // 3. Performance Summary
  const { data: perfData, isLoading: perfLoading } = useQuery({
    queryKey: ["staff-performance", staffId],
    queryFn: () => (staffId ? getStaffPerformanceApi(staffId) : null),
    enabled: !!staffId,
  });

  // Appointment Mutations
  const confirmMutation = useMutation({
    mutationFn: confirmAppointmentApi,
    onSuccess: () => {
      toast.success("Appointment confirmed");
      queryClient.invalidateQueries({ queryKey: ["staff-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["staff-appointments-list"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to confirm appointment");
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeAppointmentApi,
    onSuccess: () => {
      toast.success("Appointment completed");
      queryClient.invalidateQueries({ queryKey: ["staff-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["staff-appointments-list"] });
      queryClient.invalidateQueries({ queryKey: ["staff-performance"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to complete appointment");
    },
  });

  const appointments = apptData?.data || [];
  const queueEntries = queueData || [];
  const performance = perfData || {
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    noShowAppointments: 0,
    totalRevenue: 0,
  };

  const displayName = staff?.displayName || user?.displayName || user?.name || "Specialist";
  const businessName = staff?.business?.name || "Salon SaaS Platform";

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Active or next client
  const inChair = queueEntries.find((e) => e.status === "SERVING");
  const nextServing = inChair || queueEntries.find((e) => e.status === "CALLED") || queueEntries[0];

  const waitingCount = queueEntries.filter((e) => e.status === "WAITING").length;
  const inProgressCount = queueEntries.filter((e) => e.status === "SERVING").length;

  // Today's date string in local format
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {greeting}, {displayName}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Here&apos;s what your day looks like.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/queue">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 text-xs h-9 px-3.5 shadow-xs">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-100" />
              Live Floor Queue ({waitingCount})
            </Button>
          </Link>
          <Link href="/appointments">
            <Button variant="outline" className="text-slate-700 font-medium text-xs h-9 px-3.5">
              All Bookings
            </Button>
          </Link>
        </div>
      </div>

      {/* Today Summary Row - Compact & Operational */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-500">Appointments</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          {apptLoading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {appointments.length}
            </div>
          )}
          <span className="text-[11px] text-slate-400 mt-0.5 block">Today&apos;s schedule</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-500">Waiting</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          {queueLoading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {waitingCount}
            </div>
          )}
          <span className="text-[11px] text-slate-400 mt-0.5 block">In lobby queue</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-500">In Chair</span>
            <Radio className="w-4 h-4 text-sky-500" />
          </div>
          {queueLoading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {inProgressCount}
            </div>
          )}
          <span className="text-[11px] text-slate-400 mt-0.5 block">Active client</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-500">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          {perfLoading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {performance.completedAppointments}
            </div>
          )}
          <span className="text-[11px] text-slate-400 mt-0.5 block">Services rendered</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-500">Earnings</span>
            <IndianRupee className="w-4 h-4 text-slate-700" />
          </div>
          {perfLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(performance.totalRevenue)}
            </div>
          )}
          <span className="text-[11px] text-slate-400 mt-0.5 block">Settled revenue</span>
        </div>
      </div>

      {/* CURRENT / NEXT APPOINTMENT HERO */}
      {nextServing ? (
        <div className={`p-5 rounded-2xl border transition-all ${
          inChair 
            ? "border-emerald-300 bg-emerald-50/40" 
            : "border-slate-200 bg-white shadow-xs"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  inChair ? "bg-emerald-200 text-emerald-900" : "bg-sky-100 text-sky-800"
                }`}>
                  {inChair ? "Now Serving" : "Next In Line"}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-600">
                  Floor Queue Token
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-2 pt-1">
                <span className="text-xl sm:text-2xl font-bold text-slate-900">
                  Token #{nextServing.tokenNumber}
                </span>
                <span className="text-slate-300 text-lg">|</span>
                <span className="text-base sm:text-lg font-semibold text-slate-800">
                  {nextServing.customerName || nextServing.customer?.user?.displayName || nextServing.customer?.user?.name || "Walk-in Guest"}
                </span>
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
                <Scissors className="w-3.5 h-3.5 text-slate-400" />
                Service: <strong className="font-semibold text-slate-700">{nextServing.serviceName || nextServing.service?.name || "General Treatment"}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
              <Link href="/queue">
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs h-9 px-4 gap-1.5 shadow-xs">
                  Manage in Queue
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Two Column Layout: Today's Appointments (Primary) + Shift & Performance Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments - PRIMARY SECTION */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Today&apos;s appointments
            </h2>
            <Link
              href="/appointments"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View all ({appointments.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {apptLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200/80 text-center shadow-xs">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-800 text-sm">No appointments scheduled for today.</p>
              <p className="text-xs text-slate-500 mt-1">Walk-in clients will show in your Floor Queue.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
              {appointments.slice(0, 6).map((apt) => {
                const clientName =
                  apt.customer?.user?.displayName || apt.customer?.user?.name || "Client";
                const clientPhone = apt.customer?.user?.phone || "";
                const serviceName =
                  apt.service?.name || apt.appointmentServices?.[0]?.service?.name || "Treatment";
                const duration = apt.service?.durationMinutes || 30;
                const isPending = apt.status === "PENDING";
                const isConfirmed = apt.status === "CONFIRMED";

                return (
                  <div
                    key={apt.id}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="w-12 text-center shrink-0">
                        <span className="text-xs font-bold text-slate-900 block">
                          {formatTime(apt.startTime)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {duration} min
                        </span>
                      </div>

                      <div className="h-8 w-px bg-slate-200 shrink-0 hidden sm:block" />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 text-sm truncate">
                            {clientName}
                          </p>
                          <StatusBadge status={apt.status} />
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {serviceName}
                          {clientPhone && <span className="text-slate-400 ml-2">• {clientPhone}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {isPending && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs font-medium h-8 px-3"
                          isLoading={confirmMutation.isPending}
                          onClick={() => confirmMutation.mutate(apt.id)}
                        >
                          Confirm
                        </Button>
                      )}

                      {isConfirmed && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium h-8 px-3"
                          isLoading={completeMutation.isPending}
                          onClick={() => completeMutation.mutate(apt.id)}
                        >
                          Complete
                        </Button>
                      )}

                      <Link href={`/appointments/${apt.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs font-medium text-slate-600 h-8 px-2.5">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Operational Shift & Performance Sidebar */}
        <div className="space-y-3.5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Shift & Summary
          </h2>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Completed Sessions</span>
              <span className="font-bold text-slate-900">{performance.completedAppointments}</span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Cancellations</span>
              <span className="font-bold text-slate-900">{performance.cancelledAppointments}</span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">No-Shows</span>
              <span className="font-bold text-amber-700">{performance.noShowAppointments}</span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Settled Revenue</span>
              <span className="font-bold text-emerald-700 text-sm">
                {formatCurrency(performance.totalRevenue)}
              </span>
            </div>

            <div className="pt-2 space-y-2">
              <Link href="/schedule" className="block">
                <Button variant="outline" className="w-full text-xs font-medium h-9 text-slate-700 justify-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  View Shift Schedule
                </Button>
              </Link>
              <Link href="/customers" className="block">
                <Button variant="outline" className="w-full text-xs font-medium h-9 text-slate-700 justify-start gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Customer Directory
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}