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
  ChevronDown,
  Inbox,
  LayoutList,
  LayoutGrid,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { type KanbanTask } from "./types";

interface DailyTimelineFeedProps {
  tasks: KanbanTask[];
  onSelectTask: (task: KanbanTask) => void;
  onOpenQrModal: () => void;
}

export function DailyTimelineFeed({
  tasks,
  onSelectTask,
  onOpenQrModal,
}: DailyTimelineFeedProps) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_REVIEW" | "VERIFIED">("ALL");
  const [monthFilter, setMonthFilter] = useState<string>("ALL");
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedLayout, setFeedLayout] = useState<"GRID" | "LIST">("GRID");
  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close custom month dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsMonthDropdownOpen(false);
      }
    }
    if (isMonthDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMonthDropdownOpen]);

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

  // Label periode bulan yang sedang aktif
  const currentMonthLabel = useMemo(() => {
    if (monthFilter === "ALL") return "Semua Bulan";
    const found = availableMonths.find((m) => m.key === monthFilter);
    return found ? found.label : monthFilter;
  }, [monthFilter, availableMonths]);

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
      {/* ─── Control Bar: Status chips | Bulan, Cari & List/Grid Switcher ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Baris 1: Status Chips Ringan (Biru VokaLink) + Mobile View Switcher */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
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

          {/* Mobile-Only View Switcher (List vs Grid) di samping kanan chips */}
          <div className="flex md:hidden items-center bg-slate-200/60 p-0.5 rounded-full border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setFeedLayout("LIST")}
              aria-label="Tampilan Baris Rapi (List View)"
              title="Tampilan Baris Rapi"
              className={cn(
                "p-1.5 rounded-full transition-all cursor-pointer",
                feedLayout === "LIST"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setFeedLayout("GRID")}
              aria-label="Tampilan Kartu (Grid View)"
              title="Tampilan Kartu Visual"
              className={cn(
                "p-1.5 rounded-full transition-all cursor-pointer",
                feedLayout === "GRID"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Baris 2 di mobile (atau samping kanan di desktop): Filter Bulan + Search Bar + Desktop View Switcher */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Quick Month Filter Custom Popover Dropdown */}
          {availableMonths.length > 1 && (
            <div ref={monthDropdownRef} className="relative shrink-0">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isMonthDropdownOpen}
                onClick={() => setIsMonthDropdownOpen((prev) => !prev)}
                className={cn(
                  "h-8 px-3 rounded-full bg-white border text-[11px] font-semibold flex items-center justify-between gap-1.5 transition-all duration-150 cursor-pointer shadow-2xs select-none",
                  isMonthDropdownOpen
                    ? "border-sky-500 ring-2 ring-sky-500/20 text-sky-700 bg-sky-50/30 shadow-xs"
                    : "border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <CalendarDays
                  className={cn(
                    "w-3.5 h-3.5 shrink-0 transition-colors",
                    isMonthDropdownOpen ? "text-sky-600" : "text-slate-400"
                  )}
                />
                <span className="truncate max-w-[85px] sm:max-w-none">{currentMonthLabel}</span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 text-slate-400 shrink-0 transition-transform duration-200",
                    isMonthDropdownOpen && "rotate-180 text-sky-600"
                  )}
                />
              </button>

              {/* Popover Menu Floating Card */}
              {isMonthDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 top-full mt-1.5 z-50 min-w-[170px] bg-white rounded-2xl border border-slate-200/90 shadow-xl p-1.5 space-y-0.5 animate-in fade-in-0 zoom-in-95 duration-150"
                >
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Periode Jurnal
                  </div>
                  <button
                    type="button"
                    role="option"
                    aria-selected={monthFilter === "ALL"}
                    onClick={() => {
                      setMonthFilter("ALL");
                      setIsMonthDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer text-left",
                      monthFilter === "ALL"
                        ? "bg-sky-50 text-sky-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    )}
                  >
                    <span>Semua Bulan</span>
                    {monthFilter === "ALL" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 stroke-[2.5] shrink-0" />
                    )}
                  </button>
                  {availableMonths.map((m) => {
                    const isSelected = monthFilter === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setMonthFilter(m.key);
                          setIsMonthDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer text-left",
                          isSelected
                            ? "bg-sky-50 text-sky-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                        )}
                      >
                        <span>{m.label}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 stroke-[2.5] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pill Search Input — Luas dan fleksibel di mobile */}
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

          {/* Desktop-Only View Switcher (Tampilan Baris vs Kartu) */}
          <div className="hidden md:flex items-center bg-slate-200/60 p-0.5 rounded-full border border-slate-200 shrink-0">
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

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group cursor-pointer"
              >
                {/* Bagian Kiri: Sleek Date Badge + Info Utama */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
                  {/* Sleek Minimalist Date Badge */}
                  <div className="shrink-0 flex items-center sm:w-38">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 text-xs font-semibold text-slate-700 border border-slate-200/70 group-hover:bg-sky-50 group-hover:text-sky-700 group-hover:border-sky-200 transition-colors whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{task.date}</span>
                    </span>
                  </div>

                  {/* Judul & Detail */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                      {task.title}
                    </h3>

                    <div className="flex items-center gap-1.5 flex-wrap text-slate-500 text-xs">
                      {/* Tag Khusus Non-Kompetensi (BR-004) */}
                      {task.category.toLowerCase().includes("non-kompetensi") && (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/70 text-[10px] font-semibold text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span>Non-Kompetensi</span>
                          </span>
                          <span className="text-slate-300">·</span>
                        </>
                      )}

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

                  {/* Tag Khusus Non-Kompetensi jika tugas umum (BR-004) */}
                  {task.category.toLowerCase().includes("non-kompetensi") && (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/70 text-[10.5px] font-semibold text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>Non-Kompetensi</span>
                      </span>
                    </div>
                  )}

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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))}
              className="h-9 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer shadow-2xs"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <div className="flex items-center gap-1 sm:gap-1.5 mx-0.5 sm:mx-1">
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
                      {showEllipsis && <span className="px-1 text-slate-400 text-xs sm:text-sm">...</span>}
                      <button
                        type="button"
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          "min-w-[36px] h-9 px-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer",
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
              className="h-9 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer shadow-2xs"
              title="Halaman Berikutnya"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
