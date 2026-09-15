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
  pendingAppointments: number;
  activeQueueCount: number;
  totalRevenue: number;
  todayRevenue: number;
}