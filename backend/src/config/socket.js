/**
 * src/config/socket.js
 *
 * Socket.IO server initialisation with JWT authentication
 * and business-level room isolation.
 *
 * Room convention:
 *   business:<businessId>   → Business + Staff of that business
 *   customer:<userId>       → Individual customer notifications
 *   admin                   → Admin-only events
 *
 * CRITICAL: Business A must NEVER receive Business B events.
 */

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_ACCESS_SECRET, SOCKET_CORS_ORIGIN } from "./env.js";
import { getDB } from "./db.js";
import logger from "../utils/logger.js";

let io = null;

/**
 * Initialise Socket.IO on an existing HTTP server.
 *
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server}
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: SOCKET_CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // ── JWT Authentication middleware ─────────────────────────────────────────

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("AUTH_REQUIRED"));

      const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      socket.user = { userId: decoded.userId, role: decoded.role };

      // Resolve business context so we can auto-join the right rooms
      const prisma = getDB();
      if (decoded.role === "BUSINESS") {
        const biz = await prisma.business.findFirst({
          where: { ownerId: decoded.userId, deletedAt: null },
          select: { id: true },
        });
        if (biz) socket.user.businessId = biz.id;
      } else if (decoded.role === "STAFF") {
        const staff = await prisma.staff.findFirst({
          where: { userId: decoded.userId, deletedAt: null },
          select: { businessId: true },
        });
        if (staff) socket.user.businessId = staff.businessId;
      }

      next();
    } catch (err) {
      logger.warn(`[Socket] Auth failed: ${err.message}`);
      next(new Error("AUTH_INVALID"));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────

  io.on("connection", (socket) => {
    const { userId, role, businessId } = socket.user;
    logger.info(`[Socket] Connected: userId=${userId} role=${role}`);

    // Auto-join rooms based on role
    if (role === "ADMIN") {
      socket.join("admin");
    }

    if (role === "BUSINESS" || role === "STAFF") {
      if (businessId) {
        socket.join(`business:${businessId}`);
        logger.info(`[Socket] userId=${userId} joined room business:${businessId}`);
      }
    }

    if (role === "CUSTOMER") {
      socket.join(`customer:${userId}`);
    }

    // Allow clients to subscribe to a specific business's public feed
    // (e.g. customer watching a live queue board)
    socket.on("subscribe:business", (bizId) => {
      if (typeof bizId === "string" && bizId.length === 36) {
        socket.join(`business:${bizId}:public`);
      }
    });

    socket.on("disconnect", (reason) => {
      logger.info(`[Socket] Disconnected: userId=${userId} reason=${reason}`);
    });
  });

  logger.info("[Socket] Socket.IO initialised");
  return io;
};

/**
 * Get the Socket.IO instance. Returns null if not yet initialised.
 *
 * @returns {import("socket.io").Server | null}
 */
export const getIO = () => io;

// ── Emit helpers ────────────────────────────────────────────────────────────

/**
 * Emit an event to a specific business room (BUSINESS + STAFF only).
 */
export const emitToBusiness = (businessId, event, data) => {
  if (!io) return;
  io.to(`business:${businessId}`).emit(event, data);
};

/**
 * Emit to a business's public room (includes customers watching).
 */
export const emitToBusinessPublic = (businessId, event, data) => {
  if (!io) return;
  io.to(`business:${businessId}`).to(`business:${businessId}:public`).emit(event, data);
};

/**
 * Emit to a specific customer.
 */
export const emitToCustomer = (userId, event, data) => {
  if (!io) return;
  io.to(`customer:${userId}`).emit(event, data);
};

/**
 * Emit to admin room.
 */
export const emitToAdmin = (event, data) => {
  if (!io) return;
  io.to("admin").emit(event, data);
};
