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