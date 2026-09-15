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
import { QrCode as QrIcon, Download, Printer, Sparkles, ExternalLink } from "lucide-react";

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
      toast.success("Business QR generated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to generate business QR");
    },
  });

  const serviceQrMutation = useMutation({
    mutationFn: (svcId: string) => generateServiceQrApi(svcId),
    onSuccess: (data: any) => {
      setServiceQr(data);
      toast.success("Service QR generated");
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
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; text-align: center; }
            img { width: 300px; height: 300px; margin: 20px 0; }
            h1 { margin-bottom: 4px; }
            p { color: #555; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>Scan to Check-in & Book</h1>
          <p>${title}</p>
          <img src="${qrImgUrl}" alt="QR Code" />
          <p>Point your smartphone camera at the QR code to join the line or book an appointment.</p>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const servicesList = servicesData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">QR Code Station</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate printable QR codes for customer self-checkin, walk-in queueing, and direct bookings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Storefront QR */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <QrIcon className="w-5 h-5 text-emerald-600" />
              Business Storefront QR Code
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Place this at your reception desk or entrance. Customers scan to see your live queue and book.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            {businessQr?.qrImage ? (
              <div className="space-y-4">
                <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-xs inline-block">
                  <img
                    src={businessQr.qrImage}
                    alt="Business Storefront QR"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                {businessQr.targetUrl && (
                  <p className="text-xs text-slate-500 break-all max-w-xs flex items-center justify-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {businessQr.targetUrl}
                  </p>
                )}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <a
                    href={businessQr.qrImage}
                    download="business-qr.png"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PNG
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5"
                    onClick={() => handlePrint(businessQr.qrImage!, "Business Check-in QR")}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Signage
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <QrIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800">Generate Storefront QR</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Creates a dynamic QR linked to your live business profile and queue system.
                  </p>
                </div>
                <Button
                  onClick={() => businessQrMutation.mutate()}
                  isLoading={businessQrMutation.isPending}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate QR
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specific Service QR */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <QrIcon className="w-5 h-5 text-blue-600" />
              Service-Specific Direct Booking QR
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Creates a QR code that directly selects a specific promotional service or package.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col p-6">
            <div className="space-y-4 mb-6">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select Service
              </label>
              <Select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                options={[
                  { value: "", label: "Choose a service..." },
                  ...servicesList.map((s) => ({ value: s.id, label: `${s.name} (₹${s.price})` })),
                ]}
              />
              <Button
                disabled={!selectedServiceId}
                onClick={() => serviceQrMutation.mutate(selectedServiceId)}
                isLoading={serviceQrMutation.isPending}
                className="w-full gap-2"
                variant="outline"
              >
                <Sparkles className="w-4 h-4" />
                Generate Service QR
              </Button>
            </div>

            {serviceQr?.qrImage && (
              <div className="flex flex-col items-center justify-center space-y-4 pt-4 border-t border-slate-100">
                <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-xs inline-block">
                  <img
                    src={serviceQr.qrImage}
                    alt="Service QR"
                    className="w-44 h-44 object-contain"
                  />
                </div>
                <div className="flex items-center justify-center gap-3">
                  <a
                    href={serviceQr.qrImage}
                    download="service-qr.png"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5"
                    onClick={() => handlePrint(serviceQr.qrImage!, "Service Direct Booking QR")}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}