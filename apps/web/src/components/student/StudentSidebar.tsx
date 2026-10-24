"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  BookOpen,
  Award,
  HelpCircle,
  ArrowLeft,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

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
    sublabel: "Dashboard & Timeline",
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
    id: "career-cv",
    label: "CV ATS & Paspor",
    sublabel: "Portofolio & Verifikasi QR",
    href: "/student/career-cv",
    icon: Award,
  },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <>
      <aside
        aria-label="Navigasi Samping Siswa"
        className="hidden md:flex flex-col items-center justify-between w-[76px] shrink-0 sticky top-4 h-[calc(100vh-2rem)] py-5 px-2 bg-white/90 backdrop-blur-md rounded-[28px] border border-slate-200/70 shadow-xs z-30 transition-all select-none"
      >
        {/* Top: Brand Logo 'V' + Back to Landing Portal */}
        <div className="flex flex-col items-center gap-4 w-full">
          <Link
            href="/student/home"
            title="VokaLink Siswa — Beranda"
            className="w-12 h-12 rounded-2xl bg-sky-500 text-white font-bold text-lg flex items-center justify-center shadow-xs hover:bg-sky-600 active:scale-95 transition-all"
          >
            V
          </Link>

          <div className="w-8 h-px bg-slate-200/70" />
        </div>

        {/* Center: Main Navigation Stack (Matching Reference Mockup) */}
        <nav
          aria-label="Menu Utama"
          className="flex flex-col items-center gap-3.5 w-full my-auto"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              Boolean(pathname) &&
              (pathname === item.href ||
                (item.href !== "/student/home" && pathname!.startsWith(item.href)));

            return (
              <div key={item.id} className="relative group">
                <Link
                  href={item.href}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95",
                    isActive
                      ? "bg-sky-50 text-sky-600 ring-2 ring-sky-500/20 shadow-2xs scale-105"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/80"
                  )}
                  aria-label={item.label}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      isActive ? "text-sky-600 stroke-[2.2]" : "text-slate-400"
                    )}
                  />
                </Link>

                {/* Floating Tooltip on Hover */}
                <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col z-50 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg border border-slate-800 animate-in fade-in-0 zoom-in-95 duration-150">
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {item.sublabel}
                  </span>
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-slate-800" />
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom: Info, Help & Exit */}
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="w-8 h-px bg-slate-200/70" />

          {/* Quick Info Badge: RPL Kelas XI */}
          <div className="relative group">
            <div
              title="Rekayasa Perangkat Lunak · Kelas XI (Fase F - 792 JP)"
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-500 hover:text-sky-600 flex items-center justify-center transition cursor-default"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col z-50 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg border border-slate-800">
              <span className="font-semibold text-amber-400">RPL · Kelas XI</span>
              <span className="text-[10px] text-slate-400">
                Fase F · Target 792 Jam Pelajaran
              </span>
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-slate-800" />
            </div>
          </div>

          {/* Help Modal Trigger */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              aria-label="Panduan Penggunaan"
              className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col z-50 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg border border-slate-800">
              <span className="font-semibold">Bantuan & Panduan</span>
              <span className="text-[10px] text-slate-400">
                Alur logbook & verifikasi mentor
              </span>
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-slate-800" />
            </div>
          </div>

          {/* Exit / Back to Portal Home */}
          <div className="relative group">
            <Link
              href="/"
              title="Keluar ke Portal Utama"
              aria-label="Keluar ke Portal Utama"
              className="w-10 h-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col z-50 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg border border-slate-800">
              <span className="font-semibold text-rose-400">Keluar Portal</span>
              <span className="text-[10px] text-slate-400">
                Kembali ke Beranda Utama
              </span>
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-slate-800" />
            </div>
          </div>
        </div>
      </aside>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in-0 duration-150">
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
                  1. Mengisi Jurnal Harian (FR-005)
                </p>
                <p className="text-sky-800 mt-1 font-normal leading-relaxed">
                  Pilih kartu pekerjaan dari DUDI. Durasi harian 1–12 JP
                  (rekomendasi 8 JP). Ambil foto bukti dengan kamera HP Anda.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                <p className="font-semibold text-amber-900">
                  2. Offline-First & Sinkronisasi
                </p>
                <p className="text-amber-800 mt-1 font-normal leading-relaxed">
                  Semua jurnal tersimpan di HP Anda walau tanpa internet. Saat
                  online, jurnal akan otomatis terkirim ke server.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <p className="font-semibold text-emerald-900">
                  3. Verifikasi Mentor Tanpa Akun (FR-007)
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
        </div>
      )}
    </>
  );
}

export default StudentSidebar;

