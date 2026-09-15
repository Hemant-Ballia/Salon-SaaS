import { apiClient } from "./client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import {
  AuditLog,
  Appointment,
  Business,
  Customer,
  DashboardMetrics,
  Payment,
  Staff,
  User,
  BusinessStatus,
} from "@/types/models";

// Dashboard
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await apiClient.get<ApiResponse<{ metrics: DashboardMetrics }>>("/admin/dashboard");
  return response.data.data.metrics;
}

// Users
export async function getUsersApi(params?: {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
}): Promise<PaginatedResponse<User>> {
  const response = await apiClient.get<PaginatedResponse<User>>("/admin/users", { params });
  return response.data;
}

export async function getUserByIdApi(id: string): Promise<User> {
  const response = await apiClient.get<ApiResponse<{ user: User }>>(`/admin/users/${id}`);
  return response.data.data.user;
}

export async function updateUserStatusApi(id: string, isActive: boolean): Promise<User> {
  const response = await apiClient.patch<ApiResponse<{ user: User }>>(`/admin/users/${id}/status`, { isActive });
  return response.data.data.user;
}

// Businesses
export async function getBusinessesApi(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<PaginatedResponse<Business>> {
  const response = await apiClient.get<PaginatedResponse<Business>>("/admin/businesses", { params });
  return response.data;
}

export async function getBusinessByIdApi(id: string): Promise<Business> {
  const response = await apiClient.get<ApiResponse<{ business: Business }>>(`/admin/businesses/${id}`);
  return response.data.data.business;
}

export async function approveBusinessApi(id: string): Promise<Business> {
  const response = await apiClient.post<ApiResponse<{ business: Business }>>(`/admin/businesses/${id}/approve`);
  return response.data.data.business;
}

export async function rejectBusinessApi(id: string): Promise<Business> {
  const response = await apiClient.post<ApiResponse<{ business: Business }>>(`/admin/businesses/${id}/reject`);
  return response.data.data.business;
}

export async function updateBusinessStatusApi(id: string, status: BusinessStatus): Promise<Business> {
  const response = await apiClient.patch<ApiResponse<{ business: Business }>>(`/admin/businesses/${id}/status`, { status });
  return response.data.data.business;
}

// Staff
export async function getStaffListApi(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Staff>> {
  const response = await apiClient.get<PaginatedResponse<Staff>>("/admin/staff", { params });
  return response.data;
}

export async function getStaffByIdApi(id: string): Promise<Staff> {
  // Staff single retrieval uses general staff route if admin endpoint not separate
  const response = await apiClient.get<ApiResponse<{ staff: Staff }>>(`/staff/${id}`);
  return response.data.data.staff;
}

// Customers
export async function getCustomersApi(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Customer>> {
  const response = await apiClient.get<PaginatedResponse<Customer>>("/admin/customers", { params });
  return response.data;
}

export async function getCustomerByIdApi(id: string): Promise<Customer> {
  const response = await apiClient.get<ApiResponse<{ customer: Customer }>>(`/customers/${id}`);
  return response.data.data.customer;
}

// Appointments
export async function getAppointmentsApi(params?: {
  page?: number;
  limit?: number;
  status?: string;
  appointmentDate?: string;
}): Promise<PaginatedResponse<Appointment>> {
  const response = await apiClient.get<PaginatedResponse<Appointment>>("/admin/appointments", { params });
  return response.data;
}

export async function getAppointmentByIdApi(id: string): Promise<Appointment> {
  const response = await apiClient.get<ApiResponse<{ appointment: Appointment }>>(`/appointments/${id}`);
  return response.data.data.appointment;
}

// Payments
export async function getPaymentsApi(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<PaginatedResponse<Payment>> {
  const response = await apiClient.get<PaginatedResponse<Payment>>("/admin/payments", { params });
  return response.data;
}

export async function getPaymentByIdApi(id: string): Promise<Payment> {
  const response = await apiClient.get<ApiResponse<{ payment: Payment }>>(`/payments/${id}`);
  return response.data.data.payment;
}

// Audit Logs
export async function getAuditLogsApi(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AuditLog>> {
  const response = await apiClient.get<PaginatedResponse<AuditLog>>("/admin/audit-logs", { params });
  return response.data;
}
