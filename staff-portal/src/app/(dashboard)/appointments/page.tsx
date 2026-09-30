"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { useSocket } from "@/context/socket-context";
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
  const { socket } = useSocket();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [timeframe, setTimeframe] = useState<"all" | "today" | "tomorrow">("all");
  const [page, setPage] = useState(1);

  React.useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["staff-appointments-list"] });
      queryClient.invalidateQueries({ queryKey: ["staff-appointments"] });
    };

    socket.on("appointment:created", handleUpdate);
    socket.on("appointment:new", handleUpdate);
    socket.on("appointment:updated", handleUpdate);
    socket.on("appointment:cancelled", handleUpdate);

    return () => {
      socket.off("appointment:created", handleUpdate);
      socket.off("appointment:new", handleUpdate);
      socket.off("appointment:updated", handleUpdate);
      socket.off("appointment:cancelled", handleUpdate);
    };
  }, [socket, queryClient]);

  const [todayStr] = useState(() => new Date().toISOString().split("T")[0]);
  const [tomorrowStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

  const activeDate = timeframe === "today" ? todayStr : timeframe === "tomorrow" ? tomorrowStr : dateFilter;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["staff-appointments-list", staffId, statusFilter, activeDate, page],
    queryFn: () => (staffId ? getStaffAppointmentsApi(staffId, {
      page,
      limit: 50,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      date: activeDate || undefined,
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
    const phone = apt.customer?.user?.phone || "";
    return (
      custName.toLowerCase().includes(q) ||
      svcName.toLowerCase().includes(q) ||
      phone.includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Appointments
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Operational appointment workspace — view, confirm, and complete your assigned bookings.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        {/* Quick Date Tabs & Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Segment */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTimeframe("all");
                setDateFilter("");
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === "all" && !dateFilter
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Dates
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeframe("today");
                setDateFilter("");
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === "today"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeframe("tomorrow");
                setDateFilter("");
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === "tomorrow"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Date Picker for Custom Date & Status dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setTimeframe("all");
                setPage(1);
              }}
              className="h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              title="Custom date filter"
            />
            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateFilter("")}
                className="text-xs text-slate-500 hover:text-slate-800 h-9 px-2"
              >
                Clear
              </Button>
            )}

            <div className="w-36">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
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
          </div>
        </div>

        {/* Customer Search */}
        <div className="w-full">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search customer, service name, or phone number..."
          />
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load appointments"
          description="Could not connect to service. Please verify your connection."
          onRetry={() => refetch()}
        />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments found"
          description={
            search || statusFilter !== "ALL" || activeDate
              ? "No appointments match your search or filter criteria."
              : "No appointments are currently scheduled for your profile."
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Time & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => {
                  const custName = apt.customer?.user?.displayName || apt.customer?.user?.name || "Client";
                  const custPhone = apt.customer?.user?.phone || "";
                  const serviceName = apt.service?.name || apt.appointmentServices?.[0]?.service?.name || "Service";
                  const duration = apt.service?.durationMinutes || 30;
                  const isPending = apt.status === "PENDING";
                  const isConfirmed = apt.status === "CONFIRMED";

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {formatTime(apt.startTime)}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>{formatDate(apt.appointmentDate)}</span>
                          <span>•</span>
                          <span>{duration}m</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{custName}</div>
                        {custPhone && <div className="text-[11px] text-slate-400">{custPhone}</div>}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{serviceName}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={apt.status} />
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                        {apt.totalAmount ? formatCurrency(apt.totalAmount) : "—"}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs font-medium h-7 px-2.5"
                              isLoading={confirmMutation.isPending}
                              onClick={() => confirmMutation.mutate(apt.id)}
                            >
                              Confirm
                            </Button>
                          )}

                          {isConfirmed && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium h-7 px-2.5"
                              isLoading={completeMutation.isPending}
                              onClick={() => completeMutation.mutate(apt.id)}
                            >
                              Complete
                            </Button>
                          )}

                          <Link href={`/appointments/${apt.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs font-medium text-slate-600 h-7 px-2">
                              View
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

          {/* Mobile Stacked List View */}
          <div className="md:hidden divide-y divide-slate-100 rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
            {appointments.map((apt) => {
              const custName = apt.customer?.user?.displayName || apt.customer?.user?.name || "Client";
              const custPhone = apt.customer?.user?.phone || "";
              const serviceName = apt.service?.name || apt.appointmentServices?.[0]?.service?.name || "Service";
              const duration = apt.service?.durationMinutes || 30;
              const isPending = apt.status === "PENDING";
              const isConfirmed = apt.status === "CONFIRMED";

              return (
                <div key={apt.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {formatTime(apt.startTime)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">({duration}m)</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{formatDate(apt.appointmentDate)}</p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>

                  <div className="text-xs">
                    <p className="font-semibold text-slate-900">{custName}</p>
                    <p className="text-slate-500">{serviceName}</p>
                    {custPhone && <p className="text-slate-400 mt-0.5">{custPhone}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-700">
                      {apt.totalAmount ? formatCurrency(apt.totalAmount) : ""}
                    </span>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs font-medium h-7 px-2.5"
                          isLoading={confirmMutation.isPending}
                          onClick={() => confirmMutation.mutate(apt.id)}
                        >
                          Confirm
                        </Button>
                      )}

                      {isConfirmed && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium h-7 px-2.5"
                          isLoading={completeMutation.isPending}
                          onClick={() => completeMutation.mutate(apt.id)}
                        >
                          Complete
                        </Button>
                      )}

                      <Link href={`/appointments/${apt.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs font-medium text-slate-600 h-7 px-2">
                          View
                        </Button>
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