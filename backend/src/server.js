/**
 * src/server.js
 *
 * Application entry point.
 *
 * Startup sequence:
 *   1. Load .env (dotenv.config) — MUST happen before any other imports
 *      use process.env. Achieved by calling dotenv.config() synchronously
 *      at the top of this file, then importing the rest.
 *   2. Connect Prisma to Supabase PostgreSQL
 *   3. Start Express HTTP server
 *   4. Handle graceful shutdown on SIGTERM / SIGINT
 *
 * ES Module note:
 *   In ESM, `import` statements are hoisted and evaluated before any code.
 *   To load .env before Prisma reads DATABASE_URL, we load dotenv first
 *   using a top-level `createRequire` trick — or more simply, we ensure
 *   db.js uses lazy PrismaClient init (created at runtime, not import time).
 *   See src/config/db.js for the lazy-init pattern.
 */

import dotenv from "dotenv";

// Load .env synchronously — this runs before connectDB() calls new PrismaClient()
// because db.js uses lazy initialization (PrismaClient created inside connectDB,
// not at module-load time).
dotenv.config();

import { createServer } from "node:http";
import { PORT } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { initSocket } from "./config/socket.js";
import logger from "./utils/logger.js";
import app from "./app.js";

// Init Background Jobs (BullMQ workers)
import "./jobs/notification.job.js";
import "./jobs/payment.job.js";
import "./jobs/queue.job.js";

let server;

const startServer = async () => {
  // Step 1: Connect to the database
  try {
    await connectDB();
  } catch (error) {
    console.error(
      "Database connection failed. Server will not start.\n",
      error.message
    );
    process.exit(1);
  }

  // Step 2: Create HTTP server and attach Socket.IO
  server = createServer(app);
  initSocket(server);

  // Step 3: Start listening
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`  API base  : http://localhost:${PORT}/api/v1`);
    console.log(`  Health    : http://localhost:${PORT}/api/health`);
    console.log(`  Socket.IO : ws://localhost:${PORT}`);
    console.log(`  Env       : ${process.env.NODE_ENV || "development"}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use.`);
    } else {
      console.error("Server error:", error.message);
    }
    process.exit(1);
  });
};

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      console.log("HTTP server closed.");
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }

  // Force exit after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error("Forcing exit after shutdown timeout.");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error.message);
  console.error(error.stack);
  process.exit(1);
});

startServer();
