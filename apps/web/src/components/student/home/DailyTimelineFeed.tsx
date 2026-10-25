"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  QrCode,
  PlusCircle,
  Search,
  X,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Inbox,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { type KanbanTask, getCategoryDotColor, getCategoryShortLabel } from "./types";

interface DailyTimelineFeedProps {
  tasks: KanbanTask[];
  onSelectTask: (task: KanbanTask) => void;
  onOpenQrModal: () => void;
}

/**
 * Parser tanggal aman untuk kartu & list squircle badge
 */
function parseTaskDateParts(dateStr: string) {
  if (!dateStr) return { day: "--", month: "" };
  const trimmed = dateStr.trim();
  const tokens = trimmed.split(/\s+/);
  if (tokens.length >= 2 && tokens[0] && tokens[1] && !isNaN(Number(tokens[0]))) {
    return {
      day: tokens[0],
      month: tokens[1].slice(0, 3).toUpperCase(),
    };
  }
  if (trimmed.includes("-")) {
    const parts = trimmed.split("-");
    if (parts.length === 3) {
      const d = new Date(trimmed + "T00:00:00");
      if (!isNaN(d.getTime())) {
        return {
          day: String(d.getDate()),
          month: d.toLocaleDateString("id-ID", { month: "short" }).toUpperCase(),
        };
      }
    }
  }
  return { day: trimmed.slice(0, 5), month: "" };
}

