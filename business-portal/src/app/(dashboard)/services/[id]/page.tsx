"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getServiceByIdApi, updateServiceApi } from "@/lib/api/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { ArrowLeft, Save, Scissors } from "lucide-react";

export default function ServiceEditPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: service, isLoading, error } = useQuery({
    queryKey: ["service-detail", serviceId],
    queryFn: () => getServiceByIdApi(serviceId),
    enabled: !!serviceId,
  });

  useEffect(() => {
    if (service) {
      setName(service.name || "");
      setDescription(service.description || "");
      setPrice(service.price ? String(service.price) : "0");
      setDurationMinutes(service.durationMinutes ? String(service.durationMinutes) : "30");
      setCategory(service.category || "General");
      setIsActive(service.isActive ?? true);
    }
  }, [service]);

  const updateMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      description?: string;
      price: number;
      durationMinutes: number;
      category?: string;
      isActive: boolean;
    }) => updateServiceApi(serviceId, payload),
    onSuccess: () => {
      toast.success("Service updated successfully");
      queryClient.invalidateQueries({ queryKey: ["service-detail", serviceId] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      router.push("/services");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update service");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !durationMinutes) {
      toast.error("Please fill in all required fields");
      return;
    }
    updateMutation.mutate({
      name,
      description: description || undefined,
      price: parseFloat(price),
      durationMinutes: parseInt(durationMinutes, 10),
      category: category || "General",
      isActive,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <ErrorState
        title="Service not found"
        description="The service you are trying to edit does not exist."
        onRetry={() => router.push("/services")}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back button */}
      <div>
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-emerald-600" />
            Edit Service Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Service Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Price (INR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Duration (Minutes) *
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="edit-is-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="edit-is-active" className="text-sm font-medium text-slate-700 cursor-pointer">
                Active and available for customer bookings
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/services")}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending} className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}