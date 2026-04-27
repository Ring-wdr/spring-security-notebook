"use client";

import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from "@/lib/auth-storage";
import { apiRequest } from "@/lib/api-client";
import type { CurrentUser, StoredSession, TokenPairResponse } from "@/lib/types";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  session: StoredSession | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() =>
    getStoredSession(),
  );
  const [status, setStatus] = useState<AuthStatus>(() =>
    getStoredSession() ? "authenticated" : "anonymous",
  );

  useEffect(() => {
    if (getStoredSession()) {
      void refreshUserState();
    }
  }, []);

  async function refreshUserState() {
    try {
      const user = await apiRequest<CurrentUser>("/api/users/me");
      const currentSession = getStoredSession();
      if (!currentSession) {
        clearStoredSession();
        setSession(null);
        setStatus("anonymous");
        return;
      }

      const nextSession: StoredSession = {
        ...currentSession,
        user,
      };
      setStoredSession(nextSession);
      setSession(nextSession);
      setStatus("authenticated");
    } catch {
      clearStoredSession();
      setSession(null);
      setStatus("anonymous");
    }
  }

  async function login(email: string, password: string) {
    const body = new URLSearchParams({
      email,
      password,
    });

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      let errorCode = `HTTP_${response.status}`;
      try {
        const data = (await response.json()) as {
          error?: string;
          message?: string;
        };
        errorCode = data.error ?? data.message ?? errorCode;
      } catch {
        // ignore malformed error payload
      }

      throw new Error(errorCode);
    }

    const tokens = (await response.json()) as TokenPairResponse;
    const nextSession: StoredSession = {
      tokens,
      user: null,
    };

    setStoredSession(nextSession);
    setSession(nextSession);
    setStatus("authenticated");
    await refreshUserState();
  }

  async function logout() {
    try {
      if (getStoredSession()) {
        await apiRequest("/api/auth/logout", {
          method: "POST",
          skipRefresh: true,
        });
      }
    } catch {
      // ignore logout failures and clear client state anyway
    } finally {
      clearStoredSession();
      setSession(null);
      setStatus("anonymous");
    }
  }

  const value: AuthContextValue = {
    status,
    session,
    login,
    logout,
    refreshUser: refreshUserState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
