import React from "react";
import NextLink from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminRecentBusiness } from "@/types/models";
import { formatDate } from "@/lib/utils";
import { ArrowRight, Store } from "lucide-react";

interface RecentBusinessesTableProps {
  businesses?: AdminRecentBusiness[];
  isLoading?: boolean;
}

const CATEGORY_BADGE: Record<string, { label: string; className: string }> = {
  SALON: { label: "Salon", className: "bg-slate-100 text-slate-700 border-slate-200" },
  CAR_WASH: { label: "Car Wash", className: "bg-slate-100 text-slate-700 border-slate-200" },
  BARBER: { label: "Barber", className: "bg-slate-100 text-slate-700 border-slate-200" },
  BEAUTY_PARLOUR: { label: "Parlour", className: "bg-slate-100 text-slate-700 border-slate-200" },
  OTHER: { label: "Other", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

export const RecentBusinessesTable: React.FC<RecentBusinessesTableProps> = ({
  businesses = [],
  isLoading = false,
}) => {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between p-4 sm:px-5 sm:py-3.5 border-b border-slate-100">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Recent Tenant Registrations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Newly registered businesses onboarded to the SaaS platform
          </p>
        </div>

        <NextLink
          href="/businesses"
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
        ) : businesses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
            <Store className="h-6 w-6 text-slate-300 mb-1" />
            No tenant businesses registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Business</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Registered</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {businesses.map((biz) => {
                  const cat = CATEGORY_BADGE[biz.businessType] || CATEGORY_BADGE.OTHER;
                  return (
                    <tr key={biz.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900 text-xs truncate max-w-[160px]">
                          {biz.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          /{biz.slug}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cat.className}`}
                        >
                          {cat.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-600">
                        <div className="font-medium text-slate-800 text-xs truncate max-w-[130px]">
                          {biz.owner?.name || "Owner"}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                          {biz.owner?.email || "-"}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <StatusBadge status={biz.status} />
                      </td>

                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap text-xs">
                        {formatDate(biz.createdAt)}
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <NextLink
                          href={`/businesses/${biz.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          Manage
                          <ArrowRight className="h-3 w-3" />
                        </NextLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
