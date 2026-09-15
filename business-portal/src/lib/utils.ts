import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const numeric = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(numeric)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return String(dateString);
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return String(dateString);
  }
}

export function formatDuration(minutes: number | string | null | undefined): string {
  const m = typeof minutes === "string" ? parseInt(minutes, 10) : (minutes ?? 0);
  if (!m || isNaN(m)) return "0 min";
  if (m < 60) return `${m} mins`;
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs} hr${hrs > 1 ? "s" : ""}`;
}