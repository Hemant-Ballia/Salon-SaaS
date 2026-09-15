"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAppointmentByIdApi, 
  confirmAppointmentApi, 
  completeAppointmentApi, 
  cancelAppointmentApi, 
  rescheduleAppointmentApi, 
  noShowAppointmentApi 
} from "@/lib/api/appointments";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Scissors, 
  CheckCircle, 
  CheckCircle2, 
  XCircle, 
  UserX, 
  CalendarClock,
  Sparkles
} from "lucide-react";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;
  const queryClient = useQueryClient();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("10:00");
  const [isNoShowConfirmOpen, setIsNoShowConfirmOpen] = useState(false);

  const { data: apt, isLoading, error } = useQuery({
    queryKey: ["staff-appointment-detail", appointmentId],
    queryFn: () => getAppointmentByIdApi(appointmentId),
    enabled: !!appointmentId,
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmAppointmentApi(appointmentId),
    onSuccess: () => {
      toast.success("Appointment confirmed");
      queryClient.invalidateQueries({ queryKey: ["staff-appointment-detail", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["staff-appointments-list"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to confirm");
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => completeAppointmentApi(appointmentId),
    onSuccess: () => {
      toast.success("Appointment marked as completed");
      queryClient.invalidateQueries({ queryKey: ["staff-appointment-detail", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["staff-appointments-list"] });
      queryClient.invalidateQueries({ queryKey: ["staff-performance"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to complete");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => cancelAppointmentApi(appointmentId, reason),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      setIsCancelModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["staff-appointment-detail", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["staff-appointments-list"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to cancel");
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: (payload: { appointmentDate: string; startTime: string }) =>
      rescheduleAppointmentApi(appointmentId, payload),
    onSuccess: () => {
      toast.success("Appointment rescheduled");
      setIsRescheduleModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["staff-appointment-detail", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["staff-appointments-list"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to reschedule");
    },
  });

  const noShowMutation = useMutation({
    mutationFn: () => noShowAppointmentApi(appointmentId),
    onSuccess: () => {
      toast.success("Appointment recorded as No-Show");
      setIsNoShowConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["staff-appointment-detail", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["staff-appointments-list"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to mark no-show");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !apt) {
    return (
      <ErrorState
        title="Appointment not found"
        description="This booking does not exist or has been removed."
        onRetry={() => router.push("/appointments")}
      />
    );
  }

  const clientName = apt.customer?.user?.displayName || apt.customer?.user?.name || "Client";
  const clientEmail = apt.customer?.user?.email || "No email";
  const clientPhone = apt.customer?.user?.phone || "No phone provided";
  const serviceName = apt.service?.name || apt.appointmentServices?.[0]?.service?.name || "Service";
  const duration = apt.service?.durationMinutes || 30;
  const isPending = apt.status === "PENDING";
  const isConfirmed = apt.status === "CONFIRMED";
  const isCompleted = apt.status === "COMPLETED";
  const isCancelled = apt.status === "CANCELLED";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/appointments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Appointments
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Booking Details
            </h1>
            <StatusBadge status={apt.status} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isPending && (
              <Button
                className="gap-2 font-bold"
                onClick={() => confirmMutation.mutate()}
                isLoading={confirmMutation.isPending}
              >
                <CheckCircle className="w-4 h-4" />
                Confirm
              </Button>
            )}

            {isConfirmed && (
              <Button
                className="gap-2 font-bold bg-emerald-600 hover:bg-emerald-700"
                onClick={() => completeMutation.mutate()}
                isLoading={completeMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete Service
              </Button>
            )}

            {!isCompleted && !isCancelled && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setNewDate(apt.appointmentDate ? apt.appointmentDate.split("T")[0] : "");
                    setNewTime(apt.startTime || "10:00");
                    setIsRescheduleModalOpen(true);
                  }}
                >
                  <CalendarClock className="w-4 h-4" />
                  Reschedule
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  onClick={() => setIsNoShowConfirmOpen(true)}
                >
                  <UserX className="w-4 h-4" />
                  No-Show
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={() => setIsCancelModalOpen(true)}
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm">
                {clientName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900">{clientName}</p>
                <p className="text-xs text-slate-400">Client Contact</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{clientPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{clientEmail}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Scissors className="w-4 h-4 text-emerald-600" />
              Treatment & Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="font-bold text-slate-900">{serviceName}</p>
              <p className="text-xs text-slate-500 mt-0.5">Estimated: {duration} mins</p>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-800">{formatDate(apt.appointmentDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Window:</span>
                <span className="font-bold text-slate-800">
                  {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Price:</span>
                <span className="font-extrabold text-emerald-700">
                  {formatCurrency(apt.totalAmount || apt.service?.price || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Appointment"
        description="Select a new date and start time for this client."
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              New Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              New Start Time
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => rescheduleMutation.mutate({ appointmentDate: newDate, startTime: newTime })}
              isLoading={rescheduleMutation.isPending}
            >
              Confirm Reschedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Reason Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Booking"
        description="Provide a brief explanation for cancelling this booking."
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Cancellation Reason
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Client requested cancellation or specialist unavailable"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate(cancelReason)}
              isLoading={cancelMutation.isPending}
            >
              Cancel Booking
            </Button>
          </div>
        </div>
      </Modal>

      {/* No Show Confirm Dialog */}
      <ConfirmDialog
        isOpen={isNoShowConfirmOpen}
        title="Mark Client as No-Show"
        description="Are you sure the customer failed to arrive for this appointment?"
        confirmLabel="Record No-Show"
        variant="destructive"
        isLoading={noShowMutation.isPending}
        onConfirm={() => noShowMutation.mutate()}
        onCancel={() => setIsNoShowConfirmOpen(false)}
      />
    </div>
  );
}