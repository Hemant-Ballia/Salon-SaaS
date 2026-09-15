import React from "react";
import { BusinessLayout } from "@/components/layout/business-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BusinessLayout>{children}</BusinessLayout>;
}