export function DailyTimelineFeed({
  tasks,
  onSelectTask,
  onOpenQrModal,
}: DailyTimelineFeedProps) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_REVIEW" | "VERIFIED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedLayout, setFeedLayout] = useState<"LIST" | "GRID">("LIST");

  // Filter tasks based on status and search query
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Status Filter
      if (statusFilter === "IN_REVIEW" && t.status !== "in_review" && t.status !== "in_progress") {
        return false;
      }
      if (statusFilter === "VERIFIED" && t.status !== "verified") {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesCategory = t.category.toLowerCase().includes(q);
        const matchesDate = t.date.toLowerCase().includes(q);
        const matchesTools = t.tools.some((tool) => tool.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCategory && !matchesDate && !matchesTools) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, statusFilter, searchQuery]);

  const pendingCount = useMemo(
    () => tasks.filter((t) => t.status === "in_review" || t.status === "in_progress").length,
    [tasks]
  );
  const verifiedCount = useMemo(
    () => tasks.filter((t) => t.status === "verified").length,
    [tasks]
  );

  return (
    <div className="space-y-4">
      {/* ─── Control Bar: Status Filter Tabs, Search & List/Grid Switcher ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Status Filter Segmented Buttons - Apple Style Rounded Full */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-full border border-slate-200 text-xs font-medium w-full sm:w-auto overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={cn(
              "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 active:scale-95",
              statusFilter === "ALL"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900 font-medium"
            )}
          >
            <span className="hidden sm:inline">Semua Jurnal</span>
            <span className="sm:hidden">Semua</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-semibold",
                statusFilter === "ALL"
                  ? "bg-slate-100 text-slate-800"
                  : "bg-slate-300/60 text-slate-600"
              )}
            >
              {tasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("IN_REVIEW")}
            className={cn(
              "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 active:scale-95",
              statusFilter === "IN_REVIEW"
                ? "bg-white text-amber-800 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900 font-medium"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="hidden sm:inline">Menunggu Validasi</span>
            <span className="sm:hidden">Antrean</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("VERIFIED")}
            className={cn(
              "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 active:scale-95",
              statusFilter === "VERIFIED"
                ? "bg-white text-emerald-800 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900 font-medium"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="hidden sm:inline">Sah Terverifikasi</span>
            <span className="sm:hidden">Sah</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              {verifiedCount}
            </span>
          </button>
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
              placeholder="Cari tanggal, tugas, tools..."
              className="w-full pl-9 pr-8 py-1.5 rounded-full bg-white border border-slate-200/90 text-xs text-slate-900 placeholder:text-slate-400 font-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs"
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
              onClick={() => setFeedLayout("LIST")}
              aria-label="Tampilan Baris Rapi (List View)"
              title="Tampilan Baris Rapi (List)"
              className={cn(
                "p-1.5 rounded-full transition-all cursor-pointer",
                feedLayout === "LIST"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setFeedLayout("GRID")}
              aria-label="Tampilan Kartu (Grid View)"
              title="Tampilan Kartu Visual (Grid)"
              className={cn(
                "p-1.5 rounded-full transition-all cursor-pointer",
                feedLayout === "GRID"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Timeline Feed Content: Empty / List / Grid ─── */}
      {filteredTasks.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl border border-dashed border-slate-200/90 bg-slate-50/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 mx-auto shadow-2xs">
            <Inbox className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              Tidak Ada Jurnal yang Sesuai
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto font-normal">
              {searchQuery
                ? `Tidak ditemukan catatan jurnal dengan kata kunci "${searchQuery}".`
                : statusFilter === "IN_REVIEW"
                ? "Bagus sekali! Semua jurnal Anda telah diverifikasi oleh mentor industri."
                : "Belum ada catatan jurnal pada filter ini."}
            </p>
          </div>
          <Link
            href="/student/log/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold transition active:scale-95 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tambah Jurnal Baru</span>
          </Link>
        </div>
      ) : feedLayout === "LIST" ? (
        /* ─── TAMPILAN A: INSET GROUPED LIST (SUPER CLEAN SEPERTI DI RIWAYAT LOGBOOK) ─── */
        <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
          {filteredTasks.map((task) => {
            const isVerified = task.status === "verified";
            const dotColor = getCategoryDotColor(task.categoryColor);
            const { day, month } = parseTaskDateParts(task.date);

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors duration-150 cursor-pointer select-none gap-3"
              >
                {/* Bagian Kiri: Date Squircle Badge + Info Utama */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Squircle Date Badge */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col items-center justify-center text-center shrink-0 shadow-2xs group-hover:border-sky-300 transition-colors">
                    <span className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                      {day}
                    </span>
                    {month && (
                      <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase leading-none mt-0.5">
                        {month}
                      </span>
                    )}
                  </div>

                  {/* Judul & Detail */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                      {task.title}
                    </h3>

                    <div className="flex items-center gap-1.5 flex-wrap text-slate-500 text-xs">
                      {/* Kategori Dot + Label */}
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-slate-600">
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
                        <span>{getCategoryShortLabel(task.category)}</span>
                      </span>

                      <span className="text-slate-300">·</span>

                      {/* Kemandirian Badge */}
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                          task.autonomyLabel === "Mandiri"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                            : "bg-sky-50 text-sky-700 border-sky-200/70"
                        )}
                      >
                        {task.autonomyLabel}
                      </span>

                      {/* Tools Digunakan */}
                      {task.tools.slice(0, 2).map((tool) => (
                        <span
                          key={tool}
                          className="hidden md:inline text-[9.5px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/50"
                        >
                          {tool}
                        </span>
                      ))}

                      {/* Short Note Preview */}
                      {task.shortNote && (
                        <span className="text-slate-400 truncate max-w-[200px] hidden lg:inline font-normal text-[11px]">
                          &quot;{task.shortNote}&quot;
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bagian Kanan: Jam, Status / QR Button & Chevron */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="font-semibold text-xs sm:text-sm text-slate-900 block leading-tight">
                      {task.durationJp} Jam Kerja
                    </span>
                    <span className="text-[11px] text-slate-400 block font-normal">
                      {isVerified ? (
                        <span className="text-emerald-700 font-medium">● Terverifikasi</span>
                      ) : (
                        <span className="text-amber-700 font-medium">Menunggu PIN</span>
                      )}
                    </span>
                  </div>

                  {/* Aksi / Status Badge */}
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                      <span>Sah</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenQrModal();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-[11px] font-semibold shadow-2xs transition cursor-pointer"
                      title="Buka QR Verifikasi Mentor"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>QR PIN</span>
                    </button>
                  )}

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── TAMPILAN B: VISUAL GRID CARDS (2 KOLOM MODERN) ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTasks.map((task) => {
            const isVerified = task.status === "verified";
            const dotColor = getCategoryDotColor(task.categoryColor);

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className={cn(
                  "p-4 rounded-3xl border transition-all duration-150 cursor-pointer group hover:shadow-card active:scale-[0.99] relative bg-white flex flex-col justify-between shadow-2xs",
                  isVerified
                    ? "border-slate-200/80 hover:border-slate-300"
                    : "border-amber-200/80 bg-amber-50/15 hover:border-amber-300"
                )}
              >
                <div>
                  {/* Top Row: Date & Duration vs Status / QR PIN Button */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>{task.date}</span>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 font-semibold text-[10px] text-slate-700">
                        {task.durationJp} Jam
                      </span>
                    </div>

                    <div className="shrink-0">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                          <span>Sah</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenQrModal();
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-[10.5px] font-semibold shadow-2xs transition cursor-pointer"
                          title="Buka QR Verifikasi Mentor"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>QR PIN</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Kategori Dot + Label */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mb-1.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
                    <span>{getCategoryShortLabel(task.category)}</span>
                  </div>

                  {/* Task Title */}
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug line-clamp-2">
                    {task.title}
                  </h3>

                  {/* Short Note if exists */}
                  {task.shortNote && (
                    <p className="text-xs text-slate-500 font-normal mt-1.5 line-clamp-2 leading-relaxed">
                      &quot;{task.shortNote}&quot;
                    </p>
                  )}
                </div>

                {/* Footer Meta: Autonomy, Tools, Mentor / Sync status */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100/90 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                        task.autonomyLabel === "Mandiri"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                          : "bg-sky-50 text-sky-700 border-sky-200/70"
                      )}
                    >
                      {task.autonomyLabel}
                    </span>
                    {task.tools.slice(0, 2).map((tool) => (
                      <span
                        key={tool}
                        className="text-[9.5px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/50"
                      >
                        {tool}
                      </span>
                    ))}
                    {task.tools.length > 2 && (
                      <span className="text-[9.5px] text-slate-400 font-medium">
                        +{task.tools.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
                    {isVerified ? (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span className="hidden sm:inline">Disahkan</span>
                        <span className="truncate max-w-[100px]">{task.mentorSignature || "Mentor"}</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-normal text-[10.5px]">
                        {task.submittedAt || "Tersimpan offline"}
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

