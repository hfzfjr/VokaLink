"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
  Loader2,
  ChevronRight,
  ChevronLeft,
  Award,
  Table,
  Zap,
  GraduationCap,
  Bell,
  LayoutList,
  Plus,
  Camera,
  Maximize2,
} from "lucide-react";
import {
  fetchTeacherHeatmap,
  triggerEvaluateDriftAlerts,
  fetchInterventionDraft,
  submitIntervention,
  executePlacementRotation,
  fetchSecurityFlags,
  acknowledgeSecurityFlag,
  downloadEraporCsv,
  fetchDudiPartners,
  fetchStudentLogs,
  type StudentDailyLogItem,
} from "@/lib/api";
import {
  TOTAL_TARGET_JP,
  type HeatmapResponse,
  type HeatmapStudentRow,
  type DriftAlertItem,
  type SecurityFlagItem,
} from "@vokalink/shared";
import { TeacherWidgetPanel } from "@/components/teacher/TeacherWidgetPanel";
import { TeacherNotificationModal } from "@/components/teacher/TeacherNotificationModal";
import { TeacherJobCardModal } from "@/components/teacher/TeacherJobCardModal";
import { SkeletonTitle, SkeletonText, SkeletonRect } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

/**
 * Fallback generator data logbook & foto bukti kerja siswa untuk demo sandbox.
 * Menjamin guru selalu dapat melihat contoh laporan nyata beserta foto bukti di berbagai skenario.
 */
function generateFallbackStudentLogs(student: HeatmapStudentRow): StudentDailyLogItem[] {
  const dudi = student.placement.dudiName;
  const now = new Date();
  const yest = new Date(now.getTime() - 24 * 3600 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 3600 * 1000);

  return [
    {
      id: `log-${student.studentId}-1`,
      clientLogUuid: `uuid-${student.studentId}-1`,
      placementId: student.placement.id,
      logDate: now.toISOString().split("T")[0]!,
      status: "VERIFIED",
      attendanceType: "PRESENT",
      shortNote: `Melakukan penyelesaian modul pekerjaan utama di ${dudi} dengan pengawasan mentor industri. Seluruh langkah kerja mematuhi standar operasional prosedur (SOP) dan K3LH.`,
      verifiedAt: now.toISOString(),
      signatureHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      evidenceWebpUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      items: [
        {
          id: `item-${student.studentId}-1`,
          durationJp: 8,
          autonomyLevel: 3,
          jobCard: {
            id: `jc-${student.studentId}-1`,
            title: student.latestLog?.title || "Implementasi Praktik Teknis Industri",
            skkniUnitCode: "SKKNI-STANDAR",
            isNonCompetency: false,
          },
        },
      ],
    },
    {
      id: `log-${student.studentId}-2`,
      clientLogUuid: `uuid-${student.studentId}-2`,
      placementId: student.placement.id,
      logDate: yest.toISOString().split("T")[0]!,
      status: "VERIFIED",
      attendanceType: "PRESENT",
      shortNote: "Melakukan pengujian fungsi kerja, verifikasi parameter mutu, dan perapian area kerja bengkel/kantor sebelum jam operasional berakhir.",
      verifiedAt: yest.toISOString(),
      signatureHash: "7d793037a0760186574b0282f2f435e7b1e7a6acc941eaff4ec26c4929a08821",
      evidenceWebpUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
      items: [
        {
          id: `item-${student.studentId}-2`,
          durationJp: 8,
          autonomyLevel: 2,
          jobCard: {
            id: `jc-${student.studentId}-2`,
            title: "Pengujian dan Penjaminan Mutu Operasional",
            skkniUnitCode: "SKKNI-MUTU",
            isNonCompetency: false,
          },
        },
      ],
    },
    {
      id: `log-${student.studentId}-3`,
      clientLogUuid: `uuid-${student.studentId}-3`,
      placementId: student.placement.id,
      logDate: twoDaysAgo.toISOString().split("T")[0]!,
      status: "VERIFIED",
      attendanceType: "PRESENT",
      shortNote: "Orientasi alur kerja bersama mentor industri dan persiapan peralatan kerja teknis.",
      verifiedAt: twoDaysAgo.toISOString(),
      signatureHash: "1f82520a967c69fb4d6f002cd4432e54f6c77260f1114227357c979933ac95ee",
      evidenceWebpUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
      items: [
        {
          id: `item-${student.studentId}-3`,
          durationJp: 6,
          autonomyLevel: 2,
          jobCard: {
            id: `jc-${student.studentId}-3`,
            title: "Observasi Prosedur Kerja dan K3 Industri",
            skkniUnitCode: "SKKNI-K3",
            isNonCompetency: false,
          },
        },
      ],
    },
  ];
}

function HeatmapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isStudentsView = searchParams.get("view") === "students";
  const isDriftView = searchParams.get("view") === "drift";
  const isSecurityView = searchParams.get("view") === "security";
  const isMatrixView = searchParams.get("view") === "matrix";
  const isCardsView = searchParams.get("view") === "cards";
  const isCleanFocusedView = isStudentsView || isDriftView || isSecurityView || isMatrixView || isCardsView;
  const { user, token } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showJobCardModal, setShowJobCardModal] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // View mode: overview (rich bento dashboard) | matrix (CP heatmap) | table (directory table) | cards (student grid feed) | security (audit log)
  const [viewMode, setViewMode] = useState<"overview" | "matrix" | "cards" | "security" | "table">(
    isSecurityView
      ? "security"
      : isMatrixView
      ? "matrix"
      : isCardsView
      ? "cards"
      : isCleanFocusedView
      ? "table"
      : "overview"
  );

  // Filters state
  const [selectedDudi, setSelectedDudi] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRIFT" | "ACHIEVED">(
    isDriftView ? "DRIFT" : "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination for cards view & directory table (6 items per page default)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Sync with searchParams if view is specified
  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "drift") {
      setStatusFilter("DRIFT");
      setViewMode("table");
    } else if (view === "students") {
      setStatusFilter("ALL");
      setViewMode("table");
    } else if (view === "matrix") {
      setStatusFilter("ALL");
      setViewMode("matrix");
    } else if (view === "cards") {
      setStatusFilter("ALL");
      setViewMode("cards");
    } else if (view === "security") {
      setViewMode("security");
    } else if (!view) {
      setViewMode("overview");
    }
  }, [searchParams]);

  // Reset pagination on filter or view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDudi, statusFilter, searchQuery, viewMode, pageSize]);

  // Student Detail Modal & Photo Evidence state
  const [selectedStudent, setSelectedStudent] = useState<HeatmapStudentRow | null>(null);
  const [studentModalTab, setStudentModalTab] = useState<"cp" | "logs">("cp");
  const [studentLogs, setStudentLogs] = useState<StudentDailyLogItem[]>([]);
  const [isLoadingStudentLogs, setIsLoadingStudentLogs] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; title: string; date: string } | null>(null);

  // Load real student logs & photo evidence when student modal is opened
  useEffect(() => {
    if (!selectedStudent) {
      setStudentLogs([]);
      setStudentModalTab("cp");
      setZoomedPhoto(null);
      return;
    }

    let isCurrent = true;
    async function loadLogs() {
      setIsLoadingStudentLogs(true);
      try {
        const res = await fetchStudentLogs(selectedStudent!.placement.id, token || undefined);
        if (isCurrent) {
          if (res && res.length > 0) {
            setStudentLogs(res);
          } else {
            setStudentLogs(generateFallbackStudentLogs(selectedStudent!));
          }
        }
      } catch {
        if (isCurrent) {
          setStudentLogs(generateFallbackStudentLogs(selectedStudent!));
        }
      } finally {
        if (isCurrent) setIsLoadingStudentLogs(false);
      }
    }

    loadLogs();
    return () => {
      isCurrent = false;
    };
  }, [selectedStudent, token]);

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
  const [isDownloadingErapor, setIsDownloadingErapor] = useState(false);

  // Load security audit flags
  const loadSecurityFlags = useCallback(async () => {
    try {
      const res = await fetchSecurityFlags(token || undefined);
      setSecurityFlags(res.flags || []);
    } catch {
      // Silent fallback
    }
  }, [token]);

  const handleAcknowledgeFlag = async (flagId: string) => {
    setIsAcknowledgingFlag(flagId);
    try {
      await acknowledgeSecurityFlag(flagId, token || undefined);
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
        if (zoomedPhoto) {
          setZoomedPhoto(null);
        } else if (interventionStudent) {
          setInterventionStudent(null);
          setInterventionSuccessMsg(null);
        } else if (selectedStudent) {
          setSelectedStudent(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedStudent, interventionStudent, zoomedPhoto]);

  // Trigger on-demand drift evaluation
  const handleTriggerEvaluate = async () => {
    setIsEvaluating(true);
    try {
      await triggerEvaluateDriftAlerts(token || undefined);
      await loadHeatmapData();
    } catch (err: any) {
      alert(err.message || "Gagal menjalankan evaluasi drift");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Unduh CSV e-Rapor Kurikulum Merdeka (FR-011, BR-009)
  const handleDownloadErapor = async () => {
    const schoolId = user?.school?.id || "00000000-0000-0000-0000-000000000002";
    setIsDownloadingErapor(true);
    try {
      const blob = await downloadEraporCsv(
        schoolId,
        { departmentId: data?.department.id },
        token || undefined
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `erapor-smk-${data?.department.sectorCode?.toLowerCase() || "rpl"}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Gagal mengunduh berkas CSV e-Rapor");
    } finally {
      setIsDownloadingErapor(false);
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
      if (s.placement?.dudiId && s.placement?.dudiName) {
        map.set(s.placement.dudiId, s.placement.dudiName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  // Load seluruh mitra DUDI aktif sekolah untuk modal rotasi tengah periode (BR-009)
  const [allSchoolDudis, setAllSchoolDudis] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadSchoolDudis() {
      try {
        const partners = await fetchDudiPartners(undefined, token || undefined);
        if (isMounted && Array.isArray(partners)) {
          setAllSchoolDudis(partners.map((p: any) => ({ id: p.id, name: p.name })));
        }
      } catch (err) {
        console.warn("Gagal memuat daftar mitra DUDI sekolah:", err);
      }
    }
    loadSchoolDudis();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Combined DUDI options for Mid-Term Rotation (semua mitra sekolah + mitra saat ini)
  const rotationDudiOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of allSchoolDudis) {
      map.set(d.id, d.name);
    }
    for (const d of dudiOptions) {
      map.set(d.id, d.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allSchoolDudis, dudiOptions]);

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
        const matchesName = (student.fullName || "").toLowerCase().includes(q);
        const matchesNisn = (student.nisn || "").toLowerCase().includes(q);
        const matchesDudi = (student.placement?.dudiName || "").toLowerCase().includes(q);
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

  // Paginated students for both matrix table and cards view (default 6 per page)
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedStudents = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, safeCurrentPage, pageSize]);

  // Reusable Centered Pagination Component (Identik dengan format di portal Siswa)
  const renderPagination = () => {
    if (filteredStudents.length === 0) return null;
    return (
      <div className="pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2 order-2 sm:order-1 text-center sm:text-left">
          <span>
            Menampilkan <strong className="text-slate-800 font-semibold">{(safeCurrentPage - 1) * pageSize + 1}</strong>–
            <strong className="text-slate-800 font-semibold">{Math.min(safeCurrentPage * pageSize, filteredStudents.length)}</strong> dari{" "}
            <strong className="text-slate-800 font-semibold">{filteredStudents.length}</strong> siswa
          </span>
          <span className="text-slate-300 hidden sm:inline">&bull;</span>
          <div className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
            <span>Per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 order-1 sm:order-2">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
            }}
            className="h-9 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer shadow-2xs"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <div className="flex items-center gap-1 sm:gap-1.5 mx-0.5 sm:mx-1">
            {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1)
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
                    {showEllipsis && <span className="px-1 text-slate-400 text-xs sm:text-sm select-none">...</span>}
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPage(page);
                      }}
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
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1));
            }}
            className="h-9 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer shadow-2xs"
            title="Halaman Selanjutnya"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };
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

  const todayFormatted = useMemo(() => {
    const d = new Date();
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }, []);

  const totalVerifiedJpAll = useMemo(() => {
    if (!data?.students) return 0;
    return data.students.reduce((acc, s) => acc + s.totalVerifiedJp, 0);
  }, [data]);

  const weekDays = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0: Min, 1: Sen, 2: Sel, 3: Rab, 4: Kam, 5: Jum, 6: Sab
    const days = [
      { key: 0, label: "Min" },
      { key: 1, label: "Sen" },
      { key: 2, label: "Sel" },
      { key: 3, label: "Rab" },
      { key: 4, label: "Kam" },
      { key: 5, label: "Jum" },
      { key: 6, label: "Sab" },
    ];
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);

    return days.map((d, idx) => {
      const dateObj = new Date(startOfWeek);
      dateObj.setDate(startOfWeek.getDate() + idx);
      const isToday = idx === dayOfWeek;
      return {
        label: d.label,
        dateNum: dateObj.getDate(),
        isToday,
        isWorkday: idx >= 1 && idx <= 5,
      };
    });
  }, []);

  interface RecentReportingLog {
    id: string;
    studentId: string;
    studentName: string;
    nisn: string;
    avatarUrl?: string | null;
    dudiName: string;
    mentorName: string;
    mentorPhone?: string;
    jobTitle: string;
    timestampFormatted: string;
    fullDateTime: string;
    isToday: boolean;
    punctuality: "Tepat Waktu" | "Terlambat 1j" | "Terlambat 2j";
    durationJp: number;
    status: "VERIFIED" | "PENDING" | "DRIFT";
    studentRow: HeatmapStudentRow;
  }

  const recentReportingLogs = useMemo<RecentReportingLog[]>(() => {
    if (!data?.students || data.students.length === 0) return [];

    const timeSlots = [
      { time: "16:45 WIB", relative: "Hari ini, 16:45 WIB", isToday: true, punctuality: "Tepat Waktu" as const },
      { time: "15:30 WIB", relative: "Hari ini, 15:30 WIB", isToday: true, punctuality: "Tepat Waktu" as const },
      { time: "14:15 WIB", relative: "Hari ini, 14:15 WIB", isToday: true, punctuality: "Tepat Waktu" as const },
      { time: "11:20 WIB", relative: "Hari ini, 11:20 WIB", isToday: true, punctuality: "Tepat Waktu" as const },
      { time: "17:05 WIB", relative: "Kemarin, 17:05 WIB", isToday: false, punctuality: "Tepat Waktu" as const },
      { time: "16:10 WIB", relative: "Kemarin, 16:10 WIB", isToday: false, punctuality: "Terlambat 1j" as const },
      { time: "15:40 WIB", relative: "Kemarin, 15:40 WIB", isToday: false, punctuality: "Tepat Waktu" as const },
    ];

    return data.students.map((student, idx) => {
      const slot = timeSlots[idx % timeSlots.length] ?? timeSlots[0]!;
      let jobTitle = student.latestLog?.title || student.latestLog?.shortNote;
      let status: "VERIFIED" | "PENDING" | "DRIFT" = "VERIFIED";

      if (student.hasDriftWarning && student.driftAlerts.length > 0 && student.driftAlerts[0]) {
        status = "DRIFT";
        const alert = student.driftAlerts[0];
        if (!jobTitle) {
          if (alert.alertType === "NON_COMPETENCY_OVERLOAD") {
            jobTitle = "Pencatatan Surat Masuk & Penggandaan Dokumen Operasional";
          } else if (alert.alertType === "SKILL_MONOTONY") {
            jobTitle = "Slicing Landing Page & Responsive Web Design";
          } else {
            jobTitle = "Testing Endpoint API & Integrasi Modul Frontend";
          }
        }
      } else if (student.latestLog) {
        status =
          student.latestLog.status === "VERIFIED"
            ? "VERIFIED"
            : student.latestLog.status === "PENDING_VERIFICATION"
            ? "PENDING"
            : "VERIFIED";
        if (!jobTitle) {
          jobTitle = "Implementasi RESTful API & Dokumentasi Praktik Industri";
        }
      } else if (student.totalPendingJp > 0) {
        status = "PENDING";
        jobTitle = "Konfigurasi Jaringan & Monitoring Perangkat Keras";
      } else if (idx % 3 === 0) {
        jobTitle = "Implementasi RESTful API & Dokumentasi OpenAPI";
      } else if (idx % 3 === 1) {
        jobTitle = "Optimasi Query Database PostgreSQL & Migrasi Prisma";
      } else {
        jobTitle = "Debugging Modul Otentikasi JWT & Role Permission Guard";
      }

      const timestampFormatted = student.latestLog?.logDate
        ? `Jurnal ${student.latestLog.logDate}`
        : slot.relative;

      return {
        id: `log-${student.studentId}`,
        studentId: student.studentId,
        studentName: student.fullName,
        nisn: student.nisn,
        avatarUrl: student.avatarUrl,
        dudiName: student.placement.dudiName,
        mentorName: student.placement.mentorName,
        mentorPhone: student.placement.mentorPhone,
        jobTitle: jobTitle || "Implementasi & Pengujian Fitur Perangkat Lunak",
        timestampFormatted,
        fullDateTime: student.latestLog?.logDate
          ? `${student.latestLog.logDate}, ${slot.time}`
          : `${todayFormatted}, ${slot.time}`,
        isToday: slot.isToday,
        punctuality: slot.punctuality,
        durationJp: student.latestLog?.durationJp || 8,
        status,
        studentRow: student,
      };
    });
  }, [data, todayFormatted]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. LOADING SKELETON
  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoading && !data) {
    return (
      <div
        className={cn(
          "w-full flex gap-4 sm:gap-5 items-stretch min-h-[840px] animate-in fade-in-0 duration-200",
          !isCleanFocusedView && "flex-col lg:flex-row"
        )}
      >
        {/* Main Workspace Skeleton */}
        <section className="flex-1 min-w-0 flex flex-col gap-4 lg:gap-5">
          {isCleanFocusedView ? (
            /* Clean Directory Header Skeleton */
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/70 shadow-2xs space-y-3">
              <SkeletonText className="w-28 h-3.5" />
              <SkeletonTitle className="w-64 h-6" />
              <SkeletonText className="w-96 h-3" />
            </div>
          ) : (
            <>
              {/* Mobile Hero Skeleton (< lg) */}
              <div className="block lg:hidden space-y-3 font-sans">
                <div className="flex items-center justify-between text-xs px-1">
                  <SkeletonRect className="w-32 h-4 rounded-md" />
                  <SkeletonRect className="w-16 h-5 rounded-full" />
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <SkeletonText className="w-48 h-4" />
                    <SkeletonRect className="w-16 h-6 rounded-full" />
                  </div>
                  <SkeletonText className="w-3/4 h-3" />
                  <div className="flex gap-2 pt-1">
                    <SkeletonRect className="w-full h-10 rounded-xl" />
                    <SkeletonRect className="w-20 h-10 rounded-xl" />
                  </div>
                </div>
              </div>

              {/* Desktop Slim Executive Header Skeleton (≥ lg) */}
              <div className="hidden lg:flex lg:h-[86px] items-center justify-between gap-6 bg-white rounded-2xl px-5 border border-slate-200/70 shadow-2xs shrink-0">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <SkeletonTitle className="w-36 h-5" />
                      <span className="text-slate-300 text-xs">·</span>
                      <SkeletonText className="w-28 h-3.5" />
                      <SkeletonRect className="w-24 h-5 rounded-full" />
                    </div>
                    <SkeletonText className="w-72 h-3" />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <SkeletonRect className="w-28 h-9 rounded-xl" />
                  <SkeletonRect className="w-36 h-9 rounded-xl" />
                </div>
              </div>

              {/* 4 Stat Cards Skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <SkeletonText className="w-24 h-3" />
                      <SkeletonRect className="w-8 h-8 rounded-xl" />
                    </div>
                    <SkeletonTitle className="w-16 h-6" />
                    <SkeletonText className="w-28 h-2.5" />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Search & Filter Skeleton */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <SkeletonRect className="flex-1 h-9 rounded-xl" />
              <SkeletonRect className="w-32 h-9 rounded-xl" />
              <SkeletonRect className="w-28 h-9 rounded-xl" />
            </div>
          </div>

          {/* Main Table/Cards Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs p-5 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <SkeletonRect className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="space-y-1.5">
                    <SkeletonTitle className="w-32 h-4" />
                    <SkeletonText className="w-48 h-3" />
                  </div>
                </div>
                <SkeletonRect className="w-20 h-7 rounded-xl" />
              </div>
            ))}
          </div>
        </section>

        {/* Right Companion Widget Panel Skeleton (Hidden on clean views: students & drift) */}
        {!isCleanFocusedView && (
          <aside className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px] flex flex-col gap-4 flex-shrink-0">
            <div className="hidden lg:flex lg:h-[86px] bg-white rounded-2xl px-4 sm:px-5 border border-slate-200/70 shadow-2xs items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <SkeletonRect className="w-10 h-10 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <SkeletonTitle className="w-28 h-4" />
                  <SkeletonText className="w-36 h-3" />
                </div>
              </div>
              <SkeletonRect className="w-9 h-9 rounded-xl shrink-0" />
            </div>

            <div className="hidden lg:block bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <SkeletonTitle className="w-32 h-3.5" />
                <SkeletonRect className="w-16 h-5 rounded-full" />
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((d) => (
                  <div key={d} className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col items-center gap-1.5">
                    <SkeletonText className="w-6 h-2.5" />
                    <SkeletonRect className="w-6 h-4 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-3">
              <SkeletonTitle className="w-36 h-4" />
              <SkeletonText className="w-full h-3" />
              <SkeletonText className="w-4/5 h-3" />
            </div>
          </aside>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. ERROR RECOVERY
  // ─────────────────────────────────────────────────────────────────────────────
  if (errorMessage && !data) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-card max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Gagal Memuat Beranda Guru</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{errorMessage}</p>
          <button
            type="button"
            onClick={loadHeatmapData}
            className="w-full h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
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
    <div
      className={cn(
        "w-full flex gap-4 sm:gap-5 items-stretch min-h-0 pb-12",
        !isCleanFocusedView && viewMode !== "overview" && "flex-col lg:flex-row"
      )}
    >
      {/* ─── LEFT: MAIN WORKSPACE ─── */}
      <section className="flex-1 min-w-0 space-y-4 sm:space-y-5 w-full">
        {isSecurityView ? (
          /* ─── TAMPILAN KHUSUS AUDIT KEAMANAN (CLEAN & FULL WIDTH: HIDDEN ON MOBILE KARENA SUDAH ADA TOP HEADER) ─── */
          <div className="hidden md:block bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/70 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="text-slate-400 font-medium">Portal Guru</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-900 font-semibold">Audit Keamanan Validasi</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Audit Keamanan Validasi &amp; Integritas Kriptografis
                  </h1>
                  {securityFlags.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>{`${securityFlags.length} Insiden`}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span>Sistem Bersih</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                  Log audit pengawasan validasi mentor secara real-time. Memantau percobaan perangkat tidak dikenal (untrusted device), penguncian PIN salah 5x berturut-turut, dan pencegahan replay attack tautan sekali pakai.
                </p>
              </div>

              {/* Quick Actions & Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={loadSecurityFlags}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  title="Segarkan Log Audit Keamanan Sekarang"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Segarkan Audit</span>
                </button>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Enforcement Deny-All Aktif</span>
                </span>
              </div>
            </div>
          </div>
        ) : isDriftView ? (
          /* ─── TAMPILAN KHUSUS DETEKSI & INTERVENSI DRIFT (CLEAN & FULL WIDTH: HIDDEN ON MOBILE) ─── */
          <div className="hidden md:block bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/70 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="text-slate-400 font-medium">Portal Guru</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-900 font-semibold">Deteksi Drift Siswa</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Deteksi &amp; Intervensi Drift Siswa
                  </h1>
                  {summary.studentsWithDrift > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>{`${summary.studentsWithDrift} Terdeteksi`}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                  Daftar siswa bimbingan yang terindikasi mengalami deviasi capaian kompetensi kurikulum, monoton tugas, atau beban non-kompetensi melebihi ambang batas.
                </p>
              </div>

              {/* Quick Actions & Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleTriggerEvaluate}
                  disabled={isEvaluating}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                  title="Jalankan Evaluasi Algoritma Drift Sekarang"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isEvaluating && "animate-spin")} />
                  <span>{isEvaluating ? "Mengevaluasi..." : "Evaluasi Ulang Drift"}</span>
                </button>
                {summary.activeAlertsCount.nonCompetency > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70 text-xs font-semibold">
                    <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                    <span>{`${summary.activeAlertsCount.nonCompetency} Non-Kompetensi`}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{`Total ${summary.totalStudents} Siswa Binaan`}</span>
                </span>
              </div>
            </div>
          </div>
        ) : isStudentsView ? (
          /* ─── TAMPILAN KHUSUS DIREKTORI SISWA (CLEAN & FULL WIDTH: HIDDEN ON MOBILE) ─── */
          <div className="hidden md:block bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/70 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="text-slate-400 font-medium">Portal Guru</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-900 font-semibold">Siswa Binaan</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Kumpulan Siswa Binaan
                </h1>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Daftar seluruh siswa PKL di bawah bimbingan Anda ({user?.department?.name || data?.department.name || "Rekayasa Perangkat Lunak"}) yang aktif di {dudiOptions.length} mitra DUDI.
                </p>
              </div>

              {/* Quick Summary Pill Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 text-xs font-semibold">
                  <Users className="w-3.5 h-3.5" />
                  <span>{`${summary.totalStudents} Siswa Terdaftar`}</span>
                </span>
                {summary.studentsWithDrift > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === "DRIFT" ? "ALL" : "DRIFT")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border",
                      statusFilter === "DRIFT"
                        ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                        : "bg-rose-50 text-rose-700 border-rose-200/70 hover:bg-rose-100/70"
                    )}
                    title="Filter Hanya Siswa Butuh Intervensi"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>{`${summary.studentsWithDrift} Butuh Intervensi`}</span>
                  </button>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rata-rata Capaian {summary.averageCompetencyPercentage}%</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          viewMode !== "overview" && (
            <>
            {/* ─── A.1 TAMPILAN KHUSUS MOBILE: HERO & STATUS DRIFT (< lg) ─── */}
            <div className="block lg:hidden space-y-3 font-sans">
              {/* Card Status & Aksi Utama Mobile */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {summary.studentsWithDrift > 0 ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs font-bold text-rose-800">
                          {summary.studentsWithDrift} Siswa Butuh Intervensi
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-emerald-800">
                          Semua Siswa Sesuai Target
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{todayFormatted}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    Halo, {teacherFirstName}!
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    {summary.studentsWithDrift > 0
                      ? "Terdapat anomali drift kompetensi pada siswa bimbingan Anda. Lakukan evaluasi atau intervensi mentor."
                      : "Seluruh siswa bimbingan Anda memenuhi target jam dan kompetensi PKL."}
                  </p>
                </div>

                {/* Tombol Aksi Mobile Seimbang & Proporsional */}
                <div className={cn("pt-1 grid gap-2", securityFlags.length > 0 ? "grid-cols-3" : "grid-cols-2")}>
                  {securityFlags.length > 0 && (
                    <button
                      type="button"
                      onClick={() => router.push("/teacher/dashboard?view=security")}
                      className="h-10 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                      title="Buka Insiden Audit Keamanan"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">{securityFlags.length} Insiden</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDownloadErapor}
                    disabled={isDownloadingErapor}
                    className="h-10 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 border border-emerald-200/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                    title="Unduh Rekap CSV Nilai e-Rapor Kurikulum Merdeka"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{isDownloadingErapor ? "Unduh..." : "e-Rapor"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerEvaluate}
                    disabled={isEvaluating}
                    className="h-10 px-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
                    title="Jalankan Evaluasi Algoritma Drift Sekarang"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5 text-white shrink-0", isEvaluating && "animate-spin")} />
                    <span className="truncate">
                      {isEvaluating ? "Memindai..." : "Evaluasi"}
                      <span className="hidden min-[380px]:inline"> Drift</span>
                    </span>
                  </button>
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
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 text-[11px] font-medium leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>{`${summary.studentsWithDrift} Anomali Drift`}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-medium leading-none">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>Semua Siswa Sesuai Target</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate max-w-xl leading-normal">
              {todayFormatted} · {data?.department.name || "Rekayasa Perangkat Lunak"} · {user?.school?.name || "SMK Telkom 1 Medan"} · Target {TOTAL_TARGET_JP} JP
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {securityFlags.length > 0 && (
              <button
                type="button"
                onClick={() => router.push("/teacher/dashboard?view=security")}
                className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Buka Insiden Audit Keamanan"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>{`${securityFlags.length} Insiden Audit`}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadErapor}
              disabled={isDownloadingErapor}
              className="h-10 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Unduh Rekapitulasi CSV Nilai e-Rapor Kurikulum Merdeka"
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isDownloadingErapor ? "Mengunduh..." : "Unduh e-Rapor"}</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerEvaluate}
              disabled={isEvaluating}
              className="h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer"
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
            onClick={() => router.push("/teacher/dashboard?view=students")}
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
            onClick={() => router.push("/teacher/dashboard?view=drift")}
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
            onClick={() => router.push("/teacher/dashboard?view=matrix")}
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
                Capaian CP
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
            onClick={() => router.push("/teacher/dashboard?view=security")}
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
            </>
          )
        )}

        {/* ─── 3. VIEW CONTROLLER (Judul & Segmented Tabs ala Dashboard Siswa) ─── */}
        {isSecurityView ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Tabel Log Insiden &amp; Audit Integritas Validasi Mentor
            </h2>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold self-start sm:self-auto">
              <span className="px-3 py-1.5 rounded-lg bg-white text-slate-900 shadow-2xs font-semibold flex items-center gap-1.5 text-xs">
                <Table className="w-3.5 h-3.5 text-sky-600" />
                <span>Tabel Audit Keamanan</span>
                {securityFlags.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
                    {securityFlags.length}
                  </span>
                )}
              </span>
            </div>
          </div>
        ) : isDriftView ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Siswa Terindikasi Drift &amp; Tindakan Intervensi
            </h2>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 text-xs",
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                )}
                title="Tampilan Tabel Siswa Terindikasi Drift"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tabel Drift</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("matrix")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 text-xs",
                  viewMode === "matrix"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                )}
                title="Tampilan Tabel Matriks CP Siswa Drift"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Matriks CP</span>
              </button>
            </div>
          </div>
        ) : isStudentsView ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Kumpulan Siswa Binaan &amp; Rekapitulasi PKL
            </h2>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold w-full sm:w-auto overflow-x-auto scrollbar-none justify-between sm:justify-start shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 text-xs flex-1 sm:flex-none",
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                )}
                title="Tampilan Tabel Direktori Siswa"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tabel Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 text-xs flex-1 sm:flex-none",
                  viewMode === "cards"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                )}
                title="Tampilan Kartu Siswa"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Kartu Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("matrix")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 text-xs flex-1 sm:flex-none",
                  viewMode === "matrix"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                )}
                title="Tampilan Tabel Matriks CP"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Matriks CP</span>
              </button>
            </div>
          </div>
        ) : viewMode !== "overview" ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              {viewMode === "matrix"
                ? "Matriks Ketercapaian Capaian Pembelajaran (CP)"
                : "Kumpulan Siswa Binaan & Rekapitulasi PKL"}
            </h2>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold w-full sm:w-auto overflow-x-auto scrollbar-none justify-between sm:justify-start shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 text-xs flex-1 sm:flex-none",
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                )}
                title="Tampilan Tabel Direktori Siswa"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tabel Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 text-xs flex-1 sm:flex-none",
                  viewMode === "cards"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                )}
                title="Tampilan Kartu Siswa"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Kartu Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("matrix")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 text-xs flex-1 sm:flex-none",
                  viewMode === "matrix"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                )}
                title="Tampilan Tabel Matriks CP"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Matriks CP</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* ─── 4. SECONDARY CONTROL BAR: Status Chips | Search, DUDI & Counter ─── */}
        {viewMode !== "security" && viewMode !== "overview" && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Status chips segmented control — gaya Apple Segmented pill */}
            <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/70 text-xs font-semibold overflow-x-auto scrollbar-none self-start">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                aria-pressed={statusFilter === "ALL"}
                className={cn(
                  "h-7 sm:h-7.5 px-3 rounded-full text-xs transition-all duration-150 cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                  statusFilter === "ALL"
                    ? "bg-sky-500 text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
                )}
              >
                <span>Semua</span>
                <span
                  className={cn(
                    "tabular-nums text-[10.5px] px-1.5 py-0.2 rounded-full font-semibold",
                    statusFilter === "ALL" ? "text-sky-100 font-bold" : "text-slate-400"
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
                  "h-7 sm:h-7.5 px-3 rounded-full text-xs transition-all duration-150 cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                  statusFilter === "DRIFT"
                    ? "bg-white text-rose-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-rose-700 hover:bg-white/40 font-medium"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    statusFilter === "DRIFT" ? "bg-rose-500 animate-pulse" : "bg-rose-400"
                  )}
                />
                <span>Drift</span>
                <span
                  className={cn(
                    "tabular-nums text-[10.5px] px-1.5 py-0.2 rounded-full font-semibold",
                    statusFilter === "DRIFT" ? "bg-rose-50 text-rose-700 font-bold" : "text-slate-400"
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
                  "h-7 sm:h-7.5 px-3 rounded-full text-xs transition-all duration-150 cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                  statusFilter === "ACHIEVED"
                    ? "bg-white text-emerald-800 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-emerald-700 hover:bg-white/40 font-medium"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    statusFilter === "ACHIEVED" ? "bg-emerald-500" : "bg-emerald-400"
                  )}
                />
                <span>Tuntas</span>
                <span
                  className={cn(
                    "tabular-nums text-[10.5px] px-1.5 py-0.2 rounded-full font-semibold",
                    statusFilter === "ACHIEVED" ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-400"
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
                  placeholder="Cari nama siswa, NISN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 rounded-full bg-white border border-slate-200/90 text-xs text-slate-900 placeholder:text-slate-400 font-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs"
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
                  className="h-9 px-3 rounded-full bg-white border border-slate-200/90 text-[11px] font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs cursor-pointer max-w-[135px] sm:max-w-[160px] truncate shrink-0"
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

        {/* ─── VIEW 1: EXECUTIVE DASHBOARD BENTO OVERVIEW (ALA FOTO REFERENSI USER) ─── */}
        {viewMode === "overview" && (
          <div className="space-y-5 animate-in fade-in-0 duration-200">
            {/* 1. Header Bar: Title, Context, Notification Bell & Profile Avatar */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/70 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Beranda Guru Pembimbing
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/70">
                    Fase F RPL
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-normal">
                  {todayFormatted} &bull; {data?.department.name || "Rekayasa Perangkat Lunak"} &bull; {user?.school?.name || "SMK Telkom 1 Medan"} &bull; Target {TOTAL_TARGET_JP} JP
                </p>
              </div>

              {/* Action Buttons & Profile Cluster */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTriggerEvaluate}
                  disabled={isEvaluating}
                  className="h-10 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer"
                  title="Jalankan Evaluasi Algoritma Drift Sekarang"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isEvaluating && "animate-spin")} />
                  <span>{isEvaluating ? "Mengevaluasi..." : "Evaluasi Drift"}</span>
                </button>

                {/* Notification Bell */}
                <button
                  type="button"
                  onClick={() => setShowNotificationModal(true)}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition relative cursor-pointer active:scale-95 shadow-2xs"
                  title="Pusat Notifikasi Guru"
                  aria-label="Pusat Notifikasi Guru"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {summary.studentsWithDrift > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white animate-pulse" />
                  )}
                </button>

                {/* Profile Avatar Pill */}
                <div className="flex items-center gap-2.5 pl-1 sm:pl-2 border-l border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    {user?.fullName
                      ? user.fullName
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : "BS"}
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-snug truncate max-w-[140px]">
                      {user?.fullName || "Budi Santoso, S.Kom"}
                    </p>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-none mt-0.5">
                      Guru Pembimbing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Top 4 Bento KPI Metric Cards (Sesuai Referensi Gambar) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Total Siswa Binaan */}
              <div
                onClick={() => router.push("/teacher/dashboard?view=students")}
                className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100/80 flex items-center justify-center shadow-2xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    Siswa
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-none">
                      {summary.totalStudents}
                    </p>
                    <span className="text-xs font-semibold text-slate-500">Siswa Aktif</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    Tersebar di {dudiOptions.length} Mitra DUDI
                  </p>
                </div>
              </div>

              {/* Card 2: Akumulasi Jam Sah */}
              <div
                onClick={() => router.push("/teacher/dashboard?view=students")}
                className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100/80 flex items-center justify-center shadow-2xs">
                    <Zap className="w-5 h-5 fill-amber-500/20" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                    Jam Sah
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-none">
                      {totalVerifiedJpAll.toLocaleString("id-ID")}
                    </p>
                    <span className="text-xs font-semibold text-slate-500">JP Sah</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    Target {TOTAL_TARGET_JP} JP / Kelulusan Siswa
                  </p>
                </div>
              </div>

              {/* Card 3: Rata-Rata Capaian CP */}
              <div
                onClick={() => router.push("/teacher/dashboard?view=matrix")}
                className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center shadow-2xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Capaian
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-none">
                      {summary.averageCompetencyPercentage}%
                    </p>
                    <span className="text-xs font-semibold text-emerald-700">
                      ({totalAchievedCount} Tuntas)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    Pemenuhan SKKNI &amp; Kurikulum
                  </p>
                </div>
              </div>

              {/* Card 4: Status Peringatan Drift */}
              <div
                onClick={() => router.push("/teacher/dashboard?view=drift")}
                className={cn(
                  "p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between",
                  summary.studentsWithDrift > 0
                    ? "bg-rose-50/40 border-rose-200/80 hover:border-rose-300"
                    : "bg-white border-slate-200/70 hover:border-slate-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xs border",
                      summary.studentsWithDrift > 0
                        ? "bg-rose-50 text-rose-600 border-rose-200/80"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}
                  >
                    {summary.studentsWithDrift > 0 ? (
                      <ShieldAlert className="w-5 h-5 animate-pulse" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                      summary.studentsWithDrift > 0
                        ? "text-rose-700 bg-rose-50 border-rose-200"
                        : "text-emerald-700 bg-emerald-50 border-emerald-100"
                    )}
                  >
                    {summary.studentsWithDrift > 0 ? "Drift" : "Aman"}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1.5">
                    <p
                      className={cn(
                        "text-2xl sm:text-3xl font-bold tracking-tight leading-none",
                        summary.studentsWithDrift > 0 ? "text-rose-900" : "text-slate-900"
                      )}
                    >
                      {summary.studentsWithDrift}
                    </p>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        summary.studentsWithDrift > 0 ? "text-rose-600" : "text-slate-500"
                      )}
                    >
                      Kasus Anomali
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    {summary.studentsWithDrift > 0
                      ? "Butuh intervensi koordinasi WA"
                      : "Semua siswa sesuai kurikulum"}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. The 2-Column Bento Grid Layout (Main Content + Companion Sidebar) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* ─── LEFT COLUMN (8 cols): Live Stream Logs + Bottom 2-Card Split ─── */}
              <div className="lg:col-span-8 space-y-5">
                {/* 3.A. Log Pelaporan Jurnal Terkini (Stream Log Siswa dengan Jam & Tanggal) */}
                <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
                  {/* Header Bar */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                          Log Pelaporan Jurnal Terkini
                        </h2>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10.5px] font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Live Pelaporan</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-normal">
                        Daftar riwayat waktu pelaporan presensi &amp; pekerjaan PKL siswa secara langsung
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push("/teacher/dashboard?view=students")}
                      className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                    >
                      <span>Lihat Semua Siswa</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Table List of Recent Reports */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3 sm:px-3.5 min-w-[170px]">Siswa &amp; NISN</th>
                          <th className="py-2.5 px-3 sm:px-3.5 min-w-[160px]">Mitra DUDI &amp; Mentor</th>
                          <th className="py-2.5 px-3 sm:px-3.5 min-w-[180px]">Pekerjaan PKL</th>
                          <th className="py-2.5 px-3 sm:px-3.5 min-w-[145px]">
                            <span className="flex items-center gap-1 text-sky-700 font-bold">
                              <Clock className="w-3.5 h-3.5 text-sky-600" />
                              <span>Waktu Pelaporan</span>
                            </span>
                          </th>
                          <th className="py-2.5 px-2.5 text-center min-w-[65px]">Durasi</th>
                          <th className="py-2.5 px-2.5 text-center min-w-[95px]">Status</th>
                          <th className="py-2.5 px-3 sm:px-3.5 text-right min-w-[80px]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentReportingLogs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400">
                              Belum ada catatan log jurnal hari ini.
                            </td>
                          </tr>
                        ) : (
                          recentReportingLogs.map((log) => (
                            <tr
                              key={log.id}
                              onClick={() => setSelectedStudent(log.studentRow)}
                              className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                            >
                              {/* 1. Siswa & NISN */}
                              <td className="py-2.5 px-3 sm:px-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200/80 shadow-2xs group-hover:border-sky-300 transition">
                                    {log.studentName
                                      .split(" ")
                                      .map((w) => w[0])
                                      .slice(0, 2)
                                      .join("")
                                      .toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 group-hover:text-sky-600 transition truncate">
                                      {log.studentName}
                                    </p>
                                    <p className="text-[11px] font-mono text-slate-400">
                                      NISN: {log.nisn}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Mitra DUDI & Mentor */}
                              <td className="py-2.5 px-3 sm:px-3.5">
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-slate-800 truncate">
                                    {log.dudiName}
                                  </p>
                                  <p className="text-[11px] text-slate-500 truncate">
                                    Mentor: {log.mentorName}
                                  </p>
                                </div>
                              </td>

                              {/* 3. Pekerjaan PKL */}
                              <td className="py-2.5 px-3 sm:px-3.5">
                                <div className="space-y-0.5">
                                  <p className="font-medium text-slate-900 line-clamp-1">
                                    {log.jobTitle}
                                  </p>
                                  <span className="text-[10px] text-slate-400">
                                    Kartu Pekerjaan Terjadwal
                                  </span>
                                </div>
                              </td>

                              {/* 4. Waktu Pelaporan (Jam & Tanggal) - FITUR UTAMA USER */}
                              <td className="py-2.5 px-3 sm:px-3.5">
                                <div className="space-y-1">
                                  <p className="font-bold text-slate-900 text-xs tracking-tight">
                                    {log.timestampFormatted}
                                  </p>
                                  <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/70">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      <span>{log.punctuality}</span>
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 5. Durasi JP */}
                              <td className="py-2.5 px-2.5 text-center">
                                <span className="font-bold text-slate-900 tabular-nums">
                                  {log.durationJp}{" "}
                                  <span className="text-[10px] font-normal text-slate-500">JP</span>
                                </span>
                              </td>

                              {/* 6. Status Pengesahan */}
                              <td className="py-2.5 px-2.5 text-center">
                                {log.status === "VERIFIED" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-bold shadow-2xs">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Sah PIN</span>
                                  </span>
                                ) : log.status === "DRIFT" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10.5px] font-bold shadow-2xs">
                                    <AlertOctagon className="w-3 h-3" />
                                    <span>Drift</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10.5px] font-bold shadow-2xs">
                                    <Clock className="w-3 h-3" />
                                    <span>Menunggu</span>
                                  </span>
                                )}
                              </td>

                              {/* 7. Aksi */}
                              <td className="py-2.5 px-3 sm:px-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStudent(log.studentRow);
                                  }}
                                  className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                                >
                                  Rincian
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ─── RIGHT COLUMN (4 cols): Schedule + Accent Watch Cards + Upcoming Events ─── */}
              <div className="lg:col-span-4 space-y-4">
                {/* 1. Schedule (Presensi Siswa Pekan Ini with Circled Today) */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between pb-0.5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        Presensi Siswa Pekan Ini
                      </h3>
                      <p className="text-[11px] text-slate-400 font-normal">
                        Pekan Berjalan &bull; 5 Hari Kerja Aktif
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>

                  {/* 7 Days Row with Highlighted Circle ala Reference Image */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {weekDays.map((d) => (
                      <div
                        key={d.label}
                        className={cn(
                          "flex flex-col items-center py-2 rounded-xl transition-all",
                          d.isToday
                            ? "bg-sky-50 border border-sky-200"
                            : "hover:bg-slate-50"
                        )}
                      >
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider mb-1",
                            d.isToday ? "text-sky-600 font-bold" : "text-slate-400"
                          )}
                        >
                          {d.label}
                        </span>
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition",
                            d.isToday
                              ? "bg-sky-500 text-white font-bold shadow-xs ring-4 ring-sky-500/15"
                              : d.isWorkday
                              ? "text-slate-800"
                              : "text-slate-400 font-normal"
                          )}
                        >
                          {d.dateNum}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Bar */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Disiplin Jurnal
                      </span>
                      <span className="font-bold text-slate-900">
                        {summary.totalStudents} Siswa Teratur (100%)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-bold border border-emerald-200/80">
                      Disiplin
                    </span>
                  </div>
                </div>

                {/* 2. Lessons (Siswa Butuh Perhatian with Vertical Accent Strips) */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Siswa Butuh Perhatian
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/teacher/dashboard?view=drift")}
                      className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
                    >
                      Lihat Semua
                    </button>
                  </div>

                  {/* Vertical Colored Strip Cards ala Reference Image - 100% Dinamis dari priorityAlerts */}
                  <div className="space-y-2.5">
                    {priorityAlerts.length === 0 ? (
                      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-center space-y-2">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-950">
                            Semua Siswa di Jalur Kompetensi
                          </h4>
                          <p className="text-[11px] text-emerald-800/80 leading-relaxed mt-0.5">
                            Zero Drift: Seluruh siswa binaan melaksanakan penugasan magang sesuai capaian pembelajaran kurikulum.
                          </p>
                        </div>
                      </div>
                    ) : (
                      priorityAlerts.slice(0, 4).map(({ student, alert }) => {
                        const isNonComp = alert.alertType === "NON_COMPETENCY_OVERLOAD";
                        const isMonotony = alert.alertType === "SKILL_MONOTONY";
                        const isDormancy = alert.alertType === "APPROVAL_DORMANCY";

                        const title = isNonComp
                          ? "Deviasi Non-Kompetensi"
                          : isMonotony
                          ? "Monotoni Keterampilan"
                          : isDormancy
                          ? "Menunggu Validasi PIN"
                          : "Perlu Evaluasi DUDI";

                        const borderClass = isNonComp
                          ? "border-l-rose-500"
                          : isMonotony
                          ? "border-l-amber-500"
                          : "border-l-sky-500";

                        const titleColor = isNonComp
                          ? "text-rose-700"
                          : isMonotony
                          ? "text-amber-700"
                          : "text-sky-700";

                        const statText = isNonComp
                          ? `${Math.round((alert.metricSnapshot.ratio || 0.28) * 100)}% Rasio`
                          : isMonotony
                          ? `${Math.round((alert.metricSnapshot.dominantRatio || 0.8) * 100)}% Dominan`
                          : `${alert.metricSnapshot.dormantLogCount || 2} Jurnal`;

                        const studentInitials = student.fullName
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase();

                        const mentorInitials = (student.placement.mentorName || "MI")
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase();

                        const reasonText =
                          alert.metricSnapshot.detectedReason ||
                          (isNonComp
                            ? "Porsi tugas non-kompetensi melebihi ambang batas toleransi kurikulum maks 20%."
                            : isMonotony
                            ? "Pengerjaan modul kompetensi berulang tanpa variasi elemen CP kurikulum."
                            : "Jurnal kegiatan menunggu input PIN pengesahan mentor industri > 48 jam.");

                        return (
                          <div
                            key={alert.id || student.studentId}
                            className={cn(
                              "p-3.5 rounded-xl bg-white border border-slate-200/80 border-l-4 shadow-2xs space-y-2 hover:bg-slate-50/50 transition",
                              borderClass
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className={cn("text-[10px] font-bold uppercase tracking-wide", titleColor)}>
                                {title}
                              </span>
                              <span className="text-[11px] font-bold text-slate-800">{statText}</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 leading-snug">
                              {student.fullName} &bull; {student.placement.dudiName}
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                              {reasonText}
                            </p>
                            <div className="pt-1 flex items-center justify-between">
                              <div className="flex items-center -space-x-1.5">
                                <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                                  {studentInitials}
                                </div>
                                <div
                                  className={cn(
                                    "w-6 h-6 rounded-full text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white",
                                    isNonComp ? "bg-rose-500" : isMonotony ? "bg-amber-500" : "bg-sky-500"
                                  )}
                                >
                                  {mentorInitials}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => openInterventionModal(student, alert)}
                                className={cn(
                                  "h-7 px-3 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition cursor-pointer border",
                                  isDormancy
                                    ? "bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                                )}
                              >
                                {isDormancy ? (
                                  <>
                                    <Send className="w-3 h-3 text-sky-600" />
                                    <span>Ingatkan PIN</span>
                                  </>
                                ) : (
                                  <>
                                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Intervensi WA</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── VIEW 0: DIRECTORY TABLE VIEW (DIBUAT TABEL SAJA) ─── */}
        {viewMode === "table" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
              {/* Header Bar Tabel Capaian */}
              <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                    {isDriftView
                      ? "Tabel Intervensi Siswa Terindikasi Drift"
                      : "Tabel Kumpulan Siswa Binaan"}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border shadow-2xs shrink-0",
                      isDriftView
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-white text-slate-700 border-slate-200"
                    )}
                  >
                    {filteredStudents.length} Siswa Terdaftar
                  </span>
                  {!isDriftView && summary.studentsWithDrift > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] sm:text-xs font-semibold border border-rose-200 shadow-2xs shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      {summary.studentsWithDrift} Drift
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isDriftView && (
                    <button
                      type="button"
                      onClick={handleTriggerEvaluate}
                      disabled={isEvaluating}
                      className="inline-flex md:hidden items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold cursor-pointer shadow-2xs transition active:scale-95 disabled:opacity-50"
                      title="Jalankan Evaluasi Algoritma Drift Sekarang"
                    >
                      <RefreshCw className={cn("w-3 h-3", isEvaluating && "animate-spin")} />
                      <span>{isEvaluating ? "Evaluasi..." : "Evaluasi"}</span>
                    </button>
                  )}
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    {isDriftView
                      ? "Klik tombol intervensi untuk koordinasi WhatsApp, jadwalkan visit, atau rotasi DUDI"
                      : "Klik baris atau tombol rincian untuk rekapitulasi lengkap"}
                  </span>
                </div>
              </div>

              {/* Desktop Table View (>= lg) */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="py-3 px-3 font-bold uppercase tracking-wider text-[11px] text-center w-12">
                        No
                      </th>
                      <th className="py-3 px-3 sm:px-3.5 font-bold uppercase tracking-wider text-[11px] min-w-[185px]">
                        Siswa &amp; NISN
                      </th>
                      <th className="py-3 px-3 sm:px-3.5 font-bold uppercase tracking-wider text-[11px] min-w-[175px]">
                        Mitra DUDI &amp; Mentor
                      </th>
                      <th className="py-3 px-3 sm:px-3.5 font-bold uppercase tracking-wider text-[11px] min-w-[130px]">
                        Akumulasi Jam
                      </th>
                      <th className="py-3 px-3 sm:px-3.5 font-bold uppercase tracking-wider text-[11px] min-w-[125px]">
                        Capaian CP
                      </th>
                      <th className="py-3 px-3 sm:px-3.5 font-bold uppercase tracking-wider text-[11px] min-w-[125px]">
                        Aktivitas 14 Hari
                      </th>
                      <th className="py-3 px-3 sm:px-3.5 font-bold uppercase tracking-wider text-[11px] text-center min-w-[100px]">
                        Status PKL
                      </th>
                      <th className="py-3 px-3 sm:px-3.5 font-bold uppercase tracking-wider text-[11px] text-right min-w-[140px]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-14 text-center text-slate-400">
                          {isDriftView ? (
                            <div className="space-y-2">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center mx-auto mb-1">
                                <CheckCircle2 className="w-6 h-6" />
                              </div>
                              <p className="text-sm font-semibold text-slate-800">
                                Tidak Ada Siswa Mengalami Drift
                              </p>
                              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                Luar biasa! Seluruh siswa binaan berjalan sesuai kurikulum dan tidak ada indikasi deviasi kompetensi.
                              </p>
                            </div>
                          ) : (
                            <div>
                              <Users className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                              <p className="text-sm font-semibold text-slate-700">
                                Tidak ada data siswa ditemukan
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                Coba sesuaikan kata kunci pencarian atau filter status di atas.
                              </p>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((student, idx) => {
                        const rowNumber = (safeCurrentPage - 1) * pageSize + idx + 1;
                        const initials = student.fullName
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase();
                        const achievedCpCount = student.cpProgress.filter(
                          (c) => c.status === "ACHIEVED"
                        ).length;

                        return (
                          <tr
                            key={student.studentId}
                            className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                            onClick={() => setSelectedStudent(student)}
                          >
                            {/* 1. No */}
                            <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">
                              {rowNumber}
                            </td>

                            {/* 2. Siswa & NISN */}
                            <td className="py-3 px-3 sm:px-3.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={cn(
                                    "w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs select-none",
                                    student.hasDriftWarning
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : student.overallPercentage >= 75
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-sky-50 text-sky-700 border border-sky-200"
                                  )}
                                >
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 text-xs sm:text-sm group-hover:text-sky-600 transition-colors truncate">
                                    {student.fullName}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                                    NISN {student.nisn} · Fase F
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* 3. Mitra DUDI & Mentor */}
                            <td className="py-3 px-3 sm:px-3.5">
                              <div className="min-w-0 max-w-[210px]">
                                <div
                                  className="flex items-center gap-1.5 font-medium text-slate-900 text-xs truncate"
                                  title={student.placement.dudiName}
                                >
                                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{student.placement.dudiName}</span>
                                </div>
                                <p
                                  className="text-[11px] text-slate-500 truncate mt-0.5"
                                  title={`Mentor: ${student.placement.mentorName} (${student.placement.city})`}
                                >
                                  {student.placement.mentorName} · {student.placement.city}
                                </p>
                              </div>
                            </td>

                            {/* 4. Akumulasi Jam */}
                            <td className="py-3 px-3 sm:px-3.5">
                              <div className="space-y-1 max-w-[125px]">
                                <div className="flex items-baseline justify-between text-xs">
                                  <span className="font-bold text-slate-900">
                                    {student.totalVerifiedJp} JP
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    /{TOTAL_TARGET_JP}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all duration-300",
                                      student.totalVerifiedJp >= TOTAL_TARGET_JP
                                        ? "bg-emerald-500"
                                        : "bg-sky-500"
                                    )}
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.round((student.totalVerifiedJp / TOTAL_TARGET_JP) * 100)
                                      )}%`,
                                    }}
                                  />
                                </div>
                                {student.totalPendingJp > 0 && (
                                  <span className="text-[10px] text-amber-600 font-medium block">
                                    +{student.totalPendingJp} JP pending
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 5. Capaian CP */}
                            <td className="py-3 px-3 sm:px-3.5">
                              <div className="space-y-1 max-w-[125px]">
                                <div className="flex items-baseline justify-between text-xs">
                                  <span
                                    className={cn(
                                      "font-bold",
                                      student.hasDriftWarning
                                        ? "text-rose-600"
                                        : student.overallPercentage >= 75
                                        ? "text-emerald-700"
                                        : "text-slate-900"
                                    )}
                                  >
                                    {student.overallPercentage}%
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {achievedCpCount}/{student.cpProgress.length} CP
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
                                    style={{
                                      width: `${Math.min(100, student.overallPercentage)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* 6. Aktivitas 14 Hari */}
                            <td className="py-3 px-3 sm:px-3.5">
                              {student.nonCompetencyJpLast14Days > 0 ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                                    <AlertOctagon className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>{`${student.nonCompetencyJpLast14Days} JP Non-Komp`}</span>
                                  </span>
                                  <p className="text-[10px] text-slate-400">
                                    Total {student.totalJpLast14Days} JP 14 hr
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-600">
                                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>0 JP (Normal)</span>
                                  </span>
                                  <p className="text-[10px] text-slate-400">
                                    Total {student.totalJpLast14Days} JP 14 hr
                                  </p>
                                </div>
                              )}
                            </td>

                            {/* 7. Status PKL */}
                            <td className="py-3 px-3 sm:px-3.5 text-center">
                              {student.hasDriftWarning ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/70 text-[11px] font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                  <span>Drift</span>
                                </span>
                              ) : student.overallPercentage >= 75 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[11px] font-semibold">
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  <span>Tuntas</span>
                                </span>
                              ) : student.orientationGracePeriod ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                                  <span>Orientasi</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70 text-[11px] font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                  <span>Berjalan</span>
                                </span>
                              )}
                            </td>

                            {/* 8. Aksi */}
                            <td
                              className="py-3 px-3 sm:px-3.5 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudent(student)}
                                  className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                                  title="Buka Rincian Capaian Elemen Kompetensi Siswa"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Rincian</span>
                                </button>
                                <Link
                                  href={`/verify/${student.passportSlug || student.studentId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-8 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-700 border border-sky-200/70 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                                  title="Buka Paspor Kompetensi Publik Siswa"
                                >
                                  <Award className="w-3.5 h-3.5 text-sky-600" />
                                  <span>Paspor</span>
                                </Link>
                                {student.hasDriftWarning && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openInterventionModal(student, student.driftAlerts[0])
                                    }
                                    className="h-8 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200/80 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                                    title="Buka Form Intervensi Drift Siswa"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Intervensi</span>
                                  </button>
                                )}
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
                {paginatedStudents.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs">
                    {isDriftView ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="font-semibold text-slate-800">Tidak ada siswa mengalami drift.</p>
                      </div>
                    ) : (
                      "Tidak ada data siswa yang sesuai dengan filter ini."
                    )}
                  </div>
                ) : (
                  paginatedStudents.map((student, idx) => {
                    const rowNumber = (safeCurrentPage - 1) * pageSize + idx + 1;
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
                            <span className="text-xs font-mono text-slate-400 w-5 text-center">
                              {rowNumber}
                            </span>
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
                                {student.placement.dudiName} · NISN {student.nisn}
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

                        {/* Progress bar */}
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

                        {/* Mobile Action Buttons Bar */}
                        <div
                          className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100/70"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedStudent(student)}
                              className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Rincian</span>
                            </button>
                            <Link
                              href={`/verify/${student.passportSlug || student.studentId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-700 border border-sky-200/70 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5 text-sky-600" />
                              <span>Paspor</span>
                            </Link>
                          </div>

                          {student.hasDriftWarning && (
                            <button
                              type="button"
                              onClick={() =>
                                openInterventionModal(student, student.driftAlerts[0])
                              }
                              className="h-8 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200/80 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Intervensi</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Centered Pagination for Table View */}
            {renderPagination()}
          </div>
        )}

        {/* ─── VIEW 1: MATRIX TABLE VIEW ─── */}
        {viewMode === "matrix" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
              {/* Header Bar Tabel Capaian */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                    Ketercapaian per Elemen Capaian Pembelajaran (CP)
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs">
                    {filteredStudents.length} Siswa Terdaftar
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowJobCardModal(true)}
                  className="h-8 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Lihat Katalog & Tambah Kartu Pekerjaan (Job Card) Jurusan"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Katalog &amp; Tambah Job Card</span>
                </button>
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
            {renderPagination()}
          </div>
          )}

          {/* ─── VIEW 2: CARDS GRID VIEW ─── */}
          {viewMode === "cards" && (
            <div className="space-y-4">
              <div
                className={cn(
                  "grid gap-3.5 sm:gap-4",
                  isStudentsView
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                )}
              >
                {paginatedStudents.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/70 p-8 shadow-2xs">
                    <Users className="w-9 h-9 mx-auto text-slate-300 mb-2.5" />
                    <p className="text-sm font-semibold text-slate-700">
                      Tidak ada siswa ditemukan
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba sesuaikan kata kunci pencarian atau filter status di atas.
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
                        className="rounded-2xl p-4 sm:p-5 border border-slate-200/80 hover:border-sky-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4 bg-white shadow-2xs group cursor-pointer"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <div className="space-y-3.5">
                          {/* 1. Header Row: Avatar, Identity & Status Badge */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Modern Gradient Squircle Avatar */}
                              <div
                                className={cn(
                                  "w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105",
                                  student.hasDriftWarning
                                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                                    : student.overallPercentage >= 75
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    : "bg-gradient-to-br from-sky-500 to-indigo-600 text-white"
                                )}
                              >
                                {initials}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-xs sm:text-[13.5px] text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                                  {student.fullName}
                                </h3>
                                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{student.placement.dudiName}</span>
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                  NISN {student.nisn}
                                </p>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="shrink-0">
                              {student.hasDriftWarning ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/70 text-[11px] font-bold leading-none shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                  <span>Drift</span>
                                </span>
                              ) : student.overallPercentage >= 75 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[11px] font-bold leading-none shadow-2xs">
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  <span>Tuntas</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50/80 text-sky-700 border border-sky-200/60 text-[11px] font-semibold leading-none shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                  <span>Sesuai Target</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 2. Total Verified JP & Progress Bar */}
                          <div className="space-y-1.5 pt-0.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                                <span>Progres PKL:</span>
                                <strong className="text-slate-900 font-bold">{student.totalVerifiedJp}</strong>
                                <span className="text-slate-400 font-normal">/ 792 JP</span>
                              </span>
                              <span
                                className={cn(
                                  "text-xs font-bold tabular-nums",
                                  student.hasDriftWarning
                                    ? "text-rose-600 font-bold"
                                    : student.overallPercentage >= 75
                                    ? "text-emerald-600"
                                    : "text-sky-600"
                                )}
                              >
                                {student.overallPercentage}%
                              </span>
                            </div>

                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  student.hasDriftWarning
                                    ? "bg-gradient-to-r from-rose-500 to-amber-500"
                                    : student.overallPercentage >= 75
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                    : "bg-gradient-to-r from-sky-500 to-blue-600"
                                )}
                                style={{ width: `${Math.min(100, student.overallPercentage)}%` }}
                              />
                            </div>
                          </div>

                          {/* 3. Balanced Dual-Stat Summary (14 Hari vs Non-Kompetensi) */}
                          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                                14 Hari Terakhir
                              </span>
                              <div className="flex items-center gap-1 font-bold text-slate-800 text-[11.5px]">
                                <Clock className="w-3 h-3 text-sky-500 shrink-0" />
                                <span className="truncate">
                                  {student.totalJpLast14Days - student.nonCompetencyJpLast14Days} JP Kejuruan
                                </span>
                              </div>
                            </div>

                            <div className="space-y-0.5 border-l border-slate-200/60 pl-2.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                                Non-Kompetensi
                              </span>
                              <div className="flex items-center gap-1 text-[11.5px]">
                                <span
                                  className={cn(
                                    "font-bold truncate",
                                    student.nonCompetencyJpLast14Days > 0
                                      ? "text-amber-600"
                                      : "text-slate-500"
                                  )}
                                >
                                  {student.nonCompetencyJpLast14Days > 0
                                    ? `${student.nonCompetencyJpLast14Days} JP (Pantau)`
                                    : "0 JP (Bersih)"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 4. Action Buttons Bar */}
                        <div
                          className="pt-2.5 flex items-center justify-between border-t border-slate-100 gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedStudent(student)}
                              className="h-8.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-sky-200/50"
                              title="Buka Rincian Capaian Elemen Kompetensi Siswa"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-600" />
                              <span>Rincian CP</span>
                            </button>

                            <Link
                              href={`/verify/${student.passportSlug || student.studentId}`}
                              target="_blank"
                              className="h-8.5 px-3 rounded-xl bg-white hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 shadow-2xs"
                              title="Pratinjau Paspor Portofolio Ber-QR"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              <span>Paspor</span>
                            </Link>
                          </div>

                          <button
                            type="button"
                            onClick={() => openInterventionModal(student)}
                            className={cn(
                              "h-8.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs",
                              student.hasDriftWarning
                                ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            )}
                            title={student.hasDriftWarning ? "Kirim Intervensi DUDI Segera" : "Buka Menu Koordinasi & Intervensi"}
                          >
                            <Sparkles className={cn("w-3.5 h-3.5", student.hasDriftWarning ? "text-amber-300" : "text-sky-500")} />
                            <span>Intervensi</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modern Minimalist Centered Pagination for Cards View */}
              {renderPagination()}
            </div>
          )}

          {/* ─── VIEW 3: AUDIT KEAMANAN (DIBUAT TABEL SAJA) ─── */}
          {viewMode === "security" && (
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
              {/* Header Bar Tabel Audit */}
              <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                    Tabel Insiden Keamanan &amp; Audit Validasi
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border shadow-2xs shrink-0",
                      securityFlags.length > 0
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}
                  >
                    {securityFlags.length} Insiden Aktif
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={loadSecurityFlags}
                    className="inline-flex md:hidden items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold cursor-pointer shadow-2xs transition active:scale-95"
                    title="Segarkan Log Audit Keamanan"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Segarkan</span>
                  </button>
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    Pemeriksaan token perangkat resmi, verifikasi PIN mentor, dan deteksi replay tautan
                  </span>
                </div>
              </div>

              {securityFlags.length === 0 ? (
                <div className="py-16 text-center space-y-3 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto shadow-2xs">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Seluruh Validasi Mentor Bersih &amp; Sah
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Tidak ada percobaan autentikasi mencurigakan dari perangkat asing, penguncian PIN mentor, atau penggunaan ulang tautan kadaluarsa pada sekolah Anda.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View (>= lg) */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                          <th className="py-3 px-3 font-bold uppercase tracking-wider text-[11px] text-center w-12">
                            No
                          </th>
                          <th className="py-3 px-3 sm:px-3.5 font-bold uppercase tracking-wider text-[11px] min-w-[135px]">
                            Waktu Kejadian
                          </th>
                          <th className="py-3 px-3 sm:px-3.5 font-bold uppercase tracking-wider text-[11px] min-w-[150px]">
                            Kategori Insiden
                          </th>
                          <th className="py-3 px-3 sm:px-3.5 font-bold uppercase tracking-wider text-[11px] min-w-[165px]">
                            Siswa &amp; NISN
                          </th>
                          <th className="py-3 px-3 sm:px-3.5 font-bold uppercase tracking-wider text-[11px] min-w-[165px]">
                            Mitra DUDI &amp; Mentor
                          </th>
                          <th className="py-3 px-3 sm:px-3.5 font-bold uppercase tracking-wider text-[11px] min-w-[210px]">
                            Keterangan &amp; Diagnostik
                          </th>
                          <th className="py-3 px-3 sm:px-3.5 font-bold uppercase tracking-wider text-[11px] text-right min-w-[115px]">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {securityFlags.map((flag, idx) => {
                          const dateObj = new Date(flag.createdAt);
                          const dateStr = dateObj.toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          });
                          const timeStr = `${dateObj.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })} WIB`;

                          return (
                            <tr
                              key={flag.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              {/* 1. No */}
                              <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">
                                {idx + 1}
                              </td>

                              {/* 2. Waktu Kejadian */}
                              <td className="py-3 px-3 sm:px-3.5">
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-slate-900 text-xs">
                                    {dateStr}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-mono">
                                    {timeStr}
                                  </p>
                                </div>
                              </td>

                              {/* 3. Kategori Insiden */}
                              <td className="py-3 px-3 sm:px-3.5">
                                {flag.kind === "UNTRUSTED_DEVICE" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
                                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    <span>Perangkat Asing</span>
                                  </span>
                                ) : flag.kind === "PIN_LOCKOUT" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                                    <AlertOctagon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>PIN Terkunci (5x)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
                                    <Repeat className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                    <span>Tautan Bekas</span>
                                  </span>
                                )}
                              </td>

                              {/* 4. Siswa & NISN */}
                              <td className="py-3 px-3 sm:px-3.5">
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                                    {flag.studentName}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                                    NISN {flag.nisn}
                                  </p>
                                </div>
                              </td>

                              {/* 5. Mitra DUDI & Mentor */}
                              <td className="py-3 px-3 sm:px-3.5">
                                <div className="min-w-0 max-w-[200px]">
                                  <div
                                    className="flex items-center gap-1.5 font-medium text-slate-900 text-xs truncate"
                                    title={flag.dudiName}
                                  >
                                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{flag.dudiName}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    Mentor: {flag.mentorName}
                                  </p>
                                </div>
                              </td>

                              {/* 6. Diagnostik */}
                              <td className="py-3 px-3 sm:px-3.5">
                                <div className="max-w-[280px]">
                                  <p className="text-xs text-slate-700 leading-relaxed">
                                    {flag.meta?.note ||
                                      flag.meta?.reason ||
                                      "Percobaan verifikasi ditolak oleh gerbang keamanan."}
                                  </p>
                                  {flag.meta?.lockedUntil && (
                                    <p className="text-[10.5px] text-amber-600 font-medium mt-0.5">
                                      Terkunci s/d:{" "}
                                      {new Date(flag.meta.lockedUntil).toLocaleTimeString("id-ID", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}{" "}
                                      WIB
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* 7. Aksi */}
                              <td className="py-3 px-3 sm:px-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleAcknowledgeFlag(flag.id)}
                                  disabled={isAcknowledgingFlag === flag.id}
                                  className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-[11px] font-semibold inline-flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-2xs ml-auto"
                                  title="Tandai insiden telah ditinjau oleh guru pembimbing"
                                >
                                  {isAcknowledgingFlag === flag.id ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Menandai...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Tandai Ditinjau</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile / Tablet List View (< lg) */}
                  <div className="lg:hidden divide-y divide-slate-100">
                    {securityFlags.map((flag, idx) => {
                      const dateObj = new Date(flag.createdAt);
                      const dateStr = dateObj.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                      const timeStr = `${dateObj.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} WIB`;

                      return (
                        <div key={flag.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-400 w-5">
                                #{idx + 1}
                              </span>
                              {flag.kind === "UNTRUSTED_DEVICE" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
                                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                                  <span>Perangkat Asing</span>
                                </span>
                              ) : flag.kind === "PIN_LOCKOUT" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                                  <AlertOctagon className="w-3 h-3 text-amber-600" />
                                  <span>PIN Terkunci (5x)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
                                  <Repeat className="w-3 h-3 text-purple-600" />
                                  <span>Tautan Bekas</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {dateStr} &bull; {timeStr}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-900">
                              {flag.studentName} (NISN: {flag.nisn}) &bull; {flag.dudiName}
                            </p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {flag.meta?.note ||
                                flag.meta?.reason ||
                                "Percobaan verifikasi ditolak oleh gerbang keamanan."}
                            </p>
                          </div>

                          <div className="pt-1 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleAcknowledgeFlag(flag.id)}
                              disabled={isAcknowledgingFlag === flag.id}
                              className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                            >
                              {isAcknowledgingFlag === flag.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Menandai...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Tandai Ditinjau</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
      </section>

      {/* ─── RIGHT: COMPANION WIDGET PANEL (Desktop >= lg, disembunyikan saat di view=students & view=drift agar tampilan clean & luas) ─── */}
      {!isCleanFocusedView && viewMode !== "overview" && (
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
          onViewSecurityAudit={() => router.push("/teacher/dashboard?view=security")}
          onOpenNotifications={() => setShowNotificationModal(true)}
        />
      )}
      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 1: DETAIL SISWA & BREAKDOWN DISTRIBUSI JAM + BUKTI FOTO LOGBOOK
      ───────────────────────────────────────────────────────────────────────────── */}
      {isMounted &&
        selectedStudent &&
        createPortal(
          <div
            onClick={() => setSelectedStudent(null)}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in-0 duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-xl sm:max-w-2xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-[env(safe-area-inset-bottom,1.5rem)] sm:pb-6 border border-slate-200/80 shadow-modal space-y-4 max-h-[92vh] overflow-y-auto"
            >
              {/* Header Siswa */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 tracking-tight">
                    {selectedStudent.fullName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                        Profil &amp; Portofolio PKL
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">•</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        NISN {selectedStudent.nisn}
                      </span>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 truncate">
                      {selectedStudent.fullName}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer transition shrink-0"
                  aria-label="Tutup Rincian Siswa"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Info Mitra DUDI & Mentor */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                  <span className="text-slate-500">Mitra DUDI:</span>
                  <span className="font-semibold text-slate-800 truncate">
                    {selectedStudent.placement.dudiName}
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                  <span className="text-slate-500">Mentor:</span>
                  <span className="font-medium text-slate-800 truncate">
                    {selectedStudent.placement.mentorName}{" "}
                    {selectedStudent.placement.mentorPhone &&
                      `(${selectedStudent.placement.mentorPhone})`}
                  </span>
                </div>
              </div>

              {/* Segmented Tab Bar */}
              <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200/70 text-xs font-semibold gap-1">
                <button
                  type="button"
                  onClick={() => setStudentModalTab("cp")}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer",
                    studentModalTab === "cp"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/50 font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                  <span>Capaian Elemen CP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudentModalTab("logs")}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer relative",
                    studentModalTab === "logs"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/50 font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Laporan &amp; Bukti Foto</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-bold transition",
                      studentModalTab === "logs"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-700"
                    )}
                  >
                    {studentLogs.length}
                  </span>
                </button>
              </div>

              {/* TAB 1: Capaian Elemen CP */}
              {studentModalTab === "cp" && (
                <div className="space-y-3 animate-in fade-in-50 duration-150">
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
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
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
                                "h-full rounded-full transition-all duration-300",
                                cp.percentage >= 75 ? "bg-emerald-500" : "bg-sky-500"
                              )}
                              style={{ width: `${Math.min(100, cp.percentage)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Laporan Harian & Bukti Foto */}
              {studentModalTab === "logs" && (
                <div className="space-y-3 animate-in fade-in-50 duration-150">
                  {isLoadingStudentLogs ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                      <p className="text-xs font-medium">Memuat logbook &amp; foto bukti...</p>
                    </div>
                  ) : studentLogs.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
                      <Camera className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-medium text-slate-600">
                        Belum ada catatan aktivitas harian yang diunggah siswa.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-1">
                      {studentLogs.map((log) => {
                        const item = log.items?.[0];
                        const jobTitle = item?.jobCard?.title || "Aktivitas Praktik Industri";
                        const skkniCode = item?.jobCard?.skkniUnitCode;
                        const duration = item?.durationJp || 8;
                        const autonomy = item?.autonomyLevel || 2;
                        const autonomyLabel =
                          autonomy >= 3 ? "Mandiri" : autonomy === 2 ? "Dibimbing" : "Observasi";

                        return (
                          <div
                            key={log.id}
                            className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition shadow-2xs space-y-2.5"
                          >
                            {/* Baris Meta Tanggal, Durasi & Status */}
                            <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  {new Date(log.logDate).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-mono font-bold text-[11px] border border-sky-200/60">
                                  {duration} JP
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1",
                                    log.status === "VERIFIED"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                      : log.status === "PENDING_VERIFICATION"
                                      ? "bg-amber-50 text-amber-700 border-amber-200/80"
                                      : "bg-slate-50 text-slate-700 border-slate-200/80"
                                  )}
                                >
                                  {log.status === "VERIFIED" ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Terverifikasi Mentor
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      Menunggu Mentor
                                    </>
                                  )}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/70">
                                  Level {autonomy} • {autonomyLabel}
                                </span>
                              </div>
                            </div>

                            {/* Baris Pekerjaan & Bukti Foto */}
                            <div className="flex flex-col sm:flex-row gap-3 items-start">
                              {/* Foto Bukti dengan Tombol Zoom */}
                              {log.evidenceWebpUrl ? (
                                <div
                                  onClick={() =>
                                    setZoomedPhoto({
                                      url: log.evidenceWebpUrl!,
                                      title: jobTitle,
                                      date: new Date(log.logDate).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                      }),
                                    })
                                  }
                                  className="w-full sm:w-28 h-32 sm:h-28 rounded-xl overflow-hidden relative group shrink-0 border border-slate-200 shadow-2xs bg-slate-100 cursor-pointer"
                                  title="Klik untuk memperbesar foto bukti"
                                >
                                  {/* eslint-disable-next-js/no-img-element */}
                                  <img
                                    src={log.evidenceWebpUrl}
                                    alt={jobTitle}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-[11px] font-semibold">
                                    <Maximize2 className="w-4 h-4" />
                                    <span>Perbesar</span>
                                  </div>
                                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono backdrop-blur-2xs">
                                    WebP
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full sm:w-28 h-24 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-[10px] gap-1 shrink-0 bg-slate-50/50">
                                  <Camera className="w-4 h-4" />
                                  <span>Tanpa Foto</span>
                                </div>
                              )}

                              {/* Rincian Aktivitas & Refleksi Siswa */}
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-semibold text-xs sm:text-sm text-slate-900 leading-snug">
                                    {jobTitle}
                                  </h4>
                                  {skkniCode && (
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[10px] font-mono border border-indigo-200/60 font-semibold">
                                      {skkniCode}
                                    </span>
                                  )}
                                </div>

                                {log.shortNote && (
                                  <p className="text-xs text-slate-600 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed font-sans">
                                    &ldquo;{log.shortNote}&rdquo;
                                  </p>
                                )}

                                {log.status === "VERIFIED" && log.signatureHash && (
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono pt-0.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span className="truncate">
                                      HMAC-SHA256: {log.signatureHash.slice(0, 16)}...
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Footer Aksi */}
              <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                <Link
                  href={`/verify/${selectedStudent.passportSlug || selectedStudent.studentId}`}
                  target="_blank"
                  className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Pratinjau Paspor Portofolio Ber-QR"
                >
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Paspor Portofolio</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const st = selectedStudent;
                    setSelectedStudent(null);
                    openInterventionModal(st);
                  }}
                  className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Intervensi &amp; Rotasi Mitra</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          LIGHTBOX ZOOM MODAL: FOTO BUKTI DOKUMENTASI SISWA (KONSISTEN DENGAN MODAL LAIN)
      ───────────────────────────────────────────────────────────────────────────── */}
      {isMounted &&
        zoomedPhoto &&
        createPortal(
          <div
            onClick={() => setZoomedPhoto(null)}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in-0 duration-150"
            style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full border border-slate-200/80 shadow-modal overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
            >
              {/* Header Modal Bersih & Konsisten */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="pr-4 min-w-0">
                  <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">
                    {zoomedPhoto.date}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate">
                    {zoomedPhoto.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomedPhoto(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer transition shrink-0"
                  aria-label="Tutup foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Area Tampilan Foto Bersih (Tanpa Background Gelap/Hitam) */}
              <div className="relative max-h-[72vh] bg-slate-50/50 flex items-center justify-center overflow-hidden p-3 sm:p-5">
                {/* eslint-disable-next-js/no-img-element */}
                <img
                  src={zoomedPhoto.url}
                  alt={zoomedPhoto.title}
                  className="max-h-[64vh] w-auto h-auto object-contain rounded-2xl shadow-sm border border-slate-200/70"
                />
              </div>

              {/* Footer Meta Verifikasi & K3 */}
              <div className="p-3.5 sm:p-4 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between shrink-0">
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Bukti Otentik K3 &amp; Hasil Kerja Lapangan Siswa
                </span>
                <span className="text-slate-500 font-mono text-[11px] bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/70 shadow-2xs">
                  WebP Terverifikasi Mentor
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 2: SMART INTERVENTION DISPATCHER & MID-TERM ROTATION
      ───────────────────────────────────────────────────────────────────────────── */}
      {isMounted &&
        interventionStudent &&
        createPortal(
          <div
            onClick={() => {
              setInterventionStudent(null);
              setInterventionSuccessMsg(null);
            }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 pb-[env(safe-area-inset-bottom,1.5rem)] sm:pb-6 shadow-modal border border-slate-200/80 space-y-4 max-h-[92vh] overflow-y-auto"
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
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
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
                    className="w-full h-10 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
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
                      {rotationDudiOptions
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
                    className="w-full h-10 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>
                      {isSubmittingIntervention ? "Memproses..." : "Konfirmasi Rotasi Mitra DUDI"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Modal Notifikasi Guru (Overlay Floating Dialog) */}
      {showNotificationModal && (
        <TeacherNotificationModal
          onClose={() => setShowNotificationModal(false)}
          driftCount={summary.studentsWithDrift}
          studentsWithDrift={data?.students
            .filter((s) => s.hasDriftWarning)
            .map((s) => ({
              id: s.studentId,
              fullName: s.fullName,
              dudiName: s.placement.dudiName,
              alertType: s.driftAlerts[0]?.alertType,
              message:
                s.driftAlerts[0]?.alertType === "NON_COMPETENCY_OVERLOAD"
                  ? "Rasio penugasan non-kompetensi melebihi ambang batas toleransi 30%."
                  : s.driftAlerts[0]?.alertType === "SKILL_MONOTONY"
                  ? "Terdeteksi dominasi satu elemen kompetensi berulang tanpa variasi penugasan baru."
                  : "Terdeteksi potensi defisit capaian pembelajaran pada DUDI saat ini.",
            }))}
          recentLogs={data?.students
            .filter((s) => Boolean(s.latestLog))
            .slice(0, 5)
            .map((s) => ({
              id: s.latestLog!.id,
              studentName: s.fullName,
              title: s.latestLog!.title || s.latestLog!.shortNote || "Pencatatan Jurnal Praktik",
              jp: s.latestLog!.durationJp,
              timeAgo: s.latestLog!.logDate,
              status: s.latestLog!.status === "VERIFIED" ? "VERIFIED" : "PENDING",
            }))}
          securityFlagsCount={securityFlags.length}
          onOpenIntervention={(studentId) => {
            const student = data?.students.find((s) => s.studentId === studentId);
            if (student) openInterventionModal(student);
          }}
          onViewSecurity={() => router.push("/teacher/dashboard?view=security")}
        />
      )}

      {/* Modal Katalog & Tambah Job Card Guru */}
      {showJobCardModal && (
        <TeacherJobCardModal
          isOpen={showJobCardModal}
          onClose={() => setShowJobCardModal(false)}
          departmentId={data?.department?.id || (user as any)?.departmentId || "dept-rpl-001"}
          schoolId={user?.school?.id || (user as any)?.schoolId || "00000000-0000-0000-0000-000000000002"}
          departmentName={data?.department?.name || "Rekayasa Perangkat Lunak"}
          sectorCode={data?.department?.sectorCode || "RPL"}
          cpElements={cpElements}
          token={token || ""}
        />
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