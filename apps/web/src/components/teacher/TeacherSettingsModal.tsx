"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  X,
  Building2,
  GraduationCap,
  Sparkles,
  LogOut,
  LayoutGrid,
  LayoutList,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/cn";

interface TeacherSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeacherSettingsModal({ isOpen, onClose }: TeacherSettingsModalProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isOnline = useOnlineStatus();

  // Handle escape key & scroll locking
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const teacherName = user?.fullName || "Budi Santoso, S.Kom";
  const schoolName = user?.school?.name || "SMK Telkom 1 Medan";
  const departmentName = user?.department?.name || "Rekayasa Perangkat Lunak";
  const sectorCode = user?.department?.sectorCode || "RPL";
  const identityNumber = user?.identityNumber || "198507202010011005";

  const initials = teacherName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari akun Guru Pembimbing?")) {
      await logout();
      window.location.replace("/login");
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in-0 duration-150"
      style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-[env(safe-area-inset-bottom,1.5rem)] sm:pb-6 border border-slate-200/80 shadow-modal space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header Profil Guru */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 select-none ring-2 ring-white">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100 uppercase tracking-wider">
                  GURU PEMBIMBING
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    )}
                  />
                  <span>{isOnline ? "Online" : "Offline"}</span>
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 truncate mt-0.5">
                {teacherName}
              </h3>
              <p className="text-xs text-slate-500 truncate font-mono">
                NIP: {identityNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer transition shrink-0"
            aria-label="Tutup Pengaturan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Sekolah & Kejuruan */}
        <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Asal Sekolah
            </span>
            <span className="font-semibold text-slate-800 truncate max-w-[200px] text-right">
              {schoolName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              Konsentrasi Keahlian
            </span>
            <span className="font-semibold text-slate-800 truncate max-w-[200px] text-right">
              {departmentName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Kode Sektor SKKNI
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-mono font-bold text-[11px] border border-amber-200/60">
              {sectorCode}
            </span>
          </div>
        </div>

        {/* Akses Cepat Tampilan Navigasi */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Navigasi Pintas Portal
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleNavigate("/teacher/dashboard?view=cards")}
              className="min-h-[44px] p-3 rounded-xl bg-white hover:bg-slate-50 active:scale-95 border border-slate-200/80 text-left flex items-center justify-between transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <LayoutList className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">Kartu Siswa</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("/teacher/dashboard?view=matrix")}
              className="min-h-[44px] p-3 rounded-xl bg-white hover:bg-slate-50 active:scale-95 border border-slate-200/80 text-left flex items-center justify-between transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <LayoutGrid className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">Matriks CP</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("/teacher/dashboard?view=drift")}
              className="min-h-[44px] p-3 rounded-xl bg-white hover:bg-slate-50 active:scale-95 border border-slate-200/80 text-left flex items-center justify-between transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <RefreshCw className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">Deteksi Drift</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("/teacher/dashboard?view=security")}
              className="min-h-[44px] p-3 rounded-xl bg-white hover:bg-slate-50 active:scale-95 border border-slate-200/80 text-left flex items-center justify-between transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">Audit Keamanan</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Tombol Logout */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full h-11 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-rose-200/70 shadow-2xs"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Keluar dari Akun Guru</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
