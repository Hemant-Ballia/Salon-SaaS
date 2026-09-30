"use client";

import React, { useState } from "react";
import Image from "next/image";
import { getStaffAvatarUrl } from "@/lib/images";

interface StaffAvatarProps {
  staff?: {
    id?: string;
    displayName?: string;
    profileImageUrl?: string | null;
    user?: {
      name?: string;
    };
  };
  name?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showStatus?: boolean;
}

export const StaffAvatar: React.FC<StaffAvatarProps> = ({
  staff,
  name: nameProp,
  size = "md",
  className = "",
  showStatus = false,
}) => {
  const name = nameProp || staff?.displayName || staff?.user?.name || "Stylist";
  const fallbackUrl = getStaffAvatarUrl(name, staff?.id);
  const [imgSrc, setImgSrc] = useState(staff?.profileImageUrl || fallbackUrl);
  const [isLoading, setIsLoading] = useState(true);

  const sizeStyles = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-16 h-16",
  }[size];

  return (
    <div className={`relative shrink-0 ${sizeStyles} ${className}`}>
      <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-100 ring-2 ring-white shadow-xs">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-200/80 animate-pulse z-10" />
        )}
        <Image
          src={imgSrc}
          alt={name}
          fill
          sizes="80px"
          className={`object-cover object-top transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImgSrc(fallbackUrl);
            setIsLoading(false);
          }}
        />
      </div>

      {showStatus && (
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
      )}
    </div>
  );
};
