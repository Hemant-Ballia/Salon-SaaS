import React from "react";
import { StaffLayout } from "@/components/layout/staff-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StaffLayout>{children}</StaffLayout>;
}