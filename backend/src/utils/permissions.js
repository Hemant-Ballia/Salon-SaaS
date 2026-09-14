/**
 * src/utils/permissions.js
 *
 * Role-based permission system.
 *
 * There are EXACTLY FOUR roles:
 *   ADMIN    - Platform administrator
 *   BUSINESS - Business owner (User.role = BUSINESS, Business.ownerId = User.id)
 *   STAFF    - Employee of a specific business
 *   CUSTOMER - End customer
 *
 * Permissions are checked server-side — never trust the client.
 *
 * Usage:
 *   import { hasPermission, PERMISSIONS } from "../utils/permissions.js";
 *   if (!hasPermission(req.user.role, PERMISSIONS.BUSINESS_UPDATE)) {
 *     throw ApiError.forbidden();
 *   }
 */

// ── Permission constants ───────────────────────────────────────────────────────

export const PERMISSIONS = {
  // --- Business ---
  BUSINESS_CREATE:  "business.create",
  BUSINESS_READ:    "business.read",
  BUSINESS_UPDATE:  "business.update",
  BUSINESS_DELETE:  "business.delete",
  BUSINESS_APPROVE: "business.approve",  // ADMIN only
  BUSINESS_REJECT:  "business.reject",   // ADMIN only
  BUSINESS_SUSPEND: "business.suspend",  // ADMIN only

  // --- Staff ---
  STAFF_CREATE: "staff.create",
  STAFF_READ:   "staff.read",
  STAFF_UPDATE: "staff.update",
  STAFF_DELETE: "staff.delete",

  // --- Service ---
  SERVICE_CREATE: "service.create",
  SERVICE_READ:   "service.read",
  SERVICE_UPDATE: "service.update",
  SERVICE_DELETE: "service.delete",

  // --- Appointment ---
  APPOINTMENT_CREATE:     "appointment.create",
  APPOINTMENT_READ:       "appointment.read",
  APPOINTMENT_UPDATE:     "appointment.update",
  APPOINTMENT_CANCEL:     "appointment.cancel",
  APPOINTMENT_COMPLETE:   "appointment.complete",
  APPOINTMENT_NO_SHOW:    "appointment.no_show",

  // --- Queue ---
  QUEUE_READ:     "queue.read",
  QUEUE_JOIN:     "queue.join",
  QUEUE_MANAGE:   "queue.manage",   // call/serve/complete/skip
  QUEUE_LEAVE:    "queue.leave",

  // --- Payment ---
  PAYMENT_READ:   "payment.read",
  PAYMENT_CREATE: "payment.create",
  PAYMENT_REFUND: "payment.refund",

  // --- Subscription ---
  SUBSCRIPTION_READ:   "subscription.read",
  SUBSCRIPTION_MANAGE: "subscription.manage",

  // --- Notification ---
  NOTIFICATION_READ:           "notification.read",
  NOTIFICATION_PREFERENCES:    "notification.preferences",

  // --- QR ---
  QR_CREATE: "qr.create",
  QR_READ:   "qr.read",
  QR_DELETE: "qr.delete",

  // --- Admin ---
  ADMIN_DASHBOARD:   "admin.dashboard",
  ADMIN_USERS:       "admin.users",
  ADMIN_BUSINESSES:  "admin.businesses",
  ADMIN_PAYMENTS:    "admin.payments",
  ADMIN_AUDIT_LOGS:  "admin.audit_logs",

  // --- User profile ---
  USER_READ_OWN:    "user.read_own",
  USER_UPDATE_OWN:  "user.update_own",
  USER_DELETE_OWN:  "user.delete_own",
};

// ── Role → permissions mapping ─────────────────────────────────────────────────

