"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { User, Mail, Phone, Shield, LogOut, Key } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const name = user?.displayName || user?.name || "Business Account";
  const email = user?.email || "No email";
  const phone = user?.phone || "Not set";
  const role = user?.role || "BUSINESS";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal credentials, contact info, and session controls.
        </p>
      </div>

      {/* Account Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xl shadow-inner">
                {name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-slate-900">{name}</h2>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <Shield className="w-3 h-3" />
                    {role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Owner / Account Administrator</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 self-start sm:self-auto gap-2 text-sm"
              onClick={() => setIsLogoutDialogOpen(true)}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 mt-6 border-t border-slate-100 text-sm">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</span>
              <p className="font-medium text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                {email}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Number</span>
              <p className="font-medium text-slate-800 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                {phone}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Access */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600" />
            Security & Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-slate-600 text-xs">
            Your account is authenticated via secure JSON Web Tokens with automatic refresh rotation. Keep your credentials private.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Password update feature can be accessed via password recovery or admin")}
              className="text-xs"
            >
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout Dialog */}
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