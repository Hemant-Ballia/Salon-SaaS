"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getStaffByIdApi, 
  updateStaffStatusApi, 
  getStaffScheduleApi, 
  updateStaffScheduleApi 
} from "@/lib/api/staff";
import { StaffScheduleItem, StaffStatus } from "@/types/models";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Mail, 
  Briefcase, 
  Save, 
  Power 
} from "lucide-react";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
];

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params.id as string;
  const queryClient = useQueryClient();

  const [scheduleState, setScheduleState] = useState<Record<string, {
    isWorking: boolean;
    startTime: string;
    endTime: string;
  }>>({});

  const { data: staff, isLoading: staffLoading, error: staffError } = useQuery({
    queryKey: ["staff-detail", staffId],
    queryFn: () => getStaffByIdApi(staffId),
    enabled: !!staffId,
  });

  const { isLoading: scheduleLoading } = useQuery({
    queryKey: ["staff-schedule", staffId],
    queryFn: async () => {
      const res = await getStaffScheduleApi(staffId);
      const map: Record<string, { isWorking: boolean; startTime: string; endTime: string }> = {};
      DAYS.forEach((d) => {
        const found = res.find((item) => item.dayOfWeek?.toUpperCase() === d);
        map[d] = {
          isWorking: found ? (found.isWorking ?? true) : false,
          startTime: found?.startTime || "09:00",
          endTime: found?.endTime || "18:00",
        };
      });
      setScheduleState(map);
      return res;
    },
    enabled: !!staffId,
  });

  const updateScheduleMutation = useMutation({
    mutationFn: (newSchedules: StaffScheduleItem[]) =>
      updateStaffScheduleApi(staffId, newSchedules),
    onSuccess: () => {
      toast.success("Weekly schedule updated successfully");
      queryClient.invalidateQueries({ queryKey: ["staff-schedule", staffId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update schedule");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: StaffStatus) =>
      updateStaffStatusApi(staffId, newStatus),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["staff-detail", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update status");
    },
  });

  const handleSaveSchedule = () => {
    const payload: StaffScheduleItem[] = DAYS.map((day) => ({
      dayOfWeek: day,
      isAvailable: scheduleState[day]?.isWorking ?? false, isWorking: scheduleState[day]?.isWorking ?? false,
      startTime: scheduleState[day]?.startTime || "09:00",
      endTime: scheduleState[day]?.endTime || "18:00",
    }));
    updateScheduleMutation.mutate(payload);
  };

  const handleDayToggle = (day: string) => {
    setScheduleState((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || { isWorking: false, startTime: "09:00", endTime: "18:00" }),
        isWorking: !prev[day]?.isWorking,
      },
    }));
  };

  const handleTimeChange = (day: string, field: "startTime" | "endTime", val: string) => {
    setScheduleState((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || { isWorking: false, startTime: "09:00", endTime: "18:00" }),
        [field]: val,
      },
    }));
  };

  if (staffLoading || scheduleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (staffError || !staff) {
    return (
      <ErrorState
        title="Staff member not found"
        description="The requested staff profile does not exist or was deleted."
        onRetry={() => router.push("/staff")}
      />
    );
  }

  const name = staff.displayName || staff.user?.displayName || "Unnamed Staff";
  const email = staff.user?.email || staff.email || "No email";
  const isAct = staff.status === "ACTIVE";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/staff"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff Directory
        </Link>
      </div>

      {/* Staff Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xl shadow-inner">
                {name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900">{name}</h1>
                  <StatusBadge status={staff.status} />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    {staff.designation || "Staff Specialist"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateStatusMutation.mutate(isAct ? "INACTIVE" : "ACTIVE")
                }
                isLoading={updateStatusMutation.isPending}
                className={isAct ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}
              >
                <Power className="w-4 h-4 mr-1.5" />
                {isAct ? "Deactivate Profile" : "Activate Profile"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Management Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Weekly Working Hours & Schedule
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Define the shifts and days when this staff member is available for appointments.
            </p>
          </div>
          <Button
            onClick={handleSaveSchedule}
            isLoading={updateScheduleMutation.isPending}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save Schedule
          </Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {DAYS.map((day) => {
              const current = scheduleState[day] || {
                isWorking: false,
                startTime: "09:00",
                endTime: "18:00",
              };

              return (
                <div
                  key={day}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 w-40">
                    <input
                      type="checkbox"
                      id={`day-${day}`}
                      checked={current.isWorking}
                      onChange={() => handleDayToggle(day)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <label
                      htmlFor={`day-${day}`}
                      className="font-medium text-sm text-slate-900 cursor-pointer capitalize"
                    >
                      {day.toLowerCase()}
                    </label>
                  </div>

                  {current.isWorking ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Shift:</span>
                      </div>
                      <input
                        type="time"
                        value={current.startTime}
                        onChange={(e) => handleTimeChange(day, "startTime", e.target.value)}
                        className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                      <span className="text-slate-400 text-sm">to</span>
                      <input
                        type="time"
                        value={current.endTime}
                        onChange={(e) => handleTimeChange(day, "endTime", e.target.value)}
                        className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 italic">
                      Off / Unavailable
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}