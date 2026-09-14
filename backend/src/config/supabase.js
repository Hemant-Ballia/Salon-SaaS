/**
 * src/config/supabase.js
 *
 * Server-side Supabase admin client.
 *
 * IMPORTANT RULES:
 *   • This module is BACKEND ONLY.
 *   • SUPABASE_SECRET_KEY must NEVER reach frontend code.
 *   • Prisma remains the primary ORM — use this client only for
 *     Supabase-specific server-side operations (e.g., storage, auth admin).
 *   • Do not use this client as a competing database query layer.
 */

import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  SUPABASE_PUBLISHABLE_KEY,
} from "./env.js";

// ── Admin client (server-side only) ──────────────────────────────────────────

let supabaseAdmin = null;

/**
 * Get the server-side Supabase admin client.
 * Uses SUPABASE_SECRET_KEY — backend only.
 *
 * Returns null if credentials are not configured (graceful degradation).
 */
export const getSupabaseAdmin = () => {
  if (supabaseAdmin) return supabaseAdmin;

  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    console.warn(
      "⚠️  Supabase admin client not initialised — SUPABASE_URL or SUPABASE_SECRET_KEY is missing. " +
        "Supabase-specific features will be unavailable."
    );
    return null;
  }

  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
};

// ── Public (anon) client ──────────────────────────────────────────────────────

let supabasePublic = null;

/**
 * Get the public Supabase client (uses anon/publishable key).
 * Safe for server-side usage only — do not forward this to the frontend
 * if it accesses sensitive Supabase services.
 *
 * Returns null if credentials are not configured.
 */
export const getSupabasePublic = () => {
  if (supabasePublic) return supabasePublic;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.warn(
      "⚠️  Supabase public client not initialised — SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY is missing."
    );
    return null;
  }

  supabasePublic = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return supabasePublic;
};

export default getSupabaseAdmin;
