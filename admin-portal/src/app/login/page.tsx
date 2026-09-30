"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/auth-context";
import { getErrorMessage } from "@/lib/api/client";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@salonsaas.dev",
      password: "Password@123",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data);
      toast.success("Welcome back, Administrator!");
    } catch (err: unknown) {
      const message =
        getErrorMessage(err) || "Failed to authenticate. Please check your credentials.";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans antialiased text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* LEFT PANEL: Architectural Visual (50% desktop, reduces on tablet, hidden on mobile) */}
      <div className="hidden md:relative md:flex md:w-[45%] lg:w-1/2 flex-col justify-between p-10 lg:p-14 xl:p-16 bg-zinc-950 overflow-hidden select-none shrink-0">
        <Image
          src="/images/salon-admin-visual.jpg"
          alt="Modern luxury salon workspace"
          fill
          priority
          sizes="(max-width: 1024px) 45vw, 50vw"
          className="object-cover object-center"
        />
        {/* Subtle, restrained scrim to ensure text legibility while letting photography shine */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/35 pointer-events-none" />

        {/* Top Brand Mark */}
        <div className="relative z-10">
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-white drop-shadow-sm">
            SalonSaaS
          </span>
        </div>

        {/* Bottom Minimal Supporting Text */}
        <div className="relative z-10 max-w-sm pb-2">
          <p className="text-[13px] font-normal text-white/80 leading-relaxed tracking-normal drop-shadow-sm">
            Manage your salon from one place.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: Focused Production Authentication Interface */}
      <div className="w-full md:w-[55%] lg:w-1/2 flex flex-col justify-between min-h-screen px-6 py-8 sm:px-10 sm:py-12 md:px-12 md:py-14 lg:px-16 xl:px-24 bg-white">
        {/* Top Header - Mobile Brand Mark */}
        <div className="w-full max-w-sm mx-auto flex items-center md:hidden pt-2 pb-4">
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-900">
            SalonSaaS
          </span>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-sm mx-auto my-auto py-6">
          <div className="space-y-1 mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-500 font-normal">
              Sign in to your admin account.
            </p>
          </div>

          {serverError && (
            <div
              role="alert"
              className="mb-6 rounded-md bg-red-50 border border-red-200/80 p-3 text-xs text-red-800 flex items-start gap-2.5"
            >
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-zinc-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@salonsaas.dev"
                aria-invalid={errors.email ? "true" : "false"}
                {...register("email")}
                className={`w-full h-10 px-3 rounded-md border text-sm text-zinc-900 placeholder:text-zinc-400 bg-white transition-colors focus:outline-none focus:ring-1 ${
                  errors.email
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                    : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900 hover:border-zinc-400"
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-zinc-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  aria-invalid={errors.password ? "true" : "false"}
                  {...register("password")}
                  className={`w-full h-10 pl-3 pr-10 rounded-md border text-sm text-zinc-900 placeholder:text-zinc-400 bg-white transition-colors focus:outline-none focus:ring-1 ${
                    errors.password
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900 hover:border-zinc-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 focus:outline-none transition-colors p-1 cursor-pointer"
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
                <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer accent-zinc-900"
                />
                <span className="text-xs text-zinc-600">Remember me</span>
              </label>
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-md bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Bottom Spacer */}
        <div className="w-full max-w-sm mx-auto pt-4" />
      </div>
    </div>
  );
}