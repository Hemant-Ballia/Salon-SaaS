"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getServiceByIdApi, updateServiceApi } from "@/lib/api/services";
import { useAuth } from "@/context/auth-context";
import { getStaffListApi } from "@/lib/api/staff";
import {
  listStaffServicePricesApi,
  setStaffServicePriceApi,
  deleteStaffServicePriceApi,
} from "@/lib/api/compensation";
import { Staff, StaffServicePrice } from "@/types/models";
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

      {/* Staff-Specific Pricing Overrides */}
      <StaffPricingOverridesSection serviceId={serviceId} basePrice={Number(price || 0)} />
    </div>
  );
}

function StaffPricingOverridesSection({
  serviceId,
  basePrice,
}: {
  serviceId: string;
  basePrice: number;
}) {
  const { business } = useAuth();
  const queryClient = useQueryClient();
  const businessId = business?.id;

  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [overridePrice, setOverridePrice] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["staff-service-prices", businessId, serviceId],
    queryFn: () => listStaffServicePricesApi(businessId!, serviceId),
    enabled: !!businessId && !!serviceId,
  });

  const { data: staffData } = useQuery({
    queryKey: ["staff", businessId],
    queryFn: () => getStaffListApi({ limit: 100 }),
    enabled: !!businessId,
  });

  const setOverrideMutation = useMutation({
    mutationFn: (payload: { staffId: string; price: number }) =>
      setStaffServicePriceApi(businessId!, serviceId, payload.staffId, {
        price: payload.price,
        isActive: true,
      }),
    onSuccess: () => {
      toast.success("Staff price override saved successfully");
      setSelectedStaffId("");
      setOverridePrice("");
      queryClient.invalidateQueries({
        queryKey: ["staff-service-prices", businessId, serviceId],
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to set staff price");
    },
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: (staffId: string) =>
      deleteStaffServicePriceApi(businessId!, serviceId, staffId),
    onSuccess: () => {
      toast.success("Staff override removed. Base price will apply.");
      queryClient.invalidateQueries({
        queryKey: ["staff-service-prices", businessId, serviceId],
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to remove override");
    },
  });

  const handleAddOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !overridePrice) {
      toast.error("Please select a staff member and specify an override price.");
      return;
    }
    setOverrideMutation.mutate({
      staffId: selectedStaffId,
      price: Number(overridePrice),
    });
  };

  const availableStaff = staffData?.data?.filter(
    (s: Staff) => !data?.overrides?.some((ov: StaffServicePrice) => ov.staffId === s.id)
  );

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-emerald-600" />
              Staff-Specific Pricing
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Configure custom rates for specific team members (e.g. senior stylists). If unconfigured, the base price of ₹{basePrice} is automatically charged.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
            Base: ₹{basePrice}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Form to add override */}
        <form onSubmit={handleAddOverride} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Set Staff Price Override
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a staff member...</option>
                {availableStaff?.map((s: Staff) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName} ({s.designation || "Staff"})
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Override price"
                value={overridePrice}
                onChange={(e) => setOverridePrice(e.target.value)}
                className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={setOverrideMutation.isPending || !selectedStaffId || !overridePrice}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4"
            >
              {setOverrideMutation.isPending ? "Saving..." : "Apply Price Override"}
            </Button>
          </div>
        </form>

        {/* Existing Overrides Table */}
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : data?.overrides?.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">
            No staff overrides configured yet. All staff charge the default base price of ₹{basePrice}.
          </p>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3 text-right">Custom Price</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.overrides?.map((ov: StaffServicePrice) => (
                  <tr key={ov.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {ov.staff?.displayName || "Staff Member"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {ov.staff?.designation || "Staff"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700 text-sm">
                      ₹{Number(ov.price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteOverrideMutation.mutate(ov.staffId)}
                        disabled={deleteOverrideMutation.isPending}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 px-2"
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}