export type UserRole = "ADMIN" | "BUSINESS" | "STAFF" | "CUSTOMER";

export type StaffStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE";

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "RESCHEDULED" | "COMPLETED" | "NO_SHOW";

export type QueueEntryStatus = "WAITING" | "CALLED" | "SERVING" | "COMPLETED" | "SKIPPED" | "CANCELLED";

export interface User {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  staffProfile?: Staff | null;
}

export interface Customer {
  id: string;
  userId: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  profileImageUrl?: string | null;
  preferences?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: string;
    name: string;
    displayName?: string;
    email: string;
    phone?: string | null;
    isActive: boolean;
    createdAt?: string;
  };
  totalVisits?: number;
  lastVisit?: string | null;
  upcomingAppointment?: Appointment | null;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
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
  bio?: string | null;
  profileImageUrl?: string | null;
  status: StaffStatus;
  joiningDate?: string | null;
  user?: {
    id?: string;
    name?: string;
    displayName?: string;
    email: string;
    phone?: string | null;
  };
  business?: {
    id: string;
    name: string;
    slug?: string;
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
}

export interface Appointment {
  id: string;
  businessId?: string;
  customerId?: string;
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
    id?: string;
    user?: {
      name: string;
      displayName?: string;
      email?: string;
      phone?: string | null;
    };
  };
  staff?: {
    id: string;
    displayName: string;
    designation?: string | null;
  };
  service?: {
    id: string;
    name: string;
    durationMinutes?: number;
    price?: number;
  };
  appointmentServices?: Array<{
    quantity: number;
    priceAtBooking: number;
    service?: {
      name: string;
    };
  }>;
  createdAt: string;
}

export interface QueueEntry {
  id: string;
  tokenNumber: number;
  status: QueueEntryStatus;
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
    id?: string;
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

export interface StaffPerformanceStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  totalRevenue: number;
}

// ── Staff Earnings & Compensation Types ───────────────────────────────────────

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

export interface IncentiveProgress {
  current: string;
  target: string;
  percentage: number;
  isAchieved: boolean;
  periodStart: string;
  periodEnd: string;
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