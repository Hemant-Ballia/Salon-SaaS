"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, Business } from "@/types/models";
import { LoginCredentials, RegisterBusinessInput } from "@/types/auth";
import { loginApi, registerBusinessApi, logoutApi, getMeApi } from "@/lib/api/auth";
import { getMyBusinessApi } from "@/lib/api/business";
import { getErrorMessage } from "@/lib/api/client";

interface AuthContextType {
  user: User | null;
  business: Business | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  registerBusiness: (input: RegisterBusinessInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshBusiness = useCallback(async () => {
    try {
      const biz = await getMyBusinessApi();
      if (biz) {
        setBusiness(biz);
        localStorage.setItem("biz_current", JSON.stringify(biz));
      }
    } catch {
      // keep current business state
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("biz_access_token");
      if (storedToken) {
        setToken(storedToken);
        try {
          const currentUser = await getMeApi();
          if (currentUser.role === "BUSINESS") {
            setUser(currentUser);
            localStorage.setItem("biz_user", JSON.stringify(currentUser));
            const currentBiz = await getMyBusinessApi();
            if (currentBiz) {
              setBusiness(currentBiz);
              localStorage.setItem("biz_current", JSON.stringify(currentBiz));
            }
          } else {
            // Not a business account
            localStorage.removeItem("biz_access_token");
            localStorage.removeItem("biz_user");
            localStorage.removeItem("biz_current");
            setToken(null);
            setUser(null);
            setBusiness(null);
          }
        } catch {
          localStorage.removeItem("biz_access_token");
          localStorage.removeItem("biz_user");
          localStorage.removeItem("biz_current");
          setToken(null);
          setUser(null);
          setBusiness(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Protected route enforcement
  useEffect(() => {
    if (isLoading) return;

    const isPublic = pathname === "/login" || pathname === "/register";

    if (!user && !isPublic) {
      router.replace("/login");
    } else if (user && isPublic) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, pathname, router]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const data = await loginApi(credentials);
      if (data.user.role !== "BUSINESS") {
        throw new Error("Access restricted: This portal is for registered salon and service business owners.");
      }

      localStorage.setItem("biz_access_token", data.accessToken);
      localStorage.setItem("biz_user", JSON.stringify(data.user));
      setToken(data.accessToken);
      setUser(data.user);

      // Fetch owned business
      const biz = await getMyBusinessApi();
      if (biz) {
        setBusiness(biz);
        localStorage.setItem("biz_current", JSON.stringify(biz));
      }

      router.replace("/dashboard");
    } catch (err: unknown) {
      throw new Error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const registerBusiness = async (input: RegisterBusinessInput) => {
    setIsLoading(true);
    try {
      const data = await registerBusinessApi(input);
      localStorage.setItem("biz_access_token", data.accessToken);
      localStorage.setItem("biz_user", JSON.stringify(data.user));
      setToken(data.accessToken);
      setUser(data.user);

      const biz = await getMyBusinessApi();
      if (biz) {
        setBusiness(biz);
        localStorage.setItem("biz_current", JSON.stringify(biz));
      }

      router.replace("/dashboard");
    } catch (err: unknown) {
      throw new Error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // client cleanup
    } finally {
      localStorage.removeItem("biz_access_token");
      localStorage.removeItem("biz_user");
      localStorage.removeItem("biz_current");
      setUser(null);
      setBusiness(null);
      setToken(null);
      router.replace("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        token,
        isLoading,
        isAuthenticated: !!user && user.role === "BUSINESS",
        login,
        registerBusiness,
        logout,
        refreshBusiness,
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
