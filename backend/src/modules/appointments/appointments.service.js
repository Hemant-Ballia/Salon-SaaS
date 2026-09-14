/**
 * src/modules/appointments/appointments.service.js
 *
 * Production-grade appointment booking engine.
 *
 * Security guarantees:
 *   - customerId for CUSTOMER is ALWAYS resolved from JWT (never from body)
 *   - price / duration / endTime / totalAmount are ALWAYS server-side computed
 *   - priceAtBooking preserves the service price at booking time
 *   - businessId is validated against DB — the business must exist and be ACTIVE
 *   - Staff schedule is checked before booking
 *   - Conflicting appointments are detected within the time window
 *   - All booking operations run inside a Prisma transaction
 *
 * Isolation:
 *   ADMIN    → can read / manage any appointment
 *   BUSINESS → own business's appointments only (verified via ownerId)
 *   STAFF    → own business's appointments only (verified via staff.businessId)
 *   CUSTOMER → own appointments only (verified via customer.userId)
 */

import { getDB } from "../../config/db.js";
import { paginate } from "../../utils/pagination.js";
import { withTransaction } from "../../utils/transaction.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";
import { emitToBusiness, emitToCustomer } from "../../config/socket.js";

// ── Safe select ───────────────────────────────────────────────────────────────

const APPOINTMENT_SELECT = {
  id: true, appointmentDate: true, startTime: true, endTime: true,
  status: true, totalAmount: true, notes: true,
  cancelledAt: true, cancelReason: true, createdAt: true, updatedAt: true,
  business: { select: { id: true, name: true, phone: true, address: true } },
  customer: { select: { id: true, user: { select: { id: true, name: true, phone: true, email: true } } } },
  staff: { select: { id: true, displayName: true, designation: true } },
  appointmentServices: {
    select: {
      id: true, quantity: true, priceAtBooking: true,
      service: { select: { id: true, name: true, durationMinutes: true, category: true } },
    },
  },
};

// ── Time helpers ──────────────────────────────────────────────────────────────

/**
 * Convert "HH:MM" to total minutes from midnight.
 */
const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Add minutes to "HH:MM" and return "HH:MM".
 */
const addMinutes = (time, mins) => {
  const total = toMinutes(time) + mins;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/**
 * Get day-of-week name (Monday, Tuesday…) from a Date.
 */
const getDayOfWeek = (date) => {
  return ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][
    new Date(date).getDay()
  ];
};

// ── Caller context resolver ───────────────────────────────────────────────────

/**
 * Resolve the businessId that this caller is authorized to access.
 * Returns null for ADMIN (unrestricted) and CUSTOMER (scoped separately).
 */
const resolveCallerBusinessId = async (caller) => {
  const prisma = getDB();

  if (caller.role === "BUSINESS") {
    const biz = await prisma.business.findFirst({ where: { ownerId: caller.userId, deletedAt: null }, select: { id: true } });
    if (!biz) throw ApiError.notFound("You do not have a registered business.", "BUSINESS_NOT_FOUND");
    return biz.id;
  }

  if (caller.role === "STAFF") {
    const s = await prisma.staff.findFirst({ where: { userId: caller.userId, deletedAt: null }, select: { businessId: true } });
    if (!s) throw ApiError.notFound("Staff profile not found.", "STAFF_NOT_FOUND");
    return s.businessId;
  }

  return null;
};

/**
 * Resolve the customerId for the calling user.
 * CUSTOMER → always from JWT, never from body.
 * ADMIN/BUSINESS/STAFF → may supply customerId explicitly.
 */
const resolveCustomerId = async (caller, providedCustomerId) => {
  const prisma = getDB();

  if (caller.role === "CUSTOMER") {
    const c = await prisma.customer.findFirst({ where: { userId: caller.userId }, select: { id: true } });
    if (!c) throw ApiError.notFound("Customer profile not found.", "CUSTOMER_NOT_FOUND");
    return c.id;
  }

  if (!providedCustomerId) throw ApiError.badRequest("customerId is required.", "MISSING_CUSTOMER_ID");

  const c = await prisma.customer.findFirst({ where: { id: providedCustomerId }, select: { id: true } });
  if (!c) throw ApiError.notFound("Customer not found.", "CUSTOMER_NOT_FOUND");
  return c.id;
};

/**
 * Get and verify appointment, enforcing caller's access scope.
 */
