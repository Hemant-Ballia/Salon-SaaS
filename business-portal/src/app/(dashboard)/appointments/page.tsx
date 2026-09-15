"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAppointmentsApi, 
  confirmAppointmentApi, 
  completeAppointmentApi 
} from "@/lib/api/appointments";
import { Appointment } from "@/types/models";
import { formatCurrency, formatDate } from "@/lib/utils";
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
  Filter 
} from "lucide-react";

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["appointments", statusFilter, dateFilter, page],
    queryFn: () => getAppointmentsApi({
      page,
      limit: 30,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      appointmentDate: dateFilter || undefined,
    }),
  });

  const confirmMutation = useMutation({
    mutationFn: confirmAppointmentApi,
    onSuccess: () => {
      toast.success("Appointment confirmed");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to confirm");
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeAppointmentApi,
    onSuccess: () => {
      toast.success("Appointment completed");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to complete");
    },
  });

  const appointments = (data?.data || []).filter((apt) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const custName = apt.customer?.user?.displayName || apt.customer?.user?.email || "";
    const svcName = apt.service?.name || "";
    const staffName = apt.staff?.displayName || apt.staff?.user?.displayName || "";
    return (
      custName.toLowerCase().includes(q) ||
      svcName.toLowerCase().includes(q) ||
      staffName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track and manage bookings, confirmed schedules, and customer visits.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by customer, service, or staff..."
            />
          </div>
          <div className="w-full md:w-48">
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
          <div className="w-full md:w-48">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>
          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateFilter("")}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Clear Date
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load appointments"
          description="Could not connect to backend server. Please verify the API is running."
          onRetry={() => refetch()}
        />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments found"
          description={
            search || statusFilter !== "ALL" || dateFilter
              ? "No bookings match your selected criteria. Try adjusting your filters."
              : "No customer bookings have been scheduled yet."
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Service & Staff</th>
                  <th className="px-6 py-3.5">Schedule</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => {
                  const custName = apt.customer?.user?.displayName || "Customer";
                  const custPhone = apt.customer?.user?.phone || apt.customer?.user?.email || "";
                  const svcName = apt.service?.name || "Service";
                  const staffName = apt.staff?.displayName || apt.staff?.user?.displayName || "Any Specialist";
                  const isPending = apt.status === "PENDING";
                  const isConfirmed = apt.status === "CONFIRMED";

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center text-xs">
                            {custName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{custName}</p>
                            <p className="text-xs text-slate-500">{custPhone}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-slate-900">{svcName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-400" />
                          {staffName}
                        </p>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-slate-900 font-medium">
                          {formatDate(apt.appointmentDate)}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {apt.startTime} {apt.endTime ? `- ${apt.endTime}` : ""}
                        </p>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={apt.status} />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        {formatCurrency(apt.service?.price || apt.totalAmount || 0)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8 gap-1 text-xs"
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
                              variant="outline"
                              className="text-blue-700 border-blue-300 hover:bg-blue-50 h-8 gap-1 text-xs"
                              isLoading={completeMutation.isPending}
                              onClick={() => completeMutation.mutate(apt.id)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Complete
                            </Button>
                          )}

                          <Link href={`/appointments/${apt.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600">
                              Details
                              <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}