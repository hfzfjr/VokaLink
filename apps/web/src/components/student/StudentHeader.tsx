"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import VokaIcon from "@/components/common/VokaIcon";
import { StudentSettingsModal } from "./StudentSettingsModal";

export function StudentHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const isHome = pathname === "/student" || pathname === "/student/home";

  const getPageInfo = () => {
    if (pathname?.includes("/student/log/new")) {
      return { title: "Catat Jurnal", subtitle: "Input Bukti Praktik" };
    }
    if (pathname?.includes("/student/log/history")) {
      return { title: "Riwayat Logbook", subtitle: "Aktivitas & Mentor" };
    }
    if (pathname?.includes("/student/log/verify-request")) {
      return { title: "Minta Validasi", subtitle: "QR & WhatsApp Mentor" };
    }
    if (pathname?.includes("/student/career-cv")) {
      return { title: "CV ATS & Paspor", subtitle: "Portofolio Kompetensi" };
    }
    return { title: "VokaLink", subtitle: "" };
  };

  const pageInfo = getPageInfo();

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 pt-[env(safe-area-inset-top,0px)] shadow-2xs transition-all">
        <div className="px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Left Section: Back on subpages, Brand Logo on Home */}
          <div className="flex items-center gap-2.5 min-w-0">
            {!isHome ? (
              <Link
                href="/student/home"
                title="Kembali ke Beranda Siswa"
                aria-label="Kembali ke Beranda Siswa"
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 transition cursor-pointer shrink-0 border border-slate-200/60"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                <VokaIcon className="w-full h-full object-contain" />
              </div>
            )}

            <div className="min-w-0">
              {isHome ? (
                <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
                  VokaLink
                </span>
              ) : (
                <div className="min-w-0">
                  <h1 className="font-bold text-sm tracking-tight text-slate-900 leading-tight truncate">
                    {pageInfo.title}
                  </h1>
                  <p className="text-[10.5px] text-slate-500 font-normal leading-tight truncate mt-0.5">
                    {pageInfo.subtitle}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Settings Button & User Avatar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Tombol Pengaturan (Settings) */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              title="Pengaturan Akun & Sistem"
              aria-label="Pengaturan Akun & Sistem"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hover:text-slate-900 flex items-center justify-center transition border border-slate-200/80 cursor-pointer shadow-2xs shrink-0"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Avatar Pengguna */}
            <Link
              href="/student/career-cv"
              title="Lihat Profil & Portofolio Siswa"
              className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 select-none ring-2 ring-white hover:ring-sky-200 transition cursor-pointer"
            >
              {user?.fullName
                ? user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "AP"}
            </Link>
          </div>
        </div>
      </header>

      {/* Modal Pengaturan Siswa */}
      <StudentSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
}

export default StudentHeader;
