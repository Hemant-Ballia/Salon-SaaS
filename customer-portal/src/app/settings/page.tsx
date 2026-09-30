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
  Radio,
  SlidersHorizontal
} from "lucide-react";
import { toast } from "sonner";
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <SlidersHorizontal className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Sign In to View Settings
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Customize your communication channels and alert preferences.
          </p>
          <Link href="/login?redirect=/settings">
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
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
          <Sliders className="w-3.5 h-3.5" />
          Customer Preferences
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings & Alerts
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Control how you receive booking confirmations, live queue tickets, and reminders
        </p>
      </div>

      {/* Notification Channel Toggles */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Delivery Channels
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select the channels through which you wish to be alerted
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* WhatsApp Toggle */}
            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-emerald-300 transition-all cursor-pointer">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    WhatsApp Updates
                  </h4>
                  <p className="text-xs text-slate-500">
                    Instant queue token updates and appointment confirmation cards
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
              />
            </label>

            {/* SMS Toggle */}
            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-emerald-300 transition-all cursor-pointer">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    SMS Text Alerts
                  </h4>
                  <p className="text-xs text-slate-500">
                    Direct SMS messages for time-sensitive queue calls and slot changes
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
              />
            </label>

            {/* Email Toggle */}
            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-emerald-300 transition-all cursor-pointer">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Email Invoices & Receipts
                  </h4>
                  <p className="text-xs text-slate-500">
                    Detailed PDF receipts, cancellation summaries, and calendar files
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
              />
            </label>

            {/* In-App Notifications */}
            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-emerald-300 transition-all cursor-pointer">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    In-App Push Badges
                  </h4>
                  <p className="text-xs text-slate-500">
                    Live notification bell counter and browser sound alerts
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={inAppEnabled}
                onChange={(e) => setInAppEnabled(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
              />
            </label>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>

      {/* Security & Privacy Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Customer Data Protection
            </h3>
            <p className="text-xs text-slate-500">
              Your contact details are encrypted and isolated per salon booking
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Personal contact numbers are never sold or used for spam.</span>
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Payments are processed with 256-bit PCI-DSS compliant gateways.</span>
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>You can disable non-essential alerts at any time above.</span>
          </p>
        </div>
      </div>
    </div>
  );
}