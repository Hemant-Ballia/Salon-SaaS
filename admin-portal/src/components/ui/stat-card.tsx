import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  colorScheme?: "emerald" | "blue" | "amber" | "violet" | "sky" | "slate";
  className?: string;
}

const colorSchemeMap = {
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100/80",
  blue: "bg-blue-50 text-blue-600 border-blue-100/80",
  amber: "bg-amber-50 text-amber-600 border-amber-100/80",
  violet: "bg-violet-50 text-violet-600 border-violet-100/80",
  sky: "bg-sky-50 text-sky-600 border-sky-100/80",
  slate: "bg-slate-100 text-slate-600 border-slate-200/80",
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  colorScheme = "emerald",
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 truncate">
          {title}
        </span>
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
            colorSchemeMap[colorScheme]
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="mt-2">
        <div className="text-xl font-bold tracking-tight text-slate-900 leading-none">
          {value}
        </div>
        {(description || trend) && (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 truncate">
            {trend && (
              <span
                className={cn(
                  "font-medium shrink-0",
                  trend.isPositive ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {trend.value}
              </span>
            )}
            {description && <span className="truncate">{description}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
