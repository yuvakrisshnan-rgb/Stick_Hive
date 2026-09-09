"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AuthUser = {
  id: string;
  email: string;
  isAdmin?: boolean;
  adminPath?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  sendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (
    email: string,
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function parseResponse(response: Response) {
  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  const payload =
    data && typeof data === "object"
      ? (data as Record<string, unknown>)
      : {};

  const rawUser =
    payload.user && typeof payload.user === "object"
      ? (payload.user as Record<string, unknown>)
      : null;

  return {
    ok: response.ok,
    success: payload.success === true,
    error: typeof payload.error === "string" ? payload.error : undefined,
    user:
      rawUser &&
      typeof rawUser.id === "string" &&
      typeof rawUser.email === "string"
        ? {
            id: rawUser.id,
            email: rawUser.email,
            isAdmin: rawUser.isAdmin === true,
            adminPath:
              typeof rawUser.adminPath === "string"
                ? rawUser.adminPath
                : undefined,
          }
        : null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result = await parseResponse(response);
      setUser(result.ok && result.user ? result.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sendOtp = useCallback(async (email: string) => {
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const result = await parseResponse(response);

      return {
        success: result.ok && result.success,
        error: result.error,
      };
    } catch {
      return {
        success: false,
        error: "Unable to contact Stick Hive right now. Please try again.",
      };
    }
  }, []);

  const verifyOtp = useCallback(
    async (email: string, code: string) => {
      try {
        const response = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, code }),
        });

        const result = await parseResponse(response);

        if (result.ok && result.success && result.user) {
          setUser(result.user);
          // Refresh once after login so admin-only navigation metadata is loaded
          // from the server without exposing the admin allowlist to the client.
          await refresh();
          return { success: true };
        }

        return {
          success: false,
          error: result.error || "Unable to verify that code.",
        };
      } catch {
        return {
          success: false,
          error: "Unable to contact Stick Hive right now. Please try again.",
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      sendOtp,
      verifyOtp,
      logout,
    }),
    [user, loading, refresh, sendOtp, verifyOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
