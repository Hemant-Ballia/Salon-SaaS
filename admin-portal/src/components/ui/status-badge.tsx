import React from "react";
import { Badge } from "./badge";
import {
  BusinessStatus,
  AppointmentStatus,
  PaymentStatus,
  UserRole,
} from "@/types/models";

interface StatusBadgeProps {
  status:
    | BusinessStatus
    | AppointmentStatus
    | PaymentStatus
    | UserRole
    | "ACTIVE"
    | "INACTIVE"
    | "ON_LEAVE"
    | boolean
    | string;
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

  const s = String(status).toUpperCase();

  // Business Statuses
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
        Pending
      </Badge>
    );
  }
  if (s === "SUSPENDED") {
    return (
      <Badge variant="danger" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Suspended
      </Badge>
    );
  }
  if (s === "REJECTED") {
    return (
      <Badge variant="danger" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Rejected
      </Badge>
    );
  }

  // Appointment Statuses
  if (s === "CONFIRMED") {
    return (
      <Badge variant="info" className={className}>
        Confirmed
      </Badge>
    );
  }
  if (s === "COMPLETED") {
    return (
      <Badge variant="success" className={className}>
        Completed
      </Badge>
    );
  }
  if (s === "CANCELLED") {
    return (
      <Badge variant="danger" className={className}>
        Cancelled
      </Badge>
    );
  }
  if (s === "RESCHEDULED") {
    return (
      <Badge variant="warning" className={className}>
        Rescheduled
      </Badge>
    );
  }
  if (s === "NO_SHOW") {
    return (
      <Badge variant="danger" className={className}>
        No Show
      </Badge>
    );
  }

  // Payment Statuses
  if (s === "PAID") {
    return (
      <Badge variant="success" className={className}>
        Paid
      </Badge>
    );
  }
  if (s === "FAILED") {
    return (
      <Badge variant="danger" className={className}>
        Failed
      </Badge>
    );
  }
  if (s === "REFUNDED" || s === "PARTIALLY_REFUNDED") {
    return (
      <Badge variant="warning" className={className}>
        {s === "PARTIALLY_REFUNDED" ? "Partial Refund" : "Refunded"}
      </Badge>
    );
  }

  // Roles
  if (s === "ADMIN") {
    return (
      <Badge variant="info" className={className}>
        ADMIN
      </Badge>
    );
  }
  if (s === "BUSINESS") {
    return (
      <Badge variant="success" className={className}>
        BUSINESS
      </Badge>
    );
  }
  if (s === "STAFF") {
    return (
      <Badge variant="warning" className={className}>
        STAFF
      </Badge>
    );
  }
  if (s === "CUSTOMER") {
    return (
      <Badge variant="default" className={className}>
        CUSTOMER
      </Badge>
    );
  }

  return (
    <Badge variant="default" className={className}>
      {s}
    </Badge>
  );
};
