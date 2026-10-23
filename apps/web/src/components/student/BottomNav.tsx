"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  BookOpen,
  FileCheck2,
} from "lucide-react";
import { clsx } from "clsx";

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
    label: "Catat",
    href: "/student/log/new",
    icon: PlusCircle,
    isPrimaryAction: true,
  },
  {
    label: "Riwayat",
    href: "/student/log/history",
    icon: BookOpen,
  },
  {
    label: "CV & Paspor",
    href: "/student/career-cv",
    icon: FileCheck2,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi Utama Siswa"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto px-3 py-1 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/student/home" && pathname.startsWith(item.href));

          if (item.isPrimaryAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="group relative flex flex-col items-center justify-center -top-3 min-w-[56px] min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-full"
              >
                <div
                  className={clsx(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-200 transform group-hover:scale-105 active:scale-95 text-white",
                    isActive
                      ? "bg-sky-600 shadow-sky-600/30 ring-4 ring-sky-100"
                      : "bg-sky-500 shadow-sky-500/25 group-hover:bg-sky-600"
                  )}
                >
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span
                  className={clsx(
                    "text-[10px] font-bold tracking-tight mt-1 transition-colors duration-150",
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
              className={clsx(
                "relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-3 rounded-full transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                isActive
                  ? "bg-sky-50 text-sky-600 font-bold"
                  : "text-slate-500 hover:text-slate-900 font-medium"
              )}
            >
              <div className="relative">
                <Icon
                  className={clsx(
                    "w-5 h-5 transition-transform duration-150",
                    isActive ? "stroke-[2.4] scale-105 text-sky-600" : "stroke-[1.8] text-slate-500"
                  )}
                />
              </div>
              <span className="text-[10px] tracking-tight mt-1 leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
