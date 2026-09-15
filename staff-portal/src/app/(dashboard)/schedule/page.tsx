"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { getStaffByIdApi, updateStaffScheduleApi } from "@/lib/api/staff";
import { StaffScheduleItem } from "@/types/models";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { Calendar, Clock, Save, ShieldCheck, Check } from "lucide-react";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export default function StaffSchedulePage() {
  const queryClient = useQueryClient();
  const { staffId } = useAuth();

  const [scheduleState, setScheduleState] = useState<
    Record<string, { isAvailable: boolean; startTime: string; endTime: string }>
  >({});

  const { data: staff, isLoading, error, refetch } = useQuery({
    queryKey: ["staff-profile-schedule", staffId],
    queryFn: () => (staffId ? getStaffByIdApi(staffId) : null),
    enabled: !!staffId,
  });

  useEffect(() => {
    if (staff && staff.schedules) {
      const map: Record<string, { isAvailable: boolean; startTime: string; endTime: string }> = {};
      DAYS.forEach((d) => {
        const found = staff.schedules?.find((item) => item.dayOfWeek?.toUpperCase() === d);
        map[d] = {
          isAvailable: found ? (found.isAvailable ?? true) : false,
          startTime: found?.startTime || "09:00",
          endTime: found?.endTime || "18:00",
        };
      });
      setScheduleState(map);
    }
  }, [staff]);

  const saveMutation = useMutation({
    mutationFn: (newSchedules: StaffScheduleItem[]) => {
      if (!staffId) throw new Error("Staff profile missing");
      return updateStaffScheduleApi(staffId, newSchedules);
    },
    onSuccess: () => {
      toast.success("Weekly shift schedule updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["staff-profile-schedule", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff-appointments"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update schedule");
    },
  });

  const handleDayToggle = (day: string) => {
    setScheduleState((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || { isAvailable: false, startTime: "09:00", endTime: "18:00" }),
        isAvailable: !prev[day]?.isAvailable,
      },
    }));
  };

  const handleTimeChange = (day: string, field: "startTime" | "endTime", val: string) => {
    setScheduleState((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || { isAvailable: false, startTime: "09:00", endTime: "18:00" }),
        [field]: val,
      },
    }));
  };

  const handleSave = () => {
    const payload: StaffScheduleItem[] = DAYS.map((day) => ({
      dayOfWeek: day,
      isAvailable: scheduleState[day]?.isAvailable ?? false,
      startTime: scheduleState[day]?.startTime || "09:00",
      endTime: scheduleState[day]?.endTime || "18:00",
    }));

    saveMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            My Shift Schedule
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure your working days and daily hours for booking availability.
          </p>
        </div>

        <Button
          size="lg"
          className="gap-2 font-bold shadow-md shadow-emerald-700/20"
          onClick={handleSave}
          isLoading={saveMutation.isPending}
        >
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load schedule"
          description="Could not load your staff profile hours."
          onRetry={() => refetch()}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Weekly Working Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {DAYS.map((day) => {
              const current = scheduleState[day] || {
                isAvailable: false,
                startTime: "09:00",
                endTime: "18:00",
              };

              return (
                <div
                  key={day}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 w-40">
                    <input
                      type="checkbox"
                      id={`day-${day}`}
                      checked={current.isAvailable}
                      onChange={() => handleDayToggle(day)}
                      className="w-5 h-5 text-emerald-600 rounded-lg border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label
                      htmlFor={`day-${day}`}
                      className="font-bold text-sm text-slate-900 cursor-pointer capitalize"
                    >
                      {day.toLowerCase()}
                    </label>
                  </div>

                  {current.isAvailable ? (
                    <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Shift:</span>
                      </div>
                      <input
                        type="time"
                        value={current.startTime}
                        onChange={(e) => handleTimeChange(day, "startTime", e.target.value)}
                        className="px-3 py-1.5 font-semibold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="time"
                        value={current.endTime}
                        onChange={(e) => handleTimeChange(day, "endTime", e.target.value)}
                        className="px-3 py-1.5 font-semibold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 italic">
                      Off Duty / Not Available
                    </span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}