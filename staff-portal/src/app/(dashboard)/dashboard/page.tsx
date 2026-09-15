"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { getStaffAppointmentsApi, getStaffQueueApi, getStaffPerformanceApi } from "@/lib/api/staff";
import { formatCurrency, formatTime, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Radio, 
  ArrowRight, 
  DollarSign, 
  Sparkles, 
  Scissors,
  UserX
} from "lucide-react";

export default function StaffDashboardPage() {
  const { staff, staffId } = useAuth();

  // 1. Staff appointments
  const { data: apptData, isLoading: apptLoading } = useQuery({
    queryKey: ["staff-appointments", staffId],
    queryFn: () => (staffId ? getStaffAppointmentsApi(staffId, { limit: 10 }) : null),
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

  const appointments = apptData?.data || [];
  const queueEntries = queueData || [];
  const performance = perfData || {
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    noShowAppointments: 0,
    totalRevenue: 0,
  };

  const nextServing = queueEntries.find((e) => e.status === "SERVING") || queueEntries.find((e) => e.status === "CALLED") || queueEntries[0];

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.appointmentDate && a.appointmentDate.startsWith(todayStr));
  const completedToday = appointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-emerald-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Staff Portal Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {staff?.displayName || "Specialist"}!
          </h1>
          <p className="text-emerald-100 text-sm max-w-md">
            Ready for today’s clients? Check your live queue and assigned bookings below.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link href="/queue">
            <Button className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold gap-2 shadow-sm">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              Open Live Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Next Client / Queue Hero */}
      {nextServing ? (
        <Card className="border-2 border-emerald-500/40 bg-emerald-50/20 shadow-md">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {nextServing.status === "SERVING" ? "Now In Chair" : "Next In Line"}
                </span>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-3xl font-black text-slate-900">
                    Token #{nextServing.tokenNumber}
                  </h2>
                  <p className="text-lg font-bold text-slate-800">
                    {nextServing.customerName || nextServing.customer?.user?.displayName || nextServing.customer?.user?.name || "Walk-in Guest"}
                  </p>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-slate-400" />
                  Service: {nextServing.serviceName || nextServing.service?.name || "General Service"}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 md:pt-0">
                <Link href="/queue">
                  <Button size="lg" className="gap-2 font-bold w-full md:w-auto">
                    Manage in Queue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Queue Waiting</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          {queueLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {queueEntries.filter((e) => e.status === "WAITING").length}
            </p>
          )}
          <p className="text-[11px] text-slate-400 mt-1">Walk-in clients in lobby</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bookings</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          {apptLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {appointments.length}
            </p>
          )}
          <p className="text-[11px] text-slate-400 mt-1">Total assigned appointments</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          {perfLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {performance.completedAppointments}
            </p>
          )}
          <p className="text-[11px] text-slate-400 mt-1">Successful services rendered</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Revenue</span>
            <DollarSign className="w-4 h-4 text-teal-500" />
          </div>
          {perfLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {formatCurrency(performance.totalRevenue)}
            </p>
          )}
          <p className="text-[11px] text-slate-400 mt-1">Paid customer contribution</p>
        </Card>
      </div>

      {/* Two Column Section: Assigned Bookings & Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Upcoming Schedule
            </h2>
            <Link
              href="/appointments"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View All ({appointments.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {apptLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-500 text-sm">
                No appointments currently assigned to you.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 5).map((apt) => {
                const clientName =
                  apt.customer?.user?.displayName || apt.customer?.user?.name || "Client";
                const serviceName =
                  apt.service?.name || apt.appointmentServices?.[0]?.service?.name || "Service";

                return (
                  <Card key={apt.id} className="hover:border-emerald-300 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {clientName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{clientName}</p>
                          <p className="text-xs text-slate-500 truncate">{serviceName}</p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(apt.appointmentDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(apt.startTime)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={apt.status} />
                        <Link href={`/appointments/${apt.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            View
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Performance & Actions Card */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Performance Metric
          </h2>

          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Completed Sessions</span>
                <span className="text-sm font-bold text-slate-900">{performance.completedAppointments}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Cancellations</span>
                <span className="text-sm font-bold text-slate-900">{performance.cancelledAppointments}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500">No-Shows</span>
                <span className="text-sm font-bold text-amber-600">{performance.noShowAppointments}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-semibold text-slate-500">Revenue Contribution</span>
                <span className="text-sm font-black text-emerald-700">
                  {formatCurrency(performance.totalRevenue)}
                </span>
              </div>

              <div className="pt-2">
                <Link href="/schedule">
                  <Button variant="outline" className="w-full text-xs font-bold gap-2">
                    <Clock className="w-4 h-4" />
                    Manage Weekly Shift Hours
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}