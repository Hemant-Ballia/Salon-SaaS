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
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { CustomerLayout } from "@/components/layout/customer-layout";
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
      <CustomerLayout>
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </CustomerLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <CustomerLayout>
        <div className="max-w-md mx-auto py-16 text-center">
          <Card className="p-8">
            <User className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Sign In to View Profile
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Access your personal account, saved appointments, and security settings.
            </p>
            <Link href="/login?redirect=/profile">
              <Button className="w-full">Sign In to Continue</Button>
            </Link>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              My Profile
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Manage your personal credentials and security preferences
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={() => setIsLogoutDialogOpen(true)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-2 text-xs"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* User Card */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {user.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  Customer
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Member ID: <span className="font-mono">{user.id}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <span className="text-xs text-neutral-500 flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                Email Address
              </span>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {user.email}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <span className="text-xs text-neutral-500 flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                Phone Number
              </span>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {user.phone || "Not provided"}
              </p>
            </div>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Change Password
              </h3>
              <p className="text-xs text-neutral-500">
                Ensure your account remains safe with a strong password
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                {...register("currentPassword")}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.currentPassword && (
                <p className="text-xs text-rose-500 mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                {...register("newPassword")}
                placeholder="Minimum 8 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.newPassword && (
                <p className="text-xs text-rose-500 mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                {...register("confirmPassword")}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isSubmittingPassword}>
                {isSubmittingPassword ? "Updating Password..." : "Update Password"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Quick Links */}
        <div className="flex items-center justify-between text-xs text-neutral-500 px-2">
          <Link href="/settings" className="hover:text-indigo-600 transition-colors">
            Notification Preferences & Settings →
          </Link>
          <Link href="/appointments" className="hover:text-indigo-600 transition-colors">
            Manage Bookings →
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
    </CustomerLayout>
  );
}