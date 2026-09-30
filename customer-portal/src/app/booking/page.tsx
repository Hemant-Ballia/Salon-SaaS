"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { getBusinessesApi, getBusinessServicesApi } from "@/lib/api/businesses";
import { checkAvailabilityApi, createAppointmentApi } from "@/lib/api/appointments";
import { formatCurrency, formatDuration, formatDate, formatTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessCover } from "@/components/ui/business-cover";
import { ServiceImage } from "@/components/ui/service-image";
import { Appointment, TimeSlot } from "@/types/models";
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
  CheckCircle2,
  Sparkles,
  MapPin,
  FileText,
  CreditCard,
  User
} from "lucide-react";

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const preselectedBiz = searchParams.get("businessId") || "";
  const preselectedSvc = searchParams.get("serviceId") || "";

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
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
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  // Quick date chips for next 7 days
  const quickDates = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      list.push({ iso, label, dayNum });
    }
    return list;
  }, []);

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
  const { data: availability, isLoading: slotLoading } = useQuery({
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
      setConfirmedBooking(data);
      setStep(5);
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
      {/* Progress Stepper (hidden on final celebration screen) */}
      {step < 5 && (
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          {[
            { num: 1, label: "Salon" },
            { num: 2, label: "Services" },
            { num: 3, label: "Date & Time" },
            { num: 4, label: "Review & Book" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                  step === s.num
                    ? "bg-emerald-600 text-white shadow-xs"
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
      )}

      {/* Step 1: Select Salon */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">1. Select a Salon</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the verified parlour where you wish to reserve your slot.
            </p>
          </div>

          {bizLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {businesses.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBusinessId(b.id);
                    setStep(2);
                  }}
                  className={`overflow-hidden rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    selectedBusinessId === b.id
                      ? "border-emerald-600 bg-emerald-50/20 shadow-md ring-2 ring-emerald-600/20"
                      : "border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-xs"
                  }`}
                >
                  <BusinessCover business={b} aspectRatio="card" />

                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors truncate">
                        {b.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {b.city || b.address || "Local partner"}
                      </p>
                    </div>
                    <Button size="sm" className="font-bold text-xs bg-slate-900 text-white rounded-xl shrink-0 cursor-pointer">
                      Select
                    </Button>
                  </div>
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
              className="text-xs font-bold text-slate-600 cursor-pointer"
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
                No active treatments found for this salon.
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
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3.5 ${
                      isChecked
                        ? "border-emerald-600 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-600/20"
                        : "border-slate-200/80 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          isChecked ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <ServiceImage service={s} size="sm" />

                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{s.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{formatDuration(s.durationMinutes)}</span>
                          <span>•</span>
                          <span>{s.category || "Treatment"}</span>
                        </p>
                      </div>
                    </div>

                    <span className="font-black text-emerald-700 text-base shrink-0">
                      {formatCurrency(s.price)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Running total indicator */}
          {selectedServiceIds.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                {selectedServiceIds.length} {selectedServiceIds.length === 1 ? "service" : "services"} selected (~{totalDuration} mins)
              </span>
              <span className="text-sm font-black text-emerald-700">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setStep(1)} className="cursor-pointer">
              Back
            </Button>
            <Button
              disabled={selectedServiceIds.length === 0}
              onClick={() => setStep(3)}
              className="gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
            >
              Continue to Date & Slot
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Select Date & Available Slot */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">3. Pick Date & Available Slot</h2>
              <p className="text-xs text-slate-500">
                Live specialist slots at <span className="font-bold text-slate-800">{selectedBusiness?.name}</span>
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-600" onClick={() => setStep(2)}>
              Change Treatments
            </Button>
          </div>

          {/* Quick Date Selector Chips */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Day
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {quickDates.map((qd) => {
                const isSelected = selectedDate === qd.iso;
                return (
                  <button
                    key={qd.iso}
                    type="button"
                    onClick={() => {
                      setSelectedDate(qd.iso);
                      setSelectedSlot("");
                    }}
                    className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-[10px] uppercase font-bold tracking-wider opacity-80">
                      {qd.label}
                    </span>
                    <span className="block text-xs font-extrabold mt-0.5">
                      {qd.dayNum}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Available Time Slots ({slots.filter((s) => s.available !== false).length})
              </label>
              <span className="text-[11px] text-slate-400">
                {formatDate(selectedDate)}
              </span>
            </div>

            {slotLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-11 rounded-xl" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="p-8 bg-slate-50 border border-slate-200/80 rounded-2xl text-center text-xs text-slate-500">
                No appointment slots available on this date. Please choose another day from above.
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
                      className={`h-11 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
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
            <p className="text-xs text-slate-500 mt-0.5">
              Please check your appointment timing and special requests before confirming.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <BusinessCover business={selectedBusiness} aspectRatio="banner" className="h-40 sm:h-48" />

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salon</span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedBusiness?.name}</h3>
                  <p className="text-xs text-slate-500">{selectedBusiness?.city || selectedBusiness?.address}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</span>
                  <p className="text-2xl font-black text-emerald-700">{formatCurrency(totalAmount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pb-4 border-b border-slate-100">
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
                <span className="text-xs font-semibold text-slate-500 block mb-2.5">Selected Treatments ({selectedServices.length}):</span>
                <div className="space-y-2.5">
                  {selectedServices.map((s) => (
                    <div key={s.id} className="flex justify-between items-center gap-3 text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ServiceImage service={s} size="sm" />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block truncate">{s.name}</span>
                          <span className="text-[11px] text-slate-400">{formatDuration(s.durationMinutes)}</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-900 shrink-0">{formatCurrency(s.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Special Notes / Preferences (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Preferred hair styling products, sensitive skin notes..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                />
              </div>
            </div>
          </div>

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

      {/* Step 5: Rewarding Booking Confirmation Screen */}
      {step === 5 && confirmedBooking && (
        <div className="space-y-6 pt-4 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/20 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Appointment Confirmed!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Your salon session has been locked in. We have sent confirmation details to your account.
            </p>
          </div>

          <Card className="max-w-md mx-auto p-6 text-left space-y-4 border-emerald-200 shadow-sm bg-white">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salon</span>
                <p className="font-bold text-slate-900 text-base">{selectedBusiness?.name}</p>
                <p className="text-xs text-slate-500">{selectedBusiness?.city || selectedBusiness?.address}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reference ID</span>
                <p className="font-mono font-bold text-xs text-emerald-700 mt-0.5">
                  #{confirmedBooking.id.slice(0, 8)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Date</span>
                <span className="font-bold text-slate-900">{formatDate(selectedDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Time</span>
                <span className="font-bold text-slate-900">{formatTime(selectedSlot)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-400 block mb-1.5">Treatments</span>
              {selectedServices.map((s) => (
                <div key={s.id} className="flex justify-between text-xs py-0.5">
                  <span className="text-slate-700 font-medium">{s.name}</span>
                  <span className="font-bold text-slate-900">{formatCurrency(s.price)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Estimated Total</span>
              <span className="text-base font-black text-emerald-700">{formatCurrency(totalAmount)}</span>
            </div>
          </Card>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href={`/appointments/${confirmedBooking.id}`} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-bold gap-2 shadow-md shadow-emerald-700/20">
                View Appointment
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/home" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold">
                Back to Home
              </Button>
            </Link>
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