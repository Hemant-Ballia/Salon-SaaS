import React from "react";
import NextLink from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminRecentAppointment } from "@/types/models";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowRight, Calendar } from "lucide-react";

interface RecentAppointmentsTableProps {
  appointments?: AdminRecentAppointment[];
  isLoading?: boolean;
}

export const RecentAppointmentsTable: React.FC<RecentAppointmentsTableProps> = ({
  appointments = [],
  isLoading = false,
}) => {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between p-4 sm:px-5 sm:py-3.5 border-b border-slate-100">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Recent Platform Appointments
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-tenant booking transactions and customer appointments
          </p>
        </div>

        <NextLink
          href="/appointments"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </NextLink>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        {isLoading ? (
          <div className="p-4 space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
            <Calendar className="h-6 w-6 text-slate-300 mb-1" />
            No platform appointments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Client</th>
                  <th className="py-2.5 px-3">Business</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900 text-xs truncate max-w-[130px]">
                        {apt.customer?.user?.name || "Guest Client"}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                        {apt.customer?.user?.email || "-"}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      <div className="truncate max-w-[130px] text-xs">
                        {apt.business?.name || "Salon SaaS"}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-600">
                      <div className="truncate max-w-[120px] text-xs">
                        {apt.service?.name || "General Service"}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap text-xs">
                      <div>{formatDate(apt.appointmentDate)}</div>
                      <div className="text-[11px] text-slate-400">{apt.startTime}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <StatusBadge status={apt.status} />
                    </td>

                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap text-xs">
                      {formatCurrency(apt.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
