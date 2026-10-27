"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Flame, ShieldAlert, Users, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  id: string;
  label: string;
  href: string;
  viewParam?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "heatmap",
    label: "Heatmap",
    href: "/teacher/heatmap",
    icon: Flame,
  },
  {
    id: "drift",
    label: "Drift",
    href: "/teacher/heatmap?view=drift",
    viewParam: "drift",
    icon: ShieldAlert,
  },
  {
    id: "students",
    label: "Siswa",
    href: "/teacher/heatmap?view=students",
    viewParam: "students",
    icon: Users,
  },
  {
    id: "security",
    label: "Audit",
    href: "/teacher/heatmap?view=security",
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] pt-1.5"
    >
      <div className="max-w-md mx-auto px-4 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.viewParam
            ? currentView === item.viewParam
            : !currentView && pathname === "/teacher/heatmap";

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 select-none group min-w-[64px]",
                isActive ? "text-sky-600 font-bold" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-150",
                  isActive ? "bg-sky-50 text-sky-600 scale-105" : "group-hover:bg-slate-50"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.4]" : "stroke-[1.8]")} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight leading-none whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
