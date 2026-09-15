import { PrismaClient } from "@prisma/client";

// Global cache to prevent multiple instances in serverless / hot-reloads
const globalForPrisma = globalThis;

/**
 * Get or create the Prisma client singleton.
 */
const getPrismaClient = () => {
  if (!globalForPrisma.__prisma) {
    const isDevelopment = process.env.NODE_ENV !== "production";

    globalForPrisma.__prisma = new PrismaClient({
      log: isDevelopment ? ["info", "warn", "error"] : ["error", "warn"],
    });
  }

  return globalForPrisma.__prisma;
};

/**
 * Connect Prisma to the database explicitly (Optional for Express startup)
 */
export const connectDB = async () => {
  try {
    const client = getPrismaClient();
    await client.$connect();
    console.log("Prisma connected to PostgreSQL successfully");
    return client;
  } catch (error) {
    console.error("Prisma failed to connect to PostgreSQL:", error.message);
    throw error;
  }
};

/**
 * Disconnect Prisma.
 */
export const disconnectDB = async () => {
  try {
    if (globalForPrisma.__prisma) {
      await globalForPrisma.__prisma.$disconnect();
      console.log("Prisma disconnected from PostgreSQL");
    }
  } catch (error) {
    console.error("Error during Prisma disconnect:", error.message);
  }
};

/**
 * Get the active Prisma client instance.
 * Safe for both Serverless (Vercel) and traditional Express servers.
 */
export const getDB = () => {
  // Agar manually connectDB() call nahi hua, toh yeh auto-create kar lega
  return getPrismaClient();
};

export default getPrismaClient;