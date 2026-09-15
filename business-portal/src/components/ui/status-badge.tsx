import React from "react";
import { Badge } from "./badge";

interface StatusBadgeProps {
  status: string | boolean | undefined | null;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  if (typeof status === "boolean") {
    return status ? (
      <Badge variant="success" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Active
      </Badge>
    ) : (
      <Badge variant="danger" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Inactive
      </Badge>
    );
  }

  const s = String(status || "").toUpperCase();

  if (s === "ACTIVE" || s === "APPROVED") {
    return (
      <Badge variant="success" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {s}
      </Badge>
    );
  }
  if (s === "PENDING") {
    return (
      <Badge variant="warning" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Pending Approval
      </Badge>
    );
  }
  if (s === "SUSPENDED" || s === "REJECTED") {
    return (
      <Badge variant="danger" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        {s}
      </Badge>
    );
  }
  if (s === "WAITING") {
    return (
      <Badge variant="warning" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Waiting
      </Badge>
    );
  }
  if (s === "CALLED") {
    return (
      <Badge variant="info" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
        Called
      </Badge>
    );
  }
  if (s === "SERVING") {
    return (
      <Badge variant="success" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Serving
      </Badge>
    );
  }
  if (s === "COMPLETED") return <Badge variant="success" className={className}>Completed</Badge>;
  if (s === "CANCELLED") return <Badge variant="danger" className={className}>Cancelled</Badge>;
  if (s === "CONFIRMED") return <Badge variant="info" className={className}>Confirmed</Badge>;
  if (s === "PAID") return <Badge variant="success" className={className}>Paid</Badge>;
  if (s === "FAILED") return <Badge variant="danger" className={className}>Failed</Badge>;

  return <Badge variant="default" className={className}>{s || "-"}</Badge>;
};
