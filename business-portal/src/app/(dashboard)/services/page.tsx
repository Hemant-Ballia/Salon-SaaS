"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getServicesApi, 
  createServiceApi, 
  updateServiceStatusApi, 
  deleteServiceApi 
} from "@/lib/api/services";
import { Service } from "@/types/models";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { 
  Scissors, 
  Plus, 
  Clock, 
  Edit, 
  Trash2, 
  Power, 
  Tag
} from "lucide-react";

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [category, setCategory] = useState("General");
  const [isActive, setIsActive] = useState(true);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["services", statusFilter],
    queryFn: () => getServicesApi({
      isActive: statusFilter === "ALL" ? undefined : statusFilter === "ACTIVE" ? "true" : "false",
    }),
  });

  const createMutation = useMutation({
    mutationFn: createServiceApi,
    onSuccess: () => {
      toast.success("Service created successfully");
      setIsAddModalOpen(false);
      setName("");
      setDescription("");
      setPrice("");
      setDurationMinutes("30");
      setCategory("General");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create service");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateServiceStatusApi(id, active),
    onSuccess: () => {
      toast.success("Service status updated");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update service status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteServiceApi,
    onSuccess: () => {
      toast.success("Service deleted");
      setServiceToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete service");
    },
  });

  const services = (data?.data || []).filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q)
    );
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !durationMinutes) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      name,
      description: description || undefined,
      price: parseFloat(price),
      durationMinutes: parseInt(durationMinutes, 10),
      category: category || "General",
      isActive,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Services Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure your offerings, durations, pricing, and active status.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Service
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search services by title or category..."
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "ACTIVE", label: "Active Services" },
                { value: "INACTIVE", label: "Inactive Services" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load services"
          description="Could not reach the server. Please check that the backend is up."
          onRetry={() => refetch()}
        />
      ) : services.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="No services found"
          description={
            search || statusFilter !== "ALL"
              ? "No services match your filters. Try clearing your search query."
              : "Start by adding treatments, haircuts, or packages to your business catalog."
          }
          action={
            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create First Service
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((svc) => (
            <Card key={svc.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    <Tag className="w-3 h-3" />
                    {svc.category || "General"}
                  </span>
                  <Badge variant={svc.isActive ? "success" : "neutral"}>
                    {svc.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <h3 className="font-semibold text-base text-slate-900 line-clamp-1 mb-1">
                  {svc.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 min-h-8 mb-4">
                  {svc.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-sm">
                  <div className="flex items-center gap-1 text-slate-600 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDuration(svc.durationMinutes)}
                  </div>
                  <div className="text-base font-bold text-emerald-700">
                    {formatCurrency(svc.price)}
                  </div>
                </div>
              </CardContent>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    statusMutation.mutate({ id: svc.id, active: !svc.isActive })
                  }
                  className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    svc.isActive
                      ? "text-amber-600 hover:text-amber-700"
                      : "text-emerald-600 hover:text-emerald-700"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {svc.isActive ? "Disable" : "Enable"}
                </button>

                <div className="flex items-center gap-1">
                  <Link href={`/services/${svc.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600">
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                    onClick={() => setServiceToDelete(svc)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Service Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Service"
        description="Configure details, duration, and pricing for this offering."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Service Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Deluxe Haircut & Wash"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                placeholder="499.00"
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
              placeholder="Hair, Skin, Spa, Nails, Treatment..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is included in this service..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="is-active" className="text-sm font-medium text-slate-700 cursor-pointer">
              Set active immediately for online booking
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Service
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!serviceToDelete}
        title="Delete Service"
        description={`Are you sure you want to delete "${serviceToDelete?.name}"? Existing appointments with this service will retain their records.`}
        confirmLabel="Delete Service"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (serviceToDelete) {
            deleteMutation.mutate(serviceToDelete.id);
          }
        }}
        onCancel={() => setServiceToDelete(null)}
      />
    </div>
  );
}