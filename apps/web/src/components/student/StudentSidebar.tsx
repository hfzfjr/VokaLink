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
} from "lucide-react";
import { cn } from "@/lib/cn";
import VokaIcon from "@/components/common/VokaIcon";
import { StudentSettingsModal } from "./StudentSettingsModal";

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

  // Smooth hover expansion (hanya mengecil ketika kursor tidak di-hover lagi)
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const isExpanded = isHovered;

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
              <LogOut className="w-5 h-5 text-slate-500 group-hover:text-rose-600" />
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
      <StudentSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* ─── Help Modal ─── */}
      {isMounted && showHelpModal && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150"
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
