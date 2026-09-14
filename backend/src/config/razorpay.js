/**
 * src/config/razorpay.js
 *
 * Razorpay SDK initialisation.
 * Returns null if credentials are not configured (dev/test mode).
 */

import Razorpay from "razorpay";
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from "./env.js";
import logger from "../utils/logger.js";

let instance = null;

export const getRazorpay = () => {
  if (instance) return instance;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    logger.warn("[Razorpay] No credentials configured — running in stub mode.");
    return null;
  }

  instance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });

  logger.info("[Razorpay] Initialised.");
  return instance;
};

export default getRazorpay;
