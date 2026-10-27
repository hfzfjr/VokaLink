"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ArrowRight,
  LogOut,
  Home,
  School,
  GraduationCap,
  Briefcase,
  Lock,
} from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import VokaIcon from "@/components/common/VokaIcon";

export default function ForbiddenPage() {
  const router = useRouter();
  const { user, role, logout } = useAuth();

  const getRoleDisplayName = (r: string | null) => {
    switch (r) {
      case "SCHOOL_ADMIN":
        return "Pengelola Sekolah / Admin Pokja";
      case "TEACHER":
        return "Guru Pembimbing PKL";
      case "STUDENT":
        return "Siswa PKL";
      default:
        return "Tamu / Belum Masuk";
    }
  };

  const getRoleBadgeStyle = (r: string | null) => {
    switch (r) {
      case "SCHOOL_ADMIN":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "TEACHER":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "STUDENT":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getRoleIcon = (r: string | null) => {
    switch (r) {
      case "SCHOOL_ADMIN":
        return School;
      case "TEACHER":
        return GraduationCap;
      case "STUDENT":
        return Briefcase;
      default:
        return Lock;
    }
  };

  const getAuthorizedDashboardUrl = (r: string | null) => {
    switch (r) {
      case "SCHOOL_ADMIN":
        return "/school/dashboard";
      case "TEACHER":
        return "/teacher/dashboard";
      case "STUDENT":
        return "/student/home";
      default:
        return "/login";
    }
  };

  const RoleIcon = getRoleIcon(role);
  const targetDashboard = getAuthorizedDashboardUrl(role);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-rose-500 selection:text-white font-sans">
      {/* Decorative Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8 text-center space-y-6">
        {/* Top Logo & Status Badge */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <VokaIcon className="w-7 h-7" />
            <span className="font-extrabold text-slate-900 tracking-tight text-sm">
              VokaLink
            </span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-[11px] font-black uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>Kode HTTP 403</span>
          </span>
        </div>

        {/* Hero Visual Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-rose-400">
            <Lock className="w-3 h-3" />
          </div>
        </div>

        {/* Heading & Explanatory Text */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            Izin Akses Ditolak
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            Halaman yang Anda tuju merupakan area terbatas dan dilindungi oleh
            kebijakan pemisahan peran multi-tenant VokaLink.
          </p>
        </div>

        {/* Current Active User Profile Card */}
        {user ? (
          <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-4 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Sesi Pengguna Aktif
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getRoleBadgeStyle(
                  role
                )}`}
              >
                <RoleIcon className="w-3 h-3" />
                <span>{getRoleDisplayName(role)}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm shadow-2xs">
                {user.fullName ? user.fullName.charAt(0) : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user.fullName || "Pengguna VokaLink"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user.email || user.identityNumber || "Tanpa identitas"}
                </p>
              </div>
            </div>

            {user.school && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 text-xs text-slate-600">
                <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-medium">{user.school.name}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 text-xs text-amber-800 font-medium">
            Anda belum masuk ke sistem. Silakan masuk terlebih dahulu dengan akun
            sekolah yang valid.
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {user ? (
            <Link
              href={targetDashboard}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
            >
              <span>Buka Ruang Kerja {getRoleDisplayName(role)}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
            >
              <span>Masuk ke Akun Anda</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ganti Akun / Keluar</span>
              </button>
            )}

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Halaman Utama</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
