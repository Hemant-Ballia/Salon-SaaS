"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { createBusinessApi, CreateBusinessInput } from "@/lib/api/admin";
import { Business, BusinessType } from "@/types/models";
import { getErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";
import {
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldAlert,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react";
import NextLink from "next/link";

const BUSINESS_TYPE_OPTIONS: Array<{ value: BusinessType; label: string }> = [
  { value: "SALON", label: "Salon & Hair Studio" },
  { value: "BEAUTY_PARLOUR", label: "Beauty Parlour & Makeup" },
  { value: "BARBER", label: "Barber Shop & Grooming" },
  { value: "CAR_WASH", label: "Car Wash & Detailing" },
  { value: "OTHER", label: "Other Multi-Service Venue" },
];

export default function NewBusinessPage() {
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [formData, setFormData] = useState<CreateBusinessInput>({
    name: "",
    ownerName: "",
    businessType: "SALON",
    description: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "IN",
    pincode: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [createdResult, setCreatedResult] = useState<{
    business: Business;
    owner?: { id: string; name?: string; email: string };
    temporaryPassword?: string;
  } | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllCredentials = () => {
    if (!createdResult) return;
    const loginUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:3001/login`
        : "http://localhost:3001/login";
    const text = [
      `=== Salon SaaS Business Credentials ===`,
      `Business: ${createdResult.business.name}`,
      `Portal URL: ${loginUrl}`,
      `Login Email: ${createdResult.owner?.email || createdResult.business.email || ""}`,
      `Temporary Password: ${createdResult.temporaryPassword || "N/A"}`,
      `Note: You must change your temporary password on first login.`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopiedField("all");
    toast.success("All credentials copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const mutation = useMutation({
    mutationFn: (input: CreateBusinessInput) => createBusinessApi(input),
    onSuccess: (data) => {
      toast.success(`Business "${data.business.name}" registered successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "businesses"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "recent-activity"] });
      setCreatedResult(data);
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err) || "Failed to register business.";
      toast.error(msg);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        errors.name = "Business name is required.";
      } else if (formData.name.trim().length < 2) {
        errors.name = "Business name must be at least 2 characters.";
      }

      if (formData.phone) {
        const cleanPhone = formData.phone.replace(/[\s-]/g, "");
        if (!cleanPhone.startsWith("+") && !/^\d{10}$/.test(cleanPhone)) {
          errors.phone = "Phone should be in E.164 format (+919876543210) or 10 digits.";
        }
      }
    }

    if (step === 2) {
      if (!formData.email?.trim()) {
        errors.email = "Owner email is required for login credentials.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errors.email = "Please enter a valid email address.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev));
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) {
      toast.error("Please fill in required fields before submitting.");
      return;
    }

    let normalizedPhone = formData.phone?.trim() || undefined;
    if (normalizedPhone) {
      const cleaned = normalizedPhone.replace(/[\s-]/g, "");
      if (/^\d{10}$/.test(cleaned)) {
        normalizedPhone = `+91${cleaned}`;
      } else {
        normalizedPhone = cleaned;
      }
    }

    const payload: CreateBusinessInput = {
      name: formData.name.trim(),
      ownerName: formData.ownerName?.trim() || undefined,
      businessType: formData.businessType,
      description: formData.description?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      phone: normalizedPhone,
      address: formData.address?.trim() || undefined,
      city: formData.city?.trim() || undefined,
      state: formData.state?.trim() || undefined,
      country: formData.country?.trim() || "IN",
      pincode: formData.pincode?.trim() || undefined,
    };

    mutation.mutate(payload);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      ownerName: "",
      businessType: "SALON",
      description: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "IN",
      pincode: "",
    });
    setFormErrors({});
    setCreatedResult(null);
    setCurrentStep(1);
    setShowPassword(false);
  };

  const loginPortalUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:3001/login`
      : "http://localhost:3001/login";

  return (
    <AdminLayout title="Register Business">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {createdResult ? (
          /* ========================================================
             SCREEN 5: BUSINESS REGISTERED & CREDENTIALS CONFIRMATION
             ======================================================== */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
            {/* Header Badge */}
            <div className="text-center max-w-md mx-auto space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Business Registered Successfully!
              </h2>
              <p className="text-xs text-slate-500">
                The business account has been initialized in <span className="font-semibold text-emerald-700">ACTIVE</span> status with tenant database partitioning and access control.
              </p>
            </div>

            {/* Entity Summary */}
            <div className="bg-slate-50 rounded-xl border border-slate-200/70 p-4.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Business Entity Details
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {createdResult.business.businessType}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Business Name</span>
                  <span className="font-bold text-slate-900">{createdResult.business.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Unique Slug / Domain</span>
                  <span className="font-mono text-slate-700">/{createdResult.business.slug}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Location</span>
                  <span className="text-slate-700">
                    {createdResult.business.city ? `${createdResult.business.city}, ${createdResult.business.state || ""}` : "Unspecified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Generated Access Credentials Panel */}
            <div className="bg-white rounded-xl border-2 border-emerald-500/30 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Business Portal Access Credentials
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Provide these credentials to the business owner for initial onboarding.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAllCredentials}
                  className="h-8 px-3 text-xs font-semibold border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 cursor-pointer gap-1.5"
                >
                  {copiedField === "all" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Copied All!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy All Credentials
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Login Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-9.5 px-3.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 flex items-center select-all">
                      {createdResult.owner?.email || createdResult.business.email}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          createdResult.owner?.email || createdResult.business.email || "",
                          "Login Email"
                        )
                      }
                      className="h-9.5 px-3.5 text-xs text-slate-700 cursor-pointer gap-1.5 shrink-0"
                    >
                      {copiedField === "Login Email" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copy Email
                    </Button>
                  </div>
                </div>

                {/* Temporary Password Field */}
                {createdResult.temporaryPassword && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Server-Generated Temporary Password
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-9.5 px-3.5 rounded-lg bg-emerald-50/60 border border-emerald-300 font-mono text-xs font-bold text-slate-900 flex items-center justify-between select-all">
                        <span>
                          {showPassword
                            ? createdResult.temporaryPassword
                            : "••••••••••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            createdResult.temporaryPassword || "",
                            "Temporary Password"
                          )
                        }
                        className="h-9.5 px-3.5 text-xs border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold cursor-pointer gap-1.5 shrink-0"
                      >
                        {copiedField === "Temporary Password" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        Copy Password
                      </Button>
                    </div>
                  </div>
                )}

                {/* Login Portal URL */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Business Portal Login URL
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-9.5 px-3.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 flex items-center select-all truncate">
                      {loginPortalUrl}
                    </div>
                    <a
                      href={loginPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9.5 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Portal
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Callout */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/90 border border-amber-200/90">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Security Notice:</span> This temporary password is only displayed here once and is securely hashed using bcrypt in PostgreSQL. The business owner must change it upon their first login before gaining access to their management dashboard.
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                + Register Another Business
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <NextLink href="/businesses" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto h-9 px-4 text-xs font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  >
                    Back to Business Directory
                  </Button>
                </NextLink>
                <NextLink
                  href={`/businesses/${createdResult.business.id}`}
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto h-9 px-5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer gap-1.5"
                  >
                    View Business 360 Profile
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </NextLink>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             SCREEN 4: REGISTER NEW BUSINESS - 4-STEP WIZARD
             ======================================================== */
          <div className="space-y-6">
            {/* Step Progress Tracker */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { step: 1, label: "Business Info" },
                  { step: 2, label: "Owner Account" },
                  { step: 3, label: "Location & Detail" },
                  { step: 4, label: "Review & Provision" },
                ].map((s) => {
                  const isActive = currentStep === s.step;
                  const isDone = currentStep > s.step;
                  return (
                    <div
                      key={s.step}
                      className={`flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-xl border transition-all ${
                        isActive
                          ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold"
                          : isDone
                          ? "bg-slate-50 border-slate-200 text-slate-700"
                          : "bg-transparent border-transparent text-slate-400"
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : isDone
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isDone ? <Check className="h-3.5 w-3.5" /> : s.step}
                      </div>
                      <div className="text-center sm:text-left min-w-0">
                        <div className="text-[11px] font-semibold truncate">{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Container */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-7 space-y-6">
              {/* STEP 1: BUSINESS INFORMATION */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900">Step 1: Business Profile</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enter the commercial title, category, and public contact information.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Business Trading Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Royal Crown Salon & Luxury Spa"
                        className={`h-10.5 w-full rounded-lg border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                          formErrors.name
                            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                            : "border-slate-200 bg-white focus:border-emerald-500 focus:ring-emerald-500/20"
                        }`}
                      />
                      {formErrors.name && (
                        <p className="text-xs font-medium text-rose-600">{formErrors.name}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Business Category <span className="text-rose-500">*</span>
                      </label>
                      <Select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        options={BUSINESS_TYPE_OPTIONS}
                        className="h-10.5 w-full rounded-lg border-slate-200 shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        Customer Contact Phone
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+919876543210 or 10-digit mobile"
                        className={`h-10.5 w-full rounded-lg border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                          formErrors.phone
                            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                            : "border-slate-200 bg-white focus:border-emerald-500 focus:ring-emerald-500/20"
                        }`}
                      />
                      {formErrors.phone && (
                        <p className="text-xs font-medium text-rose-600">{formErrors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: OWNER ACCOUNT & LOGIN PROVISIONING */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900">
                      Step 2: Business Owner Account
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Provide the owner&apos;s primary login email. The backend will automatically generate a secure 14-character temporary password and assign the BUSINESS role.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Owner Full Name
                      </label>
                      <input
                        type="text"
                        name="ownerName"
                        value={formData.ownerName || ""}
                        onChange={handleChange}
                        placeholder="e.g. Anand Sharma"
                        className="h-10.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        Business Login Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="owner@royal-salon.com"
                        className={`h-10.5 w-full rounded-lg border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                          formErrors.email
                            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                            : "border-slate-200 bg-white focus:border-emerald-500 focus:ring-emerald-500/20"
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-xs font-medium text-rose-600">{formErrors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <Sparkles className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">Automated Provisioning:</span> The owner will receive role permissions for store management, staff scheduling, and point-of-sale services. They will be mandated to change their password upon their first login.
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: LOCATION & DETAILS */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900">
                      Step 3: Location & Physical Address
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Provide the salon&apos;s physical venue address for geolocation and local customer searches.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Street Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Shop No. 4, 1st Floor, High Street Mall"
                        className="h-10.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="e.g. Mumbai"
                        className="h-10.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="e.g. Maharashtra"
                        className="h-10.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Postal Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="e.g. 400050"
                        className="h-10.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="IN"
                        className="h-10.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Description & Salon Specialties (Optional)
                      </label>
                      <textarea
                        name="description"
                        rows={2}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Brief overview of salon services, premium treatments, and highlights..."
                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & PROVISION */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900">
                      Step 4: Review Details & Confirm Provisioning
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify all registration details before creating the tenant account.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                        Business Details
                      </div>
                      <div className="text-sm font-bold text-slate-900">{formData.name}</div>
                      <div className="text-xs text-slate-600">Category: {formData.businessType}</div>
                      <div className="text-xs text-slate-600">Phone: {formData.phone || "None"}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                        Owner & Credentials
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {formData.ownerName || "Default Store Owner"}
                      </div>
                      <div className="text-xs text-slate-600">Login Email: {formData.email}</div>
                      <div className="text-xs text-emerald-700 font-semibold">
                        Role: BUSINESS (Active)
                      </div>
                    </div>

                    <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                        Location
                      </div>
                      <div className="text-xs text-slate-700">
                        {formData.address ? `${formData.address}, ` : ""}
                        {formData.city ? `${formData.city}, ` : ""}
                        {formData.state ? `${formData.state} ` : ""}
                        {formData.pincode || ""}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Navigation Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                    className="h-9 px-4 text-xs font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </Button>
                ) : (
                  <NextLink href="/businesses">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 text-xs font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs"
                    >
                      Cancel
                    </Button>
                  </NextLink>
                )}

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleNext}
                    className="h-9 px-5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-sm gap-1.5 cursor-pointer text-white"
                  >
                    Next
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleFinalSubmit}
                    isLoading={mutation.isPending}
                    className="h-9 px-5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-sm gap-1.5 cursor-pointer text-white"
                  >
                    <Building2 className="h-4 w-4" />
                    Create Business & Generate Password
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
