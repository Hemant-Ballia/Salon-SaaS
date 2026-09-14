/**
 * src/utils/transaction.js
 *
 * Prisma transaction helpers.
 *
 * Use these for operations that span multiple tables where atomicity is required:
 *   - Appointment creation (Appointment + AppointmentService records)
 *   - Payment state changes
 *   - Queue token generation (read-modify-write to prevent race conditions)
 *   - Business creation (Business + related records)
 *   - Staff creation (User + Staff records)
 *   - Any multi-table update that must succeed or fail together
 *
 * Usage:
 *   import { withTransaction } from "../utils/transaction.js";
 *   const result = await withTransaction(async (tx) => {
 *     const appt = await tx.appointment.create({ data: { ... } });
 *     await tx.appointmentService.createMany({ data: [...] });
 *     return appt;
 *   });
 */

import { getDB } from "../config/db.js";

/**
 * Execute a function inside a Prisma interactive transaction.
 *
 * If the callback throws, the transaction is automatically rolled back.
 * If the callback succeeds, the transaction is committed.
 *
 * @param {Function} fn - async (tx: PrismaClient) => T
 * @param {object} [options] - Prisma transaction options
 * @param {number} [options.maxWait=5000] - Max ms to wait for a connection
 * @param {number} [options.timeout=10000] - Max ms for the transaction to complete
 * @returns {Promise<T>}
 */
export const withTransaction = async (fn, options = {}) => {
  const prisma = getDB();
  return prisma.$transaction(fn, {
    maxWait: options.maxWait ?? 5000,
    timeout: options.timeout ?? 10000,
  });
};

/**
 * Execute a Prisma batch transaction (array of operations).
 * All operations run in a single transaction — all succeed or all fail.
 *
 * @param {Promise[]} operations - Array of Prisma query promises
 * @returns {Promise<any[]>}
 */
export const withBatchTransaction = async (operations) => {
  const prisma = getDB();
  return prisma.$transaction(operations);
};
