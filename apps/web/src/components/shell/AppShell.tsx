"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import VokaIcon from "@/components/common/VokaIcon";
import { useAuth } from "@/lib/use-auth";
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  Users,
  FileSpreadsheet,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  schoolName?: string;
  activePeriod?: string;
  isDemo?: boolean;
}

const SCHOOL_NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/school/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Kurikulum & CP",
    href: "/school/curriculum",
    icon: BookOpen,
  },
  {
    label: "Mitra DUDI",
    href: "/school/dudi-directory",
    icon: Briefcase,
  },
  {
    label: "Penempatan Siswa",
    href: "/school/placements",
    icon: Users,
  },
  {
    label: "Rekap e-Rapor",
    href: "/school/erapor",
    icon: FileSpreadsheet,
  },
];

export function AppShell({
  children,
  schoolName = "SMK Negeri 1 Bandung",
  activePeriod = "2026/2027 Ganjil",
  isDemo: _isDemo = false,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const resolvedSchoolName = user?.school?.name || schoolName;

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      <div className="flex-1 flex w-full">
        {/* 2. SIDEBAR DESKTOP (Width 248px pada Layar ≥ 1024px) */}
        <aside className="hidden lg:flex w-[248px] flex-col justify-between bg-white border-r border-slate-200/80 shrink-0 sticky top-0 h-screen overflow-y-auto">
          <div>
            {/* Logo Brand Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <Link href="/school/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-xs p-1.5 flex items-center justify-center group-hover:scale-105 group-hover:border-sky-300 transition duration-150">
                  <VokaIcon className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-none">
                    VokaLink <span className="text-sky-500">SMK</span>
                  </span>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Panel Pengelola
                  </span>
                </div>
              </Link>
            </div>

            {/* School Profile Card */}
            <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-bold text-slate-800 truncate" title={resolvedSchoolName}>
                {resolvedSchoolName}
              </p>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                <span>Periode:</span>
                <span className="font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                  {activePeriod}
                </span>
              </div>
            </div>

            {/* Main Navigation Menu (Maksimal 5 Item Sesuai Aturan CP2) */}
            <nav className="px-3 space-y-1">
              <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Menu Utama
              </p>
              {SCHOOL_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }`}
                  >
                    <Icon className={`size-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 space-y-2">
            <Link
              href="/"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="size-3.5" />
                Landing Page
              </span>
              <ChevronRight className="size-3.5 text-slate-400" />
            </Link>
            <div className="pt-2 text-[10px] text-slate-400 text-center">
              VokaLink v1.0 &bull; UINIC 8.0
            </div>
          </div>
        </aside>

        {/* 3. MOBILE DRAWER OVERLAY (< 1024px) */}
        {mobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />

            {/* Drawer Container */}
            <div className="relative w-[280px] max-w-[80vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10">
              <div>
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-xs p-1 flex items-center justify-center">
                      <VokaIcon className="w-full h-full object-contain" />
                    </div>
                    <span className="text-sm font-extrabold text-slate-900">
                      VokaLink <span className="text-sky-500">SMK</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    aria-label="Tutup menu"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <p className="font-bold text-slate-800 truncate">{schoolName}</p>
                  <p className="text-[11px] text-sky-600 font-semibold mt-0.5">{activePeriod}</p>
                </div>

                <nav className="px-3 space-y-1">
                  {SCHOOL_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold transition ${
                          isActive
                            ? "bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4 border-t border-slate-100">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 py-2"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Kembali ke Halaman Depan</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 4. MAIN WORKSPACE AREA */}
        <div className="flex-1 flex flex-col min-w-0 bg-canvas">
          {/* Top Bar Responsif (Mobile Header + Desktop Breadcrumb Bar) */}
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none"
                aria-label="Buka menu navigasi"
              >
                <Menu className="size-5" />
              </button>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-800 hidden sm:inline">{resolvedSchoolName}</span>
                <span className="text-slate-300 hidden sm:inline">&bull;</span>
                <span className="text-slate-500">Panel Pokja PKL</span>
              </div>
            </div>

            {/* Right Top Bar Quick Actions */}
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Aktif Terhubung</span>
              </span>

              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
              >
                Keluar
              </button>
            </div>
          </header>

          {/* Main Children Workspace Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
