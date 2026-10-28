"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Navigation,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/school/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "dudi",
    label: "Mitra DUDI",
    href: "/school/dudi-directory",
    icon: Building2,
  },
  {
    id: "placements",
    label: "Penempatan",
    href: "/school/placements",
    icon: Navigation,
  },
  {
    id: "erapor",
    label: "e-Rapor",
    href: "/school/erapor",
    icon: FileSpreadsheet,
  },
];

export function SchoolBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi Bawah Pengelola Sekolah"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] pt-1.5"
    >
      <div className="max-w-md mx-auto px-2 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              onTouchStart={() => router.prefetch(item.href)}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-150 select-none group min-w-[56px]",
                isActive ? "text-sky-600 font-bold" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 relative",
                  isActive
                    ? "bg-sky-50 text-sky-600 shadow-2xs scale-105"
                    : "group-hover:bg-slate-100 text-slate-400"
                )}
              >
                <Icon className="w-4 h-4" />
                {isActive && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-sky-600" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] tracking-tight mt-0.5 transition-colors",
                  isActive ? "text-sky-600 font-bold" : "text-slate-500 font-medium"
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