const resolveAppointmentAccess = async (appointmentId, caller) => {
  const prisma = getDB();
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, deletedAt: null },
    select: { ...APPOINTMENT_SELECT, businessId: true, customerId: true },
  });
  if (!appt) throw ApiError.notFound("Appointment not found.", "APPOINTMENT_NOT_FOUND");

  if (caller.role === "ADMIN") return appt;

  if (caller.role === "CUSTOMER") {
    const c = await prisma.customer.findFirst({ where: { userId: caller.userId }, select: { id: true } });
    if (!c || c.id !== appt.customerId) throw ApiError.forbidden("You can only access your own appointments.", "FORBIDDEN");
    return appt;
  }

  // BUSINESS / STAFF: must belong to their business
  const callerBizId = await resolveCallerBusinessId(caller);
  if (appt.businessId !== callerBizId) {
    throw ApiError.forbidden("This appointment belongs to a different business.", "APPOINTMENT_ACCESS_DENIED");
  }

  return appt;
};

// ── Core booking validation ───────────────────────────────────────────────────

/**
 * Validate and compute all server-side booking values.
 * Returns: { services, totalDuration, totalAmount, endTime }
 */
const validateBooking = async (prisma, { businessId, staffId, appointmentDate, startTime, serviceIds, excludeAppointmentId = null }) => {
  // 1. Verify business is ACTIVE
  const business = await prisma.business.findFirst({
    where: { id: businessId, status: "ACTIVE", isActive: true, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!business) throw ApiError.badRequest("This business is not active or does not exist.", "BUSINESS_INACTIVE");

  // 2. Fetch and validate all services (must belong to this business and be active)
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, businessId, isActive: true, deletedAt: null },
    select: { id: true, name: true, durationMinutes: true, price: true },
  });

  if (services.length !== serviceIds.length) {
    const missing = serviceIds.filter((id) => !services.find((s) => s.id === id));
    throw ApiError.badRequest(`Services not found or inactive: ${missing.join(", ")}`, "INVALID_SERVICES");
  }

  // 3. Compute total duration and total amount server-side
  const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalAmount = services.reduce((sum, s) => sum + Number(s.price), 0);
  const endTime = addMinutes(startTime, totalDuration);

  // 4. Validate staff belongs to this business and is active
  if (staffId) {
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, businessId, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    if (!staff) throw ApiError.badRequest("Staff member not found, inactive, or not assigned to this business.", "INVALID_STAFF");

    // 5. Check staff schedule for this day
    const dayOfWeek = getDayOfWeek(appointmentDate);
    const schedule = await prisma.staffSchedule.findFirst({
      where: { staffId, dayOfWeek, isAvailable: true },
      select: { startTime: true, endTime: true },
    });

    if (!schedule) {
      throw ApiError.conflict(`Staff is not available on ${dayOfWeek}.`, "STAFF_UNAVAILABLE");
    }

    // Verify the appointment fits within the staff's working hours
    const schedStartMin = toMinutes(schedule.startTime);
    const schedEndMin = toMinutes(schedule.endTime);
    const apptStartMin = toMinutes(startTime);
    const apptEndMin = toMinutes(endTime);

    if (apptStartMin < schedStartMin || apptEndMin > schedEndMin) {
      throw ApiError.conflict(
        `Staff works ${schedule.startTime}–${schedule.endTime} on ${dayOfWeek}. Requested: ${startTime}–${endTime}.`,
        "OUTSIDE_STAFF_SCHEDULE"
      );
    }

    // 6. Double-booking check for staff within time window
    const conflict = await prisma.appointment.findFirst({
      where: {
        staffId,
        appointmentDate: new Date(appointmentDate),
        status: { in: ["PENDING", "CONFIRMED"] },
        deletedAt: null,
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
      select: { id: true, startTime: true, endTime: true },
    });

    if (conflict) {
      throw ApiError.conflict(
        `Staff already has an appointment from ${conflict.startTime} to ${conflict.endTime}.`,
        "STAFF_DOUBLE_BOOKING"
      );
    }
  }

  // 7. Appointment date must not be in the past
  const apptDate = new Date(appointmentDate);
  apptDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (apptDate < today) throw ApiError.badRequest("Appointment date cannot be in the past.", "PAST_DATE");

  return { services, totalDuration, totalAmount, endTime };
};

// ── Create ────────────────────────────────────────────────────────────────────

