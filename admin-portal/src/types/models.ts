export type UserRole = "ADMIN" | "BUSINESS" | "STAFF" | "CUSTOMER";

export type BusinessType = "SALON" | "BEAUTY_PARLOUR" | "BARBER" | "CAR_WASH" | "OTHER";

export type BusinessStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "ACTIVE" | "INACTIVE";

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "RESCHEDULED" | "COMPLETED" | "NO_SHOW";

export type PaymentStatus = "CREATED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  status: BusinessStatus;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  isActive: boolean;
  owner?: {
    id?: string;
    name?: string;
    email: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface Staff {
  id: string;
  userId: string;
  businessId: string;
  displayName: string;
  designation?: string | null;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  user?: {
    name?: string;
    email: string;
    phone?: string | null;
  };
  business?: {
    id?: string;
    name: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  userId: string;
  user?: {
    name?: string;
    email: string;
    phone?: string | null;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface AppointmentServiceItem {
  id: string;
  quantity: number;
  priceAtBooking: number;
  service?: {
    id: string;
    name: string;
    durationMinutes: number;
    category?: string | null;
  };
}

export interface Appointment {
  id: string;
  businessId: string;
  customerId: string;
  staffId?: string | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  totalAmount: number;
  notes?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  business?: {
    id: string;
    name: string;
    phone?: string | null;
    address?: string | null;
  };
  customer?: {
    id: string;
    user?: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
    };
  };
  staff?: {
    id: string;
    displayName: string;
    designation?: string | null;
  };
  appointmentServices?: AppointmentServiceItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  businessId: string;
  customerId: string;
  appointmentId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  refundedAmount?: number | null;
  refundId?: string | null;
  failureReason?: string | null;
  business?: {
    id: string;
    name: string;
  };
  customer?: {
    id: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
  appointment?: {
    id: string;
    appointmentDate: string;
    startTime: string;
    status: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  businessId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  user?: {
    name?: string;
    email: string;
    role?: UserRole;
  };
  createdAt: string;
}

export interface DashboardMetrics {
  users: number;
  businesses: number;
  appointments: number;
  revenue: number;
}

export interface AdminOverviewMetrics {
  totalUsers: number;
  totalBusinesses: number;
  activeBusinesses: number;
  inactiveBusinesses: number;
  totalCustomers: number;
  totalStaff: number;
  activeStaff: number;
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
}

export interface AdminPeriodMetrics {
  period: "7D" | "30D" | "3M" | "12M";
  newBusinesses: number;
  businessesChange: string;
  newCustomers: number;
  customersChange: string;
  appointments: number;
  appointmentsChange: string;
  revenue: number;
  revenueChange: string;
}

export interface AdminChartDataPoint {
  date: string;
  label: string;
  appointments: number;
  revenue: number;
}

export interface AdminBusinessDistribution {
  byStatus: { status: string; count: number }[];
  byType: { type: string; count: number }[];
}

export interface AdminRecentBusiness {
  id: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  status: BusinessStatus;
  createdAt: string;
  owner?: { id: string; name: string; email: string; phone?: string | null };
  counts?: { staff: number; services: number; appointments: number };
}

export interface AdminRecentAppointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  totalAmount: number;
  business?: { id: string; name: string; slug: string; businessType: BusinessType };
  customer?: { id: string; user?: { id: string; name: string; email: string; phone?: string | null } };
  staff?: { id: string; displayName: string; designation?: string | null };
  service?: { id: string; name: string; category?: string | null } | null;
}

export interface AdminPaymentsSummary {
  totalVolume: number;
  totalCount: number;
  paidVolume: number;
  paidCount: number;
  pendingVolume: number;
  pendingCount: number;
  failedVolume: number;
  failedCount: number;
  refundedVolume: number;
  refundedCount: number;
}

export interface AdminSubscriptionsSummary {
  total: number;
  active: number;
  byPlan: { plan: string; count: number }[];
}

export interface AdminDashboardData {
  overview: AdminOverviewMetrics;
  periodMetrics: AdminPeriodMetrics;
  chartData: AdminChartDataPoint[];
  businessDistribution: AdminBusinessDistribution;
  recentBusinesses: AdminRecentBusiness[];
  recentAppointments: AdminRecentAppointment[];
  paymentsSummary: AdminPaymentsSummary;
  subscriptionsSummary: AdminSubscriptionsSummary;
  recentActivity: AuditLog[];
}

