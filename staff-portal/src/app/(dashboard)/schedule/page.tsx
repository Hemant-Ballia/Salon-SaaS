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

  const todayDayOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][new Date().getDay()];
  const todaySchedule = scheduleState[todayDayOfWeek];
  const isOnShiftToday = todaySchedule?.isAvailable;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Schedule & Shifts
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your daily working hours, shift windows, and booking availability.
          </p>
        </div>

        <Button
          className="gap-2 font-medium text-xs h-9 px-4 bg-emerald-600 hover:bg-emerald-700 shadow-xs self-start sm:self-auto"
          onClick={handleSave}
          isLoading={saveMutation.isPending}
        >
          <Save className="w-3.5 h-3.5" />
          Save Schedule
        </Button>
      </div>

      {/* TODAY'S SHIFT CARD */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Today&apos;s Shift
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-700 capitalize">
                {todayDayOfWeek.toLowerCase()}
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              {isOnShiftToday ? (
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {todaySchedule.startTime} — {todaySchedule.endTime}
                </div>
              ) : (
                <div className="text-lg font-semibold text-slate-500">
                  Scheduled Off Duty Today
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isOnShiftToday
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnShiftToday ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              {isOnShiftToday ? "● On Shift" : "○ Off Shift"}
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Configuration */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load schedule"
          description="Could not load your staff profile hours."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Weekly Working Hours
            </span>
            <span className="text-xs text-slate-400">Toggle active days & set shift times</span>
          </div>

          <div className="divide-y divide-slate-100">
            {DAYS.map((day) => {
              const current = scheduleState[day] || {
                isAvailable: false,
                startTime: "09:00",
                endTime: "18:00",
              };
              const isToday = day === todayDayOfWeek;

              return (
                <div
                  key={day}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isToday ? "bg-emerald-50/20" : "hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3 w-44">
                    <input
                      type="checkbox"
                      id={`day-${day}`}
                      checked={current.isAvailable}
                      onChange={() => handleDayToggle(day)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label
                      htmlFor={`day-${day}`}
                      className="font-semibold text-xs sm:text-sm text-slate-900 cursor-pointer capitalize flex items-center gap-1.5"
                    >
                      <span>{day.toLowerCase()}</span>
                      {isToday && (
                        <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                          Today
                        </span>
                      )}
                    </label>
                  </div>

                  {current.isAvailable ? (
                    <div className="flex items-center gap-2 sm:gap-3 text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Hours:</span>
                      </div>
                      <input
                        type="time"
                        value={current.startTime}
                        onChange={(e) => handleTimeChange(day, "startTime", e.target.value)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-slate-400 text-xs">—</span>
                      <input
                        type="time"
                        value={current.endTime}
                        onChange={(e) => handleTimeChange(day, "endTime", e.target.value)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Off Duty
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}