"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { 
  Mail, 
  Phone, 
  Shield, 
  LogOut, 
  Key,
  ArrowRight,
  Building2,
  CheckCircle2,
} from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const name = user?.displayName || user?.name || "Business Account";
  const email = user?.email || "No email";
  const phone = user?.phone || "Not set";
  const role = user?.role || "BUSINESS";

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  const accountDetails = [
    {
      label: "Email Address",
      value: email,
      icon: Mail,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50",
    },
    {
      label: "Phone Number",
      value: phone,
      icon: Phone,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Account Role",
      value: role.replace("_", " ").charAt(0) + role.slice(1).toLowerCase(),
      icon: Shield,
      iconColor: "text-violet-500",
      iconBg: "bg-violet-50",
    },
    {
      label: "Portal",
      value: "Business Owner Portal",
      icon: Building2,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal credentials, contact info, and session controls.
        </p>
      </div>

      {/* Profile Identity Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-extrabold flex items-center justify-center text-xl shadow-sm">
                  {initials}
                </div>
                <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <Shield className="w-3 h-3" />
                    {role}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Verified Account
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Owner / Account Administrator</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 self-start gap-2"
              onClick={() => setIsLogoutDialogOpen(true)}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>

          {/* Account Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 mt-6 border-t border-slate-100">
            {accountDetails.map((detail) => {
              const Icon = detail.icon;
              return (
                <div
                  key={detail.label}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3.5"
                >
                  <div className={`h-8 w-8 rounded-lg ${detail.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${detail.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {detail.label}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">{detail.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Security & Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600" />
            Security & Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Your account uses secure JSON Web Tokens with automatic refresh rotation. 
            Keep your credentials private and update your password regularly.
          </p>

          <Link href="/settings#security">
            <div className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all duration-150 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                    Change Account Password
                  </p>
                  <p className="text-xs text-slate-400">Update your login credentials securely</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Logout Confirm */}
      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        title="Sign Out of Business Portal"
        description="Are you sure you want to sign out? You will need to enter your credentials again to access the portal."
        confirmLabel="Sign Out"
        variant="danger"
        onConfirm={() => {
          setIsLogoutDialogOpen(false);
          logout();
        }}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </div>
  );
}