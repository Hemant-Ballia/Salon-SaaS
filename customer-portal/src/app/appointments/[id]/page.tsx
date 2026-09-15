"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Users,
  Repeat,
  XCircle,
  FileText,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/context/auth-context";
import {
  getAppointmentByIdApi,
  cancelAppointmentApi,
  rescheduleAppointmentApi,
  checkAvailabilityApi
} from "@/lib/api/appointments";
import { createPaymentOrderApi, verifyPaymentApi } from "@/lib/api/payments";
import { joinQueueApi } from "@/lib/api/queues";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  const { data: appointment, isLoading, error } = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => getAppointmentByIdApi(id),
    enabled: !!id && isAuthenticated,
  });

  const servicesItems = appointment?.services || appointment?.appointmentServices || [];
  const staffName = appointment?.staff?.user?.name || appointment?.staff?.displayName;

  // Query slots when rescheduling
  const { data: availabilityData, isLoading: slotsLoading } = useQuery({
    queryKey: ["reschedule-slots", appointment?.businessId, newDate],
    queryFn: () =>
      checkAvailabilityApi({
        businessId: appointment!.businessId,
        date: newDate,
        staffId: appointment?.staffId || undefined,
        serviceIds: servicesItems
          .map((s: any) => s.serviceId || s.service?.id)
          .filter(Boolean)
          .join(","),
      }),
    enabled: isRescheduleOpen && !!appointment?.businessId && !!newDate,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => cancelAppointmentApi(id, reason),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      setIsCancelDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to cancel appointment");
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: () =>
      rescheduleAppointmentApi(id, {
        appointmentDate: newDate,
        startTime: selectedSlot,
      }),
    onSuccess: () => {
      toast.success("Appointment rescheduled successfully");
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      setIsRescheduleOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to reschedule appointment");
    },
  });

  const joinQueueMutation = useMutation({
    mutationFn: () =>
      joinQueueApi({
        businessId: appointment!.businessId,
        appointmentId: appointment!.id,
      }),
    onSuccess: (res) => {
      toast.success(`Joined live queue! Token #${res.entry.tokenNumber}`);
      router.push(`/queue/${res.entry.id}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to join queue");
    },
  });

  const payMutation = useMutation({
    mutationFn: () => createPaymentOrderApi(id),
    onSuccess: async (order) => {
      toast.info("Order created. Initializing secure checkout...");
      try {
        await verifyPaymentApi({
          razorpayOrderId: order.orderId,
          razorpayPaymentId: "pay_sim_" + Date.now(),
          razorpaySignature: "sig_verified_sim",
        });
        toast.success("Payment successful!");
        queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Payment verification failed");
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Could not initialize payment order");
    },
  });

  if (authLoading || isLoading) {
    return (
      <CustomerLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </CustomerLayout>
    );
  }

  if (error || !appointment) {
    return (
      <CustomerLayout>
        <div className="max-w-md mx-auto py-16 text-center">
          <Card className="p-8">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Appointment Not Found
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              This appointment could not be retrieved or has been removed.
            </p>
            <Link href="/appointments">
              <Button>Back to My Appointments</Button>
            </Link>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  const canCancel = appointment.status === "PENDING" || appointment.status === "CONFIRMED";
  const canReschedule = appointment.status === "PENDING" || appointment.status === "CONFIRMED";
  const canJoinQueue = appointment.status === "CONFIRMED";
  const canPay = appointment.paymentStatus !== "PAID" && appointment.status !== "CANCELLED";

  return (
    <CustomerLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back navigation */}
        <Link
          href="/appointments"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Appointments
        </Link>

        {/* Top Header Card */}
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={appointment.status} />
                <span className="text-xs text-neutral-400 font-mono">
                  Ref: {appointment.id}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {appointment.business?.name || "Partner Salon"}
              </h1>
              {appointment.business?.address && (
                <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {appointment.business.address}, {appointment.business.city}
                </p>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-xs text-neutral-500 block">Total Amount</span>
              <span className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                {formatCurrency(appointment.totalAmount || 0)}
              </span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                    appointment.paymentStatus === "PAID"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  {appointment.paymentStatus === "PAID" ? "Payment Complete" : "Payment Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Schedule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <span className="text-xs text-neutral-500 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Date
              </span>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {formatDate(appointment.appointmentDate)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <span className="text-xs text-neutral-500 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Slot & Duration
              </span>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {formatTime(appointment.startTime)} ({appointment.totalDurationMinutes || 30} mins)
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <span className="text-xs text-neutral-500 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                Stylist / Specialist
              </span>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {staffName || "Any Available Stylist"}
              </p>
            </div>
          </div>
        </Card>

        {/* Services breakdown card */}
        <Card className="p-6 sm:p-8">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Selected Services
          </h2>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {servicesItems.length > 0 ? (
              servicesItems.map((item: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {item.service?.name || "Service Item"}
                    </h4>
                    {item.service?.durationMinutes && (
                      <span className="text-xs text-neutral-500">
                        {item.service.durationMinutes} mins
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(item.price || item.priceAtBooking || item.service?.price || 0)}
                  </span>
                </div>
              ))
            ) : appointment.service ? (
              <div className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {appointment.service.name}
                  </h4>
                  {appointment.service.durationMinutes && (
                    <span className="text-xs text-neutral-500">
                      {appointment.service.durationMinutes} mins
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(appointment.service.price || 0)}
                </span>
              </div>
            ) : (
              <p className="text-sm text-neutral-500 py-2">No service details listed.</p>
            )}
          </div>

          {appointment.notes && (
            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-xs text-neutral-500 flex items-center gap-1 mb-1">
                <FileText className="w-3.5 h-3.5" />
                Customer Notes
              </span>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-lg">
                {appointment.notes}
              </p>
            </div>
          )}
        </Card>

        {/* Action Toolbar */}
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {canPay && (
                <Button
                  className="gap-2"
                  onClick={() => payMutation.mutate()}
                  disabled={payMutation.isPending}
                >
                  <CreditCard className="w-4 h-4" />
                  {payMutation.isPending ? "Processing..." : "Pay Now"}
                </Button>
              )}

              {canJoinQueue && (
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={() => joinQueueMutation.mutate()}
                  disabled={joinQueueMutation.isPending}
                >
                  <Users className="w-4 h-4" />
                  {joinQueueMutation.isPending ? "Joining..." : "Join Live Queue"}
                </Button>
              )}

              {canReschedule && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setNewDate(appointment.appointmentDate.split("T")[0]);
                    setIsRescheduleOpen(true);
                  }}
                >
                  <Repeat className="w-4 h-4" />
                  Reschedule
                </Button>
              )}
            </div>

            {canCancel && (
              <Button
                variant="ghost"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                onClick={() => setIsCancelDialogOpen(true)}
              >
                Cancel Appointment
              </Button>
            )}
          </div>
        </Card>

        {/* Reschedule Modal */}
        <Modal
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          title="Reschedule Appointment"
          description="Pick a new date and time slot for your appointment"
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                New Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={newDate}
                onChange={(e) => {
                  setNewDate(e.target.value);
                  setSelectedSlot("");
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Available Time Slots
              </label>
              {slotsLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                </div>
              ) : !newDate ? (
                <p className="text-xs text-neutral-500">Please choose a date above.</p>
              ) : availabilityData?.slots && availabilityData.slots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                  {availabilityData.slots.map((slot) => {
                    const isSelected = selectedSlot === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.startTime)}
                        className={`py-2 px-2.5 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : slot.available
                            ? "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-indigo-300"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-800 cursor-not-allowed opacity-50"
                        }`}
                      >
                        {formatTime(slot.startTime)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-rose-500">No available slots found for this date.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <Button variant="outline" onClick={() => setIsRescheduleOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => rescheduleMutation.mutate()}
                disabled={!selectedSlot || rescheduleMutation.isPending}
              >
                {rescheduleMutation.isPending ? "Updating..." : "Confirm New Slot"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Cancel Confirmation Dialog */}
        <Modal
          isOpen={isCancelDialogOpen}
          onClose={() => setIsCancelDialogOpen(false)}
          title="Cancel Appointment"
          description="Are you sure you want to cancel this booking?"
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Reason for cancellation (optional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Let the salon know why you need to cancel..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                Keep Appointment
              </Button>
              <Button
                variant="danger"
                onClick={() => cancelMutation.mutate(cancelReason || "Cancelled by customer")}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </CustomerLayout>
  );
}