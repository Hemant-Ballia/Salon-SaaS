"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Receipt,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Download,
  Filter,
  ExternalLink
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/context/auth-context";
import { getPaymentHistoryApi } from "@/lib/api/payments";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { Payment } from "@/types/models";

export default function PaymentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["payment-history"],
    queryFn: () => getPaymentHistoryApi({ limit: 50 }),
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <CreditCard className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Sign In to View Payments
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Review your salon transaction history, verify charges, and download invoices.
          </p>
          <Link href="/login?redirect=/payments">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-xs">
              Sign In to Continue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const payments: Payment[] = data?.data || [];

  const totalSpent = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidCount = payments.filter((p) => p.status === "PAID").length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <Receipt className="w-3.5 h-3.5" />
            Billing & Invoices
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Payment History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review your digital service receipts and completed transactions
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>256-Bit SSL Encrypted Checkout</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Total Lifetime Spend</span>
          <span className="text-2xl font-black text-slate-900">
            {formatCurrency(totalSpent)}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Successful Payments</span>
          <span className="text-2xl font-black text-emerald-700">
            {paidCount}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Total Records</span>
          <span className="text-2xl font-black text-slate-900">
            {payments.length}
          </span>
        </div>
      </div>

      {/* Transactions list */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center shadow-xs">
          <EmptyState
            icon={Receipt}
            title="No payment records found"
            description="When you book appointments and complete payments online or at the salon, your receipts will appear here."
            action={
              <Link href="/booking">
                <Button className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
                  Book Your Next Salon Visit
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-emerald-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CreditCard className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={payment.status} />
                    <span className="text-xs text-slate-400 font-mono">
                      {payment.razorpayPaymentId || payment.razorpayOrderId || `#${payment.id.slice(0, 8)}`}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {payment.appointment?.business?.name || "Salon Booking"}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{formatDate(payment.createdAt)}</span>
                    <span>•</span>
                    <span className="capitalize">{payment.method || "Online"}</span>
                    {payment.appointmentId && (
                      <>
                        <span>•</span>
                        <Link
                          href={`/appointments/${payment.appointmentId}`}
                          className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          View Booking
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="sm:text-right">
                  <span className="text-lg font-black text-slate-900">
                    {formatCurrency(payment.amount)}
                  </span>
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">
                    {payment.currency || "INR"}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs rounded-xl border-slate-200 hover:border-emerald-400 font-semibold text-slate-700"
                  onClick={() => setSelectedPayment(payment)}
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  Receipt
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Receipt Modal */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title="Payment Receipt"
          description="Transaction details and proof of payment"
        >
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedPayment.razorpayPaymentId || selectedPayment.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono text-slate-800">
                  {selectedPayment.razorpayOrderId || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-800 font-medium">
                  {formatDate(selectedPayment.createdAt)} {formatTime(selectedPayment.createdAt)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Status:</span>
                <StatusBadge status={selectedPayment.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold text-slate-800 uppercase">
                  {selectedPayment.method || "ONLINE"}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-800">Amount Paid:</span>
                <span className="font-black text-lg text-emerald-700">
                  {formatCurrency(selectedPayment.amount)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" className="rounded-xl" onClick={() => setSelectedPayment(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  window.print();
                }}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
              >
                <Download className="w-3.5 h-3.5" />
                Print Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}