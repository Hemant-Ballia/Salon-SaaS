"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessLayout } from "@/components/layout/business-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { updateBusinessApi } from "@/lib/api/business";
import { Store, Mail, Phone, MapPin, Clock, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const businessSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

export default function BusinessProfilePage() {
  const { business, refreshBusiness } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: "",
      description: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
    },
  });

  useEffect(() => {
    if (business) {
      reset({
        name: business.name || "",
        description: business.description || "",
        phone: business.phone || "",
        email: business.email || "",
        address: business.address || "",
        city: business.city || "",
        state: business.state || "",
        postalCode: business.postalCode || "",
      });
    }
  }, [business, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: BusinessFormData) => {
      if (!business?.id) throw new Error("No business loaded");
      return updateBusinessApi(business.id, data);
    },
    onSuccess: async () => {
      toast.success("Business profile updated successfully!");
      await refreshBusiness();
      queryClient.invalidateQueries({ queryKey: ["business"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to update business.";
      toast.error(msg);
    },
  });

  const onSubmit = (data: BusinessFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <BusinessLayout title="Business Profile">
      <div className="space-y-6 max-w-4xl">
        {/* Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Store className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900">{business?.name || "My Business"}</h2>
                <StatusBadge status={business?.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Public Slug: <span className="font-mono text-slate-700">/{business?.slug}</span> � Type:{" "}
                <span className="font-semibold text-slate-700">{business?.businessType?.replace(/_/g, " ")}</span>
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 text-right">
            <div>Tenant ID</div>
            <div className="font-mono text-[11px] text-slate-700">{business?.id}</div>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Public salon details visible to customers on booking links and QR codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  {...register("name")}
                  className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Description / Bio
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell clients about your salon, specialties, and experience..."
                  {...register("description")}
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Contact Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      {...register("email")}
                      className="h-9.5 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      {...register("phone")}
                      className="h-9.5 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Street Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    {...register("address")}
                    className="h-9.5 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    {...register("city")}
                    className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    {...register("state")}
                    className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    {...register("postalCode")}
                    className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting || updateMutation.isPending}
                  disabled={!isDirty}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </BusinessLayout>
  );
}
