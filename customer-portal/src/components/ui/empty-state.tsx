import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === "function" || (typeof icon === "object" && icon !== null)) {
      const IconComponent = icon as unknown as React.ComponentType<{ className?: string }>;
      return <IconComponent className="h-7 w-7" />;
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center p-10 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-3">
        {renderIcon()}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};