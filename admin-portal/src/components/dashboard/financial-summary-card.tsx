import React from "react";
import NextLink from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPaymentsSummary } from "@/types/models";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Clock, RotateCcw, AlertTriangle } from "lucide-react";

interface FinancialSummaryCardProps {
  payments?: AdminPaymentsSummary;
  isLoading?: boolean;
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  payments,
  isLoading = false,
}) => {
  if (isLoading || !payments) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      </div>
    );
  }

  const items = [
    {
      label: "Settled",
      amount: payments.paidVolume,
      count: payments.paidCount,
      icon: CheckCircle2,
      dot: "bg-emerald-500",
    },
    {
      label: "Pending",
      amount: payments.pendingVolume,
      count: payments.pendingCount,
      icon: Clock,
      dot: "bg-amber-500",
    },
    {
      label: "Refunded",
      amount: payments.refundedVolume,
      count: payments.refundedCount,
      icon: RotateCcw,
      dot: "bg-slate-400",
    },
    {
      label: "Failed",
      amount: payments.failedVolume,
      count: payments.failedCount,
      icon: AlertTriangle,
      dot: "bg-rose-500",
    },
  ];

  const settlementRate =
    payments.totalCount > 0
      ? Math.round((payments.paidCount / payments.totalCount) * 100)
      : 100;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Settlement Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Transaction reconciliation by state
            </p>
          </div>
          <NextLink
            href="/payments"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0"
          >
            Payments
            <ArrowRight className="h-3 w-3" />
          </NextLink>
        </div>

        {/* Clean Settlement Summary Bar */}
        <div className="py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Settlement Success Rate</span>
            <span className="font-bold text-emerald-600">{settlementRate}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5 flex">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${settlementRate}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>{payments.paidCount} of {payments.totalCount} settled</span>
            <span>Total initiated: {formatCurrency(payments.totalVolume)}</span>
          </div>
        </div>
      </div>

      {/* Breakdown 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
        {items.map((item) => (
          <div
            key={item.label}
            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col justify-between"
          >
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
              {item.label}
            </div>
            <div className="font-bold text-slate-900 mt-1 text-sm truncate tabular-nums">
              {formatCurrency(item.amount)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{item.count} txns</div>
          </div>
        ))}
      </div>
    </div>
  );
};
