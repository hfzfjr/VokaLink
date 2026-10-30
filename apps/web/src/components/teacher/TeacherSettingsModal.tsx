"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Settings,
  X,
  User,
  Shield,
  HardDrive,
  Wifi,
  WifiOff,
  Check,
  Save,
  LogOut,
  Building2,
  GraduationCap,
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

  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "system">("profile");
  const [phone, setPhone] = useState("081234567890");
  const [officeLocation, setOfficeLocation] = useState("Ruang Guru Kejuruan RPL, Gedung A Lantai 2");
  const [alertDriftEnabled, setAlertDriftEnabled] = useState(true);
  const [alertNewLogEnabled, setAlertNewLogEnabled] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("Tersinkronisasi penuh dengan server");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Load from localStorage if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vokalink_teacher_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.officeLocation) setOfficeLocation(parsed.officeLocation);
          if (typeof parsed.alertDriftEnabled === "boolean") setAlertDriftEnabled(parsed.alertDriftEnabled);
          if (typeof parsed.alertNewLogEnabled === "boolean") setAlertNewLogEnabled(parsed.alertNewLogEnabled);
        } catch {}
      }
    }
  }, []);

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

  const handleSaveSettings = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "vokalink_teacher_settings",
        JSON.stringify({ phone, officeLocation, alertDriftEnabled, alertNewLogEnabled })
      );
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari akun Guru Pembimbing ini?")) {
      await logout();
      window.location.replace("/login");
    }
  };

  if (!isMounted || !isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in-0 duration-150"
      style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200/80 animate-in zoom-in-95 duration-150 space-y-4 max-h-[92vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Pengaturan Akun &amp; Sistem Guru
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                Profil pembimbing, preferensi navigasi &amp; status sistem
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Pengaturan"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer active:scale-95 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Segmented Tabs (Konsisten dengan StudentSettingsModal) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer",
              activeTab === "profile"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={cn(
              "flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer",
              activeTab === "preferences"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Preferensi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("system")}
            className={cn(
              "flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer",
              activeTab === "system"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Sistem</span>
          </button>
        </div>

        {/* Tab 1: Profil Guru */}
        {activeTab === "profile" && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 select-none">
                  {initials}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-sky-700 block tracking-wider">
                    GURU PEMBIMBING SEKOLAH
                  </span>
                  <p className="font-bold text-slate-900 text-sm truncate mt-0.5">
                    {teacherName}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    NIP: {identityNumber} &bull; {schoolName}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                {sectorCode}
              </span>
            </div>

            {/* Info Lembaga & Kejuruan */}
            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Asal Sekolah
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-[220px] text-right">
                  {schoolName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  Konsentrasi Keahlian
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-[220px] text-right">
                  {departmentName}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 text-xs block">
                Nomor WhatsApp Koordinasi Pembimbing
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-sky-500 font-medium"
                placeholder="081234567890"
              />
              <p className="text-[10px] text-slate-400">
                Digunakan untuk template koordinasi intervensi via WhatsApp ke mentor DUDI &amp; siswa.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 text-xs block">
                Lokasi Ruang Kerja / Kantor
              </label>
              <input
                type="text"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-sky-500 font-medium"
                placeholder="Gedung Kejuruan Lantai 2"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Preferensi Navigasi & Notifikasi */}
        {activeTab === "preferences" && (
          <div className="space-y-3.5 text-xs">
            {/* Navigasi Pintas Portal */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Navigasi Cepat Portal Guru
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleNavigate("/teacher/dashboard?view=cards")}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-left flex items-center justify-between transition cursor-pointer"
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
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-left flex items-center justify-between transition cursor-pointer"
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
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-left flex items-center justify-between transition cursor-pointer"
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
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-left flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">Audit Keamanan</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              </div>
            </div>

            {/* Preferensi Notifikasi */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Preferensi Peringatan &amp; Alert
              </p>

              <label className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition">
                <div>
                  <p className="font-semibold text-slate-900">
                    Peringatan Otomatis Drift Kompetensi
                  </p>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Bunyikan indikator saat siswa mencapai rasio beban non-kompetensi &gt; 30%.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={alertDriftEnabled}
                  onChange={(e) => setAlertDriftEnabled(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded accent-sky-600 cursor-pointer ml-3"
                />
              </label>

              <label className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition">
                <div>
                  <p className="font-semibold text-slate-900">
                    Notifikasi Aktivitas Log Masuk Siswa
                  </p>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Update badge bell notifikasi saat ada verifikasi logbook harian baru.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={alertNewLogEnabled}
                  onChange={(e) => setAlertNewLogEnabled(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded accent-sky-600 cursor-pointer ml-3"
                />
              </label>
            </div>
          </div>
        )}

        {/* Tab 3: Sistem & Jaringan */}
        {activeTab === "system" && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Status Jaringan Portal:</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px]",
                    isOnline
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  )}
                >
                  {isOnline ? (
                    <>
                      <Wifi className="w-3.5 h-3.5" />
                      <span>Online (Sinkron Aktif)</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>Mode Offline</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="font-semibold text-slate-700">Kriptografi &amp; Integritas:</span>
                <span className="font-medium text-emerald-700">HMAC-SHA256 &amp; Dual-PIN Aktif</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="font-semibold text-slate-700">Status Sinkronisasi Data:</span>
                <span className="text-slate-800 font-semibold">{syncStatus}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSyncStatus("Memperbarui matriks capaian & logbook...");
                setTimeout(() => setSyncStatus("Tersinkronisasi penuh dengan server"), 2000);
              }}
              className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer active:scale-95"
            >
              Periksa &amp; Sinkronkan Ulang Sekarang
            </button>
          </div>
        )}

        {/* Modal Actions & Logout (Konsisten dengan StudentSettingsModal) */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 active:scale-95 text-white transition cursor-pointer shadow-xs"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default TeacherSettingsModal;
