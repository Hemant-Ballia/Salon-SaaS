import { BusinessType } from "@/types/models";

export type ThemeVariant = "salon" | "carwash" | "neutral";

export interface BusinessThemeConfig {
  themeKey: ThemeVariant;
  categoryLabel: string;
  sidebar: {
    bgClass: string;
    borderClass: string;
    activeNavBg: string;
    activeNavText: string;
    activeNavIcon: string;
    inactiveText: string;
    inactiveIcon: string;
    logoType: "lotus" | "shield" | "default";
    logoColor: string;
  };
  main: {
    bgClass: string;
    cardBorder: string;
    cardBg: string;
  };
  topbar: {
    searchPlaceholder: string;
    accentColor: string;
  };
  hero: {
    greetingRole: string;
    greetingEmoji: string;
    subtitle: string;
  };
  kpis: {
    kpi1: { label: string; icon: "calendar"; badgeStyle: string };
    kpi2: { label: string; icon: "revenue"; badgeStyle: string };
    kpi3: { label: string; icon: "users"; badgeStyle: string; key: "activeStaff" | "activeCustomers" };
    kpi4: { label: string; icon: "completed"; badgeStyle: string };
  };
  chart: {
    title: string;
    metricKey: "revenue" | "bookings";
    accentColor: string;
    gradientStop: string;
    valuePrefix: string;
    tooltipLabel: string;
  };
  donut: {
    title: string;
    mode: "status" | "popularity";
    centerSubtitle: string;
  };
  hasQrWidget: boolean;
  hasBottomStats: boolean;
  quickActions: Array<{
    label: string;
    description: string;
    href: string;
    icon: "appointment" | "staff" | "customer" | "services";
  }>;
}

export const SALON_THEME: BusinessThemeConfig = {
  themeKey: "salon",
  categoryLabel: "Salon & Parlour",
  sidebar: {
    bgClass: "bg-slate-950",
    borderClass: "border-slate-800",
    activeNavBg: "bg-emerald-500/15",
    activeNavText: "text-emerald-400 font-semibold",
    activeNavIcon: "text-emerald-400",
    inactiveText: "text-slate-400 hover:text-white hover:bg-white/5",
    inactiveIcon: "text-slate-500 group-hover:text-slate-300",
    logoType: "lotus",
    logoColor: "#10b981",
  },
  main: {
    bgClass: "bg-slate-50",
    cardBorder: "border-slate-200/80",
    cardBg: "bg-white",
  },
  topbar: {
    searchPlaceholder: "Search appointments, customers, services...",
    accentColor: "#059669",
  },
  hero: {
    greetingRole: "Salon Operations",
    greetingEmoji: "👋",
    subtitle: "Real-time overview of today's appointments, queue status, and salon staff.",
  },
  kpis: {
    kpi1: { label: "Today's Bookings", icon: "calendar", badgeStyle: "text-emerald-600" },
    kpi2: { label: "Total Revenue", icon: "revenue", badgeStyle: "text-emerald-600" },
    kpi3: { label: "Active Staff", icon: "users", badgeStyle: "text-emerald-600", key: "activeStaff" },
    kpi4: { label: "Services Completed", icon: "completed", badgeStyle: "text-emerald-600" },
  },
  chart: {
    title: "Revenue Overview",
    metricKey: "revenue",
    accentColor: "#059669",
    gradientStop: "#6ee7b7",
    valuePrefix: "₹",
    tooltipLabel: "Revenue",
  },
  donut: {
    title: "Appointment Status",
    mode: "status",
    centerSubtitle: "Today",
  },
  hasQrWidget: true,
  hasBottomStats: true,
  quickActions: [
    {
      label: "New Appointment",
      description: "Book an appointment slot",
      href: "/appointments",
      icon: "appointment",
    },
    {
      label: "Add Customer",
      description: "Register client profile",
      href: "/customers",
      icon: "customer",
    },
    {
      label: "Invite Staff",
      description: "Add specialist to roster",
      href: "/staff",
      icon: "staff",
    },
    {
      label: "Services & Pricing",
      description: "Update catalog services",
      href: "/services",
      icon: "services",
    },
  ],
};

export const CAR_WASH_THEME: BusinessThemeConfig = {
  themeKey: "carwash",
  categoryLabel: "Car Care & Detailing",
  sidebar: {
    bgClass: "bg-slate-950",
    borderClass: "border-slate-800",
    activeNavBg: "bg-emerald-500/15",
    activeNavText: "text-emerald-400 font-semibold",
    activeNavIcon: "text-emerald-400",
    inactiveText: "text-slate-400 hover:text-white hover:bg-white/5",
    inactiveIcon: "text-slate-500 group-hover:text-slate-300",
    logoType: "shield",
    logoColor: "#10b981",
  },
  main: {
    bgClass: "bg-slate-50",
    cardBorder: "border-slate-200/80",
    cardBg: "bg-white",
  },
  topbar: {
    searchPlaceholder: "Search bookings, customers, services...",
    accentColor: "#059669",
  },
  hero: {
    greetingRole: "Service Center Operations",
    greetingEmoji: "👋",
    subtitle: "Real-time overview of vehicle bookings, active bays, and floor staff.",
  },
  kpis: {
    kpi1: { label: "Today's Bookings", icon: "calendar", badgeStyle: "text-emerald-600" },
    kpi2: { label: "Total Revenue", icon: "revenue", badgeStyle: "text-emerald-600" },
    kpi3: { label: "Active Staff", icon: "users", badgeStyle: "text-emerald-600", key: "activeStaff" },
    kpi4: { label: "Services Completed", icon: "completed", badgeStyle: "text-emerald-600" },
  },
  chart: {
    title: "Booking Overview",
    metricKey: "bookings",
    accentColor: "#059669",
    gradientStop: "#6ee7b7",
    valuePrefix: "",
    tooltipLabel: "Bookings",
  },
  donut: {
    title: "Service Popularity",
    mode: "popularity",
    centerSubtitle: "Total Bookings",
  },
  hasQrWidget: true,
  hasBottomStats: true,
  quickActions: [
    {
      label: "New Booking",
      description: "Schedule a vehicle service",
      href: "/appointments",
      icon: "appointment",
    },
    {
      label: "Add Customer",
      description: "Register vehicle owner",
      href: "/customers",
      icon: "customer",
    },
    {
      label: "Invite Staff",
      description: "Add technician to team",
      href: "/staff",
      icon: "staff",
    },
    {
      label: "Service Catalog",
      description: "Update wash packages",
      href: "/services",
      icon: "services",
    },
  ],
};

/**
 * Resolver function: maps any BusinessType to its appropriate theme
 */
export function getBusinessTheme(businessType?: BusinessType | string | null): BusinessThemeConfig {
  const norm = (businessType || "").toUpperCase();
  if (norm === "CAR_WASH") {
    return CAR_WASH_THEME;
  }
  return SALON_THEME;
}
