"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getMySubscriptionApi, 
  createSubscriptionApi, 
  cancelSubscriptionApi 
} from "@/lib/api/subscriptions";
import { SubscriptionPlan } from "@/types/models";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { 
  Zap, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  AlertTriangle 
} from "lucide-react";

const PLANS: {
  plan: SubscriptionPlan;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}[] = [
  {
    plan: "FREE",
    name: "Free Starter",
    price: "₹0",
    period: "forever",
    features: [
      "Up to 2 staff members",
      "Up to 50 bookings / month",
      "Standard queue management",
      "Email booking confirmations",
    ],
  },
  {
    plan: "BASIC",
    name: "Growth Salon",
    price: "₹999",
    period: "per month",
    popular: true,
    features: [
      "Up to 10 staff members",
      "Unlimited appointments",
      "Real-time walk-in queue with live screen",
      "SMS & WhatsApp reminders",
      "Custom business QR codes",
      "Priority analytics",
    ],
  },
  {
    plan: "PREMIUM",
    name: "Enterprise Pro",
    price: "₹2,499",
    period: "per month",
    features: [
      "Unlimited staff & specialists",
      "Multi-counter queue management",
      "Automated marketing & re-engagement",
      "Advanced audit logs & staff commission reporting",
      "Dedicated account manager",
      "24/7 Priority support",
    ],
  },
];

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const { data: subscription, isLoading, error, refetch } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: () => getMySubscriptionApi(),
  });

  const upgradeMutation = useMutation({
    mutationFn: (plan: SubscriptionPlan) => createSubscriptionApi(plan),
    onSuccess: () => {
      toast.success("Subscription plan updated successfully");
      queryClient.invalidateQueries({ queryKey: ["my-subscription"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update subscription");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelSubscriptionApi(),
    onSuccess: () => {
      toast.success("Subscription cancelled");
      setIsCancelConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-subscription"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to cancel subscription");
    },
  });

  const currentPlan = subscription?.plan || "FREE";
  const currentStatus = subscription?.status || "ACTIVE";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">SaaS Plan & Billing</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your subscription tier, billing period, and platform features.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : error ? (
        <ErrorState
          title="Could not load subscription details"
          description="Failed to connect to billing services."
          onRetry={() => refetch()}
        />
      ) : (
        /* Current Active Subscription Banner */
        <Card className="border-emerald-200 bg-linear-to-r from-emerald-50/50 via-white to-teal-50/30">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">{currentPlan} Plan</h2>
                    <StatusBadge status={currentStatus} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {subscription?.currentPeriodEnd
                      ? `Valid until ${formatDate(subscription.currentPeriodEnd)}`
                      : "Active subscription"}
                  </p>
                </div>
              </div>

              {currentPlan !== "FREE" && currentStatus !== "CANCELLED" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 self-start sm:self-auto"
                  onClick={() => setIsCancelConfirmOpen(true)}
                >
                  Cancel Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans Comparison */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Choose the Right Tier for Your Business</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((tier) => {
            const isCurrent = currentPlan === tier.plan;

            return (
              <Card
                key={tier.plan}
                className={`relative flex flex-col justify-between transition-all ${
                  tier.popular ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20" : ""
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-slate-900">{tier.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">{tier.price}</span>
                      <span className="text-xs text-slate-500">/{tier.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <div className="p-6 pt-0">
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      className="w-full border-emerald-300 text-emerald-700 bg-emerald-50 font-semibold"
                      disabled
                    >
                      <ShieldCheck className="w-4 h-4 mr-1.5" />
                      Current Active Plan
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${
                        tier.popular
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : ""
                      }`}
                      variant={tier.popular ? "primary" : "outline"}
                      isLoading={upgradeMutation.isPending}
                      onClick={() => upgradeMutation.mutate(tier.plan)}
                    >
                      Switch to {tier.name}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        title="Cancel Subscription Plan"
        description="Are you sure you want to cancel your plan? You will retain access until the end of the billing period, after which your account will revert to the Free tier."
        confirmLabel="Confirm Cancellation"
        variant="danger"
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setIsCancelConfirmOpen(false)}
      />
    </div>
  );
}