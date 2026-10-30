"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import VokaIcon from "@/components/common/VokaIcon";
import { ArrowLeft, Bell, Settings } from "lucide-react";
import { TeacherNotificationModal } from "./TeacherNotificationModal";
import { TeacherSettingsModal } from "./TeacherSettingsModal";

export function TeacherHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const currentView = searchParams.get("view");
  const isHome = !currentView && (pathname === "/teacher/dashboard" || pathname === "/teacher");

  const getPageInfo = () => {
    if (currentView === "cards") {
      return { title: "Kartu Siswa", subtitle: "Portofolio & Capaian PKL" };
    }
    if (currentView === "matrix") {
      return { title: "Matriks CP", subtitle: "Heatmap 792 JP Siswa" };
    }
    if (currentView === "table" || currentView === "students") {
      return { title: "Daftar Siswa", subtitle: "Rekapitulasi Jam & Status" };
    }
    if (currentView === "drift") {
      return { title: "Peringatan Drift", subtitle: "Deteksi Anomali Kurikulum" };
    }
    if (currentView === "security") {
      return { title: "Audit Keamanan", subtitle: "Integritas & Anti-Fraud" };
    }
    if (pathname?.includes("/teacher/heatmap")) {
      return { title: "Matriks CP", subtitle: "Heatmap 792 JP Siswa" };
    }
    return { title: "VokaLink", subtitle: "Portal Guru Pembimbing" };
  };

  const pageInfo = getPageInfo();

  const teacherName = user?.fullName || "Budi Santoso, S.Kom";
  const initials = teacherName
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
                href="/teacher/dashboard"
                title="Kembali ke Beranda Guru"
                aria-label="Kembali ke Beranda Guru"
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
                    GURU
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
            {/* Tombol Notifikasi (Pemberitahuan Drift & Log Baru) */}
            <button
              type="button"
              onClick={() => setShowNotificationModal(true)}
              title="Pemberitahuan Guru & Drift"
              aria-label="Pemberitahuan Guru & Drift"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hover:text-slate-900 flex items-center justify-center transition border border-slate-200/80 cursor-pointer shadow-2xs shrink-0 relative"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
            </button>

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
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              title="Lihat Profil Guru"
              className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 select-none ring-2 ring-white hover:ring-sky-200 transition cursor-pointer"
            >
              {initials}
            </button>
          </div>
        </div>
      </header>

      {/* Modal Notifikasi Guru */}
      {showNotificationModal && (
        <TeacherNotificationModal
          onClose={() => setShowNotificationModal(false)}
        />
      )}

      {/* Modal Pengaturan Guru */}
      <TeacherSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
}

export default TeacherHeader;
