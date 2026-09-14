/**
 * src/config/twilio.js
 *
 * Twilio client singleton for SMS and WhatsApp.
 *
 * If credentials are not configured, the client is null and callers
 * must handle the absence gracefully (log warning, skip channel).
 */

import twilio from "twilio";
import {
  SMS_ACCOUNT_SID,
  SMS_AUTH_TOKEN,
  SMS_FROM,
  WHATSAPP_ACCOUNT_SID,
  WHATSAPP_AUTH_TOKEN,
  WHATSAPP_FROM,
  IS_PRODUCTION,
} from "./env.js";
import logger from "../utils/logger.js";

// ── SMS client ────────────────────────────────────────────────────────────────

let smsClient = null;

export const getSmsClient = () => {
  if (smsClient) return smsClient;
  if (!SMS_ACCOUNT_SID || !SMS_AUTH_TOKEN) {
    if (IS_PRODUCTION) {
      logger.warn("[Twilio SMS] Credentials not configured. SMS will not be sent.");
    }
    return null;
  }
  smsClient = twilio(SMS_ACCOUNT_SID, SMS_AUTH_TOKEN);
  return smsClient;
};

/**
 * Send an SMS message.
 *
 * @param {string} to - E.164 phone number e.g. "+919876543210"
 * @param {string} body - Message text
 * @returns {Promise<object|null>}
 */
export const sendSms = async (to, body) => {
  const client = getSmsClient();

  if (!client) {
    logger.warn(`[Twilio SMS] Skipped — not configured. Would have sent to: ${to}`);
    return null;
  }

  if (!SMS_FROM) {
    throw new Error("[Twilio SMS] SMS_FROM is not configured.");
  }

  return client.messages.create({ from: SMS_FROM, to, body });
};

// ── WhatsApp client ───────────────────────────────────────────────────────────

let waClient = null;

export const getWhatsAppClient = () => {
  if (waClient) return waClient;
  if (!WHATSAPP_ACCOUNT_SID || !WHATSAPP_AUTH_TOKEN) {
    if (IS_PRODUCTION) {
      logger.warn("[Twilio WA] Credentials not configured. WhatsApp messages will not be sent.");
    }
    return null;
  }
  waClient = twilio(WHATSAPP_ACCOUNT_SID, WHATSAPP_AUTH_TOKEN);
  return waClient;
};

/**
 * Send a WhatsApp message via Twilio.
 *
 * @param {string} to - E.164 phone number e.g. "+919876543210"
 * @param {string} body - Message text
 * @returns {Promise<object|null>}
 */
export const sendWhatsApp = async (to, body) => {
  const client = getWhatsAppClient();

  if (!client) {
    logger.warn(`[Twilio WA] Skipped — not configured. Would have sent to: ${to}`);
    return null;
  }

  if (!WHATSAPP_FROM) {
    throw new Error("[Twilio WA] WHATSAPP_FROM is not configured.");
  }

  return client.messages.create({
    from: `whatsapp:${WHATSAPP_FROM}`,
    to: `whatsapp:${to}`,
    body,
  });
};

export default { getSmsClient, getWhatsAppClient, sendSms, sendWhatsApp };
