"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User } from "@/types/models";
import { LoginCredentials } from "@/types/auth";
import { loginApi, logoutApi, getMeApi } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getMeApi();
      if (currentUser.role !== "ADMIN") {
        throw new Error("Access denied: You do not possess the ADMIN role.");
      }
      setUser(currentUser);
      localStorage.setItem("admin_user", JSON.stringify(currentUser));
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("admin_user");
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("admin_access_token");
      if (storedToken) {
        setToken(storedToken);
        try {
          const currentUser = await getMeApi();
          if (currentUser.role === "ADMIN") {
            setUser(currentUser);
          } else {
            localStorage.removeItem("admin_access_token");
            localStorage.removeItem("admin_user");
            setToken(null);
            setUser(null);
          }
        } catch {
          localStorage.removeItem("admin_access_token");
          localStorage.removeItem("admin_user");
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Protected route enforcement
  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = pathname === "/login";

    if (!user && !isAuthRoute) {
      router.replace("/login");
    } else if (user && isAuthRoute) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, pathname, router]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const data = await loginApi(credentials);

      if (data.user.role !== "ADMIN") {
        throw new Error("Access restricted: Only system administrators can access this portal.");
      }

      localStorage.setItem("admin_access_token", data.accessToken);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      setToken(data.accessToken);
      setUser(data.user);

      router.replace("/dashboard");
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Proceed with client cleanup even if backend call fails
    } finally {
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("admin_user");
      setUser(null);
      setToken(null);
      router.replace("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && user.role === "ADMIN",
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
