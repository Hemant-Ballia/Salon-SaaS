/**
 * src/utils/audit.js
 *
 * Centralized helper for generating immutable audit logs.
 */

import { getDB } from "../config/db.js";
import logger from "./logger.js";

/**
 * Creates an audit log asynchronously without blocking the main request thread.
 * 
 * @param {string|null} userId - The UUID of the user performing the action
 * @param {string|null} businessId - The UUID of the business, if applicable
 * @param {string} action - The action performed (e.g., 'login', 'business_created')
 * @param {string} entity - The affected entity (e.g., 'User', 'Business', 'Payment')
 * @param {string|null} entityId - The UUID of the affected entity
 * @param {object} metadata - Additional context (NEVER include passwords/secrets)
 */
export const auditLog = async (userId, businessId, action, entity, entityId = null, metadata = {}) => {
  try {
    const prisma = getDB();
    
    // Sanitize metadata to absolutely ensure no secrets are logged
    const safeMetadata = { ...metadata };
    delete safeMetadata.password;
    delete safeMetadata.otp;
    delete safeMetadata.secret;
    delete safeMetadata.token;

    await prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action,
        entity,
        entityId,
        metadata: safeMetadata,
      }
    });
  } catch (error) {
    logger.error(`[AuditLog] Failed to create log for action '${action}': ${error.message}`);
  }
};
