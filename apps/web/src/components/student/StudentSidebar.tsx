"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import {
  Home,
  PlusCircle,
  BookOpen,
  QrCode,
  Award,
  HelpCircle,
  LogOut,
  Settings,
  X,
  User,
  Shield,
  HardDrive,
  Check,
  Save,
  Wifi,
  WifiOff,
  Download,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { db } from "@/lib/pwa/db";
import { fetchStudentLogContext, type StudentLogContextResponse } from "@/lib/api";
import VokaIcon from "@/components/common/VokaIcon";

interface NavItem {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Beranda",
    sublabel: "Dashboard & Progres PKL",
    href: "/student/home",
    icon: Home,
  },
  {
    id: "new-log",
    label: "Catat Jurnal",
    sublabel: "Kartu Pekerjaan Baru",
    href: "/student/log/new",
    icon: PlusCircle,
  },
  {
    id: "history",
    label: "Riwayat Logbook",
    sublabel: "Daftar Aktivitas PKL",
    href: "/student/log/history",
    icon: BookOpen,
  },
  {
    id: "verify-request",
    label: "Validasi Mentor",
    sublabel: "QR Dinamis & WhatsApp",
    href: "/student/log/verify-request",
    icon: QrCode,
  },
  {
    id: "career-cv",
    label: "CV ATS & Paspor",
    sublabel: "Portofolio & Verifikasi QR",
    href: "/student/career-cv",
    icon: Award,
  },
];

export function StudentSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "privacy" | "offline">("profile");
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();

  // Smooth hover expansion (hanya mengecil ketika kursor tidak di-hover lagi)
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const isExpanded = isHovered;

  // Form states for settings
  const [phone, setPhone] = useState("081234567890");
  const [address, setAddress] = useState("Jl. Pendidikan Vokasi No. 1, Surabaya");
  const [showPhotos, setShowPhotos] = useState(true);
  const [showGrades, setShowGrades] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string>("Tersinkronisasi penuh (0 antrean)");

  const { user, token } = useAuth();

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

  // Load from localStorage & database context
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
          if (navigator.onLine) {
            const fresh = await fetchStudentLogContext(user?.id, token || undefined);
            if (fresh?.student) {
              setStudentProfile({
                fullName: fresh.student.fullName || user?.fullName || "Siswa",
                identityNumber: fresh.student.identityNumber || user?.identityNumber || "-",
                departmentName: fresh.student.departmentName || user?.department?.name || "Kejuruan",
                schoolName: fresh.student.schoolName || user?.school?.name || "SMK VokaLink",
              });
              if (fresh.student.whatsappNumber) setPhone(fresh.student.whatsappNumber);
            }
          }
        } catch {}
      };
      loadProfile();

      try {
        const saved = localStorage.getItem("vokalink_cv_customizations");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.address) setAddress(parsed.address);
        }
        const savedPrivacy = localStorage.getItem("vokalink_passport_privacy");
        if (savedPrivacy) {
          const parsedPriv = JSON.parse(savedPrivacy);
          if (parsedPriv.showPhotos !== undefined) setShowPhotos(parsedPriv.showPhotos);
          if (parsedPriv.showGrades !== undefined) setShowGrades(parsedPriv.showGrades);
        }
      } catch {
        // ignore
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const handleSaveSettings = () => {
    if (typeof window !== "undefined") {
      try {
        // Update CV customizations
        const existing = localStorage.getItem("vokalink_cv_customizations");
        const parsed = existing ? JSON.parse(existing) : {};
        localStorage.setItem(
          "vokalink_cv_customizations",
          JSON.stringify({
            ...parsed,
            phone,
            address,
          })
        );

        // Update privacy preferences
        localStorage.setItem(
          "vokalink_passport_privacy",
          JSON.stringify({
            showPhotos,
            showGrades,
          })
        );
      } catch {
        // ignore
      }
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setShowSettingsModal(false);
    }, 1000);
  };

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!showSettingsModal && !showHelpModal) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSettingsModal(false);
        setShowHelpModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [showSettingsModal, showHelpModal]);

  return (
    <>
      <aside
        aria-label="Navigasi Samping Siswa"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "hidden md:flex flex-col shrink-0 sticky top-4 h-[calc(100vh-2rem)] py-3 px-3 bg-white/95 backdrop-blur-xl rounded-[28px] border border-slate-200/80 z-40 select-none overflow-hidden transition-[width,box-shadow] duration-250 ease-out",
          isExpanded
            ? "w-[240px] shadow-[0_16px_40px_rgba(15,23,42,0.12),0_0_0_1px_rgba(226,232,240,0.8)]"
            : "w-[72px] shadow-[0_8px_30px_rgba(15,23,42,0.05)]"
        )}
      >
        {/* Top: Brand Logo 'V' + Title (Fixed Icon Position) */}
        <div className="flex flex-col w-full">
          <Link
            href="/student/home"
            title="VokaLink Siswa — Beranda"
            className="w-full h-12 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center overflow-hidden hover:border-sky-300 transition-colors duration-150"
          >
            <div className="w-12 h-12 shrink-0 flex items-center justify-center p-2.5">
              <VokaIcon className="w-full h-full object-contain" />
            </div>
            <div
              className={cn(
                "min-w-0 transition-opacity duration-200 overflow-hidden pl-1 pr-2",
                isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <span className="font-bold text-slate-900 text-sm tracking-tight leading-none block whitespace-nowrap">
                VokaLink
              </span>
            </div>
          </Link>
          <div className="-mx-3 w-[calc(100%+24px)] h-px bg-slate-200/80 my-2.5" />
        </div>

        {/* Center: Main Navigation Stack (Fixed Icon Positions) */}
        <nav aria-label="Menu Utama" className="flex flex-col gap-1.5 w-full">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              Boolean(pathname) &&
              (pathname === item.href ||
                (item.href !== "/student/home" && pathname!.startsWith(item.href)));

            return (
              <div key={item.id} className="relative flex items-center w-full">
                {/* Active Indicator Bar on left edge - completely fixed position */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-sky-500 z-10" />
                )}

                <Link
                  href={item.href}
                  className={cn(
                    "w-full h-12 rounded-2xl flex items-center overflow-hidden transition-colors duration-150 group",
                    isActive
                      ? "bg-sky-50 text-sky-600 border border-sky-200/80 shadow-2xs font-semibold"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/80"
                  )}
                  aria-label={item.label}
                >
                  <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        isActive
                          ? "text-sky-600 stroke-[2.3]"
                          : "text-slate-500 group-hover:text-slate-800"
                      )}
                    />
                  </div>

                  <div
                    className={cn(
                      "min-w-0 transition-opacity duration-200 overflow-hidden text-left pr-2",
                      isExpanded
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-semibold truncate leading-tight whitespace-nowrap",
                        isActive ? "text-sky-600 font-bold" : "text-slate-800"
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5 whitespace-nowrap">
                      {item.sublabel}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Natural Elastic Spacer */}
        <div className="flex-1 min-h-[20px]" />

        {/* Bottom: Settings, Help & Exit (Fixed Icon Positions) */}
        <div className="flex flex-col gap-1.5 w-full">
          <div className="-mx-3 w-[calc(100%+24px)] h-px bg-slate-200/80 my-1.5" />

          {/* Settings Trigger */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            aria-label="Pengaturan & Profil Siswa"
            className={cn(
              "w-full h-12 rounded-2xl flex items-center overflow-hidden transition-colors duration-150 cursor-pointer group text-left",
              showSettingsModal
                ? "bg-sky-50 text-sky-600 border border-sky-200/80 shadow-2xs"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/80"
            )}
          >
            <div className="w-12 h-12 shrink-0 flex items-center justify-center">
              <Settings className="w-5 h-5 text-slate-500 group-hover:text-slate-800" />
            </div>
            <div
              className={cn(
                "min-w-0 transition-opacity duration-200 overflow-hidden text-left pr-2",
                isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <p className="text-xs font-semibold text-slate-800 truncate leading-tight whitespace-nowrap">
                Pengaturan &amp; Akun
              </p>
              <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5 whitespace-nowrap">
                Profil &amp; Privasi
              </p>
            </div>
          </button>

          {/* Help Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            aria-label="Panduan Penggunaan"
            className={cn(
              "w-full h-12 rounded-2xl flex items-center overflow-hidden transition-colors duration-150 cursor-pointer group text-left",
              showHelpModal
                ? "bg-sky-50 text-sky-600 border border-sky-200/80 shadow-2xs"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/80"
            )}
          >
            <div className="w-12 h-12 shrink-0 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-slate-500 group-hover:text-slate-800" />
            </div>
            <div
              className={cn(
                "min-w-0 transition-opacity duration-200 overflow-hidden text-left pr-2",
                isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <p className="text-xs font-semibold text-slate-800 truncate leading-tight whitespace-nowrap">
                Bantuan &amp; Panduan
              </p>
              <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5 whitespace-nowrap">
                Alur Logbook PKL
              </p>
            </div>
          </button>

          {/* Exit / Logout to Login Page */}
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            title="Keluar dari Akun Siswa"
            aria-label="Keluar dari Akun Siswa"
            className="w-full h-12 rounded-2xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center overflow-hidden transition-colors duration-150 cursor-pointer group text-left"
          >
            <div className="w-12 h-12 shrink-0 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-rose-600 group-hover:text-rose-700 transition-colors" />
            </div>
            <div
              className={cn(
                "min-w-0 transition-opacity duration-200 overflow-hidden text-left pr-2",
                isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <p className="text-xs font-semibold text-rose-600 group-hover:text-rose-700 transition-colors truncate leading-tight whitespace-nowrap">
                Keluar Akun
              </p>
              <p className="text-[10px] text-slate-400 group-hover:text-rose-400 transition-colors truncate leading-tight mt-0.5 whitespace-nowrap">
                Halaman Masuk
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* ─── Settings Modal ─── */}
      {isMounted && showSettingsModal && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in-0 duration-150"
          style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 animate-in zoom-in-95 duration-150 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Pengaturan Akun &amp; Sistem
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Profil siswa, privasi paspor digital &amp; status offline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl">
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
                <span>Offline &amp; PWA</span>
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
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
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
                    Digunakan untuk pengiriman draf notifikasi verifikasi mentor &amp; kontak CV.
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

            {/* Tab 2: Privasi Paspor Publik */}
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
                        Menampilkan foto WebP hasil pekerjaan riil pada paspor publik.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showPhotos}
                      onChange={(e) => setShowPhotos(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded accent-sky-600 cursor-pointer"
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
                      className="w-4 h-4 text-sky-600 rounded accent-sky-600 cursor-pointer"
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
                    <span className="font-medium text-slate-900">
                      Dexie IndexedDB (Aktif)
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="font-semibold text-slate-700">Antrean Logbook:</span>
                    <span className="text-emerald-700 font-semibold">{syncStatus}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-100 text-sky-900 space-y-1">
                  <p className="font-semibold text-xs">Offline-First PWA</p>
                  <p className="text-[11px] text-sky-800 leading-relaxed font-normal">
                    Seluruh jurnal dan foto bukti dikompres secara lokal (WebP &lt; 150 KB) dan tetap aman tersimpan di HP Anda walaupun tanpa koneksi internet.
                  </p>
                </div>

                {isInstallable && !isInstalled && (
                  <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-slate-900 truncate">Pasang Aplikasi VokaLink</p>
                      <p className="text-[10.5px] text-slate-500 font-normal truncate">Akses instan di layar desktop atau HP</p>
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

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 active:scale-95 text-white transition cursor-pointer shadow-xs"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Help Modal ─── */}
      {isMounted && showHelpModal && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in-0 duration-150"
          style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-modal border border-slate-200/70 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center font-semibold text-sm">
                  ?
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Panduan Logbook Siswa
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Sistem PKL Offline-First VokaLink
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs text-slate-600">
              <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100">
                <p className="font-semibold text-sky-900">
                  1. Mengisi Jurnal Harian
                </p>
                <p className="text-sky-800 mt-1 font-normal leading-relaxed">
                  Pilih kartu pekerjaan dari DUDI. Durasi harian 1–12 JP
                  (rekomendasi 8 JP). Ambil foto bukti dengan kamera HP Anda.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                <p className="font-semibold text-amber-900">
                  2. Offline-First &amp; Sinkronisasi
                </p>
                <p className="text-amber-800 mt-1 font-normal leading-relaxed">
                  Semua jurnal tersimpan di HP Anda walau tanpa internet. Saat
                  online, jurnal akan otomatis terkirim ke server.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <p className="font-semibold text-emerald-900">
                  3. Verifikasi Mentor Tanpa Akun
                </p>
                <p className="text-emerald-800 mt-1 font-normal leading-relaxed">
                  Tunjukkan QR code atau kirim tautan ke mentor Anda. Mentor
                  memverifikasi lewat HP-nya menggunakan PIN sekali klik.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold text-xs transition cursor-pointer shadow-xs"
            >
              Mengerti
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default StudentSidebar;