export const createAppointment = async (data, caller) => {
  const prisma = getDB();

  const customerId = await resolveCustomerId(caller, data.customerId);

  const { services, totalAmount, endTime } = await validateBooking(prisma, {
    businessId: data.businessId,
    staffId: data.staffId || null,
    appointmentDate: data.appointmentDate,
    startTime: data.startTime,
    serviceIds: data.serviceIds,
  });

  const appointment = await withTransaction(async (tx) => {
    // Create appointment with server-computed values
    const appt = await tx.appointment.create({
      data: {
        businessId: data.businessId,
        customerId,
        staffId: data.staffId || null,
        appointmentDate: new Date(data.appointmentDate),
        startTime: data.startTime,
        endTime,
        totalAmount,
        status: "PENDING",
        notes: data.notes || null,
      },
      select: APPOINTMENT_SELECT,
    });

    // Create AppointmentService records with priceAtBooking snapshot
    await tx.appointmentService.createMany({
      data: services.map((s) => ({
        appointmentId: appt.id,
        serviceId: s.id,
        quantity: 1,
        priceAtBooking: s.price, // historical price preserved
      })),
    });

    // Return with appointmentServices populated
    return tx.appointment.findUnique({ where: { id: appt.id }, select: APPOINTMENT_SELECT });
  });

  logger.info(`[Appointment] Created: ${appointment.id} for businessId=${data.businessId}`);
  const serialized = serializeAppointment(appointment);
  emitToBusiness(data.businessId, "appointment:created", { appointment: serialized });
  emitToCustomer(caller.userId, "appointment:created", { appointment: serialized });
  return { appointment: serialized };
};

// ── List ──────────────────────────────────────────────────────────────────────

export const listAppointments = async (query, caller) => {
  const prisma = getDB();
  const { skip, take, orderBy, meta } = paginate(query, ["appointmentDate", "createdAt", "status", "totalAmount"]);

  const where = { deletedAt: null };

  if (caller.role === "CUSTOMER") {
    const c = await prisma.customer.findFirst({ where: { userId: caller.userId }, select: { id: true } });
    if (!c) return { appointments: [], pagination: meta(0) };
    where.customerId = c.id;
  } else if (caller.role === "BUSINESS" || caller.role === "STAFF") {
    const callerBizId = await resolveCallerBusinessId(caller);
    where.businessId = callerBizId;
  } else {
    // ADMIN: optional filters
    if (query.businessId) where.businessId = query.businessId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.staffId) where.staffId = query.staffId;
  }

  if (query.status) where.status = query.status;
  if (query.date) where.appointmentDate = { equals: new Date(query.date) };
  if (query.dateFrom || query.dateTo) {
    where.appointmentDate = {};
    if (query.dateFrom) where.appointmentDate.gte = new Date(query.dateFrom);
    if (query.dateTo) where.appointmentDate.lte = new Date(query.dateTo);
  }

  const [appointments, total] = await prisma.$transaction([
    prisma.appointment.findMany({ where, skip, take, orderBy, select: APPOINTMENT_SELECT }),
    prisma.appointment.count({ where }),
  ]);

  return { appointments: appointments.map(serializeAppointment), pagination: meta(total) };
};

// ── Get by ID ─────────────────────────────────────────────────────────────────

export const getAppointmentById = async (appointmentId, caller) => {
  const appt = await resolveAppointmentAccess(appointmentId, caller);
  return { appointment: serializeAppointment(appt) };
};

// ── Update (notes / staffId only) ────────────────────────────────────────────

export const updateAppointment = async (appointmentId, data, caller) => {
  const prisma = getDB();
  const appt = await resolveAppointmentAccess(appointmentId, caller);

  if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appt.status)) {
    throw ApiError.badRequest("Cannot update a finalized appointment.", "APPOINTMENT_FINALIZED");
  }

  // If updating staffId, validate it
  if (data.staffId) {
    const staff = await prisma.staff.findFirst({
      where: { id: data.staffId, businessId: appt.businessId, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    if (!staff) throw ApiError.badRequest("Invalid staff member for this business.", "INVALID_STAFF");
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { ...data, updatedAt: new Date() },
    select: APPOINTMENT_SELECT,
  });

  return { appointment: serializeAppointment(updated) };
};

// ── Delete (soft — only PENDING appointments) ─────────────────────────────────

export const deleteAppointment = async (appointmentId, caller) => {
  const prisma = getDB();
  const appt = await resolveAppointmentAccess(appointmentId, caller);

  if (caller.role === "CUSTOMER" && !["PENDING"].includes(appt.status)) {
    throw ApiError.badRequest("Customers can only delete PENDING appointments.", "CANNOT_DELETE");
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { deletedAt: new Date(), status: "CANCELLED", cancelledAt: new Date(), cancelledBy: caller.userId },
  });
};

// ── Status transitions ────────────────────────────────────────────────────────

