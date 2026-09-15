"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { 
  getStaffAppointmentsApi 
} from "@/lib/api/staff";
import { 
  confirmAppointmentApi, 
  completeAppointmentApi 
} from "@/lib/api/appointments";
import { Appointment } from "@/types/models";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  CheckCircle, 
  CheckCircle2, 
  ChevronRight, 
  Phone 
} from "lucide-react";

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { staffId } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["staff-appointments-list", staffId, statusFilter, page],
    queryFn: () => (staffId ? getStaffAppointmentsApi(staffId, {
      page,
      limit: 30,
      status: statusFilter === "ALL" ? undefined : statusFilter,
    }) : null),
    enabled: !!staffId,
  });

  const confirmMutation = useMutation({
    mutationFn: confirmAppointmentApi,
    onSuccess: () => {
      toast.success("Appointment confirmed");
      queryClient.invalidateQueries({ queryKey: ["staff-appointments-list"] });
      queryClient.invalidateQueries({ queryKey: ["staff-appointments"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to confirm");
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeAppointmentApi,
    onSuccess: () => {
      toast.success("Appointment marked as completed");
      queryClient.invalidateQueries({ queryKey: ["staff-appointments-list"] });
      queryClient.invalidateQueries({ queryKey: ["staff-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["staff-performance"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to complete");
    },
  });

  const appointments = (data?.data || []).filter((apt) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const custName = apt.customer?.user?.displayName || apt.customer?.user?.name || "";
    const svcName = apt.service?.name || apt.appointmentServices?.[0]?.service?.name || "";
    return custName.toLowerCase().includes(q) || svcName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          My Appointments
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review, confirm and complete your assigned client bookings.
        </p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by client or service name..."
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "PENDING", label: "Pending" },
                { value: "CONFIRMED", label: "Confirmed" },
                { value: "COMPLETED", label: "Completed" },
                { value: "CANCELLED", label: "Cancelled" },
                { value: "NO_SHOW", label: "No Show" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load appointments"
          description="Could not connect to service. Please verify your internet connection."
          onRetry={() => refetch()}
        />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No bookings found"
          description={
            search || statusFilter !== "ALL"
              ? "No appointments match your filter criteria."
              : "You have no upcoming or past bookings assigned."
          }
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const custName = apt.customer?.user?.displayName || apt.customer?.user?.name || "Client";
            const custPhone = apt.customer?.user?.phone || "";
            const svcName = apt.service?.name || apt.appointmentServices?.[0]?.service?.name || "Service";
            const isPending = apt.status === "PENDING";
            const isConfirmed = apt.status === "CONFIRMED";

            return (
              <Card key={apt.id} className="hover:border-emerald-300 transition-colors">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 font-extrabold flex items-center justify-center text-sm shrink-0">
                      {custName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{custName}</h3>
                        <StatusBadge status={apt.status} />
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{svcName}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-600">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(apt.appointmentDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                        </span>
                        {custPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {custPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {isPending && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs font-bold gap-1"
                        isLoading={confirmMutation.isPending}
                        onClick={() => confirmMutation.mutate(apt.id)}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Confirm
                      </Button>
                    )}

                    {isConfirmed && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
                        isLoading={completeMutation.isPending}
                        onClick={() => completeMutation.mutate(apt.id)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Complete
                      </Button>
                    )}

                    <Link href={`/appointments/${apt.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs font-semibold text-slate-600">
                        Details
                        <ChevronRight className="w-3.5 h-3.5 ml-1 text-slate-400" />
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
  );
}