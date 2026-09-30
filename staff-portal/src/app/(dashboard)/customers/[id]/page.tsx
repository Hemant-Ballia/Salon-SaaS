"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCustomerByIdApi, getCustomerAppointmentsApi } from "@/lib/api/customers";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  Scissors, 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck,
  CalendarCheck2
} from "lucide-react";

export default function StaffCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  // 1. Fetch Customer Profile
  const { data: customer, isLoading: isCustLoading, error: custError } = useQuery({
    queryKey: ["staff-customer-detail", customerId],
    queryFn: () => getCustomerByIdApi(customerId),
    enabled: !!customerId,
  });

  // 2. Fetch Customer Appointments
  const { data: apptData, isLoading: isApptLoading } = useQuery({
    queryKey: ["staff-customer-appointments", customerId],
    queryFn: () => getCustomerAppointmentsApi(customerId, { limit: 50 }),
    enabled: !!customerId,
  });

  if (isCustLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (custError || !customer) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <ErrorState
          title="Customer Not Found"
          description="This customer does not exist or has not visited your business."
          onRetry={() => router.push("/customers")}
        />
      </div>
    );
  }

  const name = customer.user?.displayName || customer.user?.name || "Client";
  const email = customer.user?.email || "No email";
  const phone = customer.user?.phone || "No phone";
  const initials = name.slice(0, 2).toUpperCase();
  const appointments = apptData?.data || [];

  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const upcomingCount = appointments.filter((a) => ["CONFIRMED", "PENDING", "RESCHEDULED"].includes(a.status)).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back Link & Header */}
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Customer Directory
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Profile
          </h1>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            customer.user?.isActive
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-slate-100 text-slate-600"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${customer.user?.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
            {customer.user?.isActive ? "Active Client" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Customer Header Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-lg shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">{name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {email}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 self-start sm:self-auto">
            Client since {formatDate(customer.createdAt)}
          </div>
        </div>

        {/* Operational Visit Summary */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Bookings</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{appointments.length}</p>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Completed</span>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{completedCount}</p>
          </div>
          <div className="p-3 bg-sky-50/60 rounded-xl">
            <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider">Upcoming</span>
            <p className="text-xl font-bold text-sky-700 mt-0.5">{upcomingCount}</p>
          </div>
        </div>
      </div>

      {/* Appointment History */}
      <div className="space-y-3.5">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
          Appointment History ({appointments.length})
        </h3>

        {isApptLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 text-center shadow-xs">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No past appointments recorded.</p>
            <p className="text-xs text-slate-500 mt-0.5">New bookings will appear here automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
            {appointments.map((apt) => {
              const serviceName = apt.service?.name || apt.appointmentServices?.[0]?.service?.name || "Treatment Service";
              const staffName = apt.staff?.displayName || "Assigned Specialist";

              return (
                <div
                  key={apt.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{serviceName}</span>
                      <StatusBadge status={apt.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(apt.appointmentDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Scissors className="w-3 h-3 text-slate-400" />
                        {staffName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(apt.totalAmount)}
                    </span>
                    <Link href={`/appointments/${apt.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs font-medium text-slate-600 h-8 px-2.5">
                        Details
                        <ChevronRight className="w-3.5 h-3.5 ml-1 text-slate-400" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

