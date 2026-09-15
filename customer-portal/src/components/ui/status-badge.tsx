import React from "react";
import { Badge } from "./badge";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status ? status.toUpperCase() : "UNKNOWN";

  switch (normalized) {
    case "CONFIRMED":
    case "SERVING":
    case "PAID":
    case "ACTIVE":
    case "COMPLETED":
      return <Badge variant="success">{normalized}</Badge>;

    case "PENDING":
    case "WAITING":
    case "CALLED":
      return <Badge variant="warning">{normalized}</Badge>;

    case "CANCELLED":
    case "NO_SHOW":
    case "FAILED":
    case "SKIPPED":
    case "REFUNDED":
      return <Badge variant="danger">{normalized}</Badge>;

    case "RESCHEDULED":
      return <Badge variant="info">{normalized}</Badge>;

    default:
      return <Badge variant="neutral">{normalized}</Badge>;
  }
};