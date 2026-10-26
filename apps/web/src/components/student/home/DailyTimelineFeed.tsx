"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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
  ChevronLeft,
  Inbox,
  LayoutList,
  LayoutGrid,
  CalendarDays,
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
  if (!dateStr) return { day: "--", month: "", weekday: "" };
  const trimmed = dateStr.trim();
  const tokens = trimmed.split(/\s+/);
  if (tokens.length >= 2 && tokens[0] && tokens[1] && !isNaN(Number(tokens[0]))) {
    return {
      day: tokens[0].padStart(2, "0"),
      month: tokens[1].slice(0, 3).toUpperCase(),
      weekday: "",
    };
  }
  if (trimmed.includes("-")) {
    const parts = trimmed.split("-");
    if (parts.length === 3) {
      const d = new Date(trimmed + "T00:00:00");
      if (!isNaN(d.getTime())) {
        return {
          day: String(d.getDate()).padStart(2, "0"),
          month: d.toLocaleDateString("id-ID", { month: "short" }).replace(".", "").toUpperCase(),
          weekday: d.toLocaleDateString("id-ID", { weekday: "short" }).replace(".", ""),
        };
      }
    }
  }
  return { day: trimmed.slice(0, 5), month: "", weekday: "" };
}

export function DailyTimelineFeed({
  tasks,
  onSelectTask,
  onOpenQrModal,
}: DailyTimelineFeedProps) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_REVIEW" | "VERIFIED">("ALL");
  const [monthFilter, setMonthFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedLayout, setFeedLayout] = useState<"GRID" | "LIST">("GRID");
  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ekstrak daftar bulan yang tersedia dari data jurnal
  const availableMonths = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => {
      if (t.isoDate && t.isoDate.length >= 7) {
        const ym = t.isoDate.slice(0, 7);
        if (!map.has(ym)) {
          const d = new Date(t.isoDate + "T00:00:00");
          if (!isNaN(d.getTime())) {
            const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
            map.set(ym, label);
          }
        }
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, label]) => ({ key, label }));
  }, [tasks]);

  // Filter tasks berdasarkan status, bulan, dan pencarian kata kunci
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Status Filter
      if (statusFilter === "IN_REVIEW" && t.status !== "in_review" && t.status !== "in_progress") {
        return false;
      }
      if (statusFilter === "VERIFIED" && t.status !== "verified") {
        return false;
      }

      // 2. Month Filter
      if (monthFilter !== "ALL") {
        if (t.isoDate && !t.isoDate.startsWith(monthFilter)) {
          return false;
        }
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesCategory = t.category.toLowerCase().includes(q);
        const matchesDate = t.date.toLowerCase().includes(q);
        const matchesTools = t.tools ? t.tools.some((tool) => tool.toLowerCase().includes(q)) : false;
        const matchesNote = t.shortNote ? t.shortNote.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesCategory && !matchesDate && !matchesTools && !matchesNote) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, statusFilter, monthFilter, searchQuery]);

  // Reset ke halaman 1 setiap kali filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, monthFilter, searchQuery]);

  const totalItems = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Item yang dipaginasi agar tidak terjadi scroll tak terbatas
  const paginatedTasks = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredTasks.slice(start, start + PAGE_SIZE);
  }, [filteredTasks, safeCurrentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pendingCount = useMemo(
    () => tasks.filter((t) => t.status === "in_review" || t.status === "in_progress").length,
    [tasks]
  );
  const verifiedCount = useMemo(
    () => tasks.filter((t) => t.status === "verified").length,
    [tasks]
  );

  return (
    <div ref={containerRef} className="space-y-4 pt-1 pb-6 animate-in fade-in duration-200">
      {/* ─── Control Bar: Status chips (sekunder) | Bulan, Cari & List/Grid ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Status chips ringan — warna biru VokaLink saat aktif, bersih tanpa dot */}
        <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto scrollbar-none">
          {(
            [
              { key: "ALL", label: "Semua", count: tasks.length },
              { key: "VERIFIED", label: "Sah", count: verifiedCount },
              { key: "IN_REVIEW", label: "Menunggu", count: pendingCount },
            ] as const
          ).map((chip) => {
            const active = statusFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStatusFilter(chip.key)}
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

        {/* Filter Bulan + Search Bar + View Mode Switcher (List vs Grid) */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Quick Month Filter Selector (If > 1 months exist) */}
          {availableMonths.length > 1 && (
            <div className="relative shrink-0">
              <select
                aria-label="Pilih Periode Bulan Jurnal"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="h-8 pl-7 pr-3 rounded-full bg-white border border-slate-200/90 text-[11px] font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs cursor-pointer appearance-none"
              >
                <option value="ALL">Semua Bulan</option>
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
              <CalendarDays className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Pill Search Input */}
          <div className="relative flex-1 sm:w-56 md:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tanggal, tugas..."
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
                : monthFilter !== "ALL"
                ? "Tidak ada catatan jurnal magang pada bulan yang dipilih."
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
        /* ─── TAMPILAN A: MODERN LIST CARDS (KONSISTEN DENGAN GALERI & MATRIKS) ─── */
        <div className="space-y-3 animate-in fade-in duration-150">
          {paginatedTasks.map((task) => {
            const isVerified = task.status === "verified";
            const dotColor = getCategoryDotColor(task.categoryColor);
            const { day, month, weekday } = parseTaskDateParts(task.date);

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group cursor-pointer"
              >
                {/* Bagian Kiri: Date Squircle Badge + Info Utama */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Modern Calendar Tile Date Badge - Vivid Sky Ribbon */}
                  <div className="w-12 sm:w-13 h-13 sm:h-14 rounded-2xl bg-white border border-slate-200/90 flex flex-col items-center justify-between text-center shrink-0 shadow-2xs group-hover:border-sky-300 group-hover:shadow-xs transition-all overflow-hidden select-none">
                    <div className="w-full bg-sky-600 group-hover:bg-sky-500 py-0.5 border-b border-sky-700/20 transition-colors">
                      <span className="text-[9.5px] font-bold text-white tracking-wider uppercase leading-none block">
                        {month || "LOG"}
                      </span>
                    </div>
                    <span className="text-base sm:text-lg font-black text-slate-900 leading-none py-0.5 tracking-tight font-sans">
                      {day}
                    </span>
                    <div className="w-full pb-1">
                      <span className="text-[9.5px] font-medium text-slate-400 capitalize leading-none block">
                        {weekday || "Hari"}
                      </span>
                    </div>
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

                      {/* Short Note Preview */}
                      {task.shortNote && (
                        <>
                          <span className="text-slate-300 hidden lg:inline">·</span>
                          <span className="text-slate-400 truncate max-w-[200px] hidden lg:inline font-normal text-[11px]">
                            &quot;{task.shortNote}&quot;
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bagian Kanan: Jam, Status / QR Button & Chevron */}
                <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
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
        /* ─── TAMPILAN B: NOTION MINIMALIST BENTO CARDS ─── */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 animate-in fade-in duration-150">
          {paginatedTasks.map((task) => {
            const isVerified = task.status === "verified";
            const dotColor = getCategoryDotColor(task.categoryColor);

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-200/70 hover:border-slate-300 hover:shadow-xs transition-all duration-150 cursor-pointer group active:scale-[0.99] flex flex-col justify-between space-y-3.5 relative shadow-2xs"
              >
                <div className="space-y-2.5">
                  {/* Header: Date, Duration, and Status / Action */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>{task.date}</span>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 font-semibold text-[10px] text-slate-700 font-mono">
                        {task.durationJp} Jam
                      </span>
                    </div>

                    <div className="shrink-0">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10.5px] font-medium">
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 active:scale-95 border border-sky-200/80 text-[10.5px] font-semibold transition cursor-pointer shadow-2xs"
                          title="Tampilkan QR Verifikasi Mentor"
                        >
                          <QrCode className="w-3 h-3 text-sky-600" />
                          <span>QR PIN</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Pill Tag */}
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 text-[10.5px] font-medium text-slate-600">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
                      <span className="truncate">{getCategoryShortLabel(task.category)}</span>
                    </span>
                  </div>

                  {/* Task Title (Prominent & Clear) */}
                  <h3 className="text-[13.5px] sm:text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug line-clamp-2">
                    {task.title}
                  </h3>
                </div>

                {/* Footer: Autonomy Pill & Mentor / Sync Trail */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-md border",
                      task.autonomyLabel === "Mandiri"
                        ? "bg-slate-50 text-slate-700 border-slate-200/70"
                        : "bg-sky-50/60 text-sky-700 border-sky-200/60"
                    )}
                  >
                    {task.autonomyLabel}
                  </span>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
                    {isVerified ? (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate max-w-[100px]">{task.mentorSignature || "Mentor"}</span>
                      </span>
                    ) : (
                      <span className="text-amber-700/90 font-medium text-[10.5px]">
                        Menunggu Validasi
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

      {/* ─── Modern Minimalist Centered Pagination ─── */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-slate-200/60 flex items-center justify-center">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))}
              className="h-8.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-2xs"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 5) return true;
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - safeCurrentPage) <= 1
                  );
                })
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && page - prev > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                      <button
                        type="button"
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          "min-w-[34px] h-[34px] px-2 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer",
                          safeCurrentPage === page
                            ? "bg-sky-500 text-white font-bold shadow-xs border border-sky-500"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                        )}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => handlePageChange(Math.min(totalPages, safeCurrentPage + 1))}
              className="h-8.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-2xs"
              title="Halaman Berikutnya"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
