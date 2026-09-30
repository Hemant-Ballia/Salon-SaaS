"use client";

import React from "react";
import Link from "next/link";
import { Appointment } from "@/types/models";
import { BusinessThemeConfig } from "@/config/business-theme";
import { ArrowRight, Eye, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RecentAppointmentsTableProps {
  appointments: Appointment[];
  theme: BusinessThemeConfig;
  isLoading?: boolean;
}

export const RecentAppointmentsTable: React.FC<RecentAppointmentsTableProps> = ({
  appointments = [],
  theme,
  isLoading = false,
}) => {
  const isSalon = theme.themeKey === "salon";
  const title = isSalon ? "Today's Appointments" : "Recent Appointments";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "CONFIRMED":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "IN_PROGRESS":
        return "bg-sky-50 text-sky-700 border-sky-200/80";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/80";
    }
  };

  const formatStatusText = (status: string) => {
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "NO_SHOW") return "No Show";
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between h-full">
      {/* Table Card Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Real-time schedule and customer bookings
          </p>
        </div>

        <Link
          href="/appointments"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Desktop Table & Mobile Stacked Rows */}
      <div className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-12 rounded-xl bg-slate-50 animate-pulse" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-10 text-center text-slate-400 px-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
              <Calendar className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No appointments scheduled.</p>
            <Link
              href="/appointments"
              className="inline-block mt-1 text-xs font-semibold text-emerald-600 hover:underline"
            >
              Open appointments schedule →
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table (hidden on small mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Staff</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {appointments.map((apt) => {
                    const customerName =
                      apt.customer?.user?.displayName ||
                      apt.customer?.user?.name ||
                      "Customer";
                    const customerPhone = apt.customer?.user?.phone || "";
                    const serviceName =
                      apt.service?.name ||
                      apt.appointmentServices?.[0]?.service?.name ||
                      "Service";
                    const staffName =
                      apt.staff?.displayName || apt.staff?.user?.name || "Assigned";
                    const amount = apt.totalAmount || apt.service?.price || 0;

                    return (
                      <tr
                        key={apt.id}
                        className="hover:bg-slate-50/75 transition-colors group"
                      >
                        {/* Time */}
                        <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {apt.startTime}
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700 shrink-0">
                              {customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 leading-tight">
                                {customerName}
                              </div>
                              {customerPhone && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {customerPhone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Service */}
                        <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                          {serviceName}
                        </td>

                        {/* Staff */}
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {staffName}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusBadge(
                              apt.status
                            )}`}
                          >
                            {formatStatusText(apt.status)}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(amount)}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/appointments/${apt.id}`}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3 text-slate-400" />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Rows (visible on small screens) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {appointments.map((apt) => {
                const customerName =
                  apt.customer?.user?.displayName ||
                  apt.customer?.user?.name ||
                  "Customer";
                const serviceName =
                  apt.service?.name ||
                  apt.appointmentServices?.[0]?.service?.name ||
                  "Service";
                const staffName =
                  apt.staff?.displayName || apt.staff?.user?.name || "Assigned";
                const amount = apt.totalAmount || apt.service?.price || 0;

                return (
                  <div key={apt.id} className="p-3.5 space-y-2 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {apt.startTime}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-xs text-slate-800">
                          {customerName}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.2 text-[9px] font-semibold border ${getStatusBadge(
                          apt.status
                        )}`}
                      >
                        {formatStatusText(apt.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {serviceName} ({staffName})
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