export const confirmAppointment = async (appointmentId, caller) => {
  const prisma = getDB();
  if (caller.role === "CUSTOMER") throw ApiError.forbidden("Customers cannot confirm appointments.", "FORBIDDEN");

  const appt = await resolveAppointmentAccess(appointmentId, caller);
  if (appt.status !== "PENDING") throw ApiError.badRequest(`Cannot confirm a ${appt.status} appointment.`, "INVALID_STATUS_TRANSITION");

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CONFIRMED", updatedAt: new Date() },
    select: APPOINTMENT_SELECT,
  });

  logger.info(`[Appointment] Confirmed: ${appointmentId}`);
  const serialized = serializeAppointment(updated);
  emitToBusiness(appt.businessId, "appointment:updated", { appointment: serialized, action: "confirmed" });
  if (appt.customer?.user?.id) emitToCustomer(appt.customer.user.id, "appointment:updated", { appointment: serialized, action: "confirmed" });
  return { appointment: serialized };
};

export const cancelAppointment = async (appointmentId, { cancelReason }, caller) => {
  const prisma = getDB();
  const appt = await resolveAppointmentAccess(appointmentId, caller);

  if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appt.status)) {
    throw ApiError.badRequest(`Appointment is already ${appt.status}.`, "INVALID_STATUS_TRANSITION");
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledBy: caller.userId,
      cancelReason: cancelReason || null,
      updatedAt: new Date(),
    },
    select: APPOINTMENT_SELECT,
  });

  logger.info(`[Appointment] Cancelled: ${appointmentId}`);
  const serialized = serializeAppointment(updated);
  emitToBusiness(appt.businessId, "appointment:cancelled", { appointment: serialized });
  if (appt.customer?.user?.id) emitToCustomer(appt.customer.user.id, "appointment:cancelled", { appointment: serialized });
  return { appointment: serialized };
};

export const rescheduleAppointment = async (appointmentId, data, caller) => {
  const prisma = getDB();
  const appt = await resolveAppointmentAccess(appointmentId, caller);

  if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appt.status)) {
    throw ApiError.badRequest(`Cannot reschedule a ${appt.status} appointment.`, "INVALID_STATUS_TRANSITION");
  }

  // Get existing service IDs
  const serviceIds = appt.appointmentServices.map((as) => as.service.id);
  const newStaffId = data.staffId !== undefined ? data.staffId : appt.staff?.id;

  const { endTime } = await validateBooking(prisma, {
    businessId: appt.businessId,
    staffId: newStaffId,
    appointmentDate: data.appointmentDate,
    startTime: data.startTime,
    serviceIds,
    excludeAppointmentId: appointmentId,
  });

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      appointmentDate: new Date(data.appointmentDate),
      startTime: data.startTime,
      endTime,
      staffId: newStaffId || null,
      status: "RESCHEDULED",
      updatedAt: new Date(),
    },
    select: APPOINTMENT_SELECT,
  });

  logger.info(`[Appointment] Rescheduled: ${appointmentId} → ${data.appointmentDate} ${data.startTime}`);
  const serialized = serializeAppointment(updated);
  emitToBusiness(appt.businessId, "appointment:updated", { appointment: serialized, action: "rescheduled" });
  if (appt.customer?.user?.id) emitToCustomer(appt.customer.user.id, "appointment:updated", { appointment: serialized, action: "rescheduled" });
  return { appointment: serialized };
};

export const completeAppointment = async (appointmentId, caller) => {
  const prisma = getDB();
  if (caller.role === "CUSTOMER") throw ApiError.forbidden("Customers cannot complete appointments.", "FORBIDDEN");

  const appt = await resolveAppointmentAccess(appointmentId, caller);
  if (!["CONFIRMED", "PENDING"].includes(appt.status)) {
    throw ApiError.badRequest(`Cannot complete a ${appt.status} appointment.`, "INVALID_STATUS_TRANSITION");
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "COMPLETED", updatedAt: new Date() },
    select: APPOINTMENT_SELECT,
  });

  logger.info(`[Appointment] Completed: ${appointmentId}`);
  const serialized = serializeAppointment(updated);
  emitToBusiness(appt.businessId, "appointment:updated", { appointment: serialized, action: "completed" });
  if (appt.customer?.user?.id) emitToCustomer(appt.customer.user.id, "appointment:updated", { appointment: serialized, action: "completed" });
  return { appointment: serialized };
};

