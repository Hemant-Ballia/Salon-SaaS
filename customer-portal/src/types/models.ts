export type UserRole = "ADMIN" | "BUSINESS" | "STAFF" | "CUSTOMER";

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "RESCHEDULED" | "COMPLETED" | "NO_SHOW";

export type QueueEntryStatus = "WAITING" | "CALLED" | "SERVING" | "COMPLETED" | "SKIPPED" | "CANCELLED";

export type PaymentStatus = "CREATED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";

export interface User {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Business {
  id: string;
  ownerId?: string;
  name: string;
  slug: string;
  businessType?: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  openingHours?: Record<string, unknown> | null;
  status?: string;
  isActive?: boolean;
  services?: Service[];
  createdAt?: string;
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
  business?: {
    id: string;
    name: string;
    slug?: string;
    city?: string | null;
  };
  createdAt?: string;
}

export interface Staff {
  id: string;
  displayName: string;
  designation?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  status?: string;
  user?: {
    id: string;
    name: string;
    phone?: string | null;
  };
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  staffId?: string;
}

export interface AppointmentServiceItem {
  id?: string;
  serviceId?: string;
  quantity?: number;
  price?: number;
  priceAtBooking?: number;
  service?: {
    id?: string;
    name: string;
    durationMinutes?: number;
    price?: number;
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
  totalDurationMinutes?: number;
  paymentStatus?: string;
  notes?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  business?: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
  };
  staff?: {
    id: string;
    displayName?: string;
    designation?: string | null;
    user?: {
      id?: string;
      name: string;
    };
  } | null;
  service?: {
    id: string;
    name: string;
    durationMinutes?: number;
    price?: number;
  };
  services?: AppointmentServiceItem[];
  appointmentServices?: AppointmentServiceItem[];
  payment?: Payment | null;
  createdAt: string;
}

export interface QueueEntry {
  id: string;
  tokenNumber: number;
  status: QueueEntryStatus;
  position?: number;
  estimatedWaitMinutes?: number | null;
  estimatedWaitTime?: number | string | null;
  joinedAt: string;
  calledAt?: string | null;
  servedAt?: string | null;
  completedAt?: string | null;
  skippedAt?: string | null;
  cancelledAt?: string | null;
  queue?: {
    id: string;
    name: string;
    businessId: string;
  };
  business?: {
    id: string;
    name: string;
    address?: string | null;
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
  appointmentId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  appointment?: Appointment | null;
  business?: Business | null;
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