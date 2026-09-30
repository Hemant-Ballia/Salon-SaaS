"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/auth-context";
import { Store, Lock, Mail, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50/80 px-4 py-8 sm:px-6">
      <div className="w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/25">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            SalonSaaS Business
          </h1>
          <p className="mt-1 text-xs font-medium tracking-wide text-slate-500">
            Business Owner Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm shadow-slate-900/5">
          <div className="mb-6">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to manage your salon business.
            </p>
          </div>

          {serverError && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed">{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="owner-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Owner Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="owner-email"
                  type="email"
                  autoComplete="email"
                  placeholder="owner@mysalon.com"
                  {...register("email")}
                  className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                    errors.email
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register("password")}
                  className={`h-11 w-full rounded-lg border bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                    errors.password
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full h-11 text-sm font-semibold shadow-sm shadow-emerald-600/25 mt-2"
            >
              Sign in to Business Portal
            </Button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
            Need to register a new salon?{" "}
            <NextLink
              href="/register"
              className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
            >
              Register your business
            </NextLink>
          </div>
        </div>

        {/* Security Indicator */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Secure business workspace</span>
        </div>
      </div>
    </div>
  );
}
