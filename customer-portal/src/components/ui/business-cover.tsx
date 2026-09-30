"use client";

import React, { useState } from "react";
import Image from "next/image";
import { getBusinessCoverImage } from "@/lib/images";
import { Star, ShieldCheck, MapPin } from "lucide-react";

interface BusinessCoverProps {
  business?: {
    name?: string;
    slug?: string;
    businessType?: string;
    city?: string | null;
    address?: string | null;
    imageUrl?: string | null;
  };
  className?: string;
  showOverlayBadges?: boolean;
  aspectRatio?: "video" | "banner" | "card" | "square";
}

export const BusinessCover: React.FC<BusinessCoverProps> = ({
  business,
  className = "",
  showOverlayBadges = true,
  aspectRatio = "card",
}) => {
  const fallbackUrl = getBusinessCoverImage(business);
  const [imgSrc, setImgSrc] = useState(business?.imageUrl || fallbackUrl);
  const [isLoading, setIsLoading] = useState(true);

  const aspectStyles = {
    card: "h-44 sm:h-48",
    banner: "h-56 sm:h-72",
    video: "aspect-video",
    square: "aspect-square",
  }[aspectRatio];

  return (
    <div className={`relative w-full overflow-hidden bg-slate-900 group ${aspectStyles} ${className}`}>
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200/80 animate-pulse z-10" />
      )}

      {/* Realistic Background Image */}
      <Image
        src={imgSrc}
        alt={business?.name || "Salon interior"}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={aspectRatio === "banner"}
        className={`object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallbackUrl);
          setIsLoading(false);
        }}
      />

      {/* Subtle Vignette Gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent pointer-events-none" />

      {/* Overlay Badges */}
      {showOverlayBadges && (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Verified</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>4.9</span>
          </div>
        </div>
      )}
    </div>
  );
};
