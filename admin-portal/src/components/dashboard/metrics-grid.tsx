import React from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Users, Store, Calendar, CreditCard, UserCheck, UserPlus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DashboardMetrics } from "@/types/models";

interface MetricsGridProps {
  metrics: DashboardMetrics | undefined;
  staffCount?: number;
  customersCount?: number;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  staffCount,
  customersCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Platform Users"
        value={metrics?.users?.toLocaleString() ?? "0"}
        icon={Users}
        description="Active system identities"
      />
      <StatCard
        title="Registered Businesses"
        value={metrics?.businesses?.toLocaleString() ?? "0"}
        icon={Store}
        description="Salons, barbers, car washes"
      />
      <StatCard
        title="Total Appointments"
        value={metrics?.appointments?.toLocaleString() ?? "0"}
        icon={Calendar}
        description="Bookings processed to date"
      />
      <StatCard
        title="Platform Revenue"
        value={formatCurrency(metrics?.revenue ?? 0)}
        icon={CreditCard}
        description="Gross settled payments (PAID)"
      />
      {staffCount !== undefined && (
        <StatCard
          title="Staff Members"
          value={staffCount.toLocaleString()}
          icon={UserCheck}
          description="Assigned professionals"
        />
      )}
      {customersCount !== undefined && (
        <StatCard
          title="Total Customers"
          value={customersCount.toLocaleString()}
          icon={UserPlus}
          description="Registered clients"
        />
      )}
    </div>
  );
};
