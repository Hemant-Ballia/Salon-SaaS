"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyEarningsApi } from "@/lib/api/earnings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Wallet,
  DollarSign,
  Percent,
  Award,
  Calendar,
  Receipt,
  Clock,
  ShieldCheck,
  TrendingUp,
  Scissors,
  CheckCircle2,
} from "lucide-react";

export default function StaffEarningsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-earnings"],
    queryFn: () => getMyEarningsApi(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-44" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorState
          title="Unable to load earnings"
          description="Could not retrieve your compensation data from the server."
        />
      </div>
    );
  }

  const baseSalary = Number(data?.baseSalary || 0);
  const totalCommission = Number(data?.totalCommission || 0);
  const totalIncentives = Number(data?.totalIncentives || 0);
  const totalReversals = Number(data?.totalReversals || 0);
  const totalPeriodEarnings = Number(data?.totalPeriodEarnings || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Earnings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Personal compensation breakdown — salary, commissions, and milestone incentives.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Model: <strong className="text-slate-900">{data?.compensationType || "STANDARD"}</strong>
          </span>
        </div>
      </div>

      {/* Clean Earnings Summary Breakdown Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Base Salary */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-500">Base Salary</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            ₹{baseSalary.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Guaranteed salary</span>
        </div>

        {/* Commission */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-500">Commission</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">
            ₹{totalCommission.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">From client services</span>
        </div>

        {/* Incentives */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-500">Incentives</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 tracking-tight">
            ₹{totalIncentives.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Target milestones</span>
        </div>

        {/* Total Period Earnings */}
        <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xs">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-medium text-slate-300">Total Earnings</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{totalPeriodEarnings.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Current period payout</span>
        </div>
      </div>


      {/* Active Incentive Progress Section */}
      {data?.incentiveProgress && data.incentiveProgress.length > 0 && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              My Performance Targets
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.incentiveProgress.map((inc) => {
                const isAchieved = inc.progress.isAchieved;
                return (
                  <div
                    key={inc.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{inc.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        ₹{Number(inc.rewardAmount).toLocaleString()} Bonus
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">
                          Current: {inc.progress.current} / {inc.progress.target}
                        </span>
                        <span className={isAchieved ? "text-emerald-600" : "text-slate-500"}>
                          {inc.progress.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            isAchieved ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${inc.progress.percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{inc.period} target period</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Ledger Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            Earnings History & Ledgers
          </h2>
          <span className="text-xs text-slate-400">Chronological ledger</span>
        </div>

        <div>
          {!data?.ledgerEntries || data.ledgerEntries.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No commission or incentive ledger records found for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Service / Milestone</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Calculation Snapshot</th>
                    <th className="px-4 py-3 text-right">Earned</th>
                    <th className="px-4 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.ledgerEntries.map((entry) => {
                    const isReversal = entry.type === "REVERSAL" || entry.type === "ADJUSTMENT";
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              entry.type === "COMMISSION"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : entry.type === "INCENTIVE"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : isReversal
                                ? "bg-rose-50 text-rose-800 border border-rose-200"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                          {entry.serviceName || "Service"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {entry.customerName || "Customer"}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-500">
                          {entry.calculationSnapshot?.commissionRate && (
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              {entry.calculationSnapshot.commissionRate} of ₹{entry.calculationSnapshot.priceAtBooking}
                            </span>
                          )}
                          {entry.calculationSnapshot?.reason && (
                            <span className="inline-flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded text-rose-700">
                              {entry.calculationSnapshot.reason}
                            </span>
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-right font-bold ${
                            isReversal ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          ₹{Number(entry.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-[11px] text-slate-400">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

