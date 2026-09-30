"use client";

import React, { useState } from "react";
import Link from "next/link";
import { QrCode as QrIcon, ArrowRight, Copy, Check, ExternalLink } from "lucide-react";
import { QrModal } from "./qr-modal";
import { toast } from "sonner";

interface QrWidgetProps {
  businessId?: string;
  businessName?: string;
  categoryLabel?: string;
  token?: string;
  qrImageUrl?: string | null;
  targetUrl?: string;
  isLoading?: boolean;
}

export const QrWidget: React.FC<QrWidgetProps> = ({
  businessId,
  businessName = "Business",
  categoryLabel = "Shop",
  token = "",
  qrImageUrl,
  targetUrl,
  isLoading = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeToken, setActiveToken] = useState(token);
  const [activeQrImage, setActiveQrImage] = useState(qrImageUrl);
  const [activeTargetUrl, setActiveTargetUrl] = useState(targetUrl);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    setActiveToken(token);
    setActiveQrImage(qrImageUrl);
    setActiveTargetUrl(targetUrl);
  }, [token, qrImageUrl, targetUrl]);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = activeTargetUrl || (typeof window !== "undefined" ? `${window.location.origin}/book` : "");
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Booking link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center justify-between gap-4 animate-pulse">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-slate-200 rounded-md" />
          <div className="h-3 w-44 bg-slate-100 rounded-md" />
          <div className="h-7 w-28 bg-slate-200 rounded-full mt-2" />
        </div>
        <div className="h-20 w-20 rounded-xl bg-slate-100 border border-slate-200 shrink-0" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Storefront Operations
            </span>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Business QR Code
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[210px]">
              Display at counter for instant walk-in queueing & booking.
            </p>
          </div>

          {/* Real QR Thumbnail Graphic */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="h-20 w-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1.5 shrink-0 shadow-2xs cursor-pointer hover:shadow-md transition overflow-hidden group"
            title="Click to view full QR Code"
          >
            {activeQrImage ? (
              <img
                src={activeQrImage}
                alt="Business QR"
                className="h-full w-full object-contain group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-1">
                <QrIcon className="h-8 w-8 text-slate-400 animate-pulse" />
                <span className="text-[8px] font-mono font-bold text-slate-400 mt-0.5">
                  {activeToken || "QR READY"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick action buttons row */}
        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
          >
            View QR <ArrowRight className="h-3 w-3" />
          </button>

          <button
            onClick={handleCopyLink}
            title="Copy direct booking link"
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy Link"}</span>
          </button>
        </div>
      </div>

      {/* Interactive Detail Modal */}
      <QrModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        businessId={businessId}
        businessName={businessName}
        categoryLabel={categoryLabel}
        token={activeToken}
        qrImageUrl={activeQrImage}
        targetUrl={activeTargetUrl}
        onQrUpdated={(newQr) => {
          setActiveToken(newQr.token);
          setActiveQrImage(newQr.qrImageUrl);
          setActiveTargetUrl(newQr.targetUrl);
        }}
      />
    </>
  );
};
