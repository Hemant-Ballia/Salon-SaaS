"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Mail,
  Phone,
  Lock,
  LogOut,
  ShieldCheck,
  Calendar,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/context/auth-context";
import { changePasswordApi } from "@/lib/api/auth";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmittingPassword(true);
    try {
      await changePasswordApi({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password updated successfully");
      reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Sign In to View Profile
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Access your personal account, saved appointments, and account credentials.
          </p>
          <Link href="/login?redirect=/profile">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-xs">
              Sign In to Continue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <User className="w-3.5 h-3.5" />
            Account Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal profile and account credentials
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={() => setIsLogoutDialogOpen(true)}
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-2 text-xs font-semibold rounded-xl"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>

      {/* User Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-2xs">
            {user.name?.charAt(0).toUpperCase() || "C"}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">
                {user.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified Customer
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Member Ref: {user.id.slice(0, 12)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              Email Address
            </span>
            <p className="text-sm font-bold text-slate-900 truncate">
              {user.email}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              Phone Number
            </span>
            <p className="text-sm font-bold text-slate-900">
              {user.phone || "Not provided"}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Change Password
            </h3>
            <p className="text-xs text-slate-500">
              Keep your account secure with a strong unique password
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              {...register("currentPassword")}
              placeholder="Enter current password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.currentPassword && (
              <p className="text-xs text-rose-500 mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              {...register("newPassword")}
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.newPassword && (
              <p className="text-xs text-rose-500 mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              {...register("confirmPassword")}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmittingPassword}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
            >
              {isSubmittingPassword ? "Updating Password..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>

      {/* Quick Navigation Links */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-2">
        <Link href="/settings" className="hover:text-emerald-700 transition-colors inline-flex items-center gap-1">
          Notification Preferences & Channels
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        <Link href="/appointments" className="hover:text-emerald-700 transition-colors inline-flex items-center gap-1">
          Manage Bookings
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Sign Out Confirm Dialog */}
      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        title="Sign Out"
        description="Are you sure you want to sign out of your account on this device?"
        confirmLabel="Sign Out"
        cancelLabel="Stay Logged In"
        onConfirm={async () => {
          await logout();
          setIsLogoutDialogOpen(false);
          router.push("/");
        }}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </div>
  );
}