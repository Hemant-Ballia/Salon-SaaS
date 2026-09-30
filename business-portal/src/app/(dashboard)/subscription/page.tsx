"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getMySubscriptionApi, 
  createSubscriptionApi, 
  cancelSubscriptionApi 
} from "@/lib/api/subscriptions";
import { SubscriptionPlan } from "@/types/models";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { 
  Zap, 
  Check, 
  ShieldCheck, 
  Calendar, 
  Sparkles,
  Crown,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const PLANS: {
  plan: SubscriptionPlan;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ElementType;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    plan: "FREE",
    name: "Free Starter",
    price: "₹0",
    period: "forever",
    description: "Get started with the essentials.",
    features: [
      "Up to 2 staff members",
      "Up to 50 bookings / month",
      "Standard queue management",
      "Email booking confirmations",
    ],
    icon: Zap,
    accentColor: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
  },
  {
    plan: "BASIC",
    name: "Growth Salon",
    price: "₹999",
    period: "per month",
    description: "Everything you need to scale your business.",
    popular: true,
    features: [
      "Up to 10 staff members",
      "Unlimited appointments",
      "Real-time walk-in queue with live screen",
      "SMS & WhatsApp reminders",
      "Custom business QR codes",
      "Priority analytics",
    ],
    icon: Sparkles,
    accentColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-400",
  },
  {
    plan: "PREMIUM",
    name: "Enterprise Pro",
    price: "₹2,499",
    period: "per month",
    description: "Full-scale operations for serious businesses.",
    features: [
      "Unlimited staff & specialists",
      "Multi-counter queue management",
      "Automated marketing & re-engagement",
      "Advanced audit logs & commission reporting",
      "Dedicated account manager",
      "24/7 Priority support",
    ],
    icon: Crown,
    accentColor: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
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
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Plan & Billing</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your subscription tier, unlock features, and control billing.
        </p>
      </div>

      {/* Current Plan Banner */}
      {isLoading ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : error ? (
        <ErrorState
          title="Could not load subscription details"
          description="Failed to connect to billing services."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 p-6 shadow-sm">
          {/* Subtle decorative ring */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-100/40 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                    Active Plan
                  </span>
                  <StatusBadge status={currentStatus} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {PLANS.find(p => p.plan === currentPlan)?.name || `${currentPlan} Plan`}
                </h2>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {subscription?.currentPeriodEnd
                    ? `Valid until ${formatDate(subscription.currentPeriodEnd)}`
                    : "No expiry — lifetime access"}
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
        </div>
      )}

      {/* Plan Comparison Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((tier) => {
            const isCurrent = currentPlan === tier.plan;
            const Icon = tier.icon;

            return (
              <div
                key={tier.plan}
                className={`relative flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden ${
                  tier.popular
                    ? "border-emerald-400 shadow-md shadow-emerald-100"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                {/* Popular badge */}
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
                )}
                {tier.popular && (
                  <div className="absolute top-3.5 right-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className={`p-6 pb-4 ${tier.popular ? "pt-7" : ""}`}>
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tier.bgColor} mb-3`}>
                    <Icon className={`w-4.5 h-4.5 ${tier.accentColor}`} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{tier.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{tier.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">{tier.price}</span>
                    <span className="text-xs text-slate-400">/{tier.period}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="px-6 pb-5 flex-1">
                  <div className="border-t border-slate-100 pt-4">
                    <ul className="space-y-2.5">
                      {tier.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${tier.accentColor} shrink-0 mt-0.5`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 cursor-not-allowed"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Current Plan
                    </button>
                  ) : (
                    <Button
                      className={`w-full rounded-xl gap-2 ${
                        tier.popular
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                      variant={tier.popular ? "primary" : "outline"}
                      isLoading={upgradeMutation.isPending}
                      onClick={() => upgradeMutation.mutate(tier.plan)}
                    >
                      Switch Plan
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature comparison hint */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          All plans include core booking management, customer history, and live queue.
          Downgrading takes effect at the end of your current billing period.
          Need help choosing?{" "}
          <a href="mailto:support@salonsaas.in" className="text-emerald-600 hover:underline font-medium">
            Contact support →
          </a>
        </p>
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