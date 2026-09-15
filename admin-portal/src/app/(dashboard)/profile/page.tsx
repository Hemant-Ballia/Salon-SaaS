"use client";

import React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { formatDateTime } from "@/lib/utils";
import { UserCircle, Shield, Mail, Calendar, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <AdminLayout title="Admin Profile">
      <div className="space-y-6 max-w-3xl">
        {/* Profile Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <UserCircle className="h-10 w-10" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                <StatusBadge status="ADMIN" />
              </div>
              <p className="text-xs text-slate-500 mt-1">Platform Administrator Account</p>
            </div>
          </div>

          <Button variant="destructive" size="sm" onClick={logout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Credentials and Security Card */}
        <Card>
          <CardHeader>
            <CardTitle>Administrator Identity & Access</CardTitle>
            <CardDescription>
              Authenticated administrator session details and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Administrator Email</div>
                <div className="text-sm font-medium text-slate-900">{user?.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Access Scope</div>
                <div className="text-sm font-medium text-slate-900">
                  Global System Administrator (Full platform visibility & approval authority)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Identity Created</div>
                <div className="text-sm font-medium text-slate-900">
                  {formatDateTime(user?.createdAt)}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">User UUID</div>
              <div className="font-mono text-xs text-slate-700 mt-1">{user?.id}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
