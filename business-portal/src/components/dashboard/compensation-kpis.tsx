"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getBusinessPayrollSummaryApi } from "@/lib/api/compensation";
import { DollarSign, Percent, Award, Users, ArrowRight, ShieldCheck } from "lucide-react";

interface CompensationKpisProps {
  businessId?: string;
}

export const CompensationKpis: React.FC<CompensationKpisProps> = ({ businessId }) => {
  const { data: payroll, isLoading } = useQuery({
    queryKey: ["business-payroll-summary", businessId],
    queryFn: () => (businessId ? getBusinessPayrollSummaryApi(businessId) : null),
    enabled: !!businessId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 rounded-xl bg-white border border-slate-100 p-4 shadow-xs animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!payroll) return null;

  const cards = [
    {
      label: "Estimated Total Payroll",
      value: `₹${Number(payroll.estimatedPayroll || 0).toLocaleString()}`,
      subtext: `${payroll.month} total obligations`,
      icon: DollarSign,
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      highlight: true,
    },
    {
      label: "Guaranteed Staff Salaries",
      value: `₹${Number(payroll.totalStaffCost || 0).toLocaleString()}`,
      subtext: `Active base for ${payroll.staffCount} team members`,
      icon: Users,
      iconBg: "bg-slate-50 text-slate-600 border border-slate-200",
    },
    {
      label: "Commission Earned",
      value: `₹${Number(payroll.totalCommission || 0).toLocaleString()}`,
      subtext: "Calculated from completed services",
      icon: Percent,
      iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
    },
    {
      label: "Pending Incentives Pool",
      value: `₹${Number(payroll.pendingIncentives || 0).toLocaleString()}`,
      subtext: "Active target milestones",
      icon: Award,
      iconBg: "bg-amber-50 text-amber-600 border border-amber-100",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Staff Compensation & Payroll
          </h2>
          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {payroll.month}
          </span>
        </div>
        <Link
          href="/staff"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
        >
          Manage Staff <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 truncate max-w-[150px]">
                  {card.label}
                </span>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.iconBg}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="my-2">
                <span
                  className={`text-2xl font-bold tracking-tight ${
                    card.highlight ? "text-white" : "text-slate-900"
                  }`}
                >
                  {card.value}
                </span>
              </div>

              <div className="pt-1 text-[11px] font-medium text-slate-400">
                <span className={card.highlight ? "text-emerald-300/80" : "text-slate-400"}>
                  {card.subtext}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
