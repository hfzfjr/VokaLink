"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  PlusCircle,
  QrCode,
  Calendar,
  ChevronRight,
  CheckCircle2,
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
import { DailyTimelineFeed } from "@/components/student/home/DailyTimelineFeed";
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

  // View Mode: Timeline (default) | Matrix | Evidence
  const [viewMode, setViewMode] = useState<"timeline" | "matrix" | "evidence">("timeline");
  const [selectedTaskModal, setSelectedTaskModal] = useState<KanbanTask | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // 1. Live Dexie Query for Student Logs (Reactive offline-first state)
  const offlineLogs = useLiveQuery(() => db.logs.toArray(), []) || [];

  // Today ISO Date string (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Detect whether student has already logged for today
  const todayLog = useMemo(() => {
    return offlineLogs.find((l) => l.logDate === todayStr);
  }, [offlineLogs, todayStr]);

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
            await db.refData.put({
              key: "student_log_context",
              data: fresh,
              cachedAt: Date.now(),
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
    city: placementInfo?.dudiCity || "Bandung, Jawa Barat",
    verifiedJp: totalVerifiedJp,
    pendingJp: displayPendingJp,
    targetJp: TOTAL_TARGET_JP,
  };

  // 4. Transform Dexie offline logs reactively into KanbanTask objects
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

  // ─── 5 UI States: 1. Loading Skeleton Condition ───
  if (isLoading && offlineLogs.length === 0) {
    return <HomeSkeleton />;
  }

  // SVG Progress Ring circumference calculation: 2 * Math.PI * 40 ≈ 251.32
  const strokeDashoffset = 251.32 - (251.32 * progressPercentage) / 100;

  return (
    <div className="w-full flex flex-col lg:flex-row gap-5 items-stretch min-h-[840px]">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. CENTER SECTION: WORKSPACE CANVAS (TIMELINE / MATRIX / EVIDENCE)
          Apple Design System HIG (Calm White Surface, Hairline Border, Zero Clutter)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="flex-1 min-w-0 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/70 shadow-card flex flex-col justify-between overflow-hidden space-y-6">
        <div className="space-y-5">
          {/* ─── A. CONTEXT-AWARE HERO ACTION CARD (Glance Test: 3 Detik Siswa Langsung Paham) ─── */}
          <div
            className={cn(
              "p-4 sm:p-5 rounded-2xl border transition-all relative overflow-hidden",
              todayLog
                ? "bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-sky-50/50 border-emerald-200/80 shadow-2xs"
                : "bg-gradient-to-r from-sky-50/90 via-indigo-50/60 to-slate-50 border-sky-200/80 shadow-xs"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>Jurnal Hari Ini · {formatLogDate(todayStr)}</span>
                  </span>
                  {todayLog ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                      Sudah Dicatat
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-semibold animate-pulse">
                      Belum Diisi
                    </span>
                  )}
                </div>

                {todayLog ? (
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                      {todayLog.jobCardTitle || "Jurnal Kegiatan Harian"}
                    </h2>
                    <p className="text-xs text-slate-600 font-normal mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span>Alokasi: <strong>{todayLog.durationJp} Jam Kerja</strong></span>
                      <span className="text-slate-300">·</span>
                      <span>
                        Status:{" "}
                        {todayLog.state === "verified" ? (
                          <strong className="text-emerald-700">Sah Terverifikasi (HMAC)</strong>
                        ) : (
                          <strong className="text-amber-700">Menunggu Validasi PIN Mentor</strong>
                        )}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                      Halo, Andi! Catat Kegiatan Magangmu Hari Ini
                    </h2>
                    <p className="text-xs text-slate-600 font-normal mt-0.5">
                      Batas waktu pencatatan maksimal 3 hari kerja (H-3 / 72 jam) sesuai aturan BR-003. Laporkan apa adanya secara jujur.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {todayLog ? (
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Tampilkan QR ke Mentor</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      href="/student/log/new"
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition text-center"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Catat Jurnal Hari Ini</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="hidden sm:inline-flex px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                      title="Minta mentor memindai QR untuk validasi batch"
                    >
                      <QrCode className="w-3.5 h-3.5 text-slate-500" />
                      <span>QR PIN</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── B. VISUAL ACHIEVEMENT & PROGRESS RINGS (Gamified Dual-Ring Hub) ─── */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
            {/* Left: Apple Fitness Style SVG Progress Ring */}
            <div className="flex items-center gap-4.5 shrink-0">
              <div className="relative w-24 h-24 sm:w-26 sm:h-26 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-100"
                    fill="transparent"
                  />
                  {/* Progress Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-sky-500 transition-all duration-700 ease-out"
                    fill="transparent"
                    strokeDasharray={251.32}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono leading-none">
                    {progressPercentage}%
                  </span>
                  <span className="text-[9.5px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                    Capaian
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Target Kelulusan PKL
                </span>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5 font-mono">
                  {student.verifiedJp} <span className="text-xs text-slate-400 font-normal">/ {TOTAL_TARGET_JP} JP</span>
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10.5px] font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                    <span>Fase F Kurikulum Merdeka</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: 3 Non-Redundant Essential Metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 text-center">
                <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Jam Sah</span>
                <p className="text-base sm:text-lg font-bold text-slate-900 font-mono mt-0.5">{student.verifiedJp}</p>
                <span className="text-[9.5px] text-emerald-600 font-medium">● Segel HMAC</span>
              </div>

              <div
                onClick={() => setShowQrModal(true)}
                className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-center cursor-pointer hover:bg-amber-100/60 transition active:scale-95"
                title="Klik untuk membuka QR Verifikasi"
              >
                <span className="text-[9.5px] font-semibold text-amber-700 uppercase tracking-wider block">Antrean PIN</span>
                <p className="text-base sm:text-lg font-bold text-amber-900 font-mono mt-0.5">{student.pendingJp}</p>
                <span className="text-[9.5px] text-amber-700 font-semibold flex items-center justify-center gap-0.5">
                  <span>Minta PIN</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 text-center">
                <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Sisa Target</span>
                <p className="text-base sm:text-lg font-bold text-slate-700 font-mono mt-0.5">{Math.max(0, TOTAL_TARGET_JP - student.verifiedJp)}</p>
                <span className="text-[9.5px] text-slate-400 font-medium">Jam Kerja</span>
              </div>
            </div>
          </div>

          {/* ─── C. VIEW CONTROLLER (Segmented Tab Bar - Apple HIG) ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Dokumentasi Praktik Industri</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium font-mono">
                  {allTasks.length} Catatan
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
                Verifikasi zero-login oleh mentor DUDI tanpa akun melalui PIN
              </p>
            </div>

            {/* Apple Segmented Control Bar */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold self-start sm:self-auto w-full sm:w-auto overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={cn(
                  "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap text-center text-xs flex items-center justify-center gap-1.5",
                  viewMode === "timeline"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
                )}
              >
                <span>Timeline Jurnal</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("matrix")}
                className={cn(
                  "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap text-center text-xs flex items-center justify-center gap-1.5",
                  viewMode === "matrix"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
                )}
              >
                <span>Matriks SKKNI</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("evidence")}
                className={cn(
                  "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap text-center text-xs flex items-center justify-center gap-1.5",
                  viewMode === "evidence"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
                )}
              >
                <span>Galeri Bukti</span>
              </button>
            </div>
          </div>

          {/* ─── D. ACTIVE VIEW RENDER ─── */}
          {viewMode === "timeline" && (
            <DailyTimelineFeed
              tasks={allTasks}
              onSelectTask={setSelectedTaskModal}
              onOpenQrModal={() => setShowQrModal(true)}
            />
          )}

          {viewMode === "matrix" && <SkkniMatrixView />}

          {viewMode === "evidence" && <EvidenceGalleryView />}
        </div>

        {/* ─── E. FOOTER QUICK ACTION & STATUS BAR ─── */}
        <div className="pt-4 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-normal">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px]">Dexie IndexedDB Aktif · Bekerja 100% Offline</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/verify/andi-pratama-rpl-2026"
              target="_blank"
              className="text-slate-600 hover:text-sky-600 font-semibold text-xs flex items-center gap-1 transition"
            >
              <span>Paspor Kompetensi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. RIGHT SECTION: WIDGET PANEL (Profile + Presensi Pekan Ini + Ulasan Mentor)
      ───────────────────────────────────────────────────────────────────────────── */}
      <StudentWidgetPanel
        student={student}
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
