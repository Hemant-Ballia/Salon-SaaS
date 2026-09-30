"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { createBusinessApi, CreateBusinessInput } from "@/lib/api/admin";
import { Business, BusinessType } from "@/types/models";
import { getErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";
import {
  Building2,
  Store,
  MapPin,
  Mail,
  Phone,
  FileText,
  User,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldAlert,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import NextLink from "next/link";

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (business: Business) => void;
}

const BUSINESS_TYPE_OPTIONS: Array<{ value: BusinessType; label: string }> = [
  { value: "SALON", label: "Salon" },
  { value: "BEAUTY_PARLOUR", label: "Beauty Parlour" },
  { value: "BARBER", label: "Barber Shop" },
  { value: "CAR_WASH", label: "Car Wash" },
  { value: "OTHER", label: "Other" },
];

export const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

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
      onSuccess?.(data.business);
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err) || "Failed to create business.";
      toast.error(msg);
    },
  });

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
    setShowPassword(false);
    setCopiedField(null);
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      resetForm();
      onClose();
    }
  };

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

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Business name is required.";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Business name must be at least 2 characters.";
    }

    if (!formData.email?.trim()) {
      errors.email = "Business email is required to create owner credentials.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (formData.phone) {
      const cleanPhone = formData.phone.replace(/[\s-]/g, "");
      if (!cleanPhone.startsWith("+") && !/^\d{10}$/.test(cleanPhone)) {
        errors.phone = "Phone should be in E.164 format (+919876543210) or 10 digits.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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

  const loginPortalUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:3001/login`
      : "http://localhost:3001/login";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdResult ? "Registration Successful" : "Register Business"}
      description={
        createdResult
          ? "The business has been activated and owner credentials generated."
          : "Create a new business account with automated owner credential provisioning."
      }
      maxWidth={createdResult ? "lg" : "xl"}
    >
      {createdResult ? (
        /* SCREEN 5: CREDENTIALS CONFIRMATION VIEW */
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Banner */}
            <div className="flex items-center gap-3 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200/80">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">
                  Business & Owner Account Provisioned
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Business is set to <span className="font-semibold">ACTIVE</span> status with tenant isolation enabled.
                </p>
              </div>
            </div>

            {/* Business Summary Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
              <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Registered Entity
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-slate-900">
                    {createdResult.business.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    ID: {createdResult.business.id}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {createdResult.business.businessType}
                </span>
              </div>
            </div>

            {/* Generated Credentials Box */}
            <div className="p-4 bg-white rounded-xl border-2 border-emerald-500/30 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Generated Access Credentials
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyAllCredentials}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                >
                  {copiedField === "all" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Copied All!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy All
                    </>
                  )}
                </button>
              </div>

              {/* Login Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">
                  Business Owner Login Email
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-9.5 px-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 flex items-center select-all">
                    {createdResult.owner?.email || createdResult.business.email}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        createdResult.owner?.email || createdResult.business.email || "",
                        "Login Email"
                      )
                    }
                    className="h-9.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedField === "Login Email" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy
                  </button>
                </div>
              </div>

              {/* Temporary Password */}
              {createdResult.temporaryPassword && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">
                    Temporary Generated Password
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-9.5 px-3 rounded-lg bg-emerald-50/50 border border-emerald-300/60 font-mono text-xs font-bold text-slate-900 flex items-center justify-between select-all">
                      <span>
                        {showPassword
                          ? createdResult.temporaryPassword
                          : "••••••••••••••••"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          createdResult.temporaryPassword || "",
                          "Temporary Password"
                        )
                      }
                      className="h-9.5 px-3 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedField === "Temporary Password" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Portal URL */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">
                  Business Portal URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-9.5 px-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 flex items-center select-all truncate">
                    {loginPortalUrl}
                  </div>
                  <a
                    href={loginPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </a>
                </div>
              </div>
            </div>

            {/* Critical Security Warning */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Security Notice:</span> This temporary password is only displayed once. The business owner must change it upon their first login before accessing their dashboard.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/90">
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              + Register Another Business
            </button>
            <div className="flex items-center gap-2.5">
              <NextLink href={`/businesses/${createdResult.business.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  className="h-9 px-4 text-xs font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs gap-1.5"
                >
                  View Profile
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Button>
              </NextLink>
              <Button
                variant="primary"
                size="sm"
                onClick={handleClose}
                className="h-9 px-5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-sm cursor-pointer text-white"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* REGISTRATION FORM VIEW */
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Section 1: Business Details */}
            <div>
              <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-100">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                  <Store className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Business Information
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Business Name */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter business name (e.g. Royal Crown Salon & Spa)"
                    className={`h-10 w-full rounded-lg border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                      formErrors.name
                        ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                        : "border-slate-200 bg-white focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-xs font-medium text-rose-600 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Business Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Business Category <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    options={BUSINESS_TYPE_OPTIONS}
                    className="h-10 w-full rounded-lg border-slate-200 shadow-2xs"
                  />
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-slate-400" />
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+919876543210 or 10 digits"
                    className={`h-10 w-full rounded-lg border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                      formErrors.phone
                        ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                        : "border-slate-200 bg-white focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-xs font-medium text-rose-600 mt-1">{formErrors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Owner & Login Credentials Provisioning */}
            <div>
              <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-100">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Owner Account & Login Provisioning
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Owner Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Owner Full Name
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName || ""}
                    onChange={handleChange}
                    placeholder="e.g. Rajesh Sharma"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
                  />
                </div>

                {/* Owner Email / Login */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-slate-400" />
                    Business Login Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="owner@royal-salon.com"
                    className={`h-10 w-full rounded-lg border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                      formErrors.email
                        ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                        : "border-slate-200 bg-white focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
                  />
                  {formErrors.email ? (
                    <p className="text-xs font-medium text-rose-600 mt-1">{formErrors.email}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      The backend will automatically generate a secure temporary password for this email.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Location Details */}
            <div>
              <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-100">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Location & Address
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Street Address */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Street Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Shop No. 4, 1st Floor, High Street Mall"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
                  />
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Mumbai"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
                  />
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Maharashtra"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
                  />
                </div>

                {/* Pincode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="e.g. 400050"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="IN"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Description */}
            <div>
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Description & Notes (Optional)
                </span>
              </div>
              <textarea
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="Key services, specialties, salon amenities..."
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all resize-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="shrink-0 flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/90">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={mutation.isPending}
              className="h-9 px-4 text-xs font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={mutation.isPending}
              className="h-9 px-4.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-sm gap-1.5 cursor-pointer text-white"
            >
              <Building2 className="h-4 w-4" />
              Register Business & Generate Credentials
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
