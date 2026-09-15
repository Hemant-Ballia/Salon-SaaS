"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, Staff } from "@/types/models";
import { LoginCredentials } from "@/types/auth";
import { loginApi, logoutApi, getMeApi } from "@/lib/api/auth";
import { getStaffListApi } from "@/lib/api/staff";

interface AuthContextType {
  user: User | null;
  staff: Staff | null;
  staffId: string | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshStaffProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  staff: null,
  staffId: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshStaffProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchStaffProfile = async (currentUser: User) => {
    try {
      const list = await getStaffListApi();
      const matched = list.find(
        (s) => s.userId === currentUser.id || s.user?.id === currentUser.id || s.user?.email === currentUser.email
      );
      if (matched) {
        setStaff(matched);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("staff_access_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        const { user: me } = await getMeApi();
        if (me.role !== "STAFF") {
          localStorage.removeItem("staff_access_token");
          setToken(null);
          setUser(null);
          setIsLoading(false);
          return;
        }
        setUser(me);
        await fetchStaffProfile(me);
      } catch {
        localStorage.removeItem("staff_access_token");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const result = await loginApi(credentials);
    if (result.user.role !== "STAFF") {
      throw new Error("Access restricted: You must have a STAFF account to enter the Staff Portal.");
    }

    localStorage.setItem("staff_access_token", result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);

    await fetchStaffProfile(result.user);
    router.replace("/dashboard");
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignored
    } finally {
      localStorage.removeItem("staff_access_token");
      setToken(null);
      setUser(null);
      setStaff(null);
      router.replace("/login");
    }
  };

  const refreshStaffProfile = async () => {
    if (user) {
      await fetchStaffProfile(user);
    }
  };

  const isAuthenticated = !!token && !!user && user.role === "STAFF";

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && pathname !== "/login") {
        router.replace("/login");
      } else if (isAuthenticated && pathname === "/login") {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        staff,
        staffId: staff?.id || null,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshStaffProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);