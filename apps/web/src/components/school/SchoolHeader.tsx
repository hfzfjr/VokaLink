"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import VokaIcon from "@/components/common/VokaIcon";
import { ArrowLeft, Bell, Settings } from "lucide-react";
import { SchoolSettingsModal } from "./SchoolSettingsModal";

export function SchoolHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const isHome = pathname === "/school" || pathname === "/school/dashboard";

  const getPageInfo = () => {
    if (pathname?.includes("/school/dudi-directory")) {
      return { title: "Mitra DUDI", subtitle: "Kemitraan & Kuota Siswa" };
    }
    if (pathname?.includes("/school/placements")) {
      return { title: "Penempatan Siswa", subtitle: "Smart Matching Geospasial" };
    }
    if (pathname?.includes("/school/erapor")) {
      return { title: "Rekapitulasi e-Rapor", subtitle: "Ekspor Nilai & Jam CP" };
    }
    return { title: "VokaLink", subtitle: "Panel Pengelola SMK" };
  };

  const pageInfo = getPageInfo();

  const adminName = user?.fullName || "Pokja PKL SMK";
  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 pt-[env(safe-area-inset-top,0px)] shadow-2xs transition-all">
        <div className="px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Left Section: Back on subpages, Brand Logo on Home */}
          <div className="flex items-center gap-2.5 min-w-0">
            {!isHome ? (
              <Link
                href="/school/dashboard"
                title="Kembali ke Dashboard Sekolah"
                aria-label="Kembali ke Dashboard Sekolah"
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
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
                    VokaLink
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 font-semibold leading-none tracking-wide">
                    SEKOLAH
                  </span>
                </div>
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

          {/* Right Section: Notification, Settings & User Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Tombol Notifikasi Sekolah */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              title="Pemberitahuan Sekolah"
              aria-label="Pemberitahuan Sekolah"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hover:text-slate-900 flex items-center justify-center transition border border-slate-200/80 cursor-pointer shadow-2xs shrink-0 relative"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-sky-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
            </button>

            {/* Tombol Pengaturan (Settings) */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              title="Pengaturan Akun & Sekolah"
              aria-label="Pengaturan Akun & Sekolah"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hover:text-slate-900 flex items-center justify-center transition border border-slate-200/80 cursor-pointer shadow-2xs shrink-0"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Avatar Pengguna */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              title="Lihat Profil Sekolah"
              className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 select-none ring-2 ring-white hover:ring-sky-200 transition cursor-pointer"
            >
              {initials || "SK"}
            </button>
          </div>
        </div>
      </header>

      {/* Modal Pengaturan Sekolah */}
      <SchoolSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
}

export default SchoolHeader;
