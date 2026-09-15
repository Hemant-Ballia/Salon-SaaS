"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Shield,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  Radio
} from "lucide-react";
import { toast } from "sonner";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import {
  getNotificationPreferencesApi,
  updateNotificationPreferencesApi,
} from "@/lib/api/notifications";

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => getNotificationPreferencesApi(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (data?.preferences) {
      setEmailEnabled(data.preferences.emailEnabled ?? true);
      setSmsEnabled(data.preferences.smsEnabled ?? true);
      setWhatsappEnabled(data.preferences.whatsappEnabled ?? true);
      setInAppEnabled(data.preferences.inAppEnabled ?? true);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (prefs: {
      emailEnabled: boolean;
      smsEnabled: boolean;
      whatsappEnabled: boolean;
      inAppEnabled: boolean;
    }) => updateNotificationPreferencesApi(prefs),
    onSuccess: () => {
      toast.success("Preferences updated successfully");
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update preferences");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      emailEnabled,
      smsEnabled,
      whatsappEnabled,
      inAppEnabled,
    });
  };

  if (authLoading) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </CustomerLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <CustomerLayout>
        <div className="max-w-md mx-auto py-16 text-center">
          <Card className="p-8">
            <Sliders className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Sign In to View Settings
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Customize your communication channels and alert preferences.
            </p>
            <Link href="/login?redirect=/settings">
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Choose how you receive appointment confirmations, queue tokens, and reminders
          </p>
        </div>

        {/* Notification Channel Toggles */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Notification Channels
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select which channels we should use to keep you notified
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* WhatsApp Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      WhatsApp Alerts
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Instant queue token updates and booking confirmations directly on WhatsApp
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={whatsappEnabled}
                  onChange={(e) => setWhatsappEnabled(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-neutral-300 dark:border-neutral-700 cursor-pointer"
                />
              </div>

              {/* SMS Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      SMS Messages
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Critical appointment reminders and verification codes via text SMS
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-neutral-300 dark:border-neutral-700 cursor-pointer"
                />
              </div>

              {/* Email Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Email Invoices & Updates
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Detailed itemized receipts, cancellation notices, and calendar invites
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-neutral-300 dark:border-neutral-700 cursor-pointer"
                />
              </div>

              {/* In-App Notifications */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      In-App Notifications
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Push notifications and real-time alerts inside your customer portal
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={inAppEnabled}
                  onChange={(e) => setInAppEnabled(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-neutral-300 dark:border-neutral-700 cursor-pointer"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </Card>

        {/* Security & Privacy Card */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Privacy & Data Security
              </h3>
              <p className="text-xs text-neutral-500">
                Your data is protected under end-to-end multi-tenant security architecture
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
            <p>• Your personal contact information is only shared with salons you actively book with.</p>
            <p>• Payment details are processed directly through Razorpay and never stored on our servers.</p>
            <p>• You can update or delete your appointments and queue records at any time.</p>
          </div>
        </Card>
      </div>
    </CustomerLayout>
  );
}