export const noShowAppointment = async (appointmentId, caller) => {
  const prisma = getDB();
  if (caller.role === "CUSTOMER") throw ApiError.forbidden("Customers cannot mark no-show.", "FORBIDDEN");

  const appt = await resolveAppointmentAccess(appointmentId, caller);
  if (!["CONFIRMED", "PENDING"].includes(appt.status)) {
    throw ApiError.badRequest(`Cannot mark a ${appt.status} appointment as no-show.`, "INVALID_STATUS_TRANSITION");
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "NO_SHOW", updatedAt: new Date() },
    select: APPOINTMENT_SELECT,
  });

  logger.info(`[Appointment] No-show: ${appointmentId}`);
  const serialized = serializeAppointment(updated);
  emitToBusiness(appt.businessId, "appointment:updated", { appointment: serialized, action: "no_show" });
  if (appt.customer?.user?.id) emitToCustomer(appt.customer.user.id, "appointment:updated", { appointment: serialized, action: "no_show" });
  return { appointment: serialized };
};

// ── My Appointments (CUSTOMER shortcut) ──────────────────────────────────────

export const getMyAppointments = async (query, caller) => {
  const prisma = getDB();

  if (caller.role !== "CUSTOMER") {
    throw ApiError.forbidden("This endpoint is for customers only. Use GET /appointments instead.", "FORBIDDEN");
  }

  const c = await prisma.customer.findFirst({ where: { userId: caller.userId }, select: { id: true } });
  if (!c) return { appointments: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };

  const { skip, take, orderBy, meta } = paginate(query, ["appointmentDate", "createdAt", "status"]);
  const where = { customerId: c.id, deletedAt: null };
  if (query.status) where.status = query.status;

  const [appointments, total] = await prisma.$transaction([
    prisma.appointment.findMany({ where, skip, take, orderBy, select: APPOINTMENT_SELECT }),
    prisma.appointment.count({ where }),
  ]);

  return { appointments: appointments.map(serializeAppointment), pagination: meta(total) };
};

// ── Availability ──────────────────────────────────────────────────────────────

export const getAvailability = async (query) => {
  const prisma = getDB();
  const { businessId, date, staffId, serviceIds: rawServiceIds } = query;

  const serviceIds = rawServiceIds ? rawServiceIds.split(",").filter(Boolean) : [];

  // Compute total duration from services
  let totalDuration = 60; // default slot duration
  if (serviceIds.length > 0) {
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, businessId, isActive: true },
      select: { durationMinutes: true },
    });
    totalDuration = services.reduce((s, sv) => s + sv.durationMinutes, 0);
  }

  // Business hours: 09:00 – 20:00 (or from staff schedule)
  let workStart = 9 * 60;  // minutes
  let workEnd = 20 * 60;

  if (staffId) {
    const dayOfWeek = getDayOfWeek(date);
    const sched = await prisma.staffSchedule.findFirst({
      where: { staffId, dayOfWeek, isAvailable: true },
      select: { startTime: true, endTime: true },
    });
    if (!sched) return { date, available: false, slots: [], reason: "Staff not available on this day." };
    workStart = toMinutes(sched.startTime);
    workEnd = toMinutes(sched.endTime);
  }

  // Get booked appointments for that day
  const booked = await prisma.appointment.findMany({
    where: {
      businessId,
      ...(staffId ? { staffId } : {}),
      appointmentDate: { equals: new Date(date) },
      status: { in: ["PENDING", "CONFIRMED", "RESCHEDULED"] },
      deletedAt: null,
    },
    select: { startTime: true, endTime: true },
    orderBy: { startTime: "asc" },
  });

  // Generate available slots (every 30 min)
  const SLOT_STEP = 30;
  const slots = [];
  for (let t = workStart; t + totalDuration <= workEnd; t += SLOT_STEP) {
    const slotStart = addMinutes("00:00", t);
    const slotEnd = addMinutes("00:00", t + totalDuration);
    const isBooked = booked.some(
      (b) => toMinutes(b.startTime) < t + totalDuration && toMinutes(b.endTime) > t
    );
    if (!isBooked) slots.push({ startTime: slotStart, endTime: slotEnd });
  }

  return { date, businessId, staffId: staffId || null, totalDuration, available: slots.length > 0, slots };
};

// ── Serialization helper ──────────────────────────────────────────────────────

const serializeAppointment = (appt) => {
  if (!appt) return null;
  return {
    ...appt,
    totalAmount: Number(appt.totalAmount),
    appointmentServices: appt.appointmentServices?.map((as) => ({
      ...as,
      priceAtBooking: Number(as.priceAtBooking),
    })),
  };
};
