"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { changePasswordApi } from "@/lib/api/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Building, 
  Key, 
  LogOut, 
  ShieldCheck, 
  CheckCircle2 
} from "lucide-react";

export default function StaffProfilePage() {
  const { user, staff, logout } = useAuth();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  const displayName = staff?.displayName || user?.displayName || user?.name || "Staff Specialist";
  const designation = staff?.designation || "Stylist & Specialist";
  const email = user?.email || staff?.user?.email || "No email";
  const phone = user?.phone || staff?.user?.phone || "No phone set";
  const businessName = staff?.business?.name || "Salon SaaS Platform";

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsChangingPass(true);
    try {
      await changePasswordApi({ currentPassword, newPassword });
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Staff Profile & Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account credentials and specialist identity.
        </p>
      </div>

      {/* Specialist Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xl shadow-inner">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="w-3 h-3" />
                    STAFF
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{designation}</p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  {businessName}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold gap-2 text-xs self-start sm:self-auto"
              onClick={() => setIsLogoutOpen(true)}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 mt-6 border-t border-slate-100 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
              <p className="font-semibold text-slate-800 text-sm mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {email}
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider">Phone</span>
              <p className="font-semibold text-slate-800 text-sm mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {phone}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security: Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600" />
            Update Security Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isChangingPass} className="font-bold">
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Logout Dialog */}
      <ConfirmDialog
        isOpen={isLogoutOpen}
        title="Sign Out of Workspace"
        description="Are you sure you want to end your current session?"
        confirmLabel="Sign Out"
        variant="destructive"
        onConfirm={() => {
          setIsLogoutOpen(false);
          logout();
        }}
        onCancel={() => setIsLogoutOpen(false)}
      />
    </div>
  );
}