"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ChevronDown, ChevronUp, User, Building, QrCode } from "lucide-react";

export function DemoBar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Jangan tampilkan di halaman landing page utama karena sudah ada tombol simulasi juri
  if (pathname === "/") {
    return null;
  }

  const ROLES = [
    { label: "Siswa PKL", href: "/student/home", icon: User },
    { label: "Sekolah (Pokja)", href: "/school/dashboard", icon: Building },
    { label: "Paspor Ber-QR", href: "/verify/andi-pratama-rpl-2026", icon: QrCode },
  ];

  if (collapsed) {
    return (
      <div className="fixed top-2 right-2 z-50">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold shadow-md hover:bg-slate-800 transition"
          title="Tampilkan Panel Uji Juri"
        >
          <Sparkles className="size-3 text-sky-400" />
          <span>Demo Juri</span>
          <ChevronDown className="size-3 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 text-xs py-1.5 px-4 relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-bold text-sky-400 uppercase tracking-wider text-[11px]">
            <Sparkles className="size-3.5" />
            Mode Uji Juri (UINIC 8.0)
          </span>
          <span className="hidden sm:inline text-slate-400 text-[11px]">&bull;</span>
          <span className="hidden sm:inline text-slate-400 text-[11px]">
            Peralihan Cepat Peran Simulasi:
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isActive = pathname.startsWith(role.href);
            return (
              <Link
                key={role.href}
                href={role.href}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition whitespace-nowrap ${
                  isActive
                    ? "bg-sky-500 text-white font-bold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="size-3" />
                <span>{role.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition ml-1"
            title="Sembunyikan strip demo"
            aria-label="Sembunyikan strip demo"
          >
            <ChevronUp className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