const ROLE_PERMISSIONS = {
  ADMIN: [
    // Admin has access to everything
    ...Object.values(PERMISSIONS),
  ],

  BUSINESS: [
    // Own profile
    PERMISSIONS.USER_READ_OWN,
    PERMISSIONS.USER_UPDATE_OWN,

    // Business (own only — enforced by ownership check in middleware)
    PERMISSIONS.BUSINESS_READ,
    PERMISSIONS.BUSINESS_UPDATE,

    // Staff management
    PERMISSIONS.STAFF_CREATE,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.STAFF_DELETE,

    // Service management
    PERMISSIONS.SERVICE_CREATE,
    PERMISSIONS.SERVICE_READ,
    PERMISSIONS.SERVICE_UPDATE,
    PERMISSIONS.SERVICE_DELETE,

    // Appointments
    PERMISSIONS.APPOINTMENT_READ,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.APPOINTMENT_CANCEL,
    PERMISSIONS.APPOINTMENT_COMPLETE,
    PERMISSIONS.APPOINTMENT_NO_SHOW,

    // Queue
    PERMISSIONS.QUEUE_READ,
    PERMISSIONS.QUEUE_MANAGE,

    // Payments (own business)
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_REFUND,

    // Subscription (own)
    PERMISSIONS.SUBSCRIPTION_READ,
    PERMISSIONS.SUBSCRIPTION_MANAGE,

    // Notifications
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_PREFERENCES,

    // QR
    PERMISSIONS.QR_CREATE,
    PERMISSIONS.QR_READ,
    PERMISSIONS.QR_DELETE,
  ],

  STAFF: [
    // Own profile
    PERMISSIONS.USER_READ_OWN,
    PERMISSIONS.USER_UPDATE_OWN,

    // Business (read-only, own business)
    PERMISSIONS.BUSINESS_READ,

    // Staff (read own)
    PERMISSIONS.STAFF_READ,

    // Services (read)
    PERMISSIONS.SERVICE_READ,

    // Appointments (read + limited update)
    PERMISSIONS.APPOINTMENT_READ,
    PERMISSIONS.APPOINTMENT_COMPLETE,
    PERMISSIONS.APPOINTMENT_NO_SHOW,

    // Queue
    PERMISSIONS.QUEUE_READ,
    PERMISSIONS.QUEUE_MANAGE,

    // Notifications
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_PREFERENCES,

    // QR (read)
    PERMISSIONS.QR_READ,
  ],

  CUSTOMER: [
    // Own profile
    PERMISSIONS.USER_READ_OWN,
    PERMISSIONS.USER_UPDATE_OWN,
    PERMISSIONS.USER_DELETE_OWN,

    // Business and services (public read)
    PERMISSIONS.BUSINESS_READ,
    PERMISSIONS.SERVICE_READ,

    // Appointments (own only — enforced separately)
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_READ,
    PERMISSIONS.APPOINTMENT_CANCEL,

    // Queue
    PERMISSIONS.QUEUE_READ,
    PERMISSIONS.QUEUE_JOIN,
    PERMISSIONS.QUEUE_LEAVE,

    // Payments (own)
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_CREATE,

    // Notifications (own)
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_PREFERENCES,

    // QR (read/scan)
    PERMISSIONS.QR_READ,
  ],
};

// Convert arrays to Sets for O(1) lookups
const COMPILED_PERMISSIONS = Object.fromEntries(
  Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => [role, new Set(perms)])
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Check if a role has a given permission.
 *
 * @param {string} role - UserRole enum value
 * @param {string} permission - PERMISSIONS constant value
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  const perms = COMPILED_PERMISSIONS[role];
  if (!perms) return false;
  return perms.has(permission);
};

/**
 * Check if a role has ALL of the given permissions.
 *
 * @param {string} role
 * @param {string[]} permissions
 * @returns {boolean}
 */
export const hasAllPermissions = (role, permissions) => {
  return permissions.every((p) => hasPermission(role, p));
};

/**
 * Check if a role has ANY of the given permissions.
 *
 * @param {string} role
 * @param {string[]} permissions
 * @returns {boolean}
 */
export const hasAnyPermission = (role, permissions) => {
  return permissions.some((p) => hasPermission(role, p));
};

/**
 * Get all permissions for a role.
 *
 * @param {string} role
 * @returns {string[]}
 */
export const getPermissionsForRole = (role) => {
  return Array.from(COMPILED_PERMISSIONS[role] || []);
};

export const ROLES = {
  ADMIN: "ADMIN",
  BUSINESS: "BUSINESS",
  STAFF: "STAFF",
  CUSTOMER: "CUSTOMER",
};

export default {
  PERMISSIONS,
  ROLES,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getPermissionsForRole,
};
