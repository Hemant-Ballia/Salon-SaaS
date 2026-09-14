/**
 * src/modules/appointments/appointments.controller.js
 */

import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from "../../utils/response.js";
import * as service from "./appointments.service.js";

export const createAppointmentController = asyncHandler(async (req, res) => {
  const result = await service.createAppointment(req.body, req.user);
  return sendCreated(res, "Appointment booked successfully.", result);
});

export const listAppointmentsController = asyncHandler(async (req, res) => {
  const { appointments, pagination } = await service.listAppointments(req.query, req.user);
  return sendPaginated(res, "Appointments fetched.", appointments, pagination);
});

export const getAppointmentController = asyncHandler(async (req, res) => {
  const result = await service.getAppointmentById(req.params.id, req.user);
  return sendSuccess(res, "Appointment fetched.", result);
});

export const updateAppointmentController = asyncHandler(async (req, res) => {
  const result = await service.updateAppointment(req.params.id, req.body, req.user);
  return sendSuccess(res, "Appointment updated.", result);
});

export const deleteAppointmentController = asyncHandler(async (req, res) => {
  await service.deleteAppointment(req.params.id, req.user);
  return sendNoContent(res);
});

export const confirmAppointmentController = asyncHandler(async (req, res) => {
  const result = await service.confirmAppointment(req.params.id, req.user);
  return sendSuccess(res, "Appointment confirmed.", result);
});

export const cancelAppointmentController = asyncHandler(async (req, res) => {
  const result = await service.cancelAppointment(req.params.id, req.body, req.user);
  return sendSuccess(res, "Appointment cancelled.", result);
});

export const rescheduleAppointmentController = asyncHandler(async (req, res) => {
  const result = await service.rescheduleAppointment(req.params.id, req.body, req.user);
  return sendSuccess(res, "Appointment rescheduled.", result);
});

export const completeAppointmentController = asyncHandler(async (req, res) => {
  const result = await service.completeAppointment(req.params.id, req.user);
  return sendSuccess(res, "Appointment marked as completed.", result);
});

export const noShowAppointmentController = asyncHandler(async (req, res) => {
  const result = await service.noShowAppointment(req.params.id, req.user);
  return sendSuccess(res, "Appointment marked as no-show.", result);
});

export const getMyAppointmentsController = asyncHandler(async (req, res) => {
  const { appointments, pagination } = await service.getMyAppointments(req.query, req.user);
  return sendPaginated(res, "Your appointments fetched.", appointments, pagination);
});

export const getAvailabilityController = asyncHandler(async (req, res) => {
  const result = await service.getAvailability(req.query);
  return sendSuccess(res, "Availability fetched.", result);
});
