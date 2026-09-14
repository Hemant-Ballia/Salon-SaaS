/**
 * src/config/db.js
 *
 * Prisma client singleton.
 *
 * Architecture:
 *   Express app
 *     |
 *   PrismaClient  (this module)
 *     |
 *   Supabase PostgreSQL
 *
 * IMPORTANT — ES Module import hoisting:
 *   In ESM, all `import` statements are hoisted and evaluated before any code
 *   runs. This means dotenv MUST be loaded before PrismaClient is instantiated.
 *   We use a lazy-init pattern: the PrismaClient is created inside connectDB()
 *   (called at runtime) rather than at module-load time, ensuring .env is
 *   already loaded by the time the client is constructed.
 *
 * Rules:
 *   - Single PrismaClient instance across the entire process.
 *   - connectDB() must be called before app.listen() in server.js.
 *   - A connection failure will throw — let the caller decide whether to exit.
 *   - Never log DATABASE_URL or any credentials.
 */

import { PrismaClient } from "@prisma/client";

// Lazy singleton — created on first connectDB() call, not at import time.
let prisma = null;

/**
 * Get or create the Prisma client singleton.
 * Safe to call multiple times — always returns the same instance.
 */
const getPrismaClient = () => {
  if (prisma) return prisma;

  const isDevelopment = process.env.NODE_ENV !== "production";

  // In development, reuse the instance across nodemon hot-reload cycles
  // by attaching it to globalThis.
  if (isDevelopment) {
    if (!globalThis.__prisma) {
      globalThis.__prisma = new PrismaClient({
        log: ["info", "warn", "error"],
      });
    }
    prisma = globalThis.__prisma;
  } else {
    prisma = new PrismaClient({
      log: ["error", "warn"],
    });
  }

  return prisma;
};

/**
 * Connect Prisma to the database.
 *
 * Call this once during server startup — AFTER dotenv has loaded .env.
 * Throws on failure so server.js can exit cleanly.
 */
export const connectDB = async () => {
  try {
    const client = getPrismaClient();
    await client.$connect();
    console.log("Prisma connected to PostgreSQL successfully");
    return client;
  } catch (error) {
    console.error("Prisma failed to connect to PostgreSQL:");
    console.error("  " + error.message);
    throw error;
  }
};

/**
 * Disconnect Prisma.
 * Call this during graceful shutdown.
 */
export const disconnectDB = async () => {
  try {
    if (prisma) {
      await prisma.$disconnect();
      console.log("Prisma disconnected from PostgreSQL");
    }
  } catch (error) {
    console.error("Error during Prisma disconnect:", error.message);
  }
};

/**
 * Get the active Prisma client instance.
 * Only call this after connectDB() has been called.
 */
export const getDB = () => {
  if (!prisma) {
    throw new Error(
      "Prisma client not initialised. Call connectDB() before using getDB()."
    );
  }
  return prisma;
};

export default getPrismaClient;
