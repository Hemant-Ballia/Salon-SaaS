"use client";

import React, { useState } from "react";
import Image from "next/image";
import { getServiceFallbackImage } from "@/lib/images";

interface ServiceImageProps {
  service?: {
    name?: string;
    category?: string | null;
    imageUrl?: string | null;
  };
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
}

export const ServiceImage: React.FC<ServiceImageProps> = ({
  service,
  className = "",
  size = "md",
}) => {
  const fallbackUrl = getServiceFallbackImage(service?.name, service?.category || undefined);
  const [imgSrc, setImgSrc] = useState(service?.imageUrl || fallbackUrl);
  const [isLoading, setIsLoading] = useState(true);

  const sizeStyles = {
    sm: "w-14 h-14 rounded-xl",
    md: "w-20 h-20 rounded-2xl",
    lg: "w-28 h-28 rounded-2xl",
    full: "w-full h-36 rounded-2xl",
  }[size];

  return (
    <div className={`relative overflow-hidden bg-slate-100 shrink-0 ${sizeStyles} ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200/80 animate-pulse z-10" />
      )}

      <Image
        src={imgSrc}
        alt={service?.name || "Service treatment"}
        fill
        sizes="160px"
        className={`object-cover object-center transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallbackUrl);
          setIsLoading(false);
        }}
      />
    </div>
  );
};
