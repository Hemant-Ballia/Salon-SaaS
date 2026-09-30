"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import {
  listIncentiveRulesApi,
  createIncentiveRuleApi,
  deleteIncentiveRuleApi,
} from "@/lib/api/compensation";
import { getStaffListApi } from "@/lib/api/staff";
import { getServicesApi } from "@/lib/api/services";
import { Service, Staff } from "@/types/models";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import {
  Award,
  Plus,
  Target,
  Gift,
  Calendar,
  Users,
  CheckCircle,
  TrendingUp,
  Trash2,
  Clock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function IncentivesPage() {
  const { business } = useAuth();
  const queryClient = useQueryClient();
  const businessId = business?.id;

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [metric, setMetric] = useState("APPOINTMENT_COUNT");
  const [target, setTarget] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [period, setPeriod] = useState("MONTHLY");
  const [staffId, setStaffId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");

  const { data: incentives, isLoading, error } = useQuery({
    queryKey: ["incentives", businessId],
    queryFn: () => listIncentiveRulesApi(businessId!),
    enabled: !!businessId,
  });

  const { data: staffData } = useQuery({
    queryKey: ["staff", businessId],
    queryFn: () => getStaffListApi({ limit: 100 }),
    enabled: !!businessId,
  });

  const { data: servicesData } = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => getServicesApi({ limit: 100 }),
    enabled: !!businessId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createIncentiveRuleApi(businessId!, data),
    onSuccess: () => {
      toast.success("Incentive rule created successfully");
      setIsModalOpen(false);
      setName("");
      setTarget("");
      setRewardAmount("");
      setStaffId("");
      setServiceId("");
      queryClient.invalidateQueries({ queryKey: ["incentives", businessId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create incentive rule");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIncentiveRuleApi(businessId!, id),
    onSuccess: () => {
      toast.success("Incentive rule deactivated");
      queryClient.invalidateQueries({ queryKey: ["incentives", businessId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to deactivate rule");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    createMutation.mutate({
      name,
      metric,
      target: Number(target),
      rewardType: "FIXED_BONUS",
      rewardAmount: Number(rewardAmount),
      period,
      staffId: staffId || null,
      serviceId: metric === "SERVICE_COUNT" && serviceId ? serviceId : null,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      isActive: true,
    });
  };

  if (!businessId) {
    return (
      <div className="p-8">
        <ErrorState title="Session expired" description="Please log in again." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-500" />
            Performance Incentive Builder
          </h1>
          <p className="text-sm text-slate-500">
            Define performance milestones and rewards (appointments count, eligible revenue, or service-specific targets).
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium px-4 py-2.5 rounded-lg shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Incentive Rule
        </Button>
      </div>

      {/* Authority Alert */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950">
          <span className="font-semibold">Business Owner Authority:</span> Incentives evaluate real completed appointments and revenue. Rewards are automatically credited as ledger entries to staff once targets are met in their period.
        </div>
      </div>

      {/* Incentive List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : error ? (
        <ErrorState title="Failed to load incentives" description="Could not load incentive rules." />
      ) : incentives?.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No incentives configured yet"
          description="Create your first performance bonus rule to motivate your team."
          action={
            <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white">
              Create Incentive Rule
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {incentives?.map((rule) => {
            const isCompletedTarget = rule.progress?.isAchieved;
            return (
              <Card key={rule.id} className="border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {rule.period} Target
                    </span>
                    <CardTitle className="text-base font-bold text-slate-900 mt-1.5">
                      {rule.name}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(rule.id)}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5"
                    title="Deactivate Rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-medium">Metric & Goal</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {rule.metric === "TOTAL_REVENUE" ? `₹${Number(rule.target).toLocaleString()}` : `${rule.target} Completed`}
                      </p>
                    </div>
                    <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-emerald-700 font-medium">Reward Bonus</span>
                      <p className="font-bold text-emerald-800 text-sm mt-0.5">
                        ₹{Number(rule.rewardAmount).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {rule.progress && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">
                          Progress: {rule.progress.current} / {rule.progress.target}
                        </span>
                        <span className={isCompletedTarget ? "text-emerald-600 font-bold" : "text-slate-500"}>
                          {rule.progress.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            isCompletedTarget ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${rule.progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {rule.staff ? rule.staff.displayName : "All Team Members"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Started {new Date(rule.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Incentive Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Incentive Milestone">
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Incentive Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Monthly 100 Appointments Bonus"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metric Target *
              </label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="APPOINTMENT_COUNT">Completed Appointments</option>
                <option value="TOTAL_REVENUE">Total Eligible Revenue (₹)</option>
                <option value="SERVICE_COUNT">Specific Service Volume</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Threshold *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. 100 or 50000"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {metric === "SERVICE_COUNT" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specific Service *
              </label>
              <select
                required
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select service...</option>
                {servicesData?.data?.map((s: Service) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reward Amount (₹ INR) *
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                placeholder="5000"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Evaluation Period *
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="CUSTOM">Custom Date Window</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Applicable Staff Member
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Team Members (Open Goal)</option>
                {staffData?.data?.map((s: Staff) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {createMutation.isPending ? "Creating..." : "Create Incentive"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
