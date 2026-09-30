"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { regenerateBusinessQrApi } from "@/lib/api/business";
import { toast } from "sonner";
import {
  X,
  Download,
  Copy,
  Check,
  RefreshCw,
  QrCode as QrIcon,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId?: string;
  businessName?: string;
  categoryLabel?: string;
  token?: string;
  qrImageUrl?: string | null;
  targetUrl?: string;
  onQrUpdated?: (newQr: any) => void;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  businessId,
  businessName = "Business",
  categoryLabel = "Parlour",
  token: initialToken = "BLUSH-0427",
  qrImageUrl: initialQrImageUrl,
  targetUrl: initialTargetUrl,
  onQrUpdated,
}) => {
  const queryClient = useQueryClient();
  const [currentToken, setCurrentToken] = useState(initialToken);
  const [currentQrImage, setCurrentQrImage] = useState(initialQrImageUrl);
  const [currentTargetUrl, setCurrentTargetUrl] = useState(initialTargetUrl);
  const [copied, setCopied] = useState(false);
  const [showConfirmRegen, setShowConfirmRegen] = useState(false);

  // Sync state if props change
  React.useEffect(() => {
    setCurrentToken(initialToken);
    setCurrentQrImage(initialQrImageUrl);
    setCurrentTargetUrl(initialTargetUrl);
  }, [initialToken, initialQrImageUrl, initialTargetUrl]);

  const regenMutation = useMutation({
    mutationFn: () => {
      if (!businessId) throw new Error("Business ID missing");
      return regenerateBusinessQrApi(businessId);
    },
    onSuccess: (newQr: any) => {
      setCurrentToken(newQr.token);
      setCurrentQrImage(newQr.qrImageUrl);
      setCurrentTargetUrl(newQr.targetUrl);
      setShowConfirmRegen(false);
      queryClient.invalidateQueries({ queryKey: ["business", "dashboard"] });
      if (onQrUpdated) onQrUpdated(newQr);
      toast.success("New QR code generated successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to regenerate QR code");
    },
  });

  if (!isOpen) return null;

  const customerPortalUrl =
    process.env.NEXT_PUBLIC_CUSTOMER_PORTAL_URL ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:3003`
      : "http://localhost:3003");
  const bookingUrl = currentTargetUrl || (currentToken ? `${customerPortalUrl}/book/${currentToken}` : "");

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success("Booking link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleDownload = () => {
    if (!currentQrImage) {
      toast.error("QR Code image not available for download");
      return;
    }
    const link = document.createElement("a");
    link.href = currentQrImage;
    link.download = `qr-code-${currentToken || "business"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code downloaded as PNG");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200/80 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <QrIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {businessName} QR Code
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {categoryLabel} Direct Customer Booking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* QR Display Card */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="relative h-60 w-60 rounded-2xl bg-white p-3 shadow-md border border-slate-200 flex items-center justify-center overflow-hidden">
            {currentQrImage ? (
              <img
                src={currentQrImage}
                alt={`QR Code ${currentToken}`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                <QrIcon className="h-16 w-16 animate-pulse" />
                <span className="text-xs">Generating QR...</span>
              </div>
            )}
          </div>

          {/* Token & Status Badge */}
          <div className="flex items-center gap-2 pt-1">
            <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-mono font-bold text-xs tracking-wider">
              {currentToken}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
            </span>
          </div>

          <p className="text-[11px] text-slate-500 text-center max-w-xs">
            Point any mobile smartphone camera at this code to open your verified booking page.
          </p>
        </div>

        {/* Booking Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            Booking Entry URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={bookingUrl}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-mono text-slate-700 select-all focus:outline-hidden"
            />
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-xs shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Regeneration Confirmation Alert or Primary Actions */}
        {showConfirmRegen ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Regenerate QR Code?
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  The current QR token ({currentToken}) will immediately stop working, and any printed codes will expire. Your appointments, services, and staff remain unaffected.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowConfirmRegen(false)}
                disabled={regenMutation.isPending}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-amber-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => regenMutation.mutate()}
                disabled={regenMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 transition shadow-xs"
              >
                {regenMutation.isPending && (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                )}
                {regenMutation.isPending ? "Regenerating..." : "Yes, Regenerate QR"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <button
              onClick={() => setShowConfirmRegen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate QR
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              >
                <Download className="h-3.5 w-3.5" /> Download PNG
              </button>
              <button
                onClick={onClose}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
