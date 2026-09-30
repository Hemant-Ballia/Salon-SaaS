"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { generateBusinessQrApi, generateServiceQrApi } from "@/lib/api/qr";
import { getServicesApi } from "@/lib/api/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  QrCode as QrIcon, 
  Download, 
  Printer, 
  Sparkles, 
  ExternalLink,
  Store,
  Scissors,
  Info,
} from "lucide-react";

export default function QrManagementPage() {
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [businessQr, setBusinessQr] = useState<{ qrImage?: string; targetUrl?: string } | null>(null);
  const [serviceQr, setServiceQr] = useState<{ qrImage?: string; targetUrl?: string } | null>(null);

  const { data: servicesData } = useQuery({
    queryKey: ["services-list-for-qr"],
    queryFn: () => getServicesApi({ isActive: "true" }),
  });

  const businessQrMutation = useMutation({
    mutationFn: generateBusinessQrApi,
    onSuccess: (data: any) => {
      setBusinessQr(data);
      toast.success("Business QR generated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to generate business QR");
    },
  });

  const serviceQrMutation = useMutation({
    mutationFn: (svcId: string) => generateServiceQrApi(svcId),
    onSuccess: (data: any) => {
      setServiceQr(data);
      toast.success("Service QR generated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to generate service QR");
    },
  });

  const handlePrint = (qrImgUrl: string, title: string) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; text-align: center; background: #fff; }
            img { width: 280px; height: 280px; margin: 20px 0; border: 2px solid #f1f5f9; border-radius: 16px; padding: 12px; }
            h1 { color: #0f172a; font-size: 22px; margin-bottom: 4px; }
            p { color: #64748b; font-size: 13px; max-width: 320px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <h1>Scan to Book & Check-in</h1>
          <p>${title}</p>
          <img src="${qrImgUrl}" alt="QR Code" />
          <p>Point your smartphone camera at the QR code to join the queue or book an appointment.</p>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const servicesList = servicesData?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">QR Code Station</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate printable QR codes for customer self-checkin, walk-in queueing, and direct bookings.
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>How it works:</strong> Place the Business QR at your reception desk. Customers scan it to view your live queue, self-checkin, or book an appointment — no app required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Storefront QR */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Store className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Business Storefront QR</CardTitle>
                <p className="text-[11px] text-slate-400 mt-0.5">For reception desk & entrance</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Customers scan to see your live queue and book an appointment instantly.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center flex-1">
            {businessQr?.qrImage ? (
              <div className="space-y-5 w-full">
                {/* QR Code Display */}
                <div className="inline-flex flex-col items-center">
                  <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                    <img
                      src={businessQr.qrImage}
                      alt="Business Storefront QR"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  {businessQr.targetUrl && (
                    <a
                      href={businessQr.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Preview booking page
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <a
                    href={businessQr.qrImage}
                    download="business-qr.png"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PNG
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5 rounded-xl"
                    onClick={() => handlePrint(businessQr.qrImage!, "Business Check-in QR")}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Signage
                  </Button>
                </div>

                <button
                  onClick={() => {
                    setBusinessQr(null);
                    businessQrMutation.mutate();
                  }}
                  className="text-[11px] text-slate-400 hover:text-emerald-600 transition"
                >
                  Regenerate QR →
                </button>
              </div>
            ) : (
              <div className="py-10 space-y-5">
                <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
                  <QrIcon className="w-10 h-10 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800">Generate Storefront QR</p>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Creates a dynamic QR linked to your live business profile and real-time queue.
                  </p>
                </div>
                <Button
                  onClick={() => businessQrMutation.mutate()}
                  isLoading={businessQrMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Business QR
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service-Specific QR */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Scissors className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Service Direct Booking QR</CardTitle>
                <p className="text-[11px] text-slate-400 mt-0.5">For promotions & service menus</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Links directly to a specific service booking page — ideal for promotional materials.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col p-6 flex-1">
            <div className="space-y-3 mb-5">
              <label className="block text-xs font-semibold text-slate-700">
                Select Service
              </label>
              <Select
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value);
                  setServiceQr(null);
                }}
                options={[
                  { value: "", label: "Choose a service..." },
                  ...servicesList.map((s) => ({ value: s.id, label: `${s.name} — ₹${s.price}` })),
                ]}
              />
              <Button
                disabled={!selectedServiceId}
                onClick={() => serviceQrMutation.mutate(selectedServiceId)}
                isLoading={serviceQrMutation.isPending}
                className="w-full gap-2 rounded-xl"
                variant="outline"
              >
                <Sparkles className="w-4 h-4" />
                Generate Service QR
              </Button>
            </div>

            {serviceQr?.qrImage && (
              <div className="flex flex-col items-center space-y-4 pt-5 border-t border-slate-100 flex-1 justify-center">
                <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                  <img
                    src={serviceQr.qrImage}
                    alt="Service QR"
                    className="w-44 h-44 object-contain"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <a
                    href={serviceQr.qrImage}
                    download="service-qr.png"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5 rounded-xl"
                    onClick={() => handlePrint(serviceQr.qrImage!, "Service Direct Booking QR")}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </Button>
                </div>
              </div>
            )}

            {!serviceQr?.qrImage && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                    <QrIcon className="w-7 h-7 text-blue-300" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Select a service above to generate its QR code
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}