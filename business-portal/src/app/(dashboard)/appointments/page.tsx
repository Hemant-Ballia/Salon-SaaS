"use client";

import React, { useState, useMemo } from "react";
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
  CheckCircle, 
  CheckCircle2, 
  ChevronRight,
  Eye,
  CreditCard
} from "lucide-react";

type QuickTimeFilter = "TODAY" | "TOMORROW" | "UPCOMING" | "PAST" | "ALL";

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<QuickTimeFilter>("TODAY");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Compute date query boundaries based on selected Quick Filter
  const dateParams = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    switch (timeFilter) {
      case "TODAY":
        return {
          dateFrom: today.toISOString(),
          dateTo: new Date(today.getTime() + 86399999).toISOString(),
        };
      case "TOMORROW":
        return {
          dateFrom: tomorrow.toISOString(),
          dateTo: new Date(tomorrow.getTime() + 86399999).toISOString(),
        };
      case "UPCOMING":
        return {
          dateFrom: today.toISOString(),
        };
      case "PAST":
        return {
          dateTo: new Date(today.getTime() - 1).toISOString(),
        };
      case "ALL":
      default:
        return {};
    }
  }, [timeFilter]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["appointments", statusFilter, timeFilter, page],
    queryFn: () => getAppointmentsApi({
      page,
      limit: 50,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      ...dateParams,
    }),
  });

  const confirmMutation = useMutation({
    mutationFn: confirmAppointmentApi,
    onSuccess: () => {
      toast.success("Appointment confirmed");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["business", "dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to confirm");
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeAppointmentApi,
    onSuccess: () => {
      toast.success("Appointment marked as completed");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["business", "dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to complete");
    },
  });

  const appointments = (data?.data || []).filter((apt) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const custName =
      apt.customer?.user?.displayName ||
      apt.customer?.user?.name ||
      apt.customer?.user?.email ||
      "";
    const svcName =
      apt.service?.name ||
      apt.appointmentServices?.[0]?.service?.name ||
      "";
    const staffName =
      apt.staff?.displayName ||
      apt.staff?.user?.name ||
      "";
    return (
      custName.toLowerCase().includes(q) ||
      svcName.toLowerCase().includes(q) ||
      staffName.toLowerCase().includes(q)
    );
  });

  const timeFilterTabs: { id: QuickTimeFilter; label: string }[] = [
    { id: "TODAY", label: "Today" },
    { id: "TOMORROW", label: "Tomorrow" },
    { id: "UPCOMING", label: "Upcoming" },
    { id: "PAST", label: "Past" },
    { id: "ALL", label: "All Bookings" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Appointments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Operational daily schedule, client arrivals, and booking status controls.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar (Prompt Section 21) */}
      <div className="space-y-3">
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
          {timeFilterTabs.map((tab) => {
            const isActive = timeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTimeFilter(tab.id)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Status Bar */}
        <Card className="border-slate-200/80">
          <CardContent className="p-3.5 flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by customer, staff, or service..."
              />
            </div>
            <div className="w-full md:w-52">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "PENDING", label: "Pending Confirmation" },
                  { value: "CONFIRMED", label: "Confirmed" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "CANCELLED", label: "Cancelled" },
                  { value: "NO_SHOW", label: "No Show" },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments Operational Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
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
            search || statusFilter !== "ALL"
              ? "No bookings match your selected criteria. Try adjusting your filters."
              : timeFilter === "TODAY"
              ? "No customer bookings scheduled for today."
              : "No customer bookings found for this period."
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Time</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Service</th>
                  <th className="px-5 py-3.5">Staff</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Payment</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => {
                  const custName =
                    apt.customer?.user?.displayName ||
                    apt.customer?.user?.name ||
                    "Customer";
                  const custPhone = apt.customer?.user?.phone || "";
                  const svcName =
                    apt.service?.name ||
                    apt.appointmentServices?.[0]?.service?.name ||
                    "Service";
                  const staffName =
                    apt.staff?.displayName ||
                    apt.staff?.user?.name ||
                    "Any Specialist";
                  const amount = apt.totalAmount || apt.service?.price || 0;
                  const isPending = apt.status === "PENDING";
                  const isConfirmed = apt.status === "CONFIRMED";

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/75 transition-colors">
                      {/* Time */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">
                          {apt.startTime}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {formatDate(apt.appointmentDate)}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {custName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{custName}</p>
                            {custPhone && (
                              <p className="text-[11px] text-slate-400 font-mono">{custPhone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-800">
                        {svcName}
                      </td>

                      {/* Staff */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {staffName}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={apt.status} />
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="font-bold text-slate-900 text-sm">
                          {formatCurrency(amount)}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-7.5 px-2.5 gap-1 text-xs"
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
                              className="text-blue-700 border-blue-300 hover:bg-blue-50 h-7.5 px-2.5 gap-1 text-xs"
                              isLoading={completeMutation.isPending}
                              onClick={() => completeMutation.mutate(apt.id)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Complete
                            </Button>
                          )}

                          <Link href={`/appointments/${apt.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7.5 px-2 text-slate-600 hover:text-slate-900 text-xs"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              Details
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

          {/* Mobile Stacked Rows */}
          <div className="md:hidden divide-y divide-slate-100">
            {appointments.map((apt) => {
              const custName =
                apt.customer?.user?.displayName ||
                apt.customer?.user?.name ||
                "Customer";
              const svcName =
                apt.service?.name ||
                apt.appointmentServices?.[0]?.service?.name ||
                "Service";
              const staffName =
                apt.staff?.displayName ||
                apt.staff?.user?.name ||
                "Staff";
              const amount = apt.totalAmount || apt.service?.price || 0;

              return (
                <div key={apt.id} className="p-4 space-y-2.5 hover:bg-slate-50/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-slate-900">{apt.startTime}</span>
                      <span className="text-xs text-slate-400 ml-2">{formatDate(apt.appointmentDate)}</span>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{custName}</p>
                      <p className="text-slate-500">{svcName} • {staffName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-sm">{formatCurrency(amount)}</p>
                      <Link href={`/appointments/${apt.id}`} className="text-[11px] text-emerald-600 font-semibold hover:underline">
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}