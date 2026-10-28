"use client";

import React, { useState, useMemo } from "react";
import {
  Code2,
  Database,
  CheckCircle,
  Cloud,
  Search,
  X,
  LayoutList,
  LayoutGrid,
  Inbox,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface SkkniModule {
  id: string;
  title: string;
  code: string;
  badgeLevel: string;
  badgeColor: {
    bg: string;
    border: string;
    text: string;
    dot: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconText: string;
  progressBarColor: string;
  description: string;
  verifiedJp: number;
  targetJp: number;
  percentage: number;
  skills: string[];
}

const MODULES: SkkniModule[] = [
  {
    id: "web-mobile",
    title: "Pemrograman Web & Mobile",
    code: "J.620100.009.01",
    badgeLevel: "Mahir (Ready)",
    badgeColor: {
      bg: "bg-emerald-50",
      border: "border-emerald-200/80",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    icon: Code2,
    iconBg: "bg-sky-50 border-sky-100 group-hover:bg-sky-500 group-hover:text-white",
    iconText: "text-sky-600",
    progressBarColor: "bg-sky-500",
    description:
      "Perancangan arsitektur REST API modular, router Express, middleware autentikasi, serta integrasi frontend React/Next.js.",
    verifiedJp: 128,
    targetJp: 240,
    percentage: 53,
    skills: ["Express.js", "TypeScript", "Next.js", "RESTful API", "JWT"],
  },
  {
    id: "database",
    title: "Basis Data Relasional",
    code: "J.620100.010.01",
    badgeLevel: "Menengah-Lanjut",
    badgeColor: {
      bg: "bg-teal-50",
      border: "border-teal-200/80",
      text: "text-teal-700",
      dot: "bg-teal-500",
    },
    icon: Database,
    iconBg: "bg-teal-50 border-teal-100 group-hover:bg-teal-600 group-hover:text-white",
    iconText: "text-teal-700",
    progressBarColor: "bg-teal-500",
    description:
      "Pemodelan data relasional 3NF, pembuatan skema PostgreSQL, penulisan trigger database, audit immutability, dan ORM Prisma.",
    verifiedJp: 80,
    targetJp: 160,
    percentage: 50,
    skills: ["PostgreSQL", "Prisma ORM", "Database Triggers", "Supavisor"],
  },
  {
    id: "software-qa",
    title: "Software QA & Penjaminan Mutu",
    code: "J.620100.015.01",
    badgeLevel: "Menengah",
    badgeColor: {
      bg: "bg-amber-50",
      border: "border-amber-200/80",
      text: "text-amber-800",
      dot: "bg-amber-500",
    },
    icon: CheckCircle,
    iconBg: "bg-amber-50 border-amber-100 group-hover:bg-amber-500 group-hover:text-white",
    iconText: "text-amber-600",
    progressBarColor: "bg-amber-500",
    description:
      "Pengujian unit deterministik, automated endpoint testing dengan Supertest, verifikasi format RFC 7807, dan validasi Zod.",
    verifiedJp: 48,
    targetJp: 120,
    percentage: 40,
    skills: ["Vitest", "Supertest", "Zod", "RFC 7807", "Test Automation"],
  },
  {
    id: "devops",
    title: "Cloud Architecture & DevOps",
    code: "J.620100.020.01",
    badgeLevel: "Dasar-Menengah",
    badgeColor: {
      bg: "bg-indigo-50",
      border: "border-indigo-200/80",
      text: "text-indigo-700",
      dot: "bg-indigo-500",
    },
    icon: Cloud,
    iconBg: "bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white",
    iconText: "text-indigo-600",
    progressBarColor: "bg-indigo-500",
    description:
      "Kontainerisasi microservice Docker, deployment mandiri via Coolify di Home Server, routing terowongan Cloudflare Tunnel, dan zero-cost monitoring.",
    verifiedJp: 32,
    targetJp: 120,
    percentage: 27,
    skills: ["Docker", "Coolify", "Cloudflare Tunnel", "Linux CI/CD"],
  },
];

import type { KanbanTask } from "./types";

interface SkkniMatrixViewProps {
  tasks?: KanbanTask[];
}

export function SkkniMatrixView({ tasks }: SkkniMatrixViewProps) {
  const [matrixLayout, setMatrixLayout] = useState<"GRID" | "LIST">("GRID");
  const [levelFilter, setLevelFilter] = useState<"ALL" | "READY" | "PROGRESS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  // Hitung akumulasi JP dinamis per modul SKKNI dari logbook yang berstatus verified
  const dynamicModules = useMemo(() => {
    if (!tasks || tasks.length === 0) return MODULES;

    const verifiedTasks = tasks.filter((t) => t.status === "verified");

    return MODULES.map((mod) => {
      const matchingJp = verifiedTasks
        .filter((t) => {
          if (mod.id === "web-mobile") {
            return t.category.includes("Web") || t.skkniUnitCode.includes("009") || t.title.includes("API") || t.title.includes("UI");
          }
          if (mod.id === "database") {
            return t.category.includes("Basis Data") || t.skkniUnitCode.includes("010") || t.title.includes("Database") || t.title.includes("PostgreSQL");
          }
          if (mod.id === "software-qa") {
            return t.category.includes("Testing") || t.skkniUnitCode.includes("015") || t.title.includes("QA") || t.title.includes("Test");
          }
          if (mod.id === "cloud-devops") {
            return t.category.includes("Cloud") || t.skkniUnitCode.includes("020") || t.title.includes("CI/CD") || t.title.includes("Docker");
          }
          return false;
        })
        .reduce((sum, t) => sum + t.durationJp, 0);

      const totalVerified = matchingJp;
      const percentage = Math.min(100, Math.round((totalVerified / mod.targetJp) * 100));
      const badgeLevel = percentage >= 50 ? "Mahir (Ready)" : "Menengah";

      return {
        ...mod,
        verifiedJp: totalVerified,
        percentage,
        badgeLevel,
      };
    });
  }, [tasks]);

  const readyCount = useMemo(() => dynamicModules.filter((m) => m.percentage >= 50).length, [dynamicModules]);
  const progressCount = useMemo(() => dynamicModules.filter((m) => m.percentage < 50).length, [dynamicModules]);

  // Filtered Modules
  const filteredModules = useMemo(() => {
    return dynamicModules.filter((m) => {
      // 1. Level Filter
      if (levelFilter === "READY" && m.percentage < 50) return false;
      if (levelFilter === "PROGRESS" && m.percentage >= 50) return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesCode = m.code.toLowerCase().includes(q);
        const matchesDesc = m.description.toLowerCase().includes(q);
        const matchesSkills = m.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCode && !matchesDesc && !matchesSkills) {
          return false;
        }
      }

      return true;
    });
  }, [dynamicModules, levelFilter, searchQuery]);

  return (
    <div className="space-y-4 pt-1 pb-6 animate-in fade-in duration-200">
      {/* ─── Control Bar: Level chips (sekunder) | Cari & List/Grid ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Status chips ringan — warna biru VokaLink saat aktif, bersih tanpa dot */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto scrollbar-none">
          {(
            [
              { key: "ALL", label: "Semua", count: MODULES.length },
              { key: "READY", label: "Mahir", count: readyCount },
              { key: "PROGRESS", label: "Progres", count: progressCount },
            ] as const
          ).map((chip) => {
            const active = levelFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setLevelFilter(chip.key)}
                aria-pressed={active}
                className={cn(
                  "h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer",
                  active
                    ? "bg-sky-500 text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <span>{chip.label}</span>
                <span className={cn("tabular-nums text-[11px]", active ? "text-white/80 font-medium" : "text-slate-400")}>
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar + View Mode Switcher (List vs Grid) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Pill Search Input */}
          <div className="relative flex-1 sm:w-60 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari modul, SKKNI, tools..."
              className="w-full h-8 pl-9 pr-8 rounded-full bg-white border border-slate-200/90 text-xs text-slate-900 placeholder:text-slate-400 font-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Switcher: LIST vs GRID Toggle */}
          <div className="flex items-center bg-slate-200/60 p-0.5 rounded-full border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setMatrixLayout("LIST")}
              aria-label="Tampilan Baris Rapi (List View)"
              title="Tampilan Baris Rapi (List)"
              className={cn(
                "p-1.5 rounded-full transition-all cursor-pointer",
                matrixLayout === "LIST"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMatrixLayout("GRID")}
              aria-label="Tampilan Kartu (Grid View)"
              title="Tampilan Kartu Visual (Grid)"
              className={cn(
                "p-1.5 rounded-full transition-all cursor-pointer",
                matrixLayout === "GRID"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Empty Search State ─── */}
      {filteredModules.length === 0 && (
        <div className="py-12 bg-white rounded-3xl border border-slate-200/80 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Unit Kompetensi Tidak Ditemukan</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ada modul yang cocok dengan kata kunci &quot;{searchQuery}&quot;. Coba cari istilah lain atau reset filter.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setLevelFilter("ALL");
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* ─── Mode 1: GRID VIEW (Notion Minimalist Bento Cards) ─── */}
      {matrixLayout === "GRID" && filteredModules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 animate-in fade-in duration-150">
          {filteredModules.map((module) => {
            const Icon = module.icon;
            const isExpanded = expandedModuleId === module.id;
            return (
              <div
                key={module.id}
                className={cn(
                  "bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative shadow-2xs group active:scale-[0.99]",
                  isExpanded
                    ? "border-slate-300 shadow-xs"
                    : "border-slate-200/70 hover:border-slate-300 hover:shadow-xs"
                )}
              >
                {/* Header: Icon, Title, SKKNI Code & Level Badge */}
                <div className="p-4 sm:p-5 pb-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl border flex items-center justify-center font-bold shadow-2xs transition-all duration-200 shrink-0",
                          module.iconBg,
                          module.iconText
                        )}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[13.5px] sm:text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors tracking-tight leading-snug">
                          {module.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 font-semibold text-[10px] text-slate-700 font-mono">
                            {module.code}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium shrink-0 border",
                        module.badgeColor.bg,
                        module.badgeColor.border,
                        module.badgeColor.text
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", module.badgeColor.dot)} />
                      <span>{module.badgeLevel}</span>
                    </span>
                  </div>

                  {/* Notion Skills Tag Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {module.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 text-[10.5px] text-slate-600 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {module.skills.length > 4 && (
                      <span className="text-[10px] text-slate-400 font-medium self-center">
                        +{module.skills.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Progress Row */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-medium text-slate-500">
                        Progres Capaian
                      </span>
                      <div className="flex items-baseline gap-1 font-sans tabular-nums">
                        <span className="font-bold text-slate-900 text-xs font-mono">
                          {module.verifiedJp}
                        </span>
                        <span className="text-slate-400 text-[11px] font-normal">
                          / {module.targetJp} JP
                        </span>
                        <span className="text-xs font-bold text-sky-600 ml-1">
                          ({module.percentage}%)
                        </span>
                      </div>
                    </div>

                    {/* Sleek Progress Bar (Solid, Flat & Modern) */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          module.progressBarColor
                        )}
                        style={{ width: `${module.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer: Clean Expandable Syllabus (Full-Bleed Divider) */}
                <div className="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-5 py-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-normal">
                      Standar Kompetensi Kerja (SKKNI)
                    </span>

                    <button
                      type="button"
                      onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                      className="text-[11px] text-slate-500 hover:text-sky-600 font-semibold inline-flex items-center gap-1 shrink-0 transition cursor-pointer"
                    >
                      <span>{isExpanded ? "Tutup Silabus" : "Rincian Silabus"}</span>
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform duration-200",
                          isExpanded && "rotate-180 text-sky-600"
                        )}
                      />
                    </button>
                  </div>

                  {/* Expandable Clean Syllabus Description */}
                  {isExpanded && (
                    <div className="pt-2 animate-in fade-in duration-200 text-xs text-slate-600 leading-relaxed font-normal bg-white p-3 rounded-xl border border-slate-200/80">
                      <p className="font-semibold text-slate-800 mb-1">Deskripsi Silabus SKKNI:</p>
                      <p>{module.description}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Mode 2: LIST VIEW (Clean, high-density rows) ─── */}
      {matrixLayout === "LIST" && filteredModules.length > 0 && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          {filteredModules.map((module) => {
            const Icon = module.icon;
            const isExpanded = expandedModuleId === module.id;
            return (
              <div
                key={module.id}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 shadow-xs hover:border-slate-300 transition-all flex flex-col group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                  {/* Left: Icon + Title & SKKNI Code */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl border flex items-center justify-center font-bold shadow-2xs transition-all shrink-0",
                        module.iconBg,
                        module.iconText
                      )}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
                          {module.title}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                          {module.code}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {module.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 text-[10.5px] font-normal"
                          >
                            {skill}
                          </span>
                        ))}
                        {module.skills.length > 3 && (
                          <span className="text-[10.5px] text-slate-400 font-normal">
                            +{module.skills.length - 3} lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics + Progress Bar + Status Badge */}
                  <div className="flex items-center justify-between lg:justify-end gap-3.5 shrink-0 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Progress & Numbers */}
                    <div className="space-y-1 min-w-[130px] sm:min-w-[150px]">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-semibold text-slate-900 tabular-nums text-xs">
                          {module.verifiedJp} / {module.targetJp} JP
                        </span>
                        <span className="text-xs font-bold text-sky-600">
                          {module.percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            module.progressBarColor
                          )}
                          style={{ width: `${module.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Level Badge */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 border",
                        module.badgeColor.bg,
                        module.badgeColor.border,
                        module.badgeColor.text
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", module.badgeColor.dot)} />
                      <span className="hidden sm:inline">{module.badgeLevel}</span>
                      <span className="sm:hidden">{module.percentage >= 50 ? "Mahir" : "Progres"}</span>
                    </span>

                    {/* Expand Detail Button */}
                    <button
                      type="button"
                      onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title="Lihat detail silabus"
                    >
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Syllabus Description in List */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200 text-xs text-slate-600 leading-relaxed font-normal bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                    <p className="font-semibold text-slate-800 mb-1">Cakupan Unit Pembelajaran SKKNI:</p>
                    <p>{module.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SkkniMatrixView;
