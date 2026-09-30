export type UserRole = "ADMIN" | "BUSINESS" | "STAFF" | "CUSTOMER";

export type BusinessType = "SALON" | "BEAUTY_PARLOUR" | "BARBER" | "CAR_WASH" | "OTHER";

export type BusinessStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "ACTIVE" | "INACTIVE";

export type StaffStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE";

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "RESCHEDULED" | "COMPLETED" | "NO_SHOW";

export type QueueEntryStatus = "WAITING" | "CALLED" | "SERVING" | "COMPLETED" | "SKIPPED" | "CANCELLED";

export type PaymentStatus = "CREATED" | "PENDING" | "PAID" | "SUCCESS" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";

export type SubscriptionPlan = "FREE" | "BASIC" | "PRO" | "PREMIUM";

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";

export interface User {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  openingHours?: Record<string, unknown> | null;
  status: BusinessStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StaffScheduleItem {
  id?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isWorking?: boolean;
}

export interface Staff {
  id: string;
  userId: string;
  businessId: string;
  displayName: string;
  designation?: string | null;
  email?: string;
  status: StaffStatus;
  user?: {
    name?: string;
    displayName?: string;
    email: string;
    phone?: string | null;
  };
  business?: {
    id: string;
    name: string;
  };
  schedules?: StaffScheduleItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  category?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  userId: string;
  user?: {
    name?: string;
    displayName?: string;
    email: string;
    phone?: string | null;
  };
  _count?: {
    appointments?: number;
  };
  createdAt: string;
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
  customer?: {
    id: string;
    user?: {
      name: string;
      displayName?: string;
      email: string;
      phone?: string | null;
    };
  };
  staff?: {
    id: string;
    displayName: string;
    designation?: string | null;
    user?: {
      name?: string;
      displayName?: string;
    };
  };
  service?: {
    id: string;
    name: string;
    durationMinutes?: number;
    price?: number;
  };
  appointmentServices?: Array<{
    id: string;
    quantity: number;
    priceAtBooking: number;
    service?: {
      id: string;
      name: string;
      durationMinutes: number;
      price: number;
    };
  }>;
  createdAt: string;
  updatedAt?: string;
}

export interface QueueEntry {
  id: string;
  tokenNumber: number;
  status: QueueEntryStatus;
  position?: number;
  estimatedWaitMinutes?: number | null;
  estimatedWaitTime?: number | string | null;
  customerName?: string;
  serviceName?: string;
  joinedAt: string;
  calledAt?: string | null;
  servedAt?: string | null;
  completedAt?: string | null;
  skippedAt?: string | null;
  cancelledAt?: string | null;
  customer?: {
    id: string;
    user?: {
      name?: string;
      displayName?: string;
      phone?: string | null;
    };
  };
  service?: {
    id: string;
    name: string;
  };
  appointment?: {
    id: string;
    appointmentDate: string;
    startTime: string;
  } | null;
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
  createdAt: string;
  customer?: {
    user?: {
      name: string;
      displayName?: string;
      email: string;
    };
  };
}

export interface Subscription {
  id: string;
  businessId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt?: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string | null;
}

export interface QrCode {
  id: string;
  businessId: string;
  type: string;
  token: string;
  targetUrl: string;
  qrImageUrl?: string;
  qrImage?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  channel: string;
  isRead: boolean;
  createdAt: string;
}

export interface BusinessDashboardStats {
  totalStaff: number;
  totalServices: number;
  totalAppointments: number;
  todayAppointments: number;
  yesterdayAppointments?: number;
  todayBookingsChange?: string;
  pendingAppointments: number;
  activeQueueCount: number;
  totalRevenue: number;
  todayRevenue: number;
  yesterdayRevenue?: number;
  todayRevenueChange?: string;
  activeStaff?: number;
  activeStaffChange?: string;
  activeCustomers?: number;
  activeCustomersChange?: string;
  servicesCompleted?: number;
  servicesCompletedYesterday?: number;
  servicesCompletedChange?: string;
  totalCustomers?: number;
  bookingsSparkline?: number[];
  revenueSparkline?: number[];
  customersSparkline?: number[];
  completedSparkline?: number[];
}

export interface ChartDataPoint {
  date: string;
  fullDate?: string;
  bookings: number;
  revenue: number;
}

export interface StatusBreakdownItem {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ServicePopularityItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TopServiceItem {
  id: string;
  name: string;
  category?: string;
  bookingsCount: number;
  percentage: number;
  price: number;
  imageUrl?: string | null;
}

export interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  createdAt: string;
  iconType: "appointment" | "payment" | "notification" | "staff" | "feedback";
}

export interface BusinessDashboardData {
  business: Business;
  stats: BusinessDashboardStats;
  chartData: ChartDataPoint[];
  statusBreakdown: StatusBreakdownItem[];
  servicePopularity: ServicePopularityItem[];
  topServices: TopServiceItem[];
  recentAppointments: Appointment[];
  recentActivity: ActivityEvent[];
  qrCode?: {
    id?: string;
    token?: string;
    targetUrl?: string;
    qrImageUrl?: string | null;
    scanCount?: number;
  } | null;
  subscription?: {
    id?: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    startDate?: string;
    endDate?: string | null;
    renewalDate?: string | null;
  } | null;
}

// ── Staff Compensation, Commission & Incentive Models ─────────────────────────

export type CompensationType =
  | "SALARY"
  | "COMMISSION"
  | "SALARY_COMMISSION"
  | "SALARY_INCENTIVE"
  | "SALARY_COMMISSION_INCENTIVE"
  | "COMMISSION_INCENTIVE"
  | "INCENTIVE";

export type CommissionType = "PERCENTAGE" | "FIXED";

export type CommissionBasis =
  | "COMPLETED"
  | "PAID"
  | "COMPLETED_AND_PAID"
  | "SERVICE_SUBTOTAL"
  | "NET_AFTER_DISCOUNT";

export type IncentiveMetric = "APPOINTMENT_COUNT" | "TOTAL_REVENUE" | "SERVICE_COUNT";

export type IncentivePeriod = "WEEKLY" | "MONTHLY" | "CUSTOM";

export type LedgerEntryType = "COMMISSION" | "INCENTIVE" | "SALARY" | "REVERSAL" | "ADJUSTMENT";

export type LedgerStatus = "PENDING" | "APPROVED" | "PAID" | "VOID";

export interface StaffCompensation {
  id: string;
  businessId: string;
  staffId: string;
  compensationType: CompensationType;
  monthlySalary?: string | number | null;
  payFrequency?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionRule {
  id: string;
  businessId: string;
  staffId?: string | null;
  type: CommissionType;
  percentage?: string | number | null;
  fixedAmount?: string | number | null;
  calculationBasis: CommissionBasis;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  createdAt: string;
  staff?: { id: string; displayName: string };
  services?: Array<{ service: { id: string; name: string; price: string | number } }>;
}

export interface IncentiveProgress {
  current: string;
  target: string;
  percentage: number;
  isAchieved: boolean;
  periodStart: string;
  periodEnd: string;
}

export interface IncentiveRule {
  id: string;
  businessId: string;
  staffId?: string | null;
  name: string;
  metric: IncentiveMetric;
  target: string | number;
  rewardType: string;
  rewardAmount: string | number;
  period: IncentivePeriod;
  startDate: string;
  endDate?: string | null;
  serviceId?: string | null;
  isActive: boolean;
  createdAt: string;
  staff?: { id: string; displayName: string } | null;
  service?: { id: string; name: string } | null;
  progress?: IncentiveProgress;
}

export interface StaffServicePrice {
  id: string;
  businessId: string;
  staffId: string;
  serviceId: string;
  price: string | number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  staff?: { id: string; displayName: string; designation?: string };
  service?: { id: string; name: string; price: string | number };
}

export interface CompensationLedger {
  id: string;
  businessId?: string;
  staffId: string;
  appointmentId?: string | null;
  serviceId?: string | null;
  type: LedgerEntryType;
  amount: string | number;
  calculationSnapshot: Record<string, any>;
  notes?: string | null;
  status: LedgerStatus;
  periodStart?: string | null;
  periodEnd?: string | null;
  serviceName?: string;
  customerName?: string;
  createdAt: string;
}

export interface StaffEarningsSummary {
  staffId: string;
  displayName: string;
  compensationType: CompensationType | "UNCONFIGURED";
  baseSalary: string;
  totalCommission: string;
  totalIncentives: string;
  totalReversals: string;
  totalPeriodEarnings: string;
  periodStart: string;
  periodEnd: string;
  incentiveProgress: Array<{
    id: string;
    name: string;
    metric: IncentiveMetric;
    target: string;
    rewardAmount: string;
    period: IncentivePeriod;
    progress: IncentiveProgress;
  }>;
  ledgerEntries: CompensationLedger[];
}

export interface BusinessPayrollSummary {
  month: string;
  totalStaffCost: string;
  totalCommission: string;
  totalIncentives: string;
  totalReversals: string;
  pendingIncentives: string;
  estimatedPayroll: string;
  staffCount: number;
  staffBreakdown: Array<{
    staffId: string;
    name: string;
    designation?: string;
    compensationType: string;
    salary: string;
    commissionEarned: string;
    incentivesEarned: string;
    totalPeriodEarnings: string;
  }>;
}