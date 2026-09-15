"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { getBusinessesApi, getBusinessServicesApi } from "@/lib/api/businesses";
import { checkAvailabilityApi, createAppointmentApi } from "@/lib/api/appointments";
import { formatCurrency, formatDuration, formatDate, formatTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeSlot } from "@/types/models";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  Store, 
  Scissors, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2 
} from "lucide-react";

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const preselectedBiz = searchParams.get("businessId") || "";
  const preselectedSvc = searchParams.get("serviceId") || "";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedBusinessId, setSelectedBusinessId] = useState(preselectedBiz);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    preselectedSvc ? [preselectedSvc] : []
  );
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [notes, setNotes] = useState("");

  // 1. Fetch businesses
  const { data: businessesData, isLoading: bizLoading } = useQuery({
    queryKey: ["booking-businesses"],
    queryFn: () => getBusinessesApi({ limit: 100 }),
  });

  // 2. Fetch services for selected business
  const { data: services = [], isLoading: svcLoading } = useQuery({
    queryKey: ["booking-services", selectedBusinessId],
    queryFn: () => (selectedBusinessId ? getBusinessServicesApi(selectedBusinessId) : []),
    enabled: !!selectedBusinessId,
  });

  // 3. Fetch availability slots
  const { data: availability, isLoading: slotLoading, refetch: refetchSlots } = useQuery({
    queryKey: ["booking-availability", selectedBusinessId, selectedDate, selectedServiceIds],
    queryFn: () =>
      selectedBusinessId && selectedDate && selectedServiceIds.length > 0
        ? checkAvailabilityApi({
            businessId: selectedBusinessId,
            date: selectedDate,
            serviceIds: selectedServiceIds.join(","),
          })
        : null,
    enabled: !!selectedBusinessId && !!selectedDate && selectedServiceIds.length > 0 && step === 3,
  });

  // Auto-advance if query params present
  useEffect(() => {
    if (preselectedBiz && preselectedSvc) {
      setSelectedBusinessId(preselectedBiz);
      setSelectedServiceIds([preselectedSvc]);
      setStep(3);
    } else if (preselectedBiz) {
      setSelectedBusinessId(preselectedBiz);
      setStep(2);
    }
  }, [preselectedBiz, preselectedSvc]);

  const bookingMutation = useMutation({
    mutationFn: createAppointmentApi,
    onSuccess: (data) => {
      toast.success("Appointment booked successfully!");
      router.push(`/appointments/${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create appointment");
    },
  });

  const businesses = businessesData?.data || [];
  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId);
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalAmount = selectedServices.reduce((acc, s) => acc + s.price, 0);
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.durationMinutes, 0);

  const toggleService = (svcId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(svcId) ? prev.filter((id) => id !== svcId) : [...prev, svcId]
    );
  };

  const handleConfirm = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to confirm your booking");
      router.push(`/login?redirect=${encodeURIComponent(window.location.href)}`);
      return;
    }

    if (!selectedBusinessId || !selectedDate || !selectedSlot || selectedServiceIds.length === 0) {
      toast.error("Please complete all booking selections");
      return;
    }

    bookingMutation.mutate({
      businessId: selectedBusinessId,
      appointmentDate: selectedDate,
      startTime: selectedSlot,
      serviceIds: selectedServiceIds,
      notes: notes || undefined,
    });
  };

  const slots: TimeSlot[] = availability?.slots || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        {[
          { num: 1, label: "Salon" },
          { num: 2, label: "Services" },
          { num: 3, label: "Time Slot" },
          { num: 4, label: "Confirm" },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-colors ${
                step === s.num
                  ? "bg-emerald-600 text-white shadow-sm"
                  : step > s.num
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span
              className={`text-xs font-bold hidden sm:inline ${
                step === s.num ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Select Salon */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900">1. Select a Salon</h2>
            <p className="text-xs text-slate-500">
              Choose the verified parlour where you wish to book your session.
            </p>
          </div>

          {bizLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {businesses.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBusinessId(b.id);
                    setStep(2);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedBusinessId === b.id
                      ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-sm">
                      {b.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{b.name}</h3>
                      <p className="text-xs text-slate-500">{b.city || b.address || "Local salon"}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Services */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">2. Select Treatments</h2>
              <p className="text-xs text-slate-500">
                Salon: <span className="font-bold text-slate-800">{selectedBusiness?.name}</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setStep(1)}
            >
              Change Salon
            </Button>
          </div>

          {svcLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-500 text-xs">
                No active services found for this salon.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {services.map((s) => {
                const isChecked = selectedServiceIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isChecked
                        ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          isChecked ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{formatDuration(s.durationMinutes)}</span>
                          <span>•</span>
                          <span>{s.category || "Treatment"}</span>
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-700 text-base">
                      {formatCurrency(s.price)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              disabled={selectedServiceIds.length === 0}
              onClick={() => setStep(3)}
              className="gap-2 font-bold"
            >
              Continue to Date & Slot
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Select Date & Slot */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">3. Pick Date & Available Slot</h2>
              <p className="text-xs text-slate-500">
                Checking real-time specialist slots at {selectedBusiness?.name}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setStep(2)}>
              Change Services
            </Button>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Appointment Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlot("");
              }}
              className="w-full sm:w-64 px-3.5 py-2.5 text-sm font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
            />
          </div>

          {/* Time Slots Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Available Slots ({slots.filter((s) => s.available !== false).length})
            </label>

            {slotLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-11 rounded-xl" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                No appointment slots available on this date. Please select another date.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {slots.map((slot, idx) => {
                  const isAvailable = slot.available !== false;
                  const isSelected = selectedSlot === slot.startTime;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlot(slot.startTime)}
                      className={`h-11 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30"
                          : isAvailable
                          ? "bg-white border border-slate-200 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/50"
                          : "bg-slate-100 text-slate-300 border border-slate-100 cursor-not-allowed line-through"
                      }`}
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              disabled={!selectedSlot}
              onClick={() => setStep(4)}
              className="gap-2 font-bold"
            >
              Review Booking
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Confirm */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">4. Review & Confirm Booking</h2>
            <p className="text-xs text-slate-500">
              Verify your booking schedule and salon details before confirming.
            </p>
          </div>

          <Card className="border-emerald-200 bg-emerald-50/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start pb-4 border-b border-emerald-100">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Salon</span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedBusiness?.name}</h3>
                  <p className="text-xs text-slate-500">{selectedBusiness?.city || selectedBusiness?.address}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Total</span>
                  <p className="text-2xl font-black text-emerald-700">{formatCurrency(totalAmount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pb-4 border-b border-emerald-100">
                <div>
                  <span className="text-slate-400 font-semibold block mb-0.5">Date</span>
                  <span className="font-bold text-slate-900 text-sm">{formatDate(selectedDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block mb-0.5">Start Time</span>
                  <span className="font-bold text-slate-900 text-sm">{formatTime(selectedSlot)}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">Selected Treatments:</span>
                <div className="space-y-2">
                  {selectedServices.map((s) => (
                    <div key={s.id} className="flex justify-between items-center text-xs font-medium text-slate-800">
                      <span>{s.name} ({formatDuration(s.durationMinutes)})</span>
                      <span className="font-bold">{formatCurrency(s.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Special Notes / Requests (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Allergy to certain hair oils, preferred haircut style..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              size="lg"
              onClick={handleConfirm}
              isLoading={bookingMutation.isPending}
              className="gap-2 font-bold shadow-md shadow-emerald-700/20"
            >
              <CheckCircle2 className="w-5 h-5" />
              Confirm & Book Appointment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading booking flow...</div>}>
      <BookingContent />
    </Suspense>
  );
}