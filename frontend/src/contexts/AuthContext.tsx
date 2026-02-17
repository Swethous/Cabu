"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { meApi, logoutApi } from "@/features/auth/api";

export type User = {
  id: number | string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: string;
};

type AuthContextValue = {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void; // 로그인 직후 즉시 반영용
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await meApi();         // { user: {...} } 가정
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();                  // Next BFF가 쿠키 삭제
    } finally {
      setUser(null);
    }
  };

  // 앱 시작 시 로그인 상태 복원 1회
  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      loading,
      refreshUser,
      logout,
      setUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}