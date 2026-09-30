"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import {
  getStaffCompensationApi,
  setStaffCompensationApi,
  getStaffEarningsApi,
} from "@/lib/api/compensation";
import { getServicesApi } from "@/lib/api/services";
import { Service } from "@/types/models";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  DollarSign,
  Percent,
  Award,
  Calendar,
  Save,
  ShieldCheck,
  TrendingUp,
  Receipt,
  FileText,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";

const COMPENSATION_TYPES = [
  { value: "SALARY", label: "Salary Only" },
  { value: "COMMISSION", label: "Commission Only" },
  { value: "SALARY_COMMISSION", label: "Salary + Commission" },
  { value: "SALARY_INCENTIVE", label: "Salary + Incentive" },
  { value: "SALARY_COMMISSION_INCENTIVE", label: "Salary + Commission + Incentive" },
  { value: "COMMISSION_INCENTIVE", label: "Commission + Incentive" },
  { value: "INCENTIVE", label: "Incentive Only" },
];

const CALCULATION_BASES = [
  { value: "COMPLETED_AND_PAID", label: "Completed + Paid (Recommended)" },
  { value: "COMPLETED", label: "Completed Appointments Only" },
  { value: "PAID", label: "Paid Appointments Only" },
  { value: "SERVICE_SUBTOTAL", label: "Service Subtotal" },
  { value: "NET_AFTER_DISCOUNT", label: "Net Amount After Discount" },
];

export default function StaffCompensationPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params.id as string;
  const { business } = useAuth();
  const queryClient = useQueryClient();

  const businessId = business?.id;

  // Tabs
  const [activeTab, setActiveTab] = useState<"CONFIG" | "LEDGER">("CONFIG");

  // Form states
  const [compensationType, setCompensationType] = useState<string>("SALARY_COMMISSION");
  const [monthlySalary, setMonthlySalary] = useState<string>("20000");
  const [commissionType, setCommissionType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [commissionRate, setCommissionRate] = useState<string>("15");
  const [calculationBasis, setCalculationBasis] = useState<string>("COMPLETED_AND_PAID");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState<string>(new Date().toISOString().split("T")[0]);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Queries
  const { data: compData, isLoading: compLoading, error: compError } = useQuery({
    queryKey: ["staff-compensation", businessId, staffId],
    queryFn: () => getStaffCompensationApi(businessId!, staffId),
    enabled: !!businessId && !!staffId,
  });

  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ["staff-earnings", businessId, staffId],
    queryFn: () => getStaffEarningsApi(businessId!, staffId),
    enabled: !!businessId && !!staffId,
  });

  const { data: servicesData } = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => getServicesApi({ limit: 100 }),
    enabled: !!businessId,
  });

  // Populate form when data loads
  React.useEffect(() => {
    if (compData?.compensation) {
      setCompensationType(compData.compensation.compensationType);
      setMonthlySalary(compData.compensation.monthlySalary?.toString() || "");
      setIsActive(compData.compensation.isActive);
      if (compData.compensation.effectiveFrom) {
        setEffectiveFrom(new Date(compData.compensation.effectiveFrom).toISOString().split("T")[0]);
      }
    }
    if (compData?.commissionRules && compData.commissionRules.length > 0) {
      const activeRule = compData.commissionRules[0];
      setCommissionType(activeRule.type);
      setCommissionRate(
        activeRule.type === "PERCENTAGE"
          ? activeRule.percentage?.toString() || "0"
          : activeRule.fixedAmount?.toString() || "0"
      );
      setCalculationBasis(activeRule.calculationBasis);
      if (activeRule.services) {
        setSelectedServiceIds(activeRule.services.map((s) => s.service.id));
      }
    }
  }, [compData]);

  const hasSalary = [
    "SALARY",
    "SALARY_COMMISSION",
    "SALARY_INCENTIVE",
    "SALARY_COMMISSION_INCENTIVE",
  ].includes(compensationType);

  const hasCommission = [
    "COMMISSION",
    "SALARY_COMMISSION",
    "SALARY_COMMISSION_INCENTIVE",
    "COMMISSION_INCENTIVE",
  ].includes(compensationType);

  const hasIncentive = [
    "INCENTIVE",
    "SALARY_INCENTIVE",
    "SALARY_COMMISSION_INCENTIVE",
    "COMMISSION_INCENTIVE",
  ].includes(compensationType);

  const toggleComponent = (comp: "salary" | "commission" | "incentive") => {
    const nextSalary = comp === "salary" ? !hasSalary : hasSalary;
    const nextComm = comp === "commission" ? !hasCommission : hasCommission;
    const nextInc = comp === "incentive" ? !hasIncentive : hasIncentive;

    if (!nextSalary && !nextComm && !nextInc) return;

    if (nextSalary && nextComm && nextInc) {
      setCompensationType("SALARY_COMMISSION_INCENTIVE");
    } else if (nextSalary && nextComm) {
      setCompensationType("SALARY_COMMISSION");
    } else if (nextSalary && nextInc) {
      setCompensationType("SALARY_INCENTIVE");
    } else if (nextComm && nextInc) {
      setCompensationType("COMMISSION_INCENTIVE");
    } else if (nextSalary) {
      setCompensationType("SALARY");
    } else if (nextComm) {
      setCompensationType("COMMISSION");
    } else if (nextInc) {
      setCompensationType("INCENTIVE");
    }
  };

  // Mutation
  const saveMutation = useMutation({
    mutationFn: (payload: any) => setStaffCompensationApi(businessId!, staffId, payload),
    onSuccess: () => {
      toast.success("Compensation policy saved successfully");
      queryClient.invalidateQueries({ queryKey: ["staff-compensation", businessId, staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff-earnings", businessId, staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to save compensation");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    const payload: any = {
      compensationType,
      monthlySalary: hasSalary && monthlySalary ? Number(monthlySalary) : null,
      effectiveFrom: new Date(effectiveFrom).toISOString(),
      isActive,
    };

    if (hasCommission) {
      payload.commission = {
        type: commissionType,
        percentage: commissionType === "PERCENTAGE" ? Number(commissionRate) : null,
        fixedAmount: commissionType === "FIXED" ? Number(commissionRate) : null,
        calculationBasis,
        serviceIds: selectedServiceIds,
        isActive: true,
      };
    }

    saveMutation.mutate(payload);
  };

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  if (!businessId) {
    return (
      <div className="p-8">
        <ErrorState title="Session expired" description="Please log in again." />
      </div>
    );
  }

  if (compLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (compError) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <ErrorState
          title="Failed to load compensation"
          description="Could not fetch staff compensation details."
        />
      </div>
    );
  }

  const staffName = compData?.displayName || "Staff Member";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/staff/${staffId}`}
              className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Profile
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Staff Compensation: <span className="text-emerald-600">{staffName}</span>
          </h1>
          <p className="text-sm text-slate-500">
            Configure authoritative payment rules, salary, commission percentage, and incentive qualification.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("CONFIG")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "CONFIG"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Policy & Structure
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LEDGER")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "LEDGER"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Earnings Ledger
          </button>
        </div>
      </div>

      {activeTab === "CONFIG" ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Authority Banner */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950">
              <span className="font-semibold">Business Owner Authority:</span> Staff members cannot view or modify other team members&apos; compensation structures. Changes made here apply strictly to future completed appointments and preserve historical snapshot ledger records.
            </div>
          </div>

          {/* Model Card */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Compensation Model
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Active Compensation Components
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => toggleComponent("salary")}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      hasSalary
                        ? "border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <DollarSign className={`w-4 h-4 ${hasSalary ? "text-emerald-600" : "text-slate-400"}`} />
                      <span className="text-xs">Fixed Salary</span>
                    </div>
                    <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${hasSalary ? "bg-emerald-200/80 text-emerald-800" : "bg-slate-100 text-slate-400"}`}>
                      {hasSalary ? "Active" : "Off"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleComponent("commission")}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      hasCommission
                        ? "border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Percent className={`w-4 h-4 ${hasCommission ? "text-emerald-600" : "text-slate-400"}`} />
                      <span className="text-xs">Commission</span>
                    </div>
                    <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${hasCommission ? "bg-emerald-200/80 text-emerald-800" : "bg-slate-100 text-slate-400"}`}>
                      {hasCommission ? "Active" : "Off"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleComponent("incentive")}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      hasIncentive
                        ? "border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Award className={`w-4 h-4 ${hasIncentive ? "text-emerald-600" : "text-slate-400"}`} />
                      <span className="text-xs">Incentives</span>
                    </div>
                    <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${hasIncentive ? "bg-emerald-200/80 text-emerald-800" : "bg-slate-100 text-slate-400"}`}>
                      {hasIncentive ? "Active" : "Off"}
                    </span>
                  </button>
                </div>

                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Selected Model Configuration
                </label>
                <select
                  value={compensationType}
                  onChange={(e) => setCompensationType(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  {COMPENSATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1.5">
                  Business Owner Authority: Toggle components above or choose directly from the 7 standard combinations.
                </p>
              </div>

              {/* Dynamic Salary Section */}
              {hasSalary && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Fixed Monthly Salary
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Monthly Salary (₹ INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 font-medium text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={monthlySalary}
                        onChange={(e) => setMonthlySalary(e.target.value)}
                        placeholder="25000"
                        className="w-full h-10 pl-8 pr-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Fixed guaranteed compensation paid monthly. Not dependent on appointment counts.
                    </p>
                  </div>
                </div>
              )}

              {/* Dynamic Commission Section */}
              {hasCommission && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Percent className="w-4 h-4 text-emerald-600" />
                    Commission Structure
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Commission Calculation Method
                      </label>
                      <select
                        value={commissionType}
                        onChange={(e) => setCommissionType(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="PERCENTAGE">Percentage of Service Price (%)</option>
                        <option value="FIXED">Fixed Amount per Service (₹)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        {commissionType === "PERCENTAGE" ? "Commission Rate (%)" : "Fixed Amount (₹)"}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max={commissionType === "PERCENTAGE" ? "100" : undefined}
                          step="0.01"
                          required
                          value={commissionRate}
                          onChange={(e) => setCommissionRate(e.target.value)}
                          placeholder={commissionType === "PERCENTAGE" ? "15" : "150"}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="absolute right-3.5 top-2.5 text-slate-400 font-medium text-sm">
                          {commissionType === "PERCENTAGE" ? "%" : "₹"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Commission Qualification Basis
                    </label>
                    <select
                      value={calculationBasis}
                      onChange={(e) => setCalculationBasis(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {CALCULATION_BASES.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">
                      Specifies when the compensation ledger entry is generated.
                    </p>
                  </div>

                  {/* Applicable Services */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Applicable Services
                    </label>
                    <p className="text-xs text-slate-400 mb-2">
                      Leave empty to apply to all services, or select specific eligible services:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-white">
                      {servicesData?.data?.map((svc: Service) => {
                        const checked = selectedServiceIds.includes(svc.id);
                        return (
                          <label
                            key={svc.id}
                            className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-all ${
                              checked
                                ? "border-emerald-500 bg-emerald-50/40 text-emerald-900 font-medium"
                                : "border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleService(svc.id)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="truncate">{svc.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Incentive Callout */}
              {hasIncentive && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 flex items-start gap-3">
                  <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-950">
                    <p className="font-semibold">Performance Incentives Active</p>
                    <p className="mt-0.5">
                      This staff member participates in target-based incentive bonuses. You can define custom targets (e.g. 100 completed appointments or ₹50,000 monthly sales) in the{" "}
                      <Link href="/incentives" className="font-medium underline hover:text-amber-800">
                        Incentive Builder
                      </Link>.
                    </p>
                  </div>
                </div>
              )}

              {/* Effective Dates & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Effective From
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="isActiveToggle" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Policy Active & Operative
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saveMutation.isPending ? "Saving Policy..." : "Save Compensation Policy"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      ) : (
        /* ── Earnings & Ledger Tab ── */
        <div className="space-y-6">
          {/* Earnings KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200 shadow-xs">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Base Salary
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ₹{Number(earningsData?.baseSalary || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">Monthly guaranteed</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-xs">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Commission Earned
                </p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  ₹{Number(earningsData?.totalCommission || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">From completed services</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-xs">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Incentives Awarded
                </p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  ₹{Number(earningsData?.totalIncentives || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">Target milestones</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-xs bg-emerald-900 text-white">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                  Total Period Earnings
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  ₹{Number(earningsData?.totalPeriodEarnings || 0).toLocaleString()}
                </p>
                <p className="text-xs text-emerald-300 mt-1">Current period estimate</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Incentive Progress */}
          {earningsData?.incentiveProgress && earningsData.incentiveProgress.length > 0 && (
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Active Incentive Goals Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {earningsData.incentiveProgress.map((inc) => (
                  <div key={inc.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-900">{inc.name}</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Reward: ₹{Number(inc.rewardAmount).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          inc.progress.isAchieved ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${inc.progress.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>
                        Achieved: <strong className="text-slate-800">{inc.progress.current}</strong> / {inc.progress.target}
                      </span>
                      <span>{inc.progress.percentage}% completed</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Immutable Ledger Table */}
          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-600" />
                Immutable Financial Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {earningsData?.ledgerEntries?.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No compensation transactions recorded for this period yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                      <tr>
                        <th className="px-6 py-3.5">Type</th>
                        <th className="px-6 py-3.5">Service / Milestone</th>
                        <th className="px-6 py-3.5">Customer</th>
                        <th className="px-6 py-3.5">Calculation Snapshot</th>
                        <th className="px-6 py-3.5 text-right">Amount</th>
                        <th className="px-6 py-3.5 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {earningsData?.ledgerEntries?.map((entry) => {
                        const isReversal = entry.type === "REVERSAL" || entry.type === "ADJUSTMENT";
                        return (
                          <tr key={entry.id} className="hover:bg-slate-50/75 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  entry.type === "COMMISSION"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : entry.type === "INCENTIVE"
                                    ? "bg-amber-100 text-amber-800"
                                    : isReversal
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {entry.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                              {entry.serviceName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                              {entry.customerName}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">
                              {entry.calculationSnapshot?.commissionRate && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                  Rate: {entry.calculationSnapshot.commissionRate} | Base: ₹{entry.calculationSnapshot.priceAtBooking}
                                </span>
                              )}
                              {entry.calculationSnapshot?.reason && (
                                <span className="inline-flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded text-rose-700">
                                  {entry.calculationSnapshot.reason}
                                </span>
                              )}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${
                              isReversal ? "text-rose-600" : "text-emerald-700"
                            }`}>
                              ₹{Number(entry.amount).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-slate-400">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
