"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { useSocket } from "@/context/socket-context";
import { toast } from "sonner";
import { 
  Settings, 
  Server, 
  Radio, 
  Store, 
  Bell, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Activity 
} from "lucide-react";

export default function SettingsPage() {
  const { isConnected: isSocketConnected } = useSocket();
  const [apiStatus, setApiStatus] = useState<"IDLE" | "TESTING" | "HEALTHY" | "FAILED">("IDLE");

  const testApiHealth = async () => {
    setApiStatus("TESTING");
    try {
      // Test basic endpoint
      await apiClient.get("/auth/me");
      setApiStatus("HEALTHY");
      toast.success("API server connectivity verified");
    } catch {
      setApiStatus("FAILED");
      toast.error("API ping failed");
    }
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Diagnostics, integration URLs, and configuration shortcuts.
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/business" className="block group">
          <Card className="h-full group-hover:border-emerald-500 transition-colors">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 group-hover:text-emerald-700">Business Profile</h3>
                <p className="text-xs text-slate-500">Name, category, hours & address</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/notifications" className="block group">
          <Card className="h-full group-hover:border-emerald-500 transition-colors">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-700">Notifications</h3>
                <p className="text-xs text-slate-500">SMS, Email & WhatsApp channels</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/subscription" className="block group">
          <Card className="h-full group-hover:border-emerald-500 transition-colors">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 group-hover:text-amber-700">Billing & Plans</h3>
                <p className="text-xs text-slate-500">SaaS tier & feature entitlements</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* System Diagnostics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-600" />
            System & API Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">REST API Target</p>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{apiUrl}</p>
              </div>
              <div className="flex items-center gap-2">
                {apiStatus === "HEALTHY" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                  </span>
                ) : apiStatus === "FAILED" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                    <XCircle className="w-3.5 h-3.5" /> Error
                  </span>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testApiHealth}
                  isLoading={apiStatus === "TESTING"}
                  className="text-xs"
                >
                  <Activity className="w-3.5 h-3.5 mr-1" />
                  Ping Server
                </Button>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Real-Time Socket.IO</p>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{socketUrl}</p>
              </div>
              <div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isSocketConnected
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${isSocketConnected ? "animate-pulse" : ""}`} />
                  {isSocketConnected ? "Socket Connected" : "Disconnected"}
                </span>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Frontend Environment</p>
                <p className="text-xs text-slate-500 mt-0.5">Next.js App Router (Production Mode)</p>
              </div>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                v16.3.5
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}