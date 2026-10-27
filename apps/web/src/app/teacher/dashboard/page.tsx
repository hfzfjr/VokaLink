"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import {
  Users,
  CheckCircle2,
  Clock,
  Building2,
  Search,
  RefreshCw,
  MessageCircle,
  TrendingUp,
  ShieldAlert,
  X,
  AlertOctagon,
  Sparkles,
  Repeat,
  Send,
  Calendar,
  ShieldCheck,
  Check,
  Eye,
  LayoutGrid,
  CreditCard,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import {
  fetchTeacherHeatmap,
  triggerEvaluateDriftAlerts,
  fetchInterventionDraft,
  submitIntervention,
  executePlacementRotation,
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
  const searchParams = useSearchParams();
  const { user, token } = useAuth();

  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // View mode: matrix (table) | cards (student grid feed) | security (audit log)
  const [viewMode, setViewMode] = useState<"matrix" | "cards" | "security">("matrix");

  // Filters state
  const [selectedDudi, setSelectedDudi] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRIFT" | "ACHIEVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination for cards view
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

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

  // Reset pagination on filter or view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDudi, statusFilter, searchQuery, viewMode]);

  // Student Detail Modal state
  const [selectedStudent, setSelectedStudent] = useState<HeatmapStudentRow | null>(null);

  // Smart Intervention & Mid-term Rotation Modal state
  const [interventionStudent, setInterventionStudent] = useState<HeatmapStudentRow | null>(null);
  const [interventionAlert, setInterventionAlert] = useState<DriftAlertItem | null>(null);
  const [interventionTab, setInterventionTab] = useState<
    "WA_COORDINATION" | "SITE_VISIT" | "DUDI_ROTATION"
  >("WA_COORDINATION");
  const [draftMessage, setDraftMessage] = useState("");
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false);
  const [interventionSuccessMsg, setInterventionSuccessMsg] = useState<string | null>(null);
  const [targetDudiId, setTargetDudiId] = useState("");
  const [rotationReason, setRotationReason] = useState("");
  const [siteVisitDate, setSiteVisitDate] = useState("");

  // Security Audit Flags state
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

  // Load heatmap data from API (fetch all once, filter instantaneously on client)
  const loadHeatmapData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchTeacherHeatmap({
        driftOnly: false,
        token: token || undefined,
      });
      setData(res);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memuat matriks heatmap kompetensi");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadHeatmapData();
    loadSecurityFlags();
  }, [loadHeatmapData, loadSecurityFlags]);

  // Close Modals on Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (interventionStudent) {
          setInterventionStudent(null);
          setInterventionSuccessMsg(null);
        } else if (selectedStudent) {
          setSelectedStudent(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedStudent, interventionStudent]);

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

  // Open intervention modal & fetch data-driven auto draft
  const openInterventionModal = async (student: HeatmapStudentRow, alert?: DriftAlertItem) => {
    setInterventionStudent(student);
    setInterventionAlert(alert || student.driftAlerts[0] || null);
    setInterventionTab("WA_COORDINATION");
    setInterventionSuccessMsg(null);
    setTargetDudiId("");
    setRotationReason("");
    setSiteVisitDate(new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0] || "");
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

  // Send WhatsApp intervention & record audit log
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

      setInterventionSuccessMsg(
        "Pesan koordinasi berhasil dicatat dan jendela WhatsApp telah dibuka."
      );
      await loadHeatmapData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat intervensi pembimbing");
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  // Record site visit supervision
  const handleRecordSiteVisit = async () => {
    if (!interventionStudent) return;
    setIsSubmittingIntervention(true);
    try {
      await submitIntervention({
        studentId: interventionStudent.studentId,
        placementId: interventionStudent.placement.id,
        driftAlertId: interventionAlert?.id,
        actionType: "SITE_VISIT",
        messageSent: `Rencana kunjungan supervisi lapangan dijadwalkan pada ${siteVisitDate || "minggu depan"
          }. Catatan agenda: ${draftMessage}`,
      });
      setInterventionSuccessMsg(
        "Jadwal kunjungan supervisi lapangan berhasil disimpan ke riwayat intervensi."
      );
      await loadHeatmapData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat jadwal kunjungan lapangan");
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  // Execute mid-term DUDI rotation while preserving cumulative verified JP
  const handleExecuteRotation = async () => {
    if (!interventionStudent || !targetDudiId) {
      alert("Pilih mitra DUDI tujuan baru terlebih dahulu");
      return;
    }
    setIsSubmittingIntervention(true);
    try {
      const res = await executePlacementRotation({
        studentId: interventionStudent.studentId,
        fromPlacementId: interventionStudent.placement.id,
        toDudiId: targetDudiId,
        driftAlertId: interventionAlert?.id,
        reason:
          rotationReason ||
          "Rotasi tengah semester untuk pemenuhan elemen kompetensi kurikulum.",
      });

      setInterventionSuccessMsg(
        `Sukses! Siswa berhasil dirotasi ke ${res.newPlacement.dudiName}. Total ${res.cumulativeVerifiedJp} JP terverifikasi tetap tersimpan utuh di portofolio siswa.`
      );
      await loadHeatmapData();
    } catch (err: any) {
      alert(err.message || "Gagal mengeksekusi rotasi mitra DUDI");
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
      if (selectedDudi !== "ALL" && student.placement.dudiId !== selectedDudi) {
        return false;
      }
      if (statusFilter === "DRIFT" && !student.hasDriftWarning) {
        return false;
      }
      if (statusFilter === "ACHIEVED" && student.overallPercentage < 75) {
        return false;
      }
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

  // Count achieved students (overall percentage >= 75%)
  const totalAchievedCount = useMemo(() => {
    if (!data?.students) return 0;
    return data.students.filter((s) => s.overallPercentage >= 75).length;
  }, [data]);

  // Paginated students for both matrix table and cards view (6 per page)
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedStudents = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, safeCurrentPage]);

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
      (a, b) => (priorityMap[a.alert.alertType] || 99) - (priorityMap[b.alert.alertType] || 99)
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
  // 1. LOADING SKELETON
  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoading && !data) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 items-start pb-12">
        <div className="flex-1 min-w-0 space-y-5 w-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 animate-pulse">
            <div className="space-y-2">
              <div className="h-5 w-48 bg-slate-200 rounded-full" />
              <div className="h-3.5 w-72 bg-slate-100 rounded-full" />
            </div>
            <div className="h-9 w-36 bg-slate-200 rounded-full" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 bg-white border border-slate-200/70 rounded-2xl p-4 space-y-3 animate-pulse"
              >
                <div className="h-3 w-20 bg-slate-200 rounded-full" />
                <div className="h-6 w-16 bg-slate-200 rounded-full" />
              </div>
            ))}
          </div>

          <div className="h-[460px] bg-white border border-slate-200/70 rounded-2xl animate-pulse" />
        </div>

        <div className="hidden lg:flex w-[320px] xl:w-[340px] flex-col gap-4 shrink-0">
          <div className="h-44 bg-white border border-slate-200/70 rounded-2xl animate-pulse" />
          <div className="h-64 bg-white border border-slate-200/70 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. ERROR RECOVERY
  // ─────────────────────────────────────────────────────────────────────────────
  if (errorMessage && !data) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Gagal Memuat Dasbor Guru</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{errorMessage}</p>
          <button
            type="button"
            onClick={loadHeatmapData}
            className="w-full py-2.5 px-4 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
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
    <div className="w-full flex flex-col lg:flex-row gap-4 sm:gap-5 items-stretch min-h-0 pb-12">
      {/* ─── LEFT: MAIN WORKSPACE ─── */}
      <section className="flex-1 min-w-0 space-y-4 sm:space-y-5 w-full">
        {/* ─── 1. CLEAN UNIFIED HEADER (MATCHING STUDENT DASHBOARD 86PX BAR) ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-4 sm:px-5 lg:h-[86px] border border-slate-200/70 shadow-2xs shrink-0">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                Halo, {teacherFirstName}!
              </h1>
              {summary.studentsWithDrift > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 text-[11px] font-semibold leading-none shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>{summary.studentsWithDrift} Anomali Drift</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-medium leading-none shadow-2xs">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>Semua Siswa Sesuai Target</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
              {data?.department.name || "Rekayasa Perangkat Lunak"} &bull;{" "}
              {user?.school?.name || "SMK Telkom 1 Medan"} &bull; Target {TOTAL_TARGET_JP} JP
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {securityFlags.length > 0 && (
              <button
                type="button"
                onClick={() => setViewMode("security")}
                className="h-10 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>{securityFlags.length} Insiden Audit</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTriggerEvaluate}
              disabled={isEvaluating}
              className="h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-2 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-white", isEvaluating && "animate-spin")} />
              <span>{isEvaluating ? "Memindai..." : "Evaluasi Drift"}</span>
            </button>
          </div>
        </div>

        {/* ─── 2. COMPACT KPI METRIC STRIP (Konsisten dengan Kartu Siswa) ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Tile 1: Siswa Binaan */}
          <div
            onClick={() => {
              setStatusFilter("ALL");
              if (viewMode === "security") setViewMode("matrix");
            }}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:border-slate-300 hover:shadow-xs flex items-center gap-3 cursor-pointer transition"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                Siswa Binaan
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mt-0.5">
                {summary.totalStudents}{" "}
                <span className="text-xs font-normal text-slate-500">Siswa</span>
              </p>
            </div>
          </div>

          {/* Tile 2: Peringatan Drift */}
          <div
            onClick={() => {
              setStatusFilter(statusFilter === "DRIFT" ? "ALL" : "DRIFT");
              if (viewMode === "security") setViewMode("matrix");
            }}
            className={cn(
              "p-4 sm:p-5 rounded-2xl border shadow-2xs flex items-center gap-3 cursor-pointer transition hover:shadow-xs",
              statusFilter === "DRIFT"
                ? "bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20"
                : summary.studentsWithDrift > 0
                  ? "bg-white border-rose-200/80 hover:bg-rose-50/30"
                  : "bg-white border-slate-200/70 hover:border-slate-300"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border",
                summary.studentsWithDrift > 0
                  ? "bg-rose-50 text-rose-600 border-rose-200/70"
                  : "bg-slate-50 text-slate-400 border-slate-200/60"
              )}
            >
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate",
                  summary.studentsWithDrift > 0 ? "text-rose-600" : "text-slate-400"
                )}
              >
                Anomali Drift
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mt-0.5">
                {summary.studentsWithDrift}{" "}
                <span className="text-xs font-normal text-slate-500">Siswa</span>
              </p>
            </div>
          </div>

          {/* Tile 3: Rata-rata Capaian */}
          <div
            onClick={() => {
              setStatusFilter(statusFilter === "ACHIEVED" ? "ALL" : "ACHIEVED");
              if (viewMode === "security") setViewMode("matrix");
            }}
            className={cn(
              "p-4 sm:p-5 rounded-2xl border shadow-2xs flex items-center gap-3 cursor-pointer transition hover:shadow-xs",
              statusFilter === "ACHIEVED"
                ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20"
                : "bg-white border-slate-200/70 hover:border-slate-300"
            )}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                Rata-Rata Capaian CP
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {summary.averageCompetencyPercentage}%
                </p>
                <span className="text-[10px] text-emerald-700 font-medium truncate">
                  ({totalAchievedCount} Tuntas)
                </span>
              </div>
            </div>
          </div>

          {/* Tile 4: Integritas Validasi */}
          <div
            onClick={() => setViewMode("security")}
            className={cn(
              "p-4 sm:p-5 rounded-2xl border shadow-2xs flex items-center gap-3 cursor-pointer transition hover:shadow-xs",
              viewMode === "security"
                ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20"
                : "bg-white border-slate-200/70 hover:border-slate-300"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border",
                securityFlags.length > 0
                  ? "bg-amber-50 text-amber-600 border-amber-200/70"
                  : "bg-slate-50 text-slate-500 border-slate-200/60"
              )}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                Audit Validasi
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mt-0.5">
                {securityFlags.length}{" "}
                <span className="text-xs font-normal text-slate-500">Insiden</span>
              </p>
            </div>
          </div>
        </div>

        {/* ─── 3. VIEW CONTROLLER (Judul & Segmented Tabs ala Dashboard Siswa) ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
            {viewMode === "matrix"
              ? "Matriks Capaian Elemen Kompetensi Siswa"
              : viewMode === "cards"
              ? "Daftar Siswa Binaan & Monitoring Terpadu"
              : "Audit Validasi & Integritas Kriptografis"}
          </h2>

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
              title="Matriks CP"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Matriks CP</span>
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
              title="Kartu Siswa"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Kartu Siswa</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("security")}
              className={cn(
                "px-2 sm:px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap text-center text-[11px] sm:text-xs flex items-center justify-center gap-1.5",
                viewMode === "security"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
              )}
              title="Audit Keamanan"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Keamanan</span>
              {securityFlags.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
                  {securityFlags.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ─── 4. SECONDARY CONTROL BAR: Status Chips | Search, DUDI & Counter ─── */}
        {viewMode !== "security" && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Status chips ringan */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                aria-pressed={statusFilter === "ALL"}
                className={cn(
                  "h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer",
                  statusFilter === "ALL"
                    ? "bg-sky-500 text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <span>Semua</span>
                <span
                  className={cn(
                    "tabular-nums text-[11px]",
                    statusFilter === "ALL" ? "text-white/80 font-medium" : "text-slate-400"
                  )}
                >
                  {data?.students?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("DRIFT")}
                aria-pressed={statusFilter === "DRIFT"}
                className={cn(
                  "h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer",
                  statusFilter === "DRIFT"
                    ? "bg-rose-500 text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    statusFilter === "DRIFT" ? "bg-white" : "bg-rose-500"
                  )}
                />
                <span>Drift</span>
                <span
                  className={cn(
                    "tabular-nums text-[11px]",
                    statusFilter === "DRIFT" ? "text-white/80 font-medium" : "text-slate-400"
                  )}
                >
                  {summary.studentsWithDrift}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("ACHIEVED")}
                aria-pressed={statusFilter === "ACHIEVED"}
                className={cn(
                  "h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer",
                  statusFilter === "ACHIEVED"
                    ? "bg-emerald-600 text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    statusFilter === "ACHIEVED" ? "bg-white" : "bg-emerald-500"
                  )}
                />
                <span>Tuntas</span>
                <span
                  className={cn(
                    "tabular-nums text-[11px]",
                    statusFilter === "ACHIEVED" ? "text-white/80 font-medium" : "text-slate-400"
                  )}
                >
                  {totalAchievedCount}
                </span>
              </button>
            </div>

            {/* Search + DUDI + Compact Legend & Pagination Info */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Search Box */}
              <div className="relative flex-1 sm:w-56 md:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari siswa, NISN, DUDI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-9 pr-8 rounded-full bg-white border border-slate-200/90 text-xs text-slate-900 placeholder:text-slate-400 font-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs"
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

              {/* Filter DUDI Dropdown */}
              {dudiOptions.length > 0 && (
                <select
                  value={selectedDudi}
                  onChange={(e) => setSelectedDudi(e.target.value)}
                  className="h-8 px-3 rounded-full bg-white border border-slate-200/90 text-[11px] font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs cursor-pointer max-w-[150px] truncate"
                >
                  <option value="ALL">Semua DUDI</option>
                  {dudiOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* ─── VIEW 1: MATRIX TABLE VIEW ─── */}
        {viewMode === "matrix" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
              {/* Header Bar Tabel Capaian */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                    Ketercapaian per Elemen Capaian Pembelajaran (CP)
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs">
                    {filteredStudents.length} Siswa Terdaftar
                  </span>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-xs w-72 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
                        Siswa &amp; Mitra DUDI ({filteredStudents.length})
                      </th>
                      {cpElements.map((cp) => (
                        <th
                          key={cp.id}
                          className="py-3.5 px-3 text-center min-w-[130px] border-r border-slate-100"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[11px] text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 shadow-2xs">
                              {cp.code}
                            </span>
                            <span
                              className="text-xs text-slate-800 font-semibold line-clamp-1 max-w-[125px] hover:text-sky-600 transition-colors"
                              title={cp.title}
                            >
                              {cp.title}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Target {cp.targetJp} JP
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-xs text-center w-36">
                        Total Progres
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={cpElements.length + 2}
                          className="py-14 text-center text-slate-500 font-medium"
                        >
                          Tidak ada data siswa yang sesuai dengan filter pencarian.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((student) => {
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
                            className="hover:bg-slate-50 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border transition-transform duration-150 group-hover:scale-105",
                                    student.hasDriftWarning
                                      ? "bg-rose-50 text-rose-700 border-rose-200 shadow-2xs"
                                      : "bg-slate-100 text-slate-700 border-slate-200 shadow-2xs group-hover:bg-sky-50 group-hover:text-sky-700 group-hover:border-sky-200"
                                  )}
                                >
                                  {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-semibold text-slate-900 text-xs group-hover:text-sky-600 transition-colors truncate">
                                      {student.fullName}
                                    </p>
                                    {student.hasDriftWarning && (
                                      <span
                                        className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse"
                                        title="Terdeteksi Anomali Drift"
                                      />
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5 group-hover:text-slate-700 transition-colors">
                                    {student.placement.dudiName}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {student.cpProgress.map((cp) => {
                              const isAchieved = cp.status === "ACHIEVED";
                              const isInProgress = cp.status === "IN_PROGRESS";

                              return (
                                <td
                                  key={cp.cpElementId}
                                  title={`${cp.verifiedJp} dari ${cp.targetJp} JP terverifikasi (${cp.percentage}%)`}
                                  className="py-3 px-2 text-center border-r border-slate-100"
                                >
                                  <div className="inline-flex flex-col items-center w-full max-w-[88px] space-y-1">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {isAchieved ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      ) : isInProgress ? (
                                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                      )}
                                      <span
                                        className={cn(
                                          "text-xs font-bold",
                                          isAchieved
                                            ? "text-emerald-700"
                                            : isInProgress
                                              ? "text-amber-700"
                                              : "text-slate-600"
                                        )}
                                      >
                                        {cp.percentage}%
                                      </span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                      <div
                                        className={cn(
                                          "h-full rounded-full transition-all duration-300",
                                          isAchieved
                                            ? "bg-emerald-500"
                                            : isInProgress
                                              ? "bg-amber-500"
                                              : "bg-transparent"
                                        )}
                                        style={{
                                          width: `${Math.min(100, cp.percentage)}%`,
                                          minWidth: cp.percentage > 0 ? "6px" : "0px",
                                        }}
                                      />
                                    </div>
                                    <span
                                      className={cn(
                                        "text-[10px] font-medium leading-none",
                                        isAchieved
                                          ? "text-emerald-700"
                                          : isInProgress
                                            ? "text-amber-700"
                                            : "text-slate-500"
                                      )}
                                    >
                                      {cp.verifiedJp}/{cp.targetJp} JP
                                    </span>
                                  </div>
                                </td>
                              );
                            })}

                            <td className="py-3 px-4 text-center">
                              <div className="max-w-[96px] mx-auto space-y-1.5">
                                <div className="flex items-baseline justify-between">
                                  <span
                                    className={cn(
                                      "text-xs font-bold",
                                      student.hasDriftWarning
                                        ? "text-rose-600"
                                        : student.overallPercentage >= 75
                                          ? "text-emerald-700"
                                          : student.overallPercentage > 0
                                            ? "text-slate-900"
                                            : "text-slate-600"
                                    )}
                                  >
                                    {student.overallPercentage}%
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-500">
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
                                          : student.overallPercentage > 0
                                            ? "bg-sky-500"
                                            : "bg-transparent"
                                    )}
                                    style={{
                                      width: `${Math.min(100, student.overallPercentage)}%`,
                                      minWidth: student.overallPercentage > 0 ? "6px" : "0px",
                                    }}
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

              {/* Mobile / Tablet List View (< lg) */}
              <div className="lg:hidden divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs">
                    Tidak ada data siswa yang sesuai dengan filter ini.
                  </div>
                ) : (
                  paginatedStudents.map((student) => {
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
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0",
                                student.hasDriftWarning
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-700"
                              )}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-slate-900 text-sm truncate">
                                  {student.fullName}
                                </p>
                                {student.hasDriftWarning && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
                                    Drift
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">
                                {student.placement.dudiName}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-slate-900">
                              {student.overallPercentage}%
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {student.totalVerifiedJp}/{TOTAL_TARGET_JP} JP
                            </p>
                          </div>
                        </div>

                        {/* Simplified Horizontal Scroll CP Badges for Mobile */}
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 text-xs">
                          {student.cpProgress.map((cp, idx) => (
                            <React.Fragment key={cp.cpElementId}>
                              {idx > 0 && <span className="text-slate-300 select-none">&bull;</span>}
                              <span className="shrink-0 flex items-center gap-1">
                                <span className="text-slate-500 font-medium">{cp.code}:</span>
                                <span
                                  className={cn(
                                    "font-bold",
                                    cp.status === "ACHIEVED"
                                      ? "text-emerald-700"
                                      : cp.status === "IN_PROGRESS"
                                        ? "text-amber-700"
                                        : "text-slate-600"
                                  )}
                                >
                                  {cp.percentage}%
                                </span>
                              </span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ─── Modern Minimalist Centered Pagination (TERPISAH DARI CARD UTAMA) ─── */}
            {totalPages > 1 && (
              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-center">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                              onClick={() => setCurrentPage(page)}
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
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, safeCurrentPage + 1))}
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
          )}

          {/* ─── VIEW 2: CARDS GRID VIEW ─── */}
          {viewMode === "cards" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {paginatedStudents.length === 0 ? (
                  <div className="col-span-full py-12 text-center space-y-2 bg-white rounded-2xl border border-dashed border-slate-200/90 p-8 shadow-2xs">
                    <p className="text-xs font-semibold text-slate-700">
                      Tidak ada siswa yang sesuai filter
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Silakan sesuaikan kata kunci pencarian atau pilihan filter status di atas.
                    </p>
                  </div>
                ) : (
                  paginatedStudents.map((student) => {
                    const initials = student.fullName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <div
                        key={student.studentId}
                        className="rounded-2xl p-4 sm:p-4.5 border border-slate-200/70 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3.5 bg-white shadow-2xs group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={cn(
                                  "w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0",
                                  student.hasDriftWarning
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-slate-100 text-slate-700"
                                )}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                                    {student.fullName}
                                  </h3>
                                </div>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {student.placement.dudiName} &bull; NISN {student.nisn}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 flex flex-col items-end gap-1">
                              {student.hasDriftWarning ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/70 text-[10.5px] font-semibold leading-none shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                  <span>Drift</span>
                                </span>
                              ) : student.overallPercentage >= 75 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10.5px] font-semibold leading-none shadow-2xs">
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  <span>Tuntas</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70 text-[10.5px] font-semibold leading-none shadow-2xs">
                                  <span>Sesuai Target</span>
                                </span>
                              )}
                              <span className="text-[11px] font-bold text-slate-900 font-mono">
                                {student.overallPercentage}%
                              </span>
                            </div>
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

                          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60">
                            <div>
                              <span className="text-slate-400 text-[11px]">14 Hari Terakhir: </span>
                              <span className="font-semibold text-slate-800">
                                {student.totalJpLast14Days - student.nonCompetencyJpLast14Days} JP
                                Kompetensi
                              </span>
                            </div>
                            <span
                              className={cn(
                                "text-[11px] font-medium",
                                student.nonCompetencyJpLast14Days > 0
                                  ? "text-amber-700"
                                  : "text-slate-400"
                              )}
                            >
                              {student.nonCompetencyJpLast14Days} JP Non-Kompetensi
                            </span>
                          </div>
                        </div>

                        <div className="pt-2.5 flex items-center justify-between border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setSelectedStudent(student)}
                            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Rincian CP</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openInterventionModal(student)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold transition cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-sky-400" />
                            <span>Intervensi</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modern Minimalist Centered Pagination for Cards View */}
              {totalPages > 1 && (
                <div className="pt-4 border-t border-slate-200/60 flex items-center justify-center">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      disabled={safeCurrentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                                onClick={() => setCurrentPage(page)}
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
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, safeCurrentPage + 1))}
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
          )}

          {/* ─── VIEW 3: AUDIT KEAMANAN ─── */}
          {viewMode === "security" && (
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs p-5 sm:p-6">
              {securityFlags.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Seluruh Validasi Mentor Bersih &amp; Sah
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Tidak ada percobaan otentikasi mencurigakan atau penguncian PIN mentor pada
                    sekolah Anda.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {securityFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
                            {flag.kind === "UNTRUSTED_DEVICE"
                              ? "Perangkat Asing"
                              : flag.kind === "PIN_LOCKOUT"
                                ? "PIN Terkunci (5x Salah)"
                                : "Penggunaan Ulang Tautan"}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">
                            {flag.studentName} &bull; {flag.dudiName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(flag.createdAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            WIB
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {flag.meta?.note ||
                            flag.meta?.reason ||
                            "Percobaan verifikasi ditolak oleh gerbang keamanan."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAcknowledgeFlag(flag.id)}
                        disabled={isAcknowledgingFlag === flag.id}
                        className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
                      >
                        {isAcknowledgingFlag === flag.id ? "Menandai..." : "Tandai Ditinjau"}
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
        departmentName={
          user?.department?.name || data?.department.name || "Rekayasa Perangkat Lunak"
        }
        averagePercentage={summary.averageCompetencyPercentage}
        totalStudents={summary.totalStudents}
        achievedCount={totalAchievedCount}
        driftCount={summary.studentsWithDrift}
        securityFlagsCount={securityFlags.length}
        priorityStudents={widgetPriorityStudents}
        onViewSecurityAudit={() => setViewMode("security")}
      />

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 1: DETAIL SISWA & BREAKDOWN DISTRIBUSI JAM
      ───────────────────────────────────────────────────────────────────────────── */}
      {selectedStudent && (
        <div
          onClick={() => setSelectedStudent(null)}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in-0 duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 pb-[env(safe-area-inset-bottom,1.5rem)] sm:pb-6 border border-slate-200/80 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider block">
                  Rincian Capaian Siswa
                </span>
                <h3 className="font-semibold text-base text-slate-900">
                  {selectedStudent.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">NISN:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedStudent.nisn}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mitra DUDI:</span>
                <span className="font-semibold text-slate-800">
                  {selectedStudent.placement.dudiName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mentor Industri:</span>
                <span className="font-medium text-slate-800">
                  {selectedStudent.placement.mentorName}{" "}
                  {selectedStudent.placement.mentorPhone &&
                    `(${selectedStudent.placement.mentorPhone})`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200/60">
                <p className="text-[10px] font-semibold uppercase text-sky-700">
                  Jam Kompetensi (14 Hari)
                </p>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedStudent.totalJpLast14Days - selectedStudent.nonCompetencyJpLast14Days} JP
                </p>
              </div>
              <div
                className={cn(
                  "p-3 rounded-2xl border",
                  selectedStudent.nonCompetencyJpLast14Days > 0
                    ? "bg-rose-50/70 border-rose-200/70 text-rose-900"
                    : "bg-slate-50 border-slate-200/60 text-slate-600"
                )}
              >
                <p className="text-[10px] font-semibold uppercase">Non-Kompetensi (14 Hari)</p>
                <p className="text-base font-bold mt-0.5">
                  {selectedStudent.nonCompetencyJpLast14Days} JP
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                Progres Elemen CP (Target {TOTAL_TARGET_JP} JP):
              </p>
              <div className="space-y-2">
                {selectedStudent.cpProgress.map((cp) => (
                  <div
                    key={cp.cpElementId}
                    className="p-3 rounded-2xl border border-slate-200/70 bg-white text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800 truncate">{cp.title}</span>
                      <span className="font-mono text-[11px] font-semibold text-slate-700 shrink-0">
                        {cp.percentage}% ({cp.verifiedJp}/{cp.targetJp} JP)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
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

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const st = selectedStudent;
                  setSelectedStudent(null);
                  openInterventionModal(st);
                }}
                className="flex-1 h-10 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Intervensi &amp; Rotasi Mitra</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 2: SMART INTERVENTION DISPATCHER & MID-TERM ROTATION
      ───────────────────────────────────────────────────────────────────────────── */}
      {interventionStudent && (
        <div
          onClick={() => {
            setInterventionStudent(null);
            setInterventionSuccessMsg(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 pb-[env(safe-area-inset-bottom,1.5rem)] sm:pb-6 shadow-2xl border border-slate-200/80 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Tindak Lanjut Pembimbing
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {interventionStudent.fullName} &bull; {interventionStudent.placement.dudiName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInterventionStudent(null);
                  setInterventionSuccessMsg(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {interventionSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Berhasil Diproses</p>
                  <p className="mt-0.5">{interventionSuccessMsg}</p>
                </div>
              </div>
            )}

            {interventionAlert && (
              <div className="px-3.5 py-2.5 rounded-2xl bg-rose-50/70 border border-rose-200/70 flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-rose-900 truncate">
                  {interventionAlert.metricSnapshot.detectedReason}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-semibold shrink-0">
                  {interventionAlert.alertType}
                </span>
              </div>
            )}

            {/* Segmented Action Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200/70 text-xs font-medium">
              <button
                type="button"
                onClick={() => setInterventionTab("WA_COORDINATION")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-full flex items-center justify-center gap-1.5 transition cursor-pointer",
                  interventionTab === "WA_COORDINATION"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setInterventionTab("SITE_VISIT")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-full flex items-center justify-center gap-1.5 transition cursor-pointer",
                  interventionTab === "SITE_VISIT"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>Kunjungan</span>
              </button>

              <button
                type="button"
                onClick={() => setInterventionTab("DUDI_ROTATION")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-full flex items-center justify-center gap-1.5 transition cursor-pointer",
                  interventionTab === "DUDI_ROTATION"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Repeat className="w-3.5 h-3.5 text-amber-600" />
                <span>Rotasi DUDI</span>
              </button>
            </div>

            {/* Tab 1: WhatsApp */}
            {interventionTab === "WA_COORDINATION" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">
                    Kepada: {interventionStudent.placement.mentorName} (
                    {interventionStudent.placement.mentorPhone || "WA"})
                  </span>
                </div>

                {isDraftLoading ? (
                  <div className="h-40 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Menyusun draf pesan...
                  </div>
                ) : (
                  <textarea
                    rows={6}
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    className="w-full text-xs p-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-sky-500 font-sans leading-relaxed text-slate-800 resize-none"
                    placeholder="Tulis pesan koordinasi..."
                  />
                )}

                <button
                  type="button"
                  disabled={isSubmittingIntervention || !draftMessage.trim()}
                  onClick={handleSendWaIntervention}
                  className="w-full h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSubmittingIntervention
                      ? "Mencatat..."
                      : "Kirim WhatsApp & Catat Log Intervensi"}
                  </span>
                </button>
              </div>
            )}

            {/* Tab 2: Site Visit */}
            {interventionTab === "SITE_VISIT" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tanggal Rencana Kunjungan:
                  </label>
                  <input
                    type="date"
                    value={siteVisitDate}
                    onChange={(e) => setSiteVisitDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-sky-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Agenda Supervisi:
                  </label>
                  <textarea
                    rows={4}
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-sky-500 text-slate-800 resize-none"
                  />
                </div>

                <button
                  type="button"
                  disabled={isSubmittingIntervention}
                  onClick={handleRecordSiteVisit}
                  className="w-full h-10 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {isSubmittingIntervention ? "Menyimpan..." : "Simpan Jadwal Kunjungan"}
                  </span>
                </button>
              </div>
            )}

            {/* Tab 3: Rotation */}
            {interventionTab === "DUDI_ROTATION" && (
              <div className="space-y-3">
                <p className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-[11px] leading-relaxed text-amber-900">
                  Akumulasi <strong>{interventionStudent.totalVerifiedJp} JP</strong> yang sudah
                  terverifikasi di <strong>{interventionStudent.placement.dudiName}</strong> tetap
                  tersimpan utuh di portofolio siswa.
                </p>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mitra DUDI Tujuan Baru:
                  </label>
                  <select
                    value={targetDudiId}
                    onChange={(e) => setTargetDudiId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer"
                  >
                    <option value="">-- Pilih Mitra DUDI Tujuan --</option>
                    {dudiOptions
                      .filter((d) => d.id !== interventionStudent.placement.dudiId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Alasan Rotasi:
                  </label>
                  <textarea
                    rows={3}
                    value={rotationReason}
                    onChange={(e) => setRotationReason(e.target.value)}
                    placeholder="Contoh: Pemenuhan elemen kompetensi yang belum tersedia di DUDI awal."
                    className="w-full text-xs p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-amber-500 text-slate-800 resize-none"
                  />
                </div>

                <button
                  type="button"
                  disabled={isSubmittingIntervention || !targetDudiId}
                  onClick={handleExecuteRotation}
                  className="w-full h-10 rounded-full bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>
                    {isSubmittingIntervention ? "Memproses..." : "Konfirmasi Rotasi Mitra DUDI"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-sky-500" />
        </div>
      }
    >
      <HeatmapContent />
    </Suspense>
  );
}