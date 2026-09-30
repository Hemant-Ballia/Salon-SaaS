import React from "react";
import { Badge } from "./badge";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const normalized = status ? status.toUpperCase().replace(/\s+/g, "_") : "UNKNOWN";

  switch (normalized) {
    case "CONFIRMED":
      return (
        <Badge variant="success" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Confirmed
        </Badge>
      );

    case "SERVING":
    case "IN_PROGRESS":
      return (
        <Badge variant="info" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse shrink-0" />
          In Progress
        </Badge>
      );

    case "COMPLETED":
      return (
        <Badge variant="success" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
          Completed
        </Badge>
      );

    case "WAITING":
    case "PENDING":
      return (
        <Badge variant="warning" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          {normalized === "PENDING" ? "Pending" : "Waiting"}
        </Badge>
      );

    case "CALLED":
      return (
        <Badge variant="info" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          Called
        </Badge>
      );

    case "CANCELLED":
      return (
        <Badge variant="danger" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          Cancelled
        </Badge>
      );

    case "NO_SHOW":
      return (
        <Badge variant="danger" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
          No Show
        </Badge>
      );

    case "RESCHEDULED":
      return (
        <Badge variant="neutral" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
          Rescheduled
        </Badge>
      );

    default:
      return (
        <Badge variant="neutral" className={className}>
          {status || "Unknown"}
        </Badge>
      );
  }
};