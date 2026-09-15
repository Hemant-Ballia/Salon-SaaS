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
  Filter
} from "lucide-react";
import { CustomerLayout } from "@/components/layout/customer-layout";
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
      <CustomerLayout>
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
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
            <CreditCard className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Sign In to View Payments
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Track your salon invoices, payment receipts, and transaction history.
            </p>
            <Link href="/login?redirect=/payments">
              <Button className="w-full">Sign In to Continue</Button>
            </Link>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  const payments: Payment[] = data?.data || [];

  const totalSpent = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidCount = payments.filter((p) => p.status === "PAID").length;

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Payment History
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Secure online transactions and digital service receipts
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4" />
            <span>256-Bit Razorpay Secured</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <span className="text-xs text-neutral-500 block mb-1">Total Lifetime Spend</span>
            <span className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {formatCurrency(totalSpent)}
            </span>
          </Card>

          <Card className="p-5">
            <span className="text-xs text-neutral-500 block mb-1">Completed Payments</span>
            <span className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {paidCount}
            </span>
          </Card>

          <Card className="p-5">
            <span className="text-xs text-neutral-500 block mb-1">Total Transactions</span>
            <span className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {payments.length}
            </span>
          </Card>
        </div>

        {/* Transactions list */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : payments.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="When you book appointments and complete payments, your verified receipts will appear here."
              action={
                <Link href="/booking">
                  <Button className="mt-2">Book Your Next Salon Visit</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <Card
                key={payment.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shrink-0 mt-0.5">
                    <CreditCard className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={payment.status} />
                      <span className="text-xs text-neutral-400 font-mono">
                        {payment.razorpayPaymentId || payment.razorpayOrderId || `#${payment.id.slice(0, 8)}`}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {payment.appointment?.business?.name || "Salon Booking"}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span>{formatDate(payment.createdAt)}</span>
                      <span>â€¢</span>
                      <span>{payment.method || "Online"}</span>
                      {payment.appointmentId && (
                        <>
                          <span>â€¢</span>
                          <Link
                            href={`/appointments/${payment.appointmentId}`}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            View Booking
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                  <div className="sm:text-right">
                    <span className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(payment.amount)}
                    </span>
                    <span className="text-[11px] text-neutral-400 block uppercase">
                      {payment.currency || "INR"}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Receipt
                  </Button>
                </div>
              </Card>
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
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {selectedPayment.razorpayPaymentId || selectedPayment.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Order ID:</span>
                  <span className="font-mono text-neutral-800 dark:text-neutral-200">
                    {selectedPayment.razorpayOrderId || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Date:</span>
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {formatDate(selectedPayment.createdAt)} {formatTime(selectedPayment.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Payment Status:</span>
                  <StatusBadge status={selectedPayment.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Payment Mode:</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase">
                    {selectedPayment.method || "ONLINE"}
                  </span>
                </div>
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between text-sm">
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">Amount Paid:</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(selectedPayment.amount)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    window.print();
                  }}
                  className="gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Print / Save
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </CustomerLayout>
  );
}