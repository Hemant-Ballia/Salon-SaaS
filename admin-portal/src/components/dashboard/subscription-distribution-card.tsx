import React from "react";
import NextLink from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminSubscriptionsSummary, AdminBusinessDistribution } from "@/types/models";
import { ArrowRight } from "lucide-react";

interface SubscriptionDistributionCardProps {
  subscriptions?: AdminSubscriptionsSummary;
  distribution?: AdminBusinessDistribution;
  isLoading?: boolean;
}

export const SubscriptionDistributionCard: React.FC<SubscriptionDistributionCardProps> = ({
  subscriptions,
  distribution,
  isLoading = false,
}) => {
  if (isLoading || !subscriptions) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-10 w-24" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  // Type/Category Mix data
  const typeData = [...(distribution?.byType || [])].sort((a, b) => b.count - a.count);
  const totalBusinessesInType = typeData.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Subscription & Category Mix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active tier allocation and industry distribution
            </p>
          </div>
          <NextLink
            href="/subscriptions"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0"
          >
            Manage
            <ArrowRight className="h-3 w-3" />
          </NextLink>
        </div>

        {/* Active Subscriptions Top Stat */}
        <div className="py-3 flex items-baseline justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Active Subscriptions
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
              {subscriptions.active}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                / {subscriptions.total} total licenses
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
            100% In Good Standing
          </span>
        </div>

        {/* Plan Breakdown Mini Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2">
          {subscriptions.byPlan.map((plan) => (
            <div
              key={plan.plan}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col justify-between"
            >
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                {plan.plan}
              </span>
              <div className="text-base font-bold text-slate-900 mt-0.5">{plan.count}</div>
              <span className="text-[10px] text-slate-400">
                {plan.count === 1 ? "tenant" : "tenants"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Mix Bars */}
      <div className="pt-3.5 mt-2 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
          <span className="uppercase tracking-wider">Industry Category Mix</span>
          <span className="text-slate-400 font-normal">Count (%)</span>
        </div>

        <div className="space-y-2">
          {typeData.map((item) => {
            const pct = Math.round((item.count / totalBusinessesInType) * 100);
            return (
              <div key={item.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium capitalize truncate">
                    {item.type.replace(/_/g, " ").toLowerCase()}
                  </span>
                  <span className="text-slate-900 font-semibold shrink-0 ml-2">
                    {item.count} <span className="text-slate-400 font-normal text-[11px]">({pct}%)</span>
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
