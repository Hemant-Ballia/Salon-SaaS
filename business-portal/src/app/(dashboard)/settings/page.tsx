"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { useSocket } from "@/context/socket-context";
import { toast } from "sonner";
import { 
  Server, 
  Radio, 
  Store, 
  Bell, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Activity,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { changePasswordApi } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";

// Password strength checker
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", color: "bg-rose-500" };
  if (score === 3) return { score, label: "Fair", color: "bg-amber-500" };
  if (score === 4) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

export default function SettingsPage() {
  const { isConnected: isSocketConnected } = useSocket();
  const [apiStatus, setApiStatus] = useState<"IDLE" | "TESTING" | "HEALTHY" | "FAILED">("IDLE");

  const testApiHealth = async () => {
    setApiStatus("TESTING");
    try {
      await apiClient.get("/auth/me");
      setApiStatus("HEALTHY");
      toast.success("API server connectivity verified");
    } catch {
      setApiStatus("FAILED");
      toast.error("API ping failed");
    }
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const passwordStrength = getPasswordStrength(newPassword);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setPasswordError("New password must contain uppercase, lowercase, numbers, and a special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePasswordApi({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

  const quickLinks = [
    {
      href: "/business",
      icon: Store,
      label: "Business Profile",
      description: "Name, category, hours & address",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      hoverBorder: "hover:border-emerald-300",
    },
    {
      href: "/notifications",
      icon: Bell,
      label: "Notifications",
      description: "SMS, Email & WhatsApp channels",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      hoverBorder: "hover:border-blue-300",
    },
    {
      href: "/subscription",
      icon: Zap,
      label: "Billing & Plans",
      description: "SaaS tier & feature entitlements",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      hoverBorder: "hover:border-amber-300",
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage diagnostics, security, and configuration shortcuts.
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="block group">
              <div
                className={`flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4 transition-all duration-150 hover:shadow-sm ${link.hoverBorder} group-hover:bg-slate-50/50`}
              >
                <div className={`h-9 w-9 rounded-lg ${link.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${link.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-800">{link.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{link.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* System Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-600" />
            System Diagnostics
          </CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            Verify API connectivity and real-time socket status.
          </p>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {/* REST API */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">REST API Endpoint</p>
                <p className="text-xs font-mono text-slate-400 mt-0.5 select-all">{apiUrl}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {apiStatus === "HEALTHY" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" />
                    Healthy
                  </span>
                )}
                {apiStatus === "FAILED" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                    <XCircle className="w-3 h-3" />
                    Failed
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testApiHealth}
                  isLoading={apiStatus === "TESTING"}
                  className="text-xs h-8"
                >
                  <Activity className="w-3 h-3 mr-1.5" />
                  Ping
                </Button>
              </div>
            </div>

            {/* Socket.IO */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Real-Time Socket.IO</p>
                <p className="text-xs font-mono text-slate-400 mt-0.5 select-all">{socketUrl}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  isSocketConnected
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-100 border-slate-200 text-slate-500"
                }`}
              >
                {isSocketConnected ? (
                  <>
                    <Wifi className="w-3 h-3 animate-pulse" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    Disconnected
                  </>
                )}
              </span>
            </div>

            {/* Frontend */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Frontend Runtime</p>
                <p className="text-xs text-slate-400 mt-0.5">Next.js App Router · Turbopack</p>
              </div>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                v16.3.5
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password & Security */}
      <Card id="security">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            Password & Security
          </CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            Update your login password to keep your account secure.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-5 max-w-lg">
            {/* Error Banner */}
            {passwordError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
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
              <label className="block text-xs font-semibold text-slate-700">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters with symbol & number"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          i <= passwordStrength.score ? passwordStrength.color : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-[11px] font-semibold ${
                    passwordStrength.score <= 2 ? "text-rose-500" :
                    passwordStrength.score === 3 ? "text-amber-500" :
                    passwordStrength.score === 4 ? "text-blue-500" : "text-emerald-600"
                  }`}>
                    {passwordStrength.label} password
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`h-10 w-full rounded-xl border bg-white pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                    confirmPassword && confirmPassword !== newPassword
                      ? "border-rose-300"
                      : "border-slate-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-rose-500 font-medium">Passwords do not match</p>
              )}
            </div>

            {/* Policy checklist */}
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Password requirements
              </p>
              {[
                { label: "At least 8 characters", pass: newPassword.length >= 8 },
                { label: "One uppercase letter (A–Z)", pass: /[A-Z]/.test(newPassword) },
                { label: "One lowercase letter (a–z)", pass: /[a-z]/.test(newPassword) },
                { label: "One number (0–9)", pass: /[0-9]/.test(newPassword) },
                { label: "One special character (!@#$…)", pass: /[^A-Za-z0-9]/.test(newPassword) },
              ].map((req) => (
                <div key={req.label} className="flex items-center gap-2 text-xs">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      req.pass ? "text-emerald-500" : "text-slate-300"
                    }`}
                  />
                  <span className={req.pass ? "text-slate-700" : "text-slate-400"}>{req.label}</span>
                </div>
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isChangingPassword}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-5"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}