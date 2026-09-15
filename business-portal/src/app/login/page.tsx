"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/auth-context";
import { Store, Lock, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import NextLink from "next/link";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data);
      toast.success("Welcome back to your business portal!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setServerError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 mb-3">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">SalonSaaS Business</h1>
          <p className="text-sm text-slate-500 mt-1">
            Owner portal for salons, barbers, and car wash businesses
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xs">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Sign in to your salon</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Access your appointments, live queue, staff, and services.
            </p>
          </div>

          {serverError && (
            <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Owner Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="owner@mysalon.com"
                  {...register("email")}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
              {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="��������"
                  {...register("password")}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
              {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>}
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full h-10 mt-2 font-medium">
              Sign In to Business Portal
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Need to register a new salon?{" "}
            <NextLink href="/register" className="font-semibold text-emerald-600 hover:underline">
              Register your business
            </NextLink>
          </div>
        </div>
      </div>
    </div>
  );
}
