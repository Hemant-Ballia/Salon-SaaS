"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-context";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribeToBusiness: (businessId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  subscribeToBusiness: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
    const s = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    s.on("connect", () => {
      setIsConnected(true);
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });

    s.on("connect_error", () => {
      setIsConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token, isAuthenticated]);

  const subscribeToBusiness = (businessId: string) => {
    if (socket && isConnected && businessId) {
      socket.emit("subscribe:business", businessId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, subscribeToBusiness }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);