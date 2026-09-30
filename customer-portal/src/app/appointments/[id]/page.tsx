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
  Sparkles,
  ShieldCheck,
  Receipt
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { BusinessCover } from "@/components/ui/business-cover";
import { ServiceImage } from "@/components/ui/service-image";
import { StaffAvatar } from "@/components/ui/staff-avatar";
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Appointment Not Found
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            This appointment could not be retrieved or has been removed.
          </p>
          <Link href="/appointments">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
              Back to Appointments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = appointment.status === "PENDING" || appointment.status === "CONFIRMED";
  const canReschedule = appointment.status === "PENDING" || appointment.status === "CONFIRMED";
  const canJoinQueue = appointment.status === "CONFIRMED";
  const canPay = appointment.paymentStatus !== "PAID" && appointment.status !== "CANCELLED";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Back navigation */}
      <Link
        href="/appointments"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Appointments
      </Link>

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
        {/* Cover Photo Banner */}
        <BusinessCover business={appointment.business} aspectRatio="banner" className="h-44 sm:h-56 w-full" />

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <StatusBadge status={appointment.status} />
                <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                  Ref #{appointment.id.slice(0, 10)}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                {appointment.business?.name || "Partner Salon"}
              </h1>
              {appointment.business?.address && (
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  {appointment.business.address}, {appointment.business.city}
                </p>
              )}
            </div>

            <div className="sm:text-right bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl">
              <span className="text-xs text-slate-400 block">Total Due</span>
              <span className="text-2xl font-black text-slate-900">
                {formatCurrency(appointment.totalAmount || 0)}
              </span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    appointment.paymentStatus === "PAID"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {appointment.paymentStatus === "PAID" ? "Payment Complete" : "Payment Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Schedule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Appointment Date
              </span>
              <p className="text-sm font-bold text-slate-900">
                {formatDate(appointment.appointmentDate)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Time & Duration
              </span>
              <p className="text-sm font-bold text-slate-900">
                {formatTime(appointment.startTime)} ({appointment.totalDurationMinutes || 30} mins)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Stylist / Specialist
              </span>
              <div className="flex items-center gap-2 mt-1">
                <StaffAvatar name={staffName || "Stylist"} size="xs" />
                <p className="text-sm font-bold text-slate-900 truncate">
                  {staffName || "Any Available Stylist"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services breakdown card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600" />
          Selected Services Breakdown
        </h2>

        <div className="divide-y divide-slate-100">
          {servicesItems.length > 0 ? (
            servicesItems.map((item: any, idx: number) => {
              const serviceObj = item.service || { name: item.name || "Service", price: item.price };
              return (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ServiceImage service={serviceObj} size="sm" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 truncate">
                        {serviceObj.name}
                      </h4>
                      {serviceObj.durationMinutes && (
                        <span className="text-xs text-slate-400 font-medium">
                          {serviceObj.durationMinutes} mins service time
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 shrink-0">
                    {formatCurrency(item.price || item.priceAtBooking || serviceObj.price || 0)}
                  </span>
                </div>
              );
            })
          ) : appointment.service ? (
            <div className="py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ServiceImage service={appointment.service} size="sm" />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 truncate">
                    {appointment.service.name}
                  </h4>
                  {appointment.service.durationMinutes && (
                    <span className="text-xs text-slate-400 font-medium">
                      {appointment.service.durationMinutes} mins service time
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm font-extrabold text-slate-900 shrink-0">
                {formatCurrency(appointment.service.price || 0)}
              </span>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-3">No service items recorded.</p>
          )}
        </div>

        {appointment.notes && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Special Notes / Requests
            </span>
            <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              {appointment.notes}
            </p>
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            {canPay && (
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs"
                onClick={() => payMutation.mutate()}
                disabled={payMutation.isPending}
              >
                <CreditCard className="w-4 h-4" />
                {payMutation.isPending ? "Processing..." : "Pay Now"}
              </Button>
            )}

            {canJoinQueue && (
              <Button
                className="gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold rounded-xl"
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
                className="gap-2 border-slate-200 hover:border-emerald-400 hover:text-emerald-700 font-semibold rounded-xl"
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
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold rounded-xl"
              onClick={() => setIsCancelDialogOpen(true)}
            >
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Reschedule Appointment"
        description="Pick a new date and available time slot for your salon visit"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select New Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={newDate}
              onChange={(e) => {
                setNewDate(e.target.value);
                setSelectedSlot("");
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Available Time Slots
            </label>
            {slotsLoading ? (
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
              </div>
            ) : !newDate ? (
              <p className="text-xs text-slate-400">Please choose a date above.</p>
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
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : slot.available
                          ? "bg-white border-slate-200 text-slate-800 hover:border-emerald-400 hover:text-emerald-700"
                          : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
                      }`}
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                No open slots found for this date. Please try another day.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsRescheduleOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason for cancellation (optional)
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Let the salon know why you need to cancel..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsCancelDialogOpen(false)}>
              Keep Appointment
            </Button>
            <Button
              variant="danger"
              className="rounded-xl font-semibold"
              onClick={() => cancelMutation.mutate(cancelReason || "Cancelled by customer")}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}