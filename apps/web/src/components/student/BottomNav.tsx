"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  BookOpen,
  Award,
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
    icon: Award,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi Utama Siswa"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200/70 shadow-xs pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto px-3 py-1 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            Boolean(pathname) &&
            (pathname === item.href ||
              (item.href !== "/student/home" && pathname!.startsWith(item.href)));

          if (item.isPrimaryAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="group relative flex flex-col items-center justify-center -top-3 min-w-[56px] min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-full"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-xs transition-all duration-200 transform group-hover:scale-105 active:scale-95",
                    isActive
                      ? "bg-sky-500 text-white ring-4 ring-sky-100"
                      : "bg-sky-500 hover:bg-sky-600 text-white"
                  )}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-tight mt-1 transition-colors duration-150",
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
                "relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 active:scale-95",
                isActive
                  ? "text-sky-600 font-semibold"
                  : "text-slate-400 hover:text-slate-700 font-medium"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-150",
                    isActive ? "stroke-[2.2] scale-105" : "stroke-[1.8]"
                  )}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-sky-500 rounded-full animate-in fade-in zoom-in duration-200" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 leading-none font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
