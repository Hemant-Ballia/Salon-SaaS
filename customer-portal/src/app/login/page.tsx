"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Store, Mail, Lock, ShieldCheck, Clock, Radio } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please provide both email and password");
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Brand Visual Panel (Desktop) */}
        <div className="hidden md:flex md:col-span-5 bg-slate-900 p-8 text-white flex-col justify-between border-r border-slate-800">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <Store className="w-4.5 h-4.5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                Salon<span className="text-emerald-400">Direct</span>
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight leading-snug">
                Book appointments and track your queue in real time.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect directly with salons, barbers, and spas. Select your service, choose your specialist, and confirm in seconds.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified salons and treatment pricing</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant appointment confirmation</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Live floor queue position updates</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-400">
            SalonDirect Platform
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <div className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white mb-3">
                <Store className="h-4.5 w-4.5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Welcome back
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your account email and password to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3.5 h-10 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 h-10 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer h-10.5 rounded-lg"
                  isLoading={isLoading}
                >
                  Sign In
                </Button>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}