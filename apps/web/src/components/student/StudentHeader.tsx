"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Home,
  PlusCircle,
  BookOpen,
  FileCheck2,
} from "lucide-react";
import { clsx } from "clsx";

const DESKTOP_NAV_LINKS = [
  { label: "Beranda", href: "/student/home", icon: Home },
  { label: "Catat Jurnal", href: "/student/log/new", icon: PlusCircle },
  { label: "Riwayat Logbook", href: "/student/log/history", icon: BookOpen },
  { label: "CV ATS & Paspor", href: "/student/career-cv", icon: FileCheck2 },
];

export function StudentHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand & Left section */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            title="Kembali ke Beranda Utama"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
            aria-label="Kembali ke Beranda Utama"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight text-slate-900 leading-none">
                VokaLink
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 font-extrabold leading-none tracking-wide">
                SISWA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-1 hidden sm:block">
              Fase F · Target 792 Jam Pelajaran
            </p>
          </div>
        </div>

        {/* Desktop Navigation Bar (hidden on mobile, visible on tablet & desktop) */}
        <nav
          aria-label="Navigasi Desktop Siswa"
          className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/80 shadow-2xs"
        >
          {DESKTOP_NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/student/home" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150",
                  isActive
                    ? "bg-sky-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                )}
              >
                <Icon
                  className={clsx(
                    "w-4 h-4",
                    isActive ? "text-white stroke-[2.3]" : "text-slate-400"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Student Profile snippet on right */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>RPL · Kelas XI</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
              AP
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-bold text-slate-900 leading-none">
                Andi Pratama
              </p>
              <p className="text-[10px] text-slate-500 font-medium leading-none mt-1">
                PT Nusantara Tech
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
