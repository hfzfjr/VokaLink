"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Filter,
  Search,
  RefreshCw,
  MessageCircle,
  TrendingUp,
  ShieldAlert,
  X,
  AlertOctagon,
  Sparkles,
  Send,
  ShieldCheck,
  Check,
  Eye,
  LayoutGrid,
  CreditCard,
  Lock,
  Loader2,
  HardDrive,
  Award,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import {
  fetchTeacherHeatmap,
  triggerEvaluateDriftAlerts,
  fetchInterventionDraft,
  submitIntervention,
  fetchSecurityFlags,
  acknowledgeSecurityFlag,
} from "@/lib/api";
import {
  TOTAL_TARGET_JP,
  type HeatmapResponse,
  type HeatmapStudentRow,
  type DriftAlertItem,
  type SecurityFlagItem,
} from "@vokalink/shared";
import { TeacherWidgetPanel } from "@/components/teacher/TeacherWidgetPanel";
import { cn } from "@/lib/cn";

function HeatmapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();

  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // View mode: matrix (table) | cards (student grid feed) | security (TC-006 audit)
  const [viewMode, setViewMode] = useState<"matrix" | "cards" | "security">("matrix");

  // Filters state
  const [selectedDudi, setSelectedDudi] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRIFT" | "ACHIEVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync with searchParams if view is specified
  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "drift") {
      setStatusFilter("DRIFT");
      setViewMode("matrix");
    } else if (view === "students") {
      setViewMode("cards");
    } else if (view === "security") {
      setViewMode("security");
    }
  }, [searchParams]);

  // Student Detail Modal state
  const [selectedStudent, setSelectedStudent] = useState<HeatmapStudentRow | null>(null);

  // Smart Intervention Modal state
  const [interventionStudent, setInterventionStudent] = useState<HeatmapStudentRow | null>(null);
  const [interventionAlert, setInterventionAlert] = useState<DriftAlertItem | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false);
  const [interventionSuccessMsg, setInterventionSuccessMsg] = useState<string | null>(null);

  // FR-007 A2 & TC-006: Security Audit Flags state
  const [securityFlags, setSecurityFlags] = useState<SecurityFlagItem[]>([]);
  const [isAcknowledgingFlag, setIsAcknowledgingFlag] = useState<string | null>(null);

  // Load security audit flags
  const loadSecurityFlags = useCallback(async () => {
    try {
      const res = await fetchSecurityFlags();
      setSecurityFlags(res.flags || []);
    } catch {
      // Silent fallback
    }
  }, []);

  const handleAcknowledgeFlag = async (flagId: string) => {
    setIsAcknowledgingFlag(flagId);
    try {
      await acknowledgeSecurityFlag(flagId);
      setSecurityFlags((prev) => prev.filter((f) => f.id !== flagId));
    } catch (err: any) {
      alert(err.message || "Gagal menandai bendera audit");
    } finally {
      setIsAcknowledgingFlag(null);
    }
  };

  // Load heatmap data from API
  const loadHeatmapData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchTeacherHeatmap({
        driftOnly: statusFilter === "DRIFT",
        token: token || undefined,
      });
      setData(res);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memuat matriks heatmap kompetensi");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, token]);

  useEffect(() => {
    loadHeatmapData();
    loadSecurityFlags();
  }, [loadHeatmapData, loadSecurityFlags]);

  // Trigger on-demand drift evaluation
  const handleTriggerEvaluate = async () => {
    setIsEvaluating(true);
    try {
      await triggerEvaluateDriftAlerts();
      await loadHeatmapData();
    } catch (err: any) {
      alert(err.message || "Gagal menjalankan evaluasi drift");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Buka Modal Intervensi & Ambil Draf Otomatis
  const openInterventionModal = async (
    student: HeatmapStudentRow,
    alert?: DriftAlertItem
  ) => {
    setInterventionStudent(student);
    setInterventionAlert(alert || student.driftAlerts[0] || null);
    setInterventionSuccessMsg(null);
    setIsDraftLoading(true);

    try {
      const draft = await fetchInterventionDraft({
        studentId: student.studentId,
        placementId: student.placement.id,
        driftAlertId: alert?.id || student.driftAlerts[0]?.id,
        alertType: (alert?.alertType || student.driftAlerts[0]?.alertType || "GENERAL") as any,
      });
      setDraftMessage(draft.messageText);
    } catch {
      setDraftMessage(
        `Yth. Bapak/Ibu ${student.placement.mentorName}, ${student.placement.dudiName}\n\nSalam hormat, saya Guru Pembimbing dari ${student.fullName}. Mohon waktu koordinasi terkait capaian kompetensi magang ananda.`
      );
    } finally {
      setIsDraftLoading(false);
    }
  };

  // Eksekusi Kirim WhatsApp & Catat Log Intervensi
  const handleSendWaIntervention = async () => {
    if (!interventionStudent) return;
    setIsSubmittingIntervention(true);
    try {
      await submitIntervention({
        studentId: interventionStudent.studentId,
        placementId: interventionStudent.placement.id,
        driftAlertId: interventionAlert?.id,
        actionType: "WA_COORDINATION",
        messageSent: draftMessage,
      });

      const rawPhone = interventionStudent.placement.mentorPhone || "";
      const phone = rawPhone.replace(/\D/g, "");
      const normalizedPhone = phone.startsWith("0") ? "62" + phone.slice(1) : phone;
      if (normalizedPhone) {
        const waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(draftMessage)}`;
        window.open(waUrl, "_blank");
      }

      setInterventionSuccessMsg("Pesan koordinasi berhasil dicatat dan jendela WhatsApp telah dibuka!");
      await loadHeatmapData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat intervensi pembimbing");
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  // Unique DUDI partners for filter
  const dudiOptions = useMemo(() => {
    if (!data?.students) return [];
    const map = new Map<string, string>();
    for (const s of data.students) {
      map.set(s.placement.dudiId, s.placement.dudiName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    return data.students.filter((student) => {
      // DUDI filter
      if (selectedDudi !== "ALL" && student.placement.dudiId !== selectedDudi) {
        return false;
      }

      // Status filter
      if (statusFilter === "DRIFT" && !student.hasDriftWarning) {
        return false;
      }
      if (statusFilter === "ACHIEVED" && student.overallPercentage < 75) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = student.fullName.toLowerCase().includes(q);
        const matchesNisn = student.nisn.includes(q);
        const matchesDudi = student.placement.dudiName.toLowerCase().includes(q);
        if (!matchesName && !matchesNisn && !matchesDudi) return false;
      }
      return true;
    });
  }, [data, selectedDudi, statusFilter, searchQuery]);

  // Priority Drift Alerts extracted from all students
  const priorityAlerts = useMemo(() => {
    if (!data?.students) return [];
    const alerts: { student: HeatmapStudentRow; alert: DriftAlertItem }[] = [];
    for (const student of data.students) {
      for (const alert of student.driftAlerts) {
        alerts.push({ student, alert });
      }
    }

    const priorityMap: Record<string, number> = {
      NON_COMPETENCY_OVERLOAD: 1,
      SKILL_MONOTONY: 2,
      APPROVAL_DORMANCY: 3,
    };

    return alerts.sort(
      (a, b) =>
        (priorityMap[a.alert.alertType] || 99) - (priorityMap[b.alert.alertType] || 99)
    );
  }, [data]);

  // Format priority list for companion widget panel
  const widgetPriorityStudents = useMemo(() => {
    return priorityAlerts.map(({ student, alert }) => ({
      studentId: student.studentId,
      name: student.fullName,
      dudiName: student.placement.dudiName,
      alertReason: alert.metricSnapshot.detectedReason || "Deviasi capaian kurikulum.",
      alertType: alert.alertType,
      onIntervene: () => openInterventionModal(student, alert),
    }));
  }, [priorityAlerts]);

  const teacherFirstName = useMemo(() => {
    if (user?.fullName) {
      return user.fullName.split(" ")[0];
    }
    return "Budi";
  }, [user]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5 UI CONDITIONS: 1. LOADING SKELETON
  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoading && !data) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 items-start pb-12">
        <div className="flex-1 min-w-0 space-y-4 sm:space-y-5 w-full">
          {/* Desktop Greeting Skeleton */}
          <div className="hidden lg:flex lg:h-[86px] items-center justify-between bg-white rounded-2xl px-5 border border-slate-200/70 shadow-2xs animate-pulse">
            <div className="space-y-2">
              <div className="h-4 w-48 bg-slate-200 rounded" />
              <div className="h-3 w-64 bg-slate-100 rounded" />
            </div>
            <div className="h-10 w-36 bg-slate-200 rounded-xl" />
          </div>

          {/* 4 KPI Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white border border-slate-200/70 rounded-2xl p-4 space-y-3 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                  <div className="w-8 h-8 rounded-xl bg-slate-100" />
                </div>
                <div className="h-6 w-20 bg-slate-200 rounded" />
              </div>
            ))}
          </div>

          {/* View Controller Skeleton */}
          <div className="h-12 bg-white border border-slate-200/70 rounded-2xl animate-pulse" />

          {/* Table Skeleton */}
          <div className="h-96 bg-white border border-slate-200/70 rounded-2xl animate-pulse" />
        </div>

        {/* Right Widget Panel Skeleton */}
        <div className="hidden lg:flex w-[320px] xl:w-[340px] 2xl:w-[360px] flex-col gap-4 shrink-0">
          <div className="h-[86px] bg-white border border-slate-200/70 rounded-2xl animate-pulse" />
          <div className="h-44 bg-white border border-slate-200/70 rounded-2xl animate-pulse" />
          <div className="h-60 bg-white border border-slate-200/70 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5 UI CONDITIONS: 2. ERROR RECOVERY
  // ─────────────────────────────────────────────────────────────────────────────
  if (errorMessage && !data) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-card max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900">Gagal Memuat Dasbor Heatmap</h2>
          <p className="text-xs text-slate-500 leading-relaxed font-normal">{errorMessage}</p>
          <button
            type="button"
            onClick={loadHeatmapData}
            className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            Coba Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  const cpElements = data?.cpElements || [];
  const summary = data?.summary || {
    totalStudents: 0,
    studentsWithDrift: 0,
    averageCompetencyPercentage: 0,
    activeAlertsCount: { nonCompetency: 0, skillMonotony: 0, approvalDormancy: 0 },
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start pb-12">
      {/* ─── LEFT: MAIN WORKSPACE ─── */}
      <section className="flex-1 min-w-0 space-y-4 sm:space-y-5 w-full">
        {/* ─── A.1 TAMPILAN KHUSUS MOBILE: GRADIENT HERO BANNER (< lg) ─── */}
        <div className="lg:hidden space-y-3">
          <div className="bg-gradient-to-br from-sky-500 to-sky-700 text-white p-5 rounded-3xl shadow-card relative overflow-hidden space-y-4">
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold border border-white/25">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{data?.department.name || "Rekayasa Perangkat Lunak"}</span>
              </span>
              <span className="text-[11px] font-semibold text-sky-100 bg-sky-900/40 px-2.5 py-0.5 rounded-full border border-white/15">
                Target {TOTAL_TARGET_JP} JP
              </span>
            </div>

            <div className="space-y-1 relative z-10">
              <h2 className="text-xl font-black tracking-tight leading-snug">
                Halo, {teacherFirstName}!
              </h2>
              <p className="text-xs text-sky-100/90 leading-relaxed font-normal">
                Matriks ketercapaian CP, anomali penugasan kerja industri, dan intervensi pembimbing.
              </p>
            </div>

            <div className="pt-1 flex items-center gap-2 relative z-10">
              <button
                type="button"
                onClick={handleTriggerEvaluate}
                disabled={isEvaluating}
                className="flex-1 h-11 bg-white hover:bg-sky-50 active:scale-[0.98] text-sky-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={cn("w-4 h-4", isEvaluating && "animate-spin text-sky-700")} />
                <span>{isEvaluating ? "Memindai Anomali..." : "Pindai Drift Sekarang"}</span>
              </button>
            </div>
          </div>

          {/* Quick Metric Pills di Mobile */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 text-[10.5px] uppercase tracking-wider">
                Capaian Rata-Rata Kelas
              </span>
              <span className="text-xs font-bold text-sky-600">
                {summary.averageCompetencyPercentage}% / 792 JP
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex gap-0.5 p-0.5">
              <div
                style={{ width: `${Math.min(100, summary.averageCompetencyPercentage)}%` }}
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  summary.averageCompetencyPercentage >= 75 ? "bg-emerald-500" : "bg-sky-500"
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-center">
                <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Siswa Aktif</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">{summary.totalStudents} <span className="text-[10px] font-normal text-slate-400">Org</span></span>
                <span className="text-[9.5px] font-semibold text-sky-700 flex items-center justify-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  Terdaftar
                </span>
              </div>

              <div
                onClick={() => {
                  setStatusFilter("DRIFT");
                  setViewMode("matrix");
                }}
                className={cn(
                  "p-2 rounded-xl border text-center cursor-pointer transition active:scale-95",
                  summary.studentsWithDrift > 0
                    ? "bg-rose-50/80 border-rose-200/80 text-rose-900"
                    : "bg-slate-50/80 border-slate-100 text-slate-600"
                )}
              >
                <span className="text-[9.5px] font-semibold uppercase tracking-wider block opacity-75">Drift Alert</span>
                <span className="text-sm font-bold mt-0.5 block">{summary.studentsWithDrift} <span className="text-[10px] font-normal opacity-60">Siswa</span></span>
                <span className={cn(
                  "text-[9.5px] font-semibold flex items-center justify-center gap-0.5 mt-0.5",
                  summary.studentsWithDrift > 0 ? "text-rose-700" : "text-emerald-700"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", summary.studentsWithDrift > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500")} />
                  {summary.studentsWithDrift > 0 ? "Lihat ›" : "Nir-Drift"}
                </span>
              </div>

              <div
                onClick={() => setViewMode("security")}
                className={cn(
                  "p-2 rounded-xl border text-center cursor-pointer transition active:scale-95",
                  securityFlags.length > 0
                    ? "bg-amber-50/80 border-amber-200/80 text-amber-900"
                    : "bg-slate-50/80 border-slate-100 text-slate-600"
                )}
              >
                <span className="text-[9.5px] font-semibold uppercase tracking-wider block opacity-75">Audit PIN</span>
                <span className="text-sm font-bold mt-0.5 block">{securityFlags.length} <span className="text-[10px] font-normal opacity-60">Kasus</span></span>
                <span className={cn(
                  "text-[9.5px] font-semibold flex items-center justify-center gap-0.5 mt-0.5",
                  securityFlags.length > 0 ? "text-amber-700" : "text-slate-400"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", securityFlags.length > 0 ? "bg-amber-500 animate-pulse" : "bg-slate-300")} />
                  {securityFlags.length > 0 ? "Periksa ›" : "Aman"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── A.2 TAMPILAN KHUSUS DESKTOP: HEADER SAPAAN + AKSI UTAMA (≥ lg) ─── */}
        <div className="hidden lg:flex lg:h-[86px] items-center justify-between gap-6 bg-white rounded-2xl px-5 border border-slate-200/70 shadow-2xs shrink-0">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                Halo, {teacherFirstName}!
              </h2>
              {summary.studentsWithDrift > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 text-[11px] font-medium leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>{summary.studentsWithDrift} Siswa Anomali Drift</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-medium leading-none">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>Semua Siswa On-Track (Nir-Anomali)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate max-w-xl leading-normal">
              {data?.department.name || "Rekayasa Perangkat Lunak"} &bull; {user?.school?.name || "SMK Telkom 1 Medan"} &bull; Target Kelulusan {TOTAL_TARGET_JP} JP &bull; {summary.totalStudents} Siswa Terdaftar
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleTriggerEvaluate}
              disabled={isEvaluating}
              className="h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isEvaluating && "animate-spin text-white")} />
              <span>{isEvaluating ? "Memindai Anomali..." : "Pindai Algoritma Drift"}</span>
            </button>
          </div>
        </div>

        {/* ─── B. AUDIT KEAMANAN BANNER (TC-006) ─── */}
        {securityFlags.length > 0 && (
          <div className="bg-gradient-to-r from-rose-50/90 via-red-50/60 to-amber-50/70 rounded-2xl border border-rose-200/90 shadow-2xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-rose-200/70 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-rose-950">
                      Peringatan Audit Keamanan PIN Mentor
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wide shadow-2xs">
                      {securityFlags.length} INSIDEN AKTIF
                    </span>
                  </div>
                  <p className="text-xs text-rose-800/90 font-medium mt-0.5">
                    Sistem mendeteksi percobaan verifikasi jurnal siswa dari perangkat tidak terdaftar (HP Siswa/Incognito) atau penguncian PIN mentor.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {securityFlags.map((flag) => {
                const isUntrusted = flag.kind === "UNTRUSTED_DEVICE";
                const isPinLockout = flag.kind === "PIN_LOCKOUT";

                return (
                  <div
                    key={flag.id}
                    className="p-4 rounded-xl bg-white/95 backdrop-blur-xs border border-rose-200/80 shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isUntrusted
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : isPinLockout
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-purple-100 text-purple-900 border border-purple-200"
                          }`}
                        >
                          {isUntrusted
                            ? "Perangkat Asing / Bukan HP Mentor"
                            : isPinLockout
                            ? "PIN Terkunci (Salah 5 Kali)"
                            : "Pakai Ulang Tautan"}
                        </span>
                        <span className="text-[10.5px] text-slate-400 font-semibold">
                          {new Date(flag.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {flag.studentName}{" "}
                          <span className="text-[11px] font-normal text-slate-500">
                            (NISN: {flag.nisn})
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                          {flag.dudiName} &bull; Mentor: {flag.mentorName}
                        </p>
                      </div>

                      <p className="text-[11px] text-rose-700 bg-rose-50/80 p-2.5 rounded-xl border border-rose-100 leading-snug font-medium">
                        {flag.meta?.note ||
                          flag.meta?.reason ||
                          "Percobaan persetujuan jurnal ditolak demi menjaga integritas validasi."}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[10.5px] text-slate-400 italic font-medium">
                        Perlu ditinjau pembimbing
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAcknowledgeFlag(flag.id)}
                        disabled={isAcknowledgingFlag === flag.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-[11px] font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {isAcknowledgingFlag === flag.id
                            ? "Menandai..."
                            : "Tandai Telah Ditinjau"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── C. 4 KPI OVERVIEW METRIC CARDS ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Siswa Binaan */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Siswa Binaan
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {summary.totalStudents}
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Siswa Terdaftar Aktif</p>
            </div>
          </div>

          {/* Peringatan Drift */}
          <div
            className={cn(
              "p-4 sm:p-5 rounded-2xl border shadow-2xs space-y-2 transition",
              summary.studentsWithDrift > 0
                ? "bg-rose-50/40 border-rose-200/70 text-rose-900"
                : "bg-white border-slate-200/70 text-slate-900"
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-[10.5px] font-bold uppercase tracking-wider",
                  summary.studentsWithDrift > 0 ? "text-rose-600" : "text-slate-400"
                )}
              >
                Peringatan Drift
              </span>
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs",
                  summary.studentsWithDrift > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"
                )}
              >
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold leading-tight">
                {summary.studentsWithDrift}
              </p>
              <p className="text-[11px] font-medium opacity-75 mt-0.5">
                {summary.studentsWithDrift > 0 ? "Perlu Tindak Lanjut" : "Nir-Anomali"}
              </p>
            </div>
          </div>

          {/* Rata-Rata Capaian */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Rata-Rata Capaian
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {summary.averageCompetencyPercentage}%
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, summary.averageCompetencyPercentage)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Audit Integritas TC-006 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Audit Integritas
              </span>
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs",
                securityFlags.length > 0 ? "bg-amber-100 text-amber-700" : "bg-sky-50 text-sky-600"
              )}>
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {securityFlags.length}
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                {securityFlags.length > 0 ? "Percobaan Tak Wajar Ditolak" : "Validasi Bersih & Sah"}
              </p>
            </div>
          </div>
        </div>

        {/* ─── D. VIEW CONTROLLER (Judul + Apple Segmented Control) ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Matriks Pengawasan &amp; Capaian Siswa
            </h2>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Monitoring ketercapaian CP, evaluasi drift 14 hari, dan supervisi validasi.
            </p>
          </div>

          {/* Apple Segmented Control Bar */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={cn(
                "px-2 sm:px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap text-center text-[11px] sm:text-xs flex items-center justify-center gap-1.5",
                viewMode === "matrix"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="sm:hidden">Matriks</span>
              <span className="hidden sm:inline">Matriks CP</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "px-2 sm:px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap text-center text-[11px] sm:text-xs flex items-center justify-center gap-1.5",
                viewMode === "cards"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
              )}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="sm:hidden">Kartu</span>
              <span className="hidden sm:inline">Kartu Siswa</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("security")}
              className={cn(
                "px-2 sm:px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap text-center text-[11px] sm:text-xs flex items-center justify-center gap-1.5 relative",
                viewMode === "security"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="sm:hidden">Audit</span>
              <span className="hidden sm:inline">Audit Keamanan</span>
              {securityFlags.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* ─── E. FILTER & SEARCH STRIP ─── */}
        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Box */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari siswa, NISN, atau DUDI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition font-medium"
              />
            </div>

            {/* Filter DUDI Dropdown */}
            {dudiOptions.length > 0 && (
              <select
                value={selectedDudi}
                onChange={(e) => setSelectedDudi(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:border-sky-500 cursor-pointer transition"
              >
                <option value="ALL">Semua Mitra DUDI ({dudiOptions.length})</option>
                {dudiOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("DRIFT")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                statusFilter === "DRIFT"
                  ? "bg-white text-rose-600 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-rose-600"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Drift ({summary.studentsWithDrift})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACHIEVED")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                statusFilter === "ACHIEVED"
                  ? "bg-white text-emerald-700 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-emerald-700"
              )}
            >
              <span>Tuntas (&ge;75%)</span>
            </button>
          </div>
        </div>

        {/* ─── F. VIEW 1: MATRIX TABLE VIEW ─── */}
        {viewMode === "matrix" && (
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Matriks Ketercapaian Capaian Pembelajaran ({filteredStudents.length} Siswa)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pewarnaan sel memenuhi pedoman WCAG AA (Ikon status + Angka + Persentase Capaian)
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" /> 0% Belum
                </span>
                <span className="flex items-center gap-1.5 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> 1–74% Berjalan
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> &ge;75% Tuntas
                </span>
                <span className="flex items-center gap-1.5 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Drift
                </span>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600">
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider w-64 sticky left-0 bg-slate-50 z-10 border-r border-slate-200/80">
                      Siswa &amp; Lokasi DUDI
                    </th>
                    {cpElements.map((cp) => (
                      <th key={cp.id} className="py-3.5 px-3 font-bold text-center min-w-[130px] border-r border-slate-100">
                        <p className="font-mono text-[10px] text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-full inline-block border border-sky-200/60">
                          {cp.code}
                        </p>
                        <p className="text-[11px] text-slate-800 line-clamp-1 font-bold mt-1" title={cp.title}>
                          {cp.title}
                        </p>
                        <p className="text-[10px] text-slate-400 font-normal">Target: {cp.targetJp} JP</p>
                      </th>
                    ))}
                    <th className="py-3.5 px-4 font-bold text-center w-36">
                      Total Capaian
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={cpElements.length + 2} className="py-12 text-center text-slate-400 font-medium">
                        Tidak ada data siswa yang memenuhi filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const initials = student.fullName
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <tr
                          key={student.studentId}
                          onClick={() => setSelectedStudent(student)}
                          className={cn(
                            "hover:bg-sky-50/40 transition cursor-pointer",
                            student.hasDriftWarning && "bg-rose-50/25"
                          )}
                        >
                          <td className="py-3 px-4 sticky left-0 bg-white hover:bg-slate-50/90 z-10 border-r border-slate-200/80">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {initials}
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                  <span className="truncate">{student.fullName}</span>
                                  {student.hasDriftWarning && (
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" title="Siswa Mengalami Anomali Drift" />
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[150px]">{student.placement.dudiName}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {student.cpProgress.map((cp) => {
                            const isAchieved = cp.status === "ACHIEVED";
                            const isInProgress = cp.status === "IN_PROGRESS";

                            return (
                              <td key={cp.cpElementId} className="py-2.5 px-2 text-center border-r border-slate-100">
                                <div
                                  className={cn(
                                    "p-2 rounded-xl text-center space-y-0.5 transition",
                                    isAchieved
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                                      : isInProgress
                                      ? "bg-amber-50 text-amber-900 border border-amber-200/80"
                                      : "bg-slate-50/70 text-slate-400 border border-slate-200/60"
                                  )}
                                >
                                  <div className="flex items-center justify-center gap-1">
                                    {isAchieved ? (
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    ) : isInProgress ? (
                                      <Clock className="w-3 h-3 text-amber-600" />
                                    ) : (
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    )}
                                    <span className="font-bold text-xs">{cp.percentage}%</span>
                                  </div>
                                  <p className="text-[10px] font-medium opacity-75">
                                    {cp.verifiedJp}/{cp.targetJp} JP
                                  </p>
                                </div>
                              </td>
                            );
                          })}

                          <td className="py-3 px-4 text-center">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-slate-900">{student.overallPercentage}%</span>
                                <span className="text-slate-500 font-mono text-[10px]">
                                  {student.totalVerifiedJp} JP
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    student.hasDriftWarning
                                      ? "bg-rose-500"
                                      : student.overallPercentage >= 75
                                      ? "bg-emerald-500"
                                      : "bg-sky-500"
                                  )}
                                  style={{ width: `${Math.min(100, student.overallPercentage)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Accordion Feed (< lg) */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tidak ada data siswa yang memenuhi filter ini.
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const initials = student.fullName
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={student.studentId}
                      onClick={() => setSelectedStudent(student)}
                      className="p-4 space-y-3 hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{student.fullName}</span>
                              {student.hasDriftWarning && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  Drift
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-normal">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]">{student.placement.dudiName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900">
                            {student.overallPercentage}%
                          </span>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {student.totalVerifiedJp}/{TOTAL_TARGET_JP} JP
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        {student.cpProgress.map((cp) => (
                          <div
                            key={cp.cpElementId}
                            className={cn(
                              "p-2 rounded-xl text-xs space-y-0.5 border",
                              cp.status === "ACHIEVED"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : cp.status === "IN_PROGRESS"
                                ? "bg-amber-50 border-amber-200 text-amber-900"
                                : "bg-slate-50 border-slate-100 text-slate-400"
                            )}
                          >
                            <p className="text-[10px] font-mono font-bold truncate">{cp.code}</p>
                            <div className="flex items-center justify-between font-bold">
                              <span>{cp.percentage}%</span>
                              <span className="text-[10px] font-normal opacity-80">{cp.verifiedJp} JP</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ─── G. VIEW 2: CARDS GRID VIEW ─── */}
        {viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((student) => {
              const initials = student.fullName
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={student.studentId}
                  className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-2xs space-y-4 hover:shadow-card hover:border-sky-300 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 truncate">
                            {student.fullName}
                          </h3>
                          {student.hasDriftWarning && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 shrink-0">
                              Drift
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          NISN: {student.nisn} &bull; {student.placement.dudiName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-bold text-slate-900">
                        {student.overallPercentage}%
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {student.totalVerifiedJp}/{TOTAL_TARGET_JP} JP
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        student.hasDriftWarning
                          ? "bg-rose-500"
                          : student.overallPercentage >= 75
                          ? "bg-emerald-500"
                          : "bg-sky-500"
                      )}
                      style={{ width: `${Math.min(100, student.overallPercentage)}%` }}
                    />
                  </div>

                  {/* Workload 14-days breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
                      <span className="text-[9.5px] uppercase font-bold text-sky-800 block">Jam Teknis</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {student.totalJpLast14Days - student.nonCompetencyJpLast14Days} JP
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Non-Kompetensi</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {student.nonCompetencyJpLast14Days} JP
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(student)}
                      className="text-xs font-semibold text-slate-600 hover:text-sky-600 flex items-center gap-1 cursor-pointer transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Rincian Jam Kerja</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openInterventionModal(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Intervensi WA</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── H. VIEW 3: AUDIT KEAMANAN (TC-006) ─── */}
        {viewMode === "security" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Log Audit Keamanan &amp; Integritas Verifikasi PIN
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mencatat semua percobaan validasi yang ditolak oleh sistem karena perangkat asing atau kesalahan PIN berulang.
                  </p>
                </div>
              </div>
            </div>

            {securityFlags.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Seluruh Validasi Mentor Bersih</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Tidak ada percobaan otentikasi mencurigakan atau penguncian PIN mentor pada sekolah Anda.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {securityFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                          {flag.kind}
                        </span>
                        <span className="text-[11px] font-bold text-slate-900">
                          {flag.studentName} ({flag.dudiName})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {flag.meta?.note || flag.meta?.reason || "Percobaan verifikasi ditolak oleh gerbang keamanan."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAcknowledgeFlag(flag.id)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 transition"
                    >
                      Tandai Telah Ditinjau
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── RIGHT: COMPANION WIDGET PANEL (Desktop >= lg) ─── */}
      <TeacherWidgetPanel
        teacherName={user?.fullName || "Budi Santoso, S.Kom"}
        schoolName={user?.school?.name || "SMK Telkom 1 Medan"}
        departmentName={user?.department?.name || data?.department.name || "Rekayasa Perangkat Lunak"}
        averagePercentage={summary.averageCompetencyPercentage}
        totalStudents={summary.totalStudents}
        driftCount={summary.studentsWithDrift}
        securityFlagsCount={securityFlags.length}
        priorityStudents={widgetPriorityStudents}
        onTriggerEvaluate={handleTriggerEvaluate}
        isEvaluating={isEvaluating}
      />

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 1: DETAIL SISWA & BREAKDOWN DISTRIBUSI JAM
         ───────────────────────────────────────────────────────────────────────────── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
          <div className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/70 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">
                  Rincian Pengawasan Siswa
                </span>
                <h3 className="font-bold text-base text-slate-900">{selectedStudent.fullName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profil & Penempatan DUDI */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">NISN:</span>
                <span className="font-mono font-bold text-slate-800">{selectedStudent.nisn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">Tempat Magang:</span>
                <span className="font-bold text-slate-800">{selectedStudent.placement.dudiName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">Mentor Industri:</span>
                <span className="font-medium text-slate-700">
                  {selectedStudent.placement.mentorName}{" "}
                  {selectedStudent.placement.mentorPhone && `(${selectedStudent.placement.mentorPhone})`}
                </span>
              </div>
            </div>

            {/* Workload Breakdown: Teknis vs Tombol Jujur Non-Kompetensi */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Distribusi Jam Kerja 14 Hari Terakhir:
              </p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-900">
                  <p className="text-[10px] font-bold uppercase">Jam Teknis Kejuruan</p>
                  <p className="text-lg font-bold mt-0.5">
                    {selectedStudent.totalJpLast14Days - selectedStudent.nonCompetencyJpLast14Days} JP
                  </p>
                </div>
                <div
                  className={cn(
                    "p-3.5 rounded-xl border",
                    selectedStudent.nonCompetencyJpLast14Days > 0
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : "bg-slate-50 border-slate-100 text-slate-600"
                  )}
                >
                  <p className="text-[10px] font-bold uppercase">Non-Kejuruan (Tombol Jujur)</p>
                  <p className="text-lg font-bold mt-0.5">
                    {selectedStudent.nonCompetencyJpLast14Days} JP
                  </p>
                </div>
              </div>
            </div>

            {/* Rincian per Elemen CP */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Capaian Tiap Elemen CP (dari Target {TOTAL_TARGET_JP} JP):
              </p>
              <div className="space-y-2">
                {selectedStudent.cpProgress.map((cp) => (
                  <div
                    key={cp.cpElementId}
                    className="p-3.5 rounded-xl border border-slate-100 bg-white text-xs space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{cp.title}</span>
                      <span
                        className={cn(
                          "font-bold px-2 py-0.5 rounded-full text-[10px]",
                          cp.status === "ACHIEVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : cp.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {cp.percentage}% ({cp.verifiedJp}/{cp.targetJp} JP)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          cp.percentage >= 75 ? "bg-emerald-500" : "bg-sky-500"
                        )}
                        style={{ width: `${Math.min(100, cp.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const st = selectedStudent;
                  setSelectedStudent(null);
                  openInterventionModal(st);
                }}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi Mentor Industri via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 2: KOORDINASI INTERVENSI WHATSAPP KE MENTOR INDUSTRI
         ───────────────────────────────────────────────────────────────────────────── */}
      {interventionStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200/70 space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-2xs">
                    <MessageCircle className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Hubungi Mentor Industri via WhatsApp
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Koordinasi pembimbingan untuk <span className="font-bold text-slate-800">{interventionStudent.fullName}</span> ({interventionStudent.nisn})
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInterventionStudent(null);
                  setInterventionSuccessMsg(null);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {interventionSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Aksi Berhasil Diproses!</p>
                  <p>{interventionSuccessMsg}</p>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mitra DUDI Aktif:</p>
                  <p className="font-bold text-slate-800 text-sm">{interventionStudent.placement.dudiName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mentor Pembimbing:</p>
                  <p className="font-bold text-slate-800">
                    {interventionStudent.placement.mentorName}{" "}
                    <span className="font-mono text-emerald-600 font-semibold">({interventionStudent.placement.mentorPhone || "WA Siap"})</span>
                  </p>
                </div>
              </div>
              {interventionAlert && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pemicu Anomali:</span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">
                    {interventionAlert.alertType}
                  </span>
                  <span className="text-[11px] text-slate-600 truncate">
                    {interventionAlert.metricSnapshot.detectedReason}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Draf Pesan Koordinasi Otomatis:</span>
                <span className="text-slate-400 text-[11px] font-medium">Bisa disunting sebelum dikirim</span>
              </div>

              <div className="relative">
                {isDraftLoading ? (
                  <div className="h-44 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Menyusun draf pesan koordinasi berbasis data capaian...
                  </div>
                ) : (
                  <textarea
                    rows={7}
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    className="w-full text-xs p-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-sans leading-relaxed text-slate-800 resize-none transition"
                    placeholder="Draf pesan koordinasi..."
                  />
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-slate-500">
                  Nomor tujuan mentor: <span className="font-mono font-bold">{interventionStudent.placement.mentorPhone || "08..."}</span>
                </span>

                <button
                  type="button"
                  disabled={isSubmittingIntervention || !draftMessage.trim()}
                  onClick={handleSendWaIntervention}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingIntervention ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mencatat Intervensi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim via WhatsApp &amp; Catat Intervensi</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherHeatmapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        </div>
      }
    >
      <HeatmapContent />
    </Suspense>
  );
}
