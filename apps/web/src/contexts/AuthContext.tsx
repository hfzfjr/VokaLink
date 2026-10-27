"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { UserRole } from "@vokalink/shared";
import { supabase } from "@/lib/supabase";

export interface AuthSchool {
  id: string;
  name: string;
  npsn: string;
  province: string;
  city: string;
  isDemoSandbox: boolean;
}

export interface AuthDepartment {
  id: string;
  name: string;
  sectorCode: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  role: UserRole;
  fullName: string;
  identityNumber: string | null;
  whatsappNumber: string | null;
  school: AuthSchool | null;
  department: AuthDepartment | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithIdentifier: (
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  setSession: (token: string, user: AuthUser) => void;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "vokalink_auth_token";
const USER_KEY = "vokalink_auth_user";

function setAuthCookies(role: string | null, token: string | null) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  if (role && token) {
    document.cookie = `vokalink_role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `vokalink_token_exists=true; path=/; max-age=${maxAge}; SameSite=Lax`;
  } else {
    document.cookie = "vokalink_role=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "vokalink_token_exists=; path=/; max-age=0; SameSite=Lax";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const apiUrl =
    process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3001/api/v1";

  // Simpan sesi ke state dan storage
  const setSession = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    try {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setAuthCookies(newUser.role, newToken);
      // Bersihkan cache refData IndexedDB jika berganti akun
      import("@/lib/pwa/db").then(({ db }) => {
        db.refData.clear().catch(() => {});
      }).catch(() => {});
    } catch {
      // Ignored for restricted environments
    }
  }, []);

  // Hapus seluruh sesi (Logout)
  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setAuthCookies(null, null);
      try {
        const { db } = await import("@/lib/pwa/db");
        await db.refData.clear();
      } catch {}
      await supabase.auth.signOut();
    } catch {
      // Ignored
    }
  }, []);

  // Verifikasi token aktif ke backend
  const verifyTokenWithBackend = useCallback(
    async (rawToken: string): Promise<AuthUser | null> => {
      try {
        const res = await fetch(`${apiUrl}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${rawToken}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const json = await res.json();
          const verifiedUser: AuthUser = json.data;
          setSession(rawToken, verifiedUser);
          return verifiedUser;
        }

        if (res.status === 401 || res.status === 403) {
          // Token tidak lagi valid di backend
          await logout();
          return null;
        }

        // Jika status server error (500) atau offline, pertahankan data lokal jika ada
        return null;
      } catch {
        // Mode offline: izinkan fallback dari localStorage
        return null;
      }
    },
    [apiUrl, setSession, logout]
  );

  // Refresh profil user aktif
  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    let currentToken = token;
    if (!currentToken) {
      try {
        currentToken = localStorage.getItem(TOKEN_KEY);
      } catch {
        // Ignored
      }
    }
    if (!currentToken) return null;
    return verifyTokenWithBackend(currentToken);
  }, [token, verifyTokenWithBackend]);

  // Login manual dengan NISN / NIP / Kode Akses
  const loginWithIdentifier = useCallback(
    async (
      identifier: string,
      password: string
    ): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiUrl}/auth/login-identifier`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: identifier.trim(),
            password,
          }),
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          return {
            success: false,
            error:
              json.detail ||
              json.title ||
              "Identitas atau kata sandi tidak valid.",
          };
        }

        const sessionToken: string = json.token;
        const profileData: AuthUser = json.data;

        setSession(sessionToken, profileData);

        return {
          success: true,
          role: profileData.role,
        };
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Gagal terhubung ke server autentikasi.";
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, setSession]
  );

  // Inisialisasi awal saat aplikasi dimuat
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setIsLoading(true);
      try {
        // 1. Cek sesi lokal (NISN / NIP session)
        let storedToken: string | null = null;
        let storedUser: AuthUser | null = null;

        try {
          storedToken = localStorage.getItem(TOKEN_KEY);
          const rawUser = localStorage.getItem(USER_KEY);
          if (rawUser) {
            storedUser = JSON.parse(rawUser) as AuthUser;
          }
        } catch {
          // Ignored
        }

        // 2. Cek sesi Supabase (Google OAuth / Supabase Auth)
        const {
          data: { session: supabaseSession },
        } = await supabase.auth.getSession();

        if (supabaseSession?.access_token) {
          const freshUser = await verifyTokenWithBackend(
            supabaseSession.access_token
          );
          if (freshUser && isMounted) {
            setIsLoading(false);
            return;
          }
        }

        // 3. Jika ada sesi tersimpan dari identifier login
        if (storedToken && storedUser) {
          if (isMounted) {
            setToken(storedToken);
            setUser(storedUser);
            setAuthCookies(storedUser.role, storedToken);
          }

          // Verifikasi di latar belakang ke backend
          verifyTokenWithBackend(storedToken).catch(() => {
            // Keep storedUser if offline
          });
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // 4. Listen perubahan sesi Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.access_token) {
        await verifyTokenWithBackend(session.access_token);
      } else if (event === "SIGNED_OUT") {
        // Hanya logout jika token aktif berasal dari supabase
        if (!localStorage.getItem(TOKEN_KEY)) {
          setUser(null);
          setToken(null);
          setAuthCookies(null, null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [verifyTokenWithBackend]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      role: user?.role ?? null,
      isLoading,
      isAuthenticated: !!user && !!token,
      loginWithIdentifier,
      setSession,
      refreshUser,
      logout,
    }),
    [
      user,
      token,
      isLoading,
      loginWithIdentifier,
      setSession,
      refreshUser,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
