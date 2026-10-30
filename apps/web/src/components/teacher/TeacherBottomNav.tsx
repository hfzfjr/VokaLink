"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, LayoutGrid, RefreshCw, Users, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  id: string;
  label: string;
  href: string;
  viewParam?: string;
  icon: React.ComponentType<{ className?: string }>;
  isPrimaryAction?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Beranda",
    href: "/teacher/dashboard",
    icon: Home,
  },
  {
    id: "matrix",
    label: "Matriks CP",
    href: "/teacher/dashboard?view=matrix",
    viewParam: "matrix",
    icon: LayoutGrid,
  },
  {
    id: "drift",
    label: "Evaluasi",
    href: "/teacher/dashboard?view=drift",
    viewParam: "drift",
    icon: RefreshCw,
    isPrimaryAction: true,
  },
  {
    id: "students",
    label: "Siswa",
    href: "/teacher/dashboard?view=students",
    viewParam: "students",
    icon: Users,
  },
  {
    id: "security",
    label: "Audit",
    href: "/teacher/dashboard?view=security",
    viewParam: "security",
    icon: ShieldCheck,
  },
];

export function TeacherBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view");

  return (
    <nav
      aria-label="Navigasi Bawah Guru"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] pt-1"
    >
      <div className="max-w-md mx-auto px-2 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.viewParam
            ? currentView === item.viewParam
            : !currentView &&
              (pathname === "/teacher/dashboard" || pathname === "/teacher/heatmap" || pathname === "/teacher");

          if (item.isPrimaryAction) {
            return (
              <Link
                key={item.id}
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
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 group min-w-[56px]",
                isActive ? "text-sky-600 font-semibold" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-150 group-hover:scale-110",
                    isActive ? "stroke-[2.2] text-sky-600" : "stroke-[1.8] text-slate-500"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] tracking-tight mt-1 transition-colors leading-none",
                  isActive ? "font-semibold text-sky-600" : "font-normal text-slate-500"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
