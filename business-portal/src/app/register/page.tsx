"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/auth-context";
import { Store, Lock, Mail, User, Phone, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import NextLink from "next/link";

const registerSchema = z.object({
  name: z.string().min(2, "Owner name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  businessName: z.string().min(2, "Business name is required"),
  businessType: z.enum(["SALON", "BEAUTY_PARLOUR", "BARBER", "CAR_WASH", "OTHER"]),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { registerBusiness } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      businessName: "",
      businessType: "SALON",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerBusiness(data);
      toast.success("Business registered successfully! Welcome to SalonSaaS.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setServerError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md mb-2">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Register Your Business</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create your salon account and start managing appointments and queues
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          {serverError && (
            <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Owner Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    {...register("name")}
                    className="h-9.5 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm"
                  />
                </div>
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    {...register("phone")}
                    className="h-9.5 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Owner Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="owner@salon.com"
                    {...register("email")}
                    className="h-9.5 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm"
                  />
                </div>
                {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="��������"
                    {...register("password")}
                    className="h-9.5 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm"
                  />
                </div>
                {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-3">
                Business Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    placeholder="Elite Hair Studio"
                    {...register("businessName")}
                    className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  />
                  {errors.businessName && <p className="text-xs text-rose-600 mt-1">{errors.businessName.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Business Category
                  </label>
                  <select
                    {...register("businessType")}
                    className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
                  >
                    <option value="SALON">Salon & Spa</option>
                    <option value="BEAUTY_PARLOUR">Beauty Parlour</option>
                    <option value="BARBER">Barbershop</option>
                    <option value="CAR_WASH">Car Care / Wash</option>
                    <option value="OTHER">Other Appointment Service</option>
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Street Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="123 High Street, Suite 4"
                    {...register("address")}
                    className="h-9.5 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                <input
                  type="text"
                  placeholder="City"
                  {...register("city")}
                  className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                />
                <input
                  type="text"
                  placeholder="State"
                  {...register("state")}
                  className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                />
                <input
                  type="text"
                  placeholder="Postal Code"
                  {...register("postalCode")}
                  className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                />
              </div>
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full h-10 mt-4 font-medium">
              Create Business Account
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 pt-3">
            Already have an account?{" "}
            <NextLink href="/login" className="font-semibold text-emerald-600 hover:underline">
              Sign in
            </NextLink>
          </div>
        </div>
      </div>
    </div>
  );
}
