"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  MessageSquare,
  ChevronDown,
  PlusCircle,
  QrCode,
  X,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { TOTAL_TARGET_JP } from "@vokalink/shared";
import { db } from "@/lib/pwa/db";
import { fetchStudentLogContext, type StudentLogContextResponse } from "@/lib/api";
import { cn } from "@/lib/cn";

import {
  type CategoryColor,
  type KanbanTask,
  type StudentInfo,
  DEFAULT_KANBAN_TASKS,
  formatLogDate,
} from "@/components/student/home/types";
import { KanbanWorkflowBoard } from "@/components/student/home/KanbanWorkflowBoard";
import { SkkniMatrixView } from "@/components/student/home/SkkniMatrixView";
import { EvidenceGalleryView } from "@/components/student/home/EvidenceGalleryView";
import { StudentWidgetPanel } from "@/components/student/home/StudentWidgetPanel";
import { TaskDetailModal } from "@/components/student/home/TaskDetailModal";
import { MentorQrModal } from "@/components/student/home/MentorQrModal";
import { MentorNotificationModal } from "@/components/student/home/MentorNotificationModal";
import { HomeSkeleton } from "@/components/student/home/HomeSkeleton";

export default function StudentHomePage() {
  const [placementInfo, setPlacementInfo] = useState<{
    dudiName?: string;
    dudiCity?: string;
    mentorName?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [viewMode, setViewMode] = useState<"kanban" | "matrix" | "evidence">("kanban");
  const [selectedTaskModal, setSelectedTaskModal] = useState<KanbanTask | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [dismissBackdateAlert, setDismissBackdateAlert] = useState(false);
  const [mobileKanbanColumn, setMobileKanbanColumn] = useState<
    "all" | "in_progress" | "in_review" | "verified"
  >("all");

  // 1. Live Dexie Query for Student Logs (Reactive offline-first state)
  const offlineLogs = useLiveQuery(() => db.logs.toArray(), []) || [];

  // 2. Load context from IndexedDB cache or server fallback
  useEffect(() => {
    let isMounted = true;
    async function loadPlacementContext() {
      try {
        const cached = await db.refData.get("student_log_context");
        if (cached && cached.data && isMounted) {
          const data = cached.data as StudentLogContextResponse;
          if (data.activePlacement) {
            setPlacementInfo({
              dudiName: data.activePlacement.dudiName,
              dudiCity: data.activePlacement.dudiCity,
              mentorName: data.activePlacement.mentorName,
            });
          }
        }

        if (typeof navigator !== "undefined" && navigator.onLine) {
          const fresh = await fetchStudentLogContext();
          if (fresh && fresh.activePlacement && isMounted) {
            setPlacementInfo({
              dudiName: fresh.activePlacement.dudiName,
              dudiCity: fresh.activePlacement.dudiCity,
              mentorName: fresh.activePlacement.mentorName,
            });
          }
        }
      } catch (err) {
        console.warn("Konteks penempatan offline fallback:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadPlacementContext();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Dynamically calculate JP from seed base + Dexie logs
  const baseVerifiedJp = 288;
  const dexieVerifiedJp = offlineLogs
    .filter((l) => l.state === "verified")
    .reduce((acc, curr) => acc + curr.durationJp, 0);

  const totalVerifiedJp = baseVerifiedJp + dexieVerifiedJp;

  const totalPendingJp = offlineLogs
    .filter((l) => l.state === "queued" || l.state === "meta_synced" || l.state === "synced")
    .reduce((acc, curr) => acc + curr.durationJp, 0);

  const displayPendingJp = totalPendingJp > 0 ? totalPendingJp : 16;
  const progressPercentage = Math.min(100, Math.round((totalVerifiedJp / TOTAL_TARGET_JP) * 100));

  const student: StudentInfo = {
    name: "Andi Pratama",
    email: "andi.pratama@smk.sch.id",
    nisn: "0078901234",
    school: "SMK Demo VokaLink",
    major: "Rekayasa Perangkat Lunak (RPL)",
    dudi: placementInfo?.dudiName || "PT Nusantara Tech",
    mentor: placementInfo?.mentorName || "Rizky Firmansyah (Engineering Lead)",
    city: placementInfo?.dudiCity || "Surabaya, Jawa Timur",
    verifiedJp: totalVerifiedJp,
    pendingJp: displayPendingJp,
    targetJp: TOTAL_TARGET_JP,
  };

  // 4. Transform Dexie offline logs reactively into KanbanTask cards
  const dexieTasks: KanbanTask[] = useMemo(() => {
    return offlineLogs.map((log) => {
      const isVerified = log.state === "verified";
      const isInReview =
        log.state === "queued" ||
        log.state === "meta_synced" ||
        log.state === "synced";
      const autonomyLabel =
        log.autonomyLevel === 3
          ? "Mandiri"
          : log.autonomyLevel === 2
          ? "Terbimbing"
          : "Observasi";
      const category = log.isNonCompetency
        ? log.nonCompetencyCategory || "Tugas Umum Non-Kompetensi"
        : "Pemrograman Web & Mobile";
      const categoryColor: CategoryColor = log.isNonCompetency ? "rose" : "sky";

      const syncStatusText =
        log.state === "queued"
          ? "Tersimpan di HP (Offline)"
          : log.state === "meta_synced" || log.state === "synced"
          ? "Tersinkron (Menunggu PIN)"
          : log.state === "verified"
          ? "Sah Terverifikasi"
          : "Perlu Revisi";

      return {
        id: log.clientLogUuid,
        title: log.jobCardTitle || log.shortNote || "Pencatatan Jurnal Praktik",
        category,
        categoryColor,
        date: formatLogDate(log.logDate),
        durationJp: log.durationJp,
        progressPercent: isVerified ? 100 : isInReview ? 85 : 40,
        autonomyLabel,
        skkniUnitCode: log.isNonCompetency ? "NON-KOMPETENSI" : "J.620100.009.01",
        status: isVerified ? "verified" : isInReview ? "in_review" : "in_progress",
        tools: log.isNonCompetency ? ["SOP Industri"] : ["Logbook PKL", "Dexie IndexedDB"],
        submittedAt: syncStatusText,
        mentorSignature: isVerified
          ? placementInfo?.mentorName || "Mentor Industri"
          : undefined,
        hmacVerified: isVerified,
        syncState: log.state,
        isLocalDexie: true,
        shortNote: log.shortNote,
      };
    });
  }, [offlineLogs, placementInfo]);

  // Combine Dexie logs (recent first) with sample base tasks
  const allTasks = useMemo(() => {
    return [...dexieTasks, ...DEFAULT_KANBAN_TASKS];
  }, [dexieTasks]);

  // Filtered tasks across all categories and search query
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      if (selectedCategory !== "ALL" && task.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesCategory = task.category.toLowerCase().includes(q);
        const matchesAutonomy = task.autonomyLabel.toLowerCase().includes(q);
        const matchesTools = task.tools.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCategory && !matchesAutonomy && !matchesTools) return false;
      }
      return true;
    });
  }, [allTasks, searchQuery, selectedCategory]);

  const tasksInProgress = useMemo(
    () => filteredTasks.filter((t) => t.status === "in_progress"),
    [filteredTasks]
  );
  const tasksInReview = useMemo(
    () => filteredTasks.filter((t) => t.status === "in_review"),
    [filteredTasks]
  );
  const tasksVerified = useMemo(
    () => filteredTasks.filter((t) => t.status === "verified"),
    [filteredTasks]
  );

  // ─── 5 UI States: 1. Loading Skeleton Condition ───
  if (isLoading && offlineLogs.length === 0) {
    return <HomeSkeleton />;
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-5 items-stretch min-h-[840px]">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. CENTER SECTION: WORKSPACE CANVAS (KANBAN / MATRIX / EVIDENCE)
          Apple Design System HIG (Clean White Surface, Hairline Border, Refined Spacing)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="flex-1 min-w-0 bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-slate-200/70 shadow-card flex flex-col justify-between overflow-hidden">
        <div>
          {/* ─── MOBILE-FIRST TOP HERO: Quick Status & Fast 3-Box Metrics (< lg) ─── */}
          <div className="lg:hidden mb-4 space-y-2.5">
            {/* Student & DUDI Info + Fast Action */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-xs">
                  AP
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-semibold text-slate-900 truncate">
                      {student.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 text-[9px] font-semibold shrink-0">
                      Fase F
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5 font-normal">
                    {student.dudi}
                  </p>
                </div>
              </div>

              {/* Fast Action: Minta Validasi PIN */}
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer min-h-[40px]"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Minta PIN</span>
              </button>
            </div>

            {/* Mobile 3-Box Metrics (Clean White Surface Cards) */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border border-slate-200/70 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-xs">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
                  Total JP
                </span>
                <p className="text-xl font-bold tracking-tight text-slate-900 my-1 leading-none font-mono">
                  {student.verifiedJp}
                </p>
                <span className="text-[9px] text-emerald-600 font-medium leading-none">
                  ● Terdata
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setViewMode("kanban");
                  setMobileKanbanColumn("in_review");
                }}
                className="bg-white border border-slate-200/70 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-xs cursor-pointer active:scale-95 transition hover:border-slate-300"
              >
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
                  Menunggu
                </span>
                <p className="text-xl font-bold tracking-tight text-slate-900 my-1 leading-none font-mono">
                  {student.pendingJp}
                </p>
                <span className="text-[9px] text-amber-600 font-medium leading-none flex items-center justify-center gap-0.5">
                  <span>● Antrean</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </span>
              </button>

              <div className="bg-white border border-slate-200/70 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-xs">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
                  Capaian
                </span>
                <p className="text-xl font-bold tracking-tight text-slate-900 my-1 leading-none font-mono">
                  {progressPercentage}%
                </p>
                <span className="text-[9px] text-sky-600 font-medium leading-none">
                  / 792 Target
                </span>
              </div>
            </div>
          </div>

          {/* ─── Header Bar: Title + Filter + Search + Notification ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-200/70">
            <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                Dashboard
              </h1>

              {/* Chat / Notification Trigger on mobile */}
              <div className="flex items-center gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  title="Pesan Bimbingan & Validasi Mentor"
                  className="w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-slate-200/60 border border-slate-200/70 flex items-center justify-center text-slate-600 transition relative cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
                </button>
              </div>

              {/* Category Filter Dropdown (Desktop) */}
              <div className="relative hidden sm:block">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-slate-100/80 hover:bg-slate-200/60 text-slate-800 text-xs font-medium py-2 pl-3.5 pr-8 rounded-xl border border-slate-200/70 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 min-h-[38px]"
                >
                  <option value="ALL">Semua Elemen CP</option>
                  <option value="Pemrograman Web & Mobile">Pemrograman Web & Mobile</option>
                  <option value="Basis Data Relasional">Basis Data Relasional</option>
                  <option value="Testing & QA">Testing & QA</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="Tugas Umum Non-Kompetensi">Tugas Umum Non-Kompetensi</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Right: Search Input + Message Chat Icon (Desktop) */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tugas, modul, atau tools..."
                  className="w-full bg-slate-100/80 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 font-normal pl-9 pr-8 py-2 rounded-xl border border-slate-200/70 transition focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 min-h-[38px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Pesan Bimbingan & Validasi Mentor"
                className="hidden sm:flex w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-slate-200/60 border border-slate-200/70 items-center justify-center text-slate-600 transition relative cursor-pointer shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
              </button>
            </div>

            {/* Mobile Category Select */}
            <div className="relative sm:hidden w-full">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none bg-slate-100/80 hover:bg-slate-200/60 text-slate-800 text-xs font-medium py-2.5 pl-3.5 pr-8 rounded-xl border border-slate-200/70 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 min-h-[40px]"
              >
                <option value="ALL">Semua Elemen CP</option>
                <option value="Pemrograman Web & Mobile">Pemrograman Web & Mobile</option>
                <option value="Basis Data Relasional">Basis Data Relasional</option>
                <option value="Testing & QA">Testing & QA</option>
                <option value="Cloud & DevOps">Cloud & DevOps</option>
                <option value="Tugas Umum Non-Kompetensi">Tugas Umum Non-Kompetensi</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* ─── BR-003 Backdate Alert Guard Banner (Apple Callout) ─── */}
          {!dismissBackdateAlert && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 shadow-card flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300/60 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4.5 h-4.5 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">
                      Batas Waktu Pengisian Logbook (BR-003)
                    </p>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100/80 border border-amber-200 text-amber-800 text-[10px] font-medium font-mono">
                      72 Jam
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5 font-normal">
                    Jurnal maksimal diisi dalam 3 hari kerja. Pastikan kegiatan pekan ini telah dicatat sebelum sistem mengunci otomatis.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/student/log/new"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-medium text-[11px] transition shadow-xs"
                >
                  Catat Sekarang
                </Link>
                <button
                  type="button"
                  onClick={() => setDismissBackdateAlert(true)}
                  className="w-7 h-7 rounded-lg hover:bg-amber-100/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
                  title="Tutup Pengingat"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ─── VIEW CONTROLLER: Segmented Tab Switcher (Apple HIG Style) ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Alur Kerja & Penguasaan Kompetensi</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 font-medium font-mono">
                  Fase F · 792 JP
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
                Dokumentasi zero-typing dan validasi resmi mentor industri
              </p>
            </div>

            {/* Apple Segmented Control Bar */}
            <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl border border-slate-200/50 text-xs font-semibold self-start sm:self-auto w-full sm:w-auto overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap text-center text-xs",
                  viewMode === "kanban"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
                )}
              >
                Alur Kerja
              </button>
              <button
                type="button"
                onClick={() => setViewMode("matrix")}
                className={cn(
                  "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap text-center text-xs",
                  viewMode === "matrix"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
                )}
              >
                Matriks SKKNI
              </button>
              <button
                type="button"
                onClick={() => setViewMode("evidence")}
                className={cn(
                  "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap text-center text-xs",
                  viewMode === "evidence"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
                )}
              >
                Bukti & Logbook
              </button>
            </div>
          </div>

          {/* ─── ACTIVE VIEW RENDER ─── */}
          {viewMode === "kanban" && (
            <KanbanWorkflowBoard
              tasksInProgress={tasksInProgress}
              tasksInReview={tasksInReview}
              tasksVerified={tasksVerified}
              totalFilteredCount={filteredTasks.length}
              mobileColumn={mobileKanbanColumn}
              onSelectMobileColumn={setMobileKanbanColumn}
              onSelectTask={setSelectedTaskModal}
              onOpenQrModal={() => setShowQrModal(true)}
            />
          )}

          {viewMode === "matrix" && <SkkniMatrixView />}

          {viewMode === "evidence" && <EvidenceGalleryView />}
        </div>

        {/* ─── Bottom Legend & Quick Link (Apple Minimalist Footer) ─── */}
        <div className="pt-4 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-normal">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition cursor-pointer border",
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white font-medium border-slate-900 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200/70 hover:border-slate-300"
              )}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("Pemrograman Web & Mobile")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition cursor-pointer border",
                selectedCategory === "Pemrograman Web & Mobile"
                  ? "bg-sky-50 text-sky-800 font-medium border-sky-200"
                  : "bg-white text-slate-600 border-slate-200/70 hover:border-slate-300"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              <span>Pemrograman Web</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("Basis Data Relasional")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition cursor-pointer border",
                selectedCategory === "Basis Data Relasional"
                  ? "bg-teal-50 text-teal-800 font-medium border-teal-200"
                  : "bg-white text-slate-600 border-slate-200/70 hover:border-slate-300"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span>Basis Data</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("Tugas Umum Non-Kompetensi")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition cursor-pointer border",
                selectedCategory === "Tugas Umum Non-Kompetensi"
                  ? "bg-rose-50 text-rose-800 font-medium border-rose-200"
                  : "bg-white text-slate-600 border-slate-200/70 hover:border-slate-300"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Tugas Umum</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("Testing & QA")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition cursor-pointer border",
                selectedCategory === "Testing & QA"
                  ? "bg-amber-50 text-amber-800 font-medium border-amber-200"
                  : "bg-white text-slate-600 border-slate-200/70 hover:border-slate-300"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Testing & QA</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("Cloud & DevOps")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition cursor-pointer border",
                selectedCategory === "Cloud & DevOps"
                  ? "bg-indigo-50 text-indigo-800 font-medium border-indigo-200"
                  : "bg-white text-slate-600 border-slate-200/70 hover:border-slate-300"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Cloud & DevOps</span>
            </button>
          </div>

          <Link
            href="/student/log/new"
            className="text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1.5 hover:underline"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Jurnal Baru</span>
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. RIGHT SECTION: WIDGET PANEL
          Modular StudentWidgetPanel (Profile + CP Progress + Mentor Feedback + Presensi)
      ───────────────────────────────────────────────────────────────────────────── */}
      <StudentWidgetPanel
        student={student}
        progressPercentage={progressPercentage}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenQrModal={() => setShowQrModal(true)}
      />

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. ACCESSIBLE MODALS
      ───────────────────────────────────────────────────────────────────────────── */}
      {selectedTaskModal && (
        <TaskDetailModal
          task={selectedTaskModal}
          onClose={() => setSelectedTaskModal(null)}
        />
      )}

      {showNotifications && (
        <MentorNotificationModal
          onClose={() => setShowNotifications(false)}
        />
      )}

      {showQrModal && (
        <MentorQrModal
          onClose={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
}
