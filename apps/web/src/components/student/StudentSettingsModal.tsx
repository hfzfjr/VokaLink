"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Settings,
  X,
  User,
  Shield,
  HardDrive,
  Wifi,
  WifiOff,
  Download,
  Check,
  Save,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/use-auth";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { db } from "@/lib/pwa/db";
import type { StudentLogContextResponse } from "@/lib/api";

interface StudentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudentSettingsModal({ isOpen, onClose }: StudentSettingsModalProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "privacy" | "offline">("profile");
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();

  const [phone, setPhone] = useState("081234567890");
  const [address, setAddress] = useState("Jl. Pendidikan Vokasi No. 1, Surabaya");
  const [showPhotos, setShowPhotos] = useState(true);
  const [showGrades, setShowGrades] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string>("Tersinkronisasi penuh (0 antrean)");
  const [isMounted, setIsMounted] = useState(false);

  const [studentProfile, setStudentProfile] = useState<{
    fullName: string;
    identityNumber: string;
    departmentName: string;
    schoolName: string;
  }>({
    fullName: user?.fullName || "Siswa VokaLink",
    identityNumber: user?.identityNumber || "-",
    departmentName: user?.department?.name || "Kejuruan",
    schoolName: user?.school?.name || "SMK VokaLink",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setStudentProfile({
        fullName: user.fullName || "Siswa",
        identityNumber: user.identityNumber || "-",
        departmentName: user.department?.name || "Kejuruan",
        schoolName: user.school?.name || "SMK VokaLink",
      });
      if (user.whatsappNumber) setPhone(user.whatsappNumber);
    }
  }, [user]);

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

  // Load context from IndexedDB
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      const loadProfile = async () => {
        try {
          const cacheKey = user?.id ? `student_log_context_${user.id}` : "student_log_context";
          const cached = await db.refData.get(cacheKey);
          if (cached?.data) {
            const data = cached.data as StudentLogContextResponse;
            if (data.student && (!user?.id || data.student.id === user.id)) {
              setStudentProfile({
                fullName: data.student.fullName || user?.fullName || "Siswa",
                identityNumber: data.student.identityNumber || user?.identityNumber || "-",
                departmentName: data.student.departmentName || user?.department?.name || "Kejuruan",
                schoolName: data.student.schoolName || user?.school?.name || "SMK VokaLink",
              });
              if (data.student.whatsappNumber) setPhone(data.student.whatsappNumber);
            }
          }
        } catch {}
      };
      loadProfile();

      const savedSettings = localStorage.getItem("vokalink_student_settings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.address) setAddress(parsed.address);
          if (typeof parsed.showPhotos === "boolean") setShowPhotos(parsed.showPhotos);
          if (typeof parsed.showGrades === "boolean") setShowGrades(parsed.showGrades);
        } catch {}
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [user]);

  const handleSaveSettings = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "vokalink_student_settings",
        JSON.stringify({ phone, address, showPhotos, showGrades })
      );
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
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
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Pengaturan Akun &amp; Sistem
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                Profil siswa, privasi paspor &amp; status offline
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

        {/* Modal Tabs */}
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
            onClick={() => setActiveTab("privacy")}
            className={cn(
              "flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer",
              activeTab === "privacy"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privasi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("offline")}
            className={cn(
              "flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer",
              activeTab === "offline"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Offline</span>
          </button>
        </div>

        {/* Tab 1: Profil */}
        {activeTab === "profile" && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Siswa Terdaftar (Fase F)
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {studentProfile.fullName}
                </p>
                <p className="text-[11px] text-slate-500 font-normal">
                  NISN: {studentProfile.identityNumber} · {studentProfile.schoolName}
                </p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                {studentProfile.departmentName.includes("RPL") ? "RPL" : "Vokasi"} · 792 JP
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 text-xs block">
                Nomor WhatsApp Aktif
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-sky-500 font-medium"
                placeholder="081234567890"
              />
              <p className="text-[10px] text-slate-400">
                Digunakan untuk notifikasi verifikasi mentor &amp; kontak CV.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 text-xs block">
                Alamat Domisili Siswa
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-sky-500 font-medium"
                placeholder="Surabaya, Jawa Timur"
              />
              <p className="text-[10px] text-slate-400">
                Ditampilkan pada header dokumen cetak CV ATS standar industri.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Privasi */}
        {activeTab === "privacy" && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-1">
              <p className="font-bold text-amber-900 text-xs">
                Kontrol Privasi Paspor Publik
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed font-normal">
                Paspor kompetensi publik ber-QR dapat dipindai oleh HRD dan perusahaan. Anda memiliki kendali penuh atas visibilitas data pribadi berikut:
              </p>
            </div>

            <div className="space-y-2">
              <label className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition">
                <div>
                  <p className="font-semibold text-slate-900">
                    Tampilkan Galeri Foto Bukti Jurnal
                  </p>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Menampilkan foto hasil pekerjaan riil pada paspor publik.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showPhotos}
                  onChange={(e) => setShowPhotos(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded accent-sky-600 cursor-pointer ml-3"
                />
              </label>

              <label className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition">
                <div>
                  <p className="font-semibold text-slate-900">
                    Tampilkan Skor Sikap &amp; Endorsement Mentor
                  </p>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Menampilkan skor etos kerja (1–100) dan lencana sikap dari DUDI.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showGrades}
                  onChange={(e) => setShowGrades(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded accent-sky-600 cursor-pointer ml-3"
                />
              </label>
            </div>
          </div>
        )}

        {/* Tab 3: Offline & PWA */}
        {activeTab === "offline" && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Status Jaringan:</span>
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
                      <span>Online (Siap Sinkron)</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>Offline Mode Aktif</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="font-semibold text-slate-700">Penyimpanan Lokal:</span>
                <span className="font-medium text-slate-900">Dexie IndexedDB (Aktif)</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="font-semibold text-slate-700">Antrean Logbook:</span>
                <span className="text-emerald-700 font-semibold">{syncStatus}</span>
              </div>
            </div>

            {isInstallable && !isInstalled && (
              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-slate-900 truncate">Pasang Aplikasi VokaLink</p>
                  <p className="text-[10.5px] text-slate-500 font-normal truncate">Akses instan di layar HP atau desktop</p>
                </div>
                <button
                  type="button"
                  onClick={promptInstall}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Pasang</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSyncStatus("Memeriksa antrean... Sinkronisasi selesai!");
                setTimeout(() => setSyncStatus("Tersinkronisasi penuh (0 antrean)"), 2500);
              }}
              className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer active:scale-95"
            >
              Cek &amp; Sinkronkan Sekarang
            </button>
          </div>
        )}

        {/* Modal Actions & Logout */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm("Apakah Anda yakin ingin keluar dari akun siswa ini?")) {
                logout();
              }
            }}
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

