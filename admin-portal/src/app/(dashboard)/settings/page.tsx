"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import axios from "axios";

export default function SettingsPage() {
  const {
    data: healthStatus,
    isLoading: isChecking,
    refetch: checkHealth,
  } = useQuery({
    queryKey: ["admin", "backend-health"],
    queryFn: async () => {
      const res = await axios.get("http://localhost:5000/api/v1/health");
      return res.data;
    },
    retry: 1,
  });

  return (
    <AdminLayout title="System Settings & Diagnostics">
      <div className="space-y-6 max-w-4xl">
        {/* Backend API Connectivity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Backend Service Connectivity</CardTitle>
              <CardDescription>
                Live connectivity test against the frozen Supabase PostgreSQL Express backend
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkHealth()}
              isLoading={isChecking}
              className="gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Ping Health Endpoint
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Target Endpoint
                </span>
                <Badge variant={healthStatus?.success ? "success" : "warning"}>
                  {healthStatus?.success ? "ONLINE (200 OK)" : "OFFLINE / ERROR"}
                </Badge>
              </div>
              <div className="font-mono text-xs text-slate-800">
                http://localhost:5000/api/v1/health
              </div>
              {healthStatus && (
                <pre className="mt-3 bg-white p-3 rounded-md border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto">
                  {JSON.stringify(healthStatus, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Platform Configuration Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Configuration & Isolation</CardTitle>
            <CardDescription>
              Security parameters enforced by the backend architecture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-700">Multi-tenant Architecture</span>
              <Badge variant="success">Strict Database-Level Isolation</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-700">Supported Roles</span>
              <span className="text-xs font-mono text-slate-600">
                ADMIN * BUSINESS * STAFF * CUSTOMER (Exact 4)
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-700">Database Engine</span>
              <span className="text-xs font-mono text-slate-600">
                Supabase PostgreSQL via Prisma v5 (PgBouncer)
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-700">Payment Gateway</span>
              <span className="text-xs font-mono text-slate-600">
                Razorpay (HMAC-SHA256 Signed Verification)
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs font-medium text-slate-700">Asynchronous Job Processing</span>
              <span className="text-xs font-mono text-slate-600">
                BullMQ + Redis (Graceful Local Fallback)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
