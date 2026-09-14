/**
 * src/config/mailer.js
 *
 * Nodemailer transporter singleton.
 *
 * Usage:
 *   import mailer from "../config/mailer.js";
 *   await mailer.sendMail({ to, subject, html });
 *
 * In development with no SMTP credentials, Nodemailer will create a
 * preview URL via Ethereal — check the console output.
 */

import nodemailer from "nodemailer";
import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_FROM,
  IS_PRODUCTION,
} from "./env.js";
import logger from "../utils/logger.js";

let transporter;

/**
 * Build a transporter.
 * In development without SMTP credentials, uses Ethereal test account.
 */
const createTransporter = async () => {
  if (SMTP_USER && SMTP_PASSWORD) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
  }

  if (!IS_PRODUCTION) {
    // Ethereal fake SMTP for development — no real emails sent
    const testAccount = await nodemailer.createTestAccount();
    logger.info(`[Mailer] No SMTP credentials. Using Ethereal test account: ${testAccount.user}`);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  throw new Error(
    "[Mailer] SMTP_USER and SMTP_PASSWORD are required in production. Check your .env file."
  );
};

/**
 * Get the Nodemailer transporter (singleton).
 * Lazy-initialised on first use.
 */
export const getMailer = async () => {
  if (!transporter) {
    transporter = await createTransporter();
  }
  return transporter;
};

/**
 * Send an email.
 *
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 * @returns {Promise<object>} Nodemailer info object
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const t = await getMailer();

  const info = await t.sendMail({
    from: SMTP_FROM || "noreply@salonsaas.dev",
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ""),
  });

  if (!IS_PRODUCTION) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`[Mailer] Preview URL: ${previewUrl}`);
    }
  }

  return info;
};

export default { getMailer, sendEmail };
