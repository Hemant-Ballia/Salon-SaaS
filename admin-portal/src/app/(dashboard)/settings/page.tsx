"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { changePasswordApi } from "@/lib/api/admin";
import { getErrorMessage, apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import {
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState("");

  const {
    data: healthStatus,
    isLoading: isChecking,
    refetch: checkHealth,
  } = useQuery({
    queryKey: ["admin", "backend-health"],
    queryFn: async () => {
      const res = await apiClient.get("/health");
      return res.data;
    },
    retry: 1,
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePasswordApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err) || "Failed to change password.";
      setPasswordError(msg);
      toast.error(msg);
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }

    if (!newPassword) {
      setPasswordError("New password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setPasswordError("New password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Confirm password does not match new password.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword,
    });
  };

  return (
    <AdminLayout title="System Settings & Security">
      <div className="space-y-6 max-w-4xl pb-12">
        {/* Security: Change Password Card */}
        <Card className="border border-slate-200/90 bg-white shadow-2xs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <KeyRound className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle>Password & Security</CardTitle>
                <CardDescription>
                  Update your administrator account password to maintain system access security.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
              {passwordError && (
                <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  {passwordError}
                </div>
              )}

              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Minimum 8 characters with at least 1 uppercase letter, 1 lowercase letter, and 1 number.
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={changePasswordMutation.isPending}
                className="h-9 px-4.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-sm cursor-pointer text-white gap-1.5"
              >
                <Lock className="h-3.5 w-3.5" />
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Backend API Connectivity */}
        <Card className="border border-slate-200/90 bg-white shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Backend Service Connectivity</CardTitle>
              <CardDescription>
                Live connectivity status with the Supabase PostgreSQL Express backend
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkHealth()}
              isLoading={isChecking}
              className="gap-2 text-xs cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Ping Health Endpoint
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Target Endpoint
                </span>
                <Badge variant={healthStatus?.success ? "success" : "warning"}>
                  {healthStatus?.success ? "ONLINE (200 OK)" : "OFFLINE / ERROR"}
                </Badge>
              </div>
              <div className="font-mono text-xs text-slate-800">
                {(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1") + "/health"}
              </div>
              {healthStatus && (
                <pre className="mt-3 bg-white p-3.5 rounded-lg border border-slate-200/80 text-[11px] font-mono text-slate-700 overflow-x-auto shadow-2xs">
                  {JSON.stringify(healthStatus, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Platform Configuration Matrix */}
        <Card className="border border-slate-200/90 bg-white shadow-2xs">
          <CardHeader>
            <CardTitle>Platform Configuration & Isolation</CardTitle>
            <CardDescription>
              Security parameters enforced by the backend architecture
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 first:pt-0">
              <span className="text-xs font-semibold text-slate-700 shrink-0">Multi-tenant Architecture</span>
              <Badge variant="success" className="w-fit text-[11px] px-2.5 py-0.5">
                Strict Database-Level Isolation
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3">
              <span className="text-xs font-semibold text-slate-700 shrink-0">Supported Roles</span>
              <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                {["ADMIN", "BUSINESS", "STAFF", "CUSTOMER"].map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-mono font-medium text-slate-700 border border-slate-200/60"
                  >
                    {role}
                  </span>
                ))}
                <span className="text-[11px] font-mono text-slate-400 ml-1">(Exact 4)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3">
              <span className="text-xs font-semibold text-slate-700 shrink-0">Database Engine</span>
              <span className="text-xs font-mono text-slate-600 sm:text-right break-words">
                Supabase PostgreSQL via Prisma v5 (PgBouncer)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3">
              <span className="text-xs font-semibold text-slate-700 shrink-0">Password Encryption</span>
              <span className="text-xs font-mono text-slate-600 sm:text-right break-words">
                Bcrypt (Salt Rounds: 12) + Crypto Random Int Generator
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 last:pb-0">
              <span className="text-xs font-semibold text-slate-700 shrink-0">Temporary Credential Policy</span>
              <span className="text-xs font-mono text-slate-600 sm:text-right break-words">
                Mandatory First-Login Password Change (mustChangePassword Flag)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
