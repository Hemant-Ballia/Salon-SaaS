"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAppointmentByIdApi, 
  confirmAppointmentApi, 
  cancelAppointmentApi, 
  rescheduleAppointmentApi, 
  completeAppointmentApi, 
  noShowAppointmentApi 
} from "@/lib/api/appointments";
import { formatCurrency, formatDate } from "@/lib/utils";
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
  CalendarClock 
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
    queryKey: ["appointment-detail", appointmentId],
    queryFn: () => getAppointmentByIdApi(appointmentId),
    enabled: !!appointmentId,
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmAppointmentApi(appointmentId),
    onSuccess: () => {
      toast.success("Appointment confirmed");
      queryClient.invalidateQueries({ queryKey: ["appointment-detail", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to confirm");
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => completeAppointmentApi(appointmentId),
    onSuccess: () => {
      toast.success("Appointment marked as completed");
      queryClient.invalidateQueries({ queryKey: ["appointment-detail", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
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
      queryClient.invalidateQueries({ queryKey: ["appointment-detail", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to cancel");
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: (payload: { appointmentDate: string; startTime: string }) =>
      rescheduleAppointmentApi(appointmentId, payload),
    onSuccess: () => {
      toast.success("Appointment rescheduled successfully");
      setIsRescheduleModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["appointment-detail", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to reschedule");
    },
  });

  const noShowMutation = useMutation({
    mutationFn: () => noShowAppointmentApi(appointmentId),
    onSuccess: () => {
      toast.success("Appointment marked as No-Show");
      setIsNoShowConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["appointment-detail", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to mark no-show");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !apt) {
    return (
      <ErrorState
        title="Appointment not found"
        description="The requested booking could not be located."
        onRetry={() => router.push("/appointments")}
      />
    );
  }

  const custName = apt.customer?.user?.displayName || "Customer";
  const custEmail = apt.customer?.user?.email || "No email";
  const custPhone = apt.customer?.user?.phone || "No phone provided";
  const staffName = apt.staff?.displayName || apt.staff?.user?.displayName || "Unassigned Specialist";
  const staffRole = apt.staff?.designation || "Staff Specialist";
  const isPending = apt.status === "PENDING";
  const isConfirmed = apt.status === "CONFIRMED";
  const isCompleted = apt.status === "COMPLETED";
  const isCancelled = apt.status === "CANCELLED";

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/appointments"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Appointments
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Appointment #{apt.id.slice(0, 8)}
            </h1>
            <StatusBadge status={apt.status} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isPending && (
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => confirmMutation.mutate()}
              isLoading={confirmMutation.isPending}
            >
              <CheckCircle className="w-4 h-4" />
              Confirm Booking
            </Button>
          )}

          {isConfirmed && (
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => completeMutation.mutate()}
              isLoading={completeMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Completed
            </Button>
          )}

          {!isCompleted && !isCancelled && (
            <>
              <Button
                variant="outline"
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
                className="gap-1.5 text-amber-600 hover:bg-amber-50 border-amber-200"
                onClick={() => setIsNoShowConfirmOpen(true)}
              >
                <UserX className="w-4 h-4" />
                No Show
              </Button>

              <Button
                variant="outline"
                className="gap-1.5 text-rose-600 hover:bg-rose-50 border-rose-200"
                onClick={() => setIsCancelModalOpen(true)}
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-base">
                {custName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{custName}</p>
                <p className="text-xs text-slate-500">Verified Client</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{custEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{custPhone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service & Staff Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scissors className="w-4 h-4 text-emerald-600" />
              Service & Specialist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-slate-900">{apt.service?.name || "Service"}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {apt.service?.durationMinutes ? `${apt.service.durationMinutes} mins` : "Duration standard"}
                  </p>
                </div>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(apt.service?.price || apt.totalAmount || 0)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Specialist:</span>
                <span className="font-medium text-slate-900">{staffName} ({staffRole})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Date:</span>
                <span className="font-medium text-slate-900">{formatDate(apt.appointmentDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Window:</span>
                <span className="font-medium text-slate-900">
                  {apt.startTime} {apt.endTime ? `- ${apt.endTime}` : ""}
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
        description="Choose a new date and time for this booking."
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              New Appointment Date *
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              New Start Time *
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRescheduleModalOpen(false)}
            >
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
        title="Cancel Appointment"
        description="Please provide a reason for cancelling this booking."
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Cancellation Reason
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation / specialist unavailable"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCancelModalOpen(false)}
            >
              Keep Appointment
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

      {/* Mark No Show Confirm */}
      <ConfirmDialog
        isOpen={isNoShowConfirmOpen}
        title="Mark Customer as No-Show?"
        description="This will record that the client failed to arrive for their scheduled booking."
        confirmLabel="Confirm No-Show"
        variant="destructive"
        isLoading={noShowMutation.isPending}
        onConfirm={() => noShowMutation.mutate()}
        onCancel={() => setIsNoShowConfirmOpen(false)}
      />
    </div>
  );
}