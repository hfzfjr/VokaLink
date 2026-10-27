"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import {
  LayoutDashboard,
  Layers,
  Building2,
  Navigation,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  X,
  School,
  Check,
  Save,
} from "lucide-react";
import { cn } from "@/lib/cn";
import VokaIcon from "@/components/common/VokaIcon";

interface NavItem {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dasbor Utama",
    sublabel: "Ringkasan Operasional PKL",
    href: "/school/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "curriculum",
    label: "Kurikulum & CP",
    sublabel: "Matriks 792 JP & Job Cards",
    href: "/school/curriculum",
    icon: Layers,
    badge: "792 JP",
  },
  {
    id: "dudi",
    label: "Direktori DUDI",
    sublabel: "Mitra & Mentor Terdaftar",
    href: "/school/dudi-directory",
    icon: Building2,
  },
  {
    id: "placements",
    label: "Smart Placement",
    sublabel: "Pencocokan 70% CP + 30% Jarak",
    href: "/school/placements",
    icon: Navigation,
  },
  {
    id: "erapor",
    label: "Rekap e-Rapor",
    sublabel: "Ekspor Nilai & Dapodik",
    href: "/school/erapor",
    icon: FileSpreadsheet,
    badge: "Dapodik",
  },
];

export function SchoolSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"school" | "period" | "about">("school");

  // Smooth hover expansion
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isHovered;

  // Settings form states
  const [schoolPhone, setSchoolPhone] = useState("061-7865432");
  const [schoolEmail, setSchoolEmail] = useState("smktelkom1medan@sch.id");
  const [isSaved, setIsSaved] = useState(false);

  const schoolProfile = {
    schoolName: user?.school?.name || "SMK Telkom 1 Medan",
    npsn: user?.school?.npsn || "10210850",
    city: user?.school?.city || "Medan",
    province: user?.school?.province || "Sumatera Utara",
    adminName: user?.fullName || "Pokja PKL SMK Telkom 1 Medan",
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
        aria-label="Navigasi Samping Pengelola Sekolah"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "hidden md:flex flex-col shrink-0 sticky top-4 h-[calc(100vh-2rem)] py-3 px-3 bg-white/95 backdrop-blur-xl rounded-[28px] border border-slate-200/80 z-40 select-none overflow-hidden transition-[width,box-shadow] duration-250 ease-out",
          isExpanded
            ? "w-[248px] shadow-[0_16px_40px_rgba(15,23,42,0.12),0_0_0_1px_rgba(226,232,240,0.8)]"
            : "w-[72px] shadow-[0_8px_30px_rgba(15,23,42,0.05)]"
        )}
      >
        {/* Top: Brand Logo + Title */}
        <div className="flex flex-col w-full">
          <Link
            href="/school/dashboard"
            className="flex items-center gap-3 px-1 py-1 rounded-2xl hover:bg-slate-100/70 transition-colors group"
          >
            <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 transition-transform">
              <VokaIcon className="w-full h-full object-contain" />
            </div>
            {isExpanded && (
              <div className="min-w-0 transition-opacity duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-900 tracking-tight">VokaLink</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-sky-50 text-sky-700 font-bold text-[9px] border border-sky-100">
                    SMK
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                  {schoolProfile.schoolName}
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 mt-6 flex flex-col gap-1.5 w-full">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-2 py-2.5 rounded-2xl transition-all duration-150 relative group",
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                    isActive
                      ? "text-sky-400"
                      : "text-slate-500 group-hover:text-slate-900"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {isExpanded && (
                  <div className="flex-1 min-w-0 flex items-center justify-between pr-1">
                    <div className="truncate">
                      <p className={cn("text-xs font-bold truncate", isActive ? "text-white" : "text-slate-800")}>
                        {item.label}
                      </p>
                      <p className={cn("text-[10px] truncate", isActive ? "text-slate-300" : "text-slate-400")}>
                        {item.sublabel}
                      </p>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-md text-[9px] font-black shrink-0 ml-1.5",
                          isActive
                            ? "bg-white/15 text-sky-300"
                            : "bg-slate-100 text-slate-600 border border-slate-200/60"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions: Settings, Help, Profile */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-1 w-full">
          {/* Settings Trigger */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-3 px-2 py-2 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-colors w-full text-left cursor-pointer"
            title={!isExpanded ? "Pengaturan Sekolah" : undefined}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            {isExpanded && (
              <span className="text-xs font-bold text-slate-700 truncate">Pengaturan Sekolah</span>
            )}
          </button>

          {/* Help Trigger */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-3 px-2 py-2 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-colors w-full text-left cursor-pointer"
            title={!isExpanded ? "Panduan Pengelola" : undefined}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            {isExpanded && (
              <span className="text-xs font-bold text-slate-700 truncate">Panduan Pengelola</span>
            )}
          </button>

          {/* User Profile Mini Trigger */}
          <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center gap-2 px-1">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
              <School className="w-4 h-4" />
            </div>
            {isExpanded && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {schoolProfile.adminName}
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-mono">NPSN: {schoolProfile.npsn}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ─── MODAL PENGATURAN SEKOLAH ─── */}
      {showSettingsModal && isMounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div
              className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Pengaturan Profil Sekolah</h3>
                    <p className="text-[11px] text-slate-500">Konfigurasi multi-tenant & kontak operasional PKL</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-6 pt-3 flex border-b border-slate-100 gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("school")}
                  className={cn(
                    "pb-2 border-b-2 transition cursor-pointer",
                    activeTab === "school"
                      ? "border-sky-500 text-sky-600 font-bold"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  Identitas Sekolah
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("period")}
                  className={cn(
                    "pb-2 border-b-2 transition cursor-pointer",
                    activeTab === "period"
                      ? "border-sky-500 text-sky-600 font-bold"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  Periode Akademik
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("about")}
                  className={cn(
                    "pb-2 border-b-2 transition cursor-pointer",
                    activeTab === "about"
                      ? "border-sky-500 text-sky-600 font-bold"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  Tentang VokaLink
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {activeTab === "school" ? (
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Lembaga Pendidikan</label>
                      <input
                        type="text"
                        disabled
                        value={schoolProfile.schoolName}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">NPSN</label>
                        <input
                          type="text"
                          disabled
                          value={schoolProfile.npsn}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Wilayah / Kota</label>
                        <input
                          type="text"
                          disabled
                          value={`${schoolProfile.city}, ${schoolProfile.province}`}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Telepon Pokja PKL</label>
                      <input
                        type="text"
                        value={schoolPhone}
                        onChange={(e) => setSchoolPhone(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Email Resmi Sekolah</label>
                      <input
                        type="email"
                        value={schoolEmail}
                        onChange={(e) => setSchoolEmail(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                  </div>
                ) : activeTab === "period" ? (
                  <div className="space-y-3.5 text-xs text-slate-600">
                    <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Periode Aktif 2026/2027</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Target Kurikulum Merdeka Fase F: <span className="font-bold text-sky-600">792 JP</span> (12 JP/hari kerja).
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Sinkronisasi otomatis ke e-Rapor dan paspor kompetensi siswa saat status log mencapai VERIFIED.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs text-slate-600">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">VokaLink Platform</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          v1.0 Production
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        SaaS Multi-Tenant PKL SMK Kurikulum Merdeka. Solusi pencatatan kartu kerja terstandarisasi, validasi mentor instan tanpa login, deteksi drift kesenjangan kurikulum, dan paspor kompetensi publik ber-QR.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    logout();
                    router.push("/login");
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                >
                  Keluar dari Akun
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaved ? "Tersimpan!" : "Simpan Perubahan"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── MODAL PANDUAN PENGELOLA ─── */}
      {showHelpModal && isMounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div
              className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Alur Kerja Pengelola PKL (Pokja)</h3>
                    <p className="text-[11px] text-slate-500">Panduan langkah operasional platform VokaLink</p>
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

              <div className="p-6 space-y-3.5 max-h-[60vh] overflow-y-auto text-xs text-slate-600">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="font-bold text-slate-900">1. Konfigurasi Kurikulum & Penguncian (FR-001)</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Pastikan total alokasi JP per jurusan genap 792 JP sesuai Kurikulum Merdeka. Setelah selesai, kunci kurikulum agar siswa dapat memulai pencatatan kartu kerja.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="font-bold text-slate-900">2. Direktori Kemitraan DUDI & Mentor (FR-003)</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Daftarkan mitra industri dan mentor pembimbing. Kirimkan tautan atau QR aktivasi 72 jam ke WhatsApp mentor untuk mengikat HP mentor dengan PIN 6-digit.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="font-bold text-slate-900">3. Smart Placement Berkeadilan (FR-004)</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Gunakan algoritma rekomendasi multi-kriteria (70% relevansi Elemen CP + 30% jarak geospasial Haversine) untuk memplot siswa ke DUDI secara optimal.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="font-bold text-slate-900">4. Ekspor e-Rapor Resmi SMK (FR-011)</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Setelah periode PKL selesai, unduh rekapitulasi nilai dan deskripsi capaian berformat CSV siap impor ke aplikasi e-Rapor Kemendikbudristek / Dapodik.
                  </p>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  Saya Mengerti
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
