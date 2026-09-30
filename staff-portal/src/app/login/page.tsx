"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Scissors, Mail, Lock, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      toast.success("Welcome back to your workspace!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs mb-1">
            <Scissors className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Staff Workspace
          </h1>
          <p className="text-xs text-slate-500">
            Sign in to access your appointments, live queue & daily schedule
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xs border-slate-200/80 bg-white">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Staff Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="specialist@salon.com"
                    className="w-full pl-10 pr-3.5 h-10 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 bg-white transition-colors"
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
                    className="w-full pl-10 pr-3.5 h-10 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 bg-white transition-colors"
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
                  Sign In to Workspace
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Restricted to authorized salon staff & specialists</span>
        </div>
      </div>
    </div>
  );
}