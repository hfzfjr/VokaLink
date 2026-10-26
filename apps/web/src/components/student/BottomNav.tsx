"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Plus,
  Award,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isPrimaryAction?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Beranda",
    href: "/student/home",
    icon: Home,
  },
  {
    label: "Riwayat",
    href: "/student/log/history",
    icon: BookOpen,
  },
  {
    label: "Catat",
    href: "/student/log/new",
    icon: Plus,
    isPrimaryAction: true,
  },
  {
    label: "Validasi",
    href: "/student/log/verify-request",
    icon: QrCode,
  },
  {
    label: "CV & Paspor",
    href: "/student/career-cv",
    icon: Award,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi Utama Siswa"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] pt-1"
    >
      <div className="max-w-md mx-auto px-2 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            Boolean(pathname) &&
            (pathname === item.href ||
              (item.href !== "/student/home" &&
                pathname!.startsWith(item.href)));

          if (item.isPrimaryAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="group relative flex flex-col items-center justify-center -top-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-full"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform active:scale-90",
                    isActive
                      ? "bg-sky-600 text-white shadow-sky-500/40 ring-4 ring-sky-100"
                      : "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/30 group-hover:scale-105 border-2 border-white"
                  )}
                >
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-tight mt-0.5 transition-colors duration-150 leading-none",
                    isActive ? "text-sky-600" : "text-slate-600 group-hover:text-sky-600"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center py-1 px-1.5 min-w-[54px] rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 active:scale-95",
                isActive ? "text-sky-600" : "text-slate-400 hover:text-slate-700"
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-150",
                    isActive ? "stroke-[2.2] scale-105" : "stroke-[1.75]"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] tracking-tight mt-1 leading-none transition-colors",
                  isActive ? "font-semibold text-sky-600" : "font-medium text-slate-500"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 bg-sky-500 rounded-full mt-1 animate-in fade-in zoom-in duration-200" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
