"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types/models";
import { LoginCredentials, RegisterCustomerData } from "@/types/auth";
import { loginApi, registerCustomerApi, logoutApi, getMeApi } from "@/lib/api/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterCustomerData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("customer_access_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        const { user: me } = await getMeApi();
        setUser(me);
      } catch {
        localStorage.removeItem("customer_access_token");
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
    localStorage.setItem("customer_access_token", result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);
    router.replace("/home");
  };

  const register = async (data: RegisterCustomerData) => {
    await registerCustomerApi(data);
    // After register, prompt login or auto login if credentials provided
    if (data.password) {
      await login({ email: data.email, password: data.password });
    } else {
      router.replace("/login");
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignored
    } finally {
      localStorage.removeItem("customer_access_token");
      setToken(null);
      setUser(null);
      router.replace("/");
    }
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const { user: me } = await getMeApi();
        setUser(me);
      } catch {
        // Ignored
      }
    }
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);