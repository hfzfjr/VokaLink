"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import {
  Home,
  Users,
  ShieldAlert,
  ShieldCheck,
  Settings,
  HelpCircle,
  ArrowLeft,
  X,
  User,
  School,
  Check,
  Save,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/cn";
import VokaIcon from "@/components/common/VokaIcon";

interface NavItem {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  viewParam?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Beranda",
    sublabel: "Monitoring & Progres Siswa",
    href: "/teacher/dashboard",
    icon: Home,
  },
  {
    id: "drift",
    label: "Peringatan Drift",
    sublabel: "Deteksi Dini Anomali",
    href: "/teacher/dashboard?view=drift",
    viewParam: "drift",
    icon: ShieldAlert,
  },
  {
    id: "students",
    label: "Siswa Binaan",
    sublabel: "Daftar Siswa & DUDI",
    href: "/teacher/dashboard?view=students",
    viewParam: "students",
    icon: Users,
  },
  {
    id: "security",
    label: "Audit Keamanan",
    sublabel: "Integritas Validasi PIN",
    href: "/teacher/dashboard?view=security",
    viewParam: "security",
    icon: ShieldCheck,
  },
];

export function TeacherSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view");
  const { user, logout } = useAuth();

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "school" | "drift">("profile");

  // Smooth hover expansion (hanya mengecil ketika kursor tidak di-hover lagi)
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const isExpanded = isHovered;

  const isItemActive = (item: NavItem) => {
    if (item.viewParam) {
      return currentView === item.viewParam;
    }
    return !currentView && (pathname === "/teacher/dashboard" || pathname === "/teacher/heatmap" || pathname === "/teacher");
  };

  // Settings form states
  const [phone, setPhone] = useState("081234567899");
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifyOverload, setNotifyOverload] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const teacherProfile = {
    fullName: user?.fullName || "Budi Santoso, S.Kom",
    identityNumber: user?.identityNumber || "197501012000011001",
    departmentName: user?.department?.name || "Rekayasa Perangkat Lunak",
    schoolName: user?.school?.name || "SMK Telkom 1 Medan",
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

  const handleSaveSettings = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setShowSettingsModal(false);
    }, 1000);
  };

  return (
    <>
      <aside
        aria-label="Navigasi Samping Guru Pembimbing"
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
            href="/teacher/dashboard"
            title="VokaLink Guru — Beranda"
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
          <div className="w-full h-px bg-slate-200/80 my-2.5" />
        </div>

        {/* Center: Main Navigation Stack (Fixed Icon Positions) */}
        <nav aria-label="Menu Guru" className="flex flex-col gap-1.5 w-full">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);

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
                      isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
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

        {/* Bottom: Settings, Help & Exit */}
        <div className="flex flex-col gap-1.5 w-full">
          <div className="w-full h-px bg-slate-200/80 my-1" />

          {/* Settings Trigger */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            aria-label="Pengaturan & Profil Guru"
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
                Profil &amp; Notifikasi
              </p>
            </div>
          </button>

          {/* Help Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            aria-label="Panduan Pembimbing PKL"
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
                Alur Supervisi PKL
              </p>
            </div>
          </button>

          {/* Exit / Logout */}
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            title="Keluar dari Akun Guru"
            aria-label="Keluar dari Akun Guru"
            className="w-full h-12 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center overflow-hidden transition-colors duration-150 cursor-pointer group text-left"
          >
            <div className="w-12 h-12 shrink-0 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-rose-600" />
            </div>
            <div
              className={cn(
                "min-w-0 transition-opacity duration-200 overflow-hidden text-left pr-2",
                isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <p className="text-xs font-semibold text-rose-600 truncate leading-tight whitespace-nowrap">
                Keluar Akun
              </p>
              <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5 whitespace-nowrap">
                Halaman Masuk
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* ─── Settings Modal (Portal) ─── */}
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
                    Pengaturan Akun Guru Pembimbing
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Profil pembimbing, konsentrasi kejuruan &amp; preferensi alert drift
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
                  activeTab === "profile" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profil</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("school")}
                className={cn(
                  "flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer",
                  activeTab === "school" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <School className="w-3.5 h-3.5" />
                <span>Sekolah</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("drift")}
                className={cn(
                  "flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer",
                  activeTab === "drift" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Alert Drift</span>
              </button>
            </div>

            {/* Tab 1: Profile */}
            {activeTab === "profile" && (
              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Guru Pembimbing PKL
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {teacherProfile.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      NIP: {teacherProfile.identityNumber}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                    Fase F &bull; 792 JP
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 text-xs block">
                    Nomor WhatsApp Guru (Supervisi Lapangan)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-sky-500 font-medium"
                    placeholder="081234567899"
                  />
                  <p className="text-[10px] text-slate-400">
                    Digunakan untuk pengiriman draf koordinasi intervensi resmi ke mentor industri.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: School */}
            {activeTab === "school" && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Asal Institusi
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{teacherProfile.schoolName}</p>
                  <p className="text-[11px] text-slate-600">
                    Konsentrasi Keahlian: <strong className="text-sky-600">{teacherProfile.departmentName}</strong>
                  </p>
                  <p className="text-[10.5px] text-slate-400">
                    Terdaftar resmi pada basis data kurikulum nasional UINIC 8.0.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Alert Drift */}
            {activeTab === "drift" && (
              <div className="space-y-2.5 text-xs">
                <label className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Notifikasi Peringatan Drift Otomatis
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Peringatan anomali beban non-kompetensi &gt;15% atau stagnasi materi.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOverload}
                    onChange={(e) => setNotifyOverload(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded accent-sky-600 cursor-pointer"
                  />
                </label>

                <label className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Sinkronisasi Kontak WhatsApp Mentor
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Memuat nomor telepon mentor industri untuk auto-dispatch pesan koordinasi.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyWhatsApp}
                    onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded accent-sky-600 cursor-pointer"
                  />
                </label>
              </div>
            )}

            {/* Actions */}
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

      {/* ─── Help Modal (Portal) ─── */}
      {isMounted && showHelpModal && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in-0 duration-150"
          style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center font-bold text-sm">
                  ?
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Panduan Pembimbing PKL
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Alur Pemantauan &amp; Intervensi VokaLink
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-1">
                <p className="font-bold text-sky-900">1. Matriks Capaian Kompetensi (Heatmap)</p>
                <p className="text-sky-800 leading-relaxed font-normal">
                  Memantau akumulasi JP yang telah disahkan mentor. Sel hijau (&ge;75%) menandakan elemen kompetensi tuntas; kuning berjalan, dan abu-abu belum terisi.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-1">
                <p className="font-bold text-amber-900">2. Peringatan Drift &amp; Intervensi WhatsApp</p>
                <p className="text-amber-800 leading-relaxed font-normal">
                  Jika terdeteksi beban non-kompetensi berlebih, tugas monoton, atau jurnal tertunda, sistem menyiapkan pesan WhatsApp sopan otomatis ke mentor industri.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                <p className="font-bold text-emerald-900">3. Audit Keamanan Verifikasi PIN</p>
                <p className="text-emerald-800 leading-relaxed font-normal">
                  Memantau riwayat pengesahan PIN mentor industri untuk mendeteksi percobaan PIN salah berulang atau penguncian perangkat sementara.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
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
