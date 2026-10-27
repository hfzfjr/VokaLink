"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { UserRole } from "@vokalink/shared";
import { useAuth } from "@/lib/use-auth";
import VokaIcon from "@/components/common/VokaIcon";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // 1. Belum login sama sekali -> lempar ke login
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    // 2. Sudah login tetapi peran tidak diizinkan -> lempar ke 403 Forbidden
    if (role && !allowedRoles.includes(role)) {
      router.replace("/forbidden");
    }
  }, [isLoading, isAuthenticated, user, role, allowedRoles, router, pathname]);

  // Loading state yang elegan
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/80 shadow-md flex items-center justify-center text-sky-600">
              <VokaIcon className="w-9 h-9" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
              Memverifikasi Akses Sesi
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Menghubungkan ke ruang kerja multi-tenant VokaLink...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Jika belum login atau salah role, tahan rendering agar tidak ada content leakage
  if (!isAuthenticated || !user || !role || !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // Hak akses sah
  return <>{children}</>;
}
