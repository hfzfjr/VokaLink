"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  Camera,
  ShieldCheck,
  Check,
  Clock,
  Info,
  X,
  ArrowRight,
  FileText,
  UserCheck,
  Building2,
  ChevronRight,
  ChevronLeft,
  Search,
  Image as ImageIcon,
  QrCode,
  Share2,
  AlertTriangle,
  TrendingUp,
  Paintbrush,
  EyeOff,
  RotateCcw,
  Package,
  Truck,
  Store,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  MIN_DAILY_JP,
  MAX_DAILY_JP,
  TOTAL_TARGET_JP,
  STUDENT_MAX_NORMAL_WEEKLY_HOURS,
  STUDENT_OVERWORK_CRITICAL_HOURS,
  convertRealHoursToJp,
} from "@vokalink/shared";
import { db } from "@/lib/pwa/db";
import { compressEvidencePhoto, type CompressedPhotoResult } from "@/lib/pwa/photo";
import { fetchStudentLogContext, fetchStudentLogs, type StudentLogContextResponse } from "@/lib/api";
import { cn } from "@/lib/cn";
import { MentorQrModal } from "@/components/student/home/MentorQrModal";
import { PhotoPrivacyStudioModal } from "@/components/student/log/PhotoPrivacyStudioModal";
import { SmartDateSelector } from "@/components/student/log/SmartDateSelector";
import { SmartShiftSelector } from "@/components/student/log/SmartShiftSelector";

interface JobCardItem {
  id: string;
  title: string;
  tools: string[];
  skkni?: string | null;
  category: string;
}

const DEFAULT_JOB_CARDS: JobCardItem[] = [
  {
    id: "cadfbcc3-541b-405d-9e9d-b66fd5d88d85",
    title: "Membuat komponen UI dengan HTML dan CSS",
    tools: ["VS Code", "Chrome DevTools", "Figma"],
    skkni: "J.620100.020.02",
    category: "Frontend Web",
  },
  {
    id: "32af8c23-7354-427e-b977-fb150ab89837",
    title: "Mengimplementasikan logika JavaScript atau TypeScript",
    tools: ["VS Code", "Node.js", "Chrome DevTools"],
    skkni: "J.620100.021.02",
    category: "Frontend Web",
  },
  {
    id: "a17985fc-8c12-49b0-b045-a691f7d0c83b",
    title: "Membuat endpoint API RESTful",
    tools: ["Node.js", "Express", "Postman"],
    skkni: "J.620100.026.02",
    category: "Backend Development",
  },
  {
    id: "4c9d195e-9d98-48f2-8fe5-9a46c9681185",
    title: "Merancang dan membuat tabel database relasional",
    tools: ["PostgreSQL", "MySQL", "DBeaver"],
    skkni: "J.620100.025.02",
    category: "Database & Storage",
  },
  {
    id: "13c8dd8c-04c3-452a-95a2-a2dc44fee604",
    title: "Menulis unit test dan integration test",
    tools: ["Jest", "Vitest", "Supertest"],
    skkni: "J.620100.030.02",
    category: "Quality Assurance",
  },
];

const DEFAULT_NON_COMPETENCY_JC = {
  id: "85544774-bbd3-43d8-bcdc-ee38c800ef98",
  title: "Bantuan administrasi dan operasional kantor IT",
};

const DEFAULT_PLACEMENT_ID = "3ffec674-ad55-482a-a566-9dff84ab71be";

// ─── RUBRIK PENGUASAAN SOP (PEDAGOGI POSITIF KURIKULUM MERDEKA) ───
// Nilai angka (75, 88, 100) disembunyikan dari siswa dan hanya dihitung di backend guru (e-Rapor)
const AUTONOMY_LEVEL_OPTIONS = [
  {
    level: 1 as const,
    label: "Observasi",
    sub: "Tahap Pengenalan",
    badge: "Tahap Awal",
    desc: "Mempelajari & mengamati alur kerja mentor industri",
  },
  {
    level: 2 as const,
    label: "Terbimbing",
    sub: "Tahap Praktik",
    badge: "Dengan Arahan",
    desc: "Mengerjakan tugas dengan supervisi berkala dari mentor",
  },
  {
    level: 3 as const,
    label: "Mandiri",
    sub: "Standar Industri",
    badge: "Sesuai SOP",
    desc: "Mengeksekusi tugas mandiri sesuai standar baku DUDI",
  },
];

function getLocalIsoDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function NewLogPage() {
  const today = getLocalIsoDate(new Date());
  const minDate = getLocalIsoDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
  const [selectedDate, setSelectedDate] = useState(today);
  const [attendanceType, setAttendanceType] = useState<"PRESENT" | "SICK" | "PERMIT">("PRESENT");
  const [isNonCompetency, setIsNonCompetency] = useState(false);
  const [nonCompetencyCategory, setNonCompetencyCategory] = useState("ADMIN_UMUM");
  const [durationJp, setDurationJp] = useState(8);
  const [overtimeReason, setOvertimeReason] = useState("Rilis / Deployment Sistem");
  const [autonomyLevel, setAutonomyLevel] = useState<1 | 2 | 3>(3);
  const [cardAutonomyMap, setCardAutonomyMap] = useState<Record<string, 1 | 2 | 3>>({});
  const [shortNote, setShortNote] = useState("");

  // Context state (Placement & Job Cards)
  const [jobCards, setJobCards] = useState<JobCardItem[]>(DEFAULT_JOB_CARDS);
  const [nonCompetencyJobCard, setNonCompetencyJobCard] = useState(DEFAULT_NON_COMPETENCY_JC);
  const [activePlacement, setActivePlacement] = useState<{
    id: string;
    dudiName: string;
    dudiCity: string;
    mentorName: string;
  } | null>(null);

  // Search & Filter state for Job Cards
  const [jobCardSearch, setJobCardSearch] = useState("");
  const [jobCardCategory, setJobCardCategory] = useState("ALL");

  // Photo state & Privacy Blur (FR-006 & TC-003)
  const [rawPhotoFile, setRawPhotoFile] = useState<File | null>(null);
  const [applyPrivacyBlur, setApplyPrivacyBlur] = useState(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [compressedPhoto, setCompressedPhoto] = useState<CompressedPhotoResult | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [showPrivacyStudio, setShowPrivacyStudio] = useState(false);

  // Hidden file input refs for Camera vs Gallery
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // 3-Step Wizard Navigation State (Apple HIG)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Multi-Job Cards state (1 to 3 job cards per daily log, PRD FR-005)
  const [selectedJobCardIds, setSelectedJobCardIds] = useState<string[]>([]);

  // Submission state & Modals
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLogUuid, setSubmittedLogUuid] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Group C, D, E, F: Demo mode, loading context, inline error, and online status
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [cardLimitError, setCardLimitError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const modalSuccessRef = useRef<HTMLDivElement>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap, body scroll lock & Escape listener untuk dialog konfirmasi sukses (Kelompok 1.4 & 2.16)
  useEffect(() => {
    if (!submittedLogUuid) return;
    previousActiveElement.current = document.activeElement as HTMLElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const modalEl = modalSuccessRef.current;
    if (modalEl) {
      const focusableElements = modalEl.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstEl = focusableElements[0];
      firstEl?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showQrModal) return;
      if (e.key === "Escape") {
        e.preventDefault();
        resetForm();
        return;
      }
      if (e.key === "Tab") {
        const modal = modalSuccessRef.current;
        if (!modal) return;
        const focusables = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [submittedLogUuid, showQrModal]);

  const showError = (message: string) => {
    setFormError(message);
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Hapus formError saat field utama presensi/tugas berubah (Kelompok 2.12)
  useEffect(() => {
    if (formError) setFormError(null);
  }, [attendanceType, selectedJobCardIds, durationJp, compressedPhoto, selectedDate]);

  // 1. Reactive Dexie Query untuk mendeteksi log yang sudah ada & pencegahan duplikasi (BR-001/002)
  const offlineLogs = useLiveQuery(() => db.logs.toArray(), []) || [];

  // Hitung akumulasi jam pada tanggal terpilih
  const logsForSelectedDate = useMemo(
    () => offlineLogs.filter((l) => l.logDate === selectedDate),
    [offlineLogs, selectedDate]
  );

  const existingDailyJp = useMemo(
    () => logsForSelectedDate.reduce((acc, curr) => acc + curr.durationJp, 0),
    [logsForSelectedDate]
  );

  const remainingDailyQuota = Math.max(0, MAX_DAILY_JP - existingDailyJp);
  const isDailyLimitReached = existingDailyJp >= MAX_DAILY_JP;
  const hasExistingSickOrPermit = logsForSelectedDate.some(
    (l) => l.attendanceType === "SICK" || l.attendanceType === "PERMIT"
  );

  // 2. Kalkulasi Dampak Progres Terhadap Target 792 JP murni dari Database (Kelompok 1.2, 1.6 & 3.16)
  const [serverVerifiedJp, setServerVerifiedJp] = useState<number | null>(null);
  const offlineVerifiedJp = offlineLogs.filter((l) => l.state === "verified").reduce((acc, curr) => acc + curr.durationJp, 0);
  const hasVerifiedData = serverVerifiedJp !== null || offlineVerifiedJp > 0;
  const currentTotalJp = (serverVerifiedJp ?? 0) + offlineVerifiedJp;
  const verifiedPercentage = Math.min(100, Math.round((currentTotalJp / TOTAL_TARGET_JP) * 100));
  const sessionJp = attendanceType === "PRESENT" ? convertRealHoursToJp(durationJp) : 0;
  const sessionPercentage = Math.min(100 - verifiedPercentage, Math.round((sessionJp / TOTAL_TARGET_JP) * 100));
  const projectedPercentage = Math.min(100, Math.round(((currentTotalJp + sessionJp) / TOTAL_TARGET_JP) * 100));

  // 3. Kalkulasi Jam Kerja Mingguan & Perlindungan K3 Siswa (Student Welfare Protection - BR-013)
  // Perbaikan: Sinkronisasi akurat antara jam tersimpan di minggu ini + durasi aktif
  const weeklyWorkStats = useMemo(() => {
    const sel = new Date(selectedDate);
    const day = isNaN(sel.getTime()) ? 1 : sel.getDay(); // 0: Minggu, 1: Senin, ...
    const diffToMonday = sel.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(sel);
    monday.setDate(diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekLogs = offlineLogs.filter((l) => {
      const d = new Date(l.logDate);
      return d >= monday && d <= sunday && l.attendanceType === "PRESENT";
    });

    const loggedWeekHours = weekLogs.reduce((sum, l) => sum + l.durationJp, 0);
    // Jam total minggu ini = total jam tersimpan di minggu ini + durasi jam yang sedang diisi
    const totalWeeklyHours = loggedWeekHours + (attendanceType === "PRESENT" ? durationJp : 0);

    // Hitung hari lembur/proyek khusus (>= 9 jam)
    const overtimeDaysCount =
      weekLogs.filter((l) => l.durationJp >= 9 && l.logDate !== selectedDate).length +
      (attendanceType === "PRESENT" && durationJp >= 9 ? 1 : 0);

    const isCriticalOverwork = totalWeeklyHours >= STUDENT_OVERWORK_CRITICAL_HOURS || overtimeDaysCount >= 4;
    const isWarningOverwork =
      !isCriticalOverwork &&
      (totalWeeklyHours > STUDENT_MAX_NORMAL_WEEKLY_HOURS || overtimeDaysCount >= 3);

    return {
      totalWeeklyHours,
      overtimeDaysCount,
      isCriticalOverwork,
      isWarningOverwork,
      isNormal: !isCriticalOverwork && !isWarningOverwork,
    };
  }, [offlineLogs, selectedDate, attendanceType, durationJp]);

  // Track apakah siswa pernah mengubah durasi jam secara manual
  const hasUserManuallyChangedDuration = useRef(false);

  const isSaturday = useMemo(() => {
    const d = new Date(selectedDate);
    return !isNaN(d.getTime()) && d.getDay() === 6;
  }, [selectedDate]);

  const isWeekday = useMemo(() => {
    const d = new Date(selectedDate);
    return !isNaN(d.getTime()) && d.getDay() >= 1 && d.getDay() <= 5;
  }, [selectedDate]);

  // Format tanggal untuk sticky submit bar (Kelompok 2.9)
  const formattedStickyDate = useMemo(() => {
    const d = new Date(selectedDate);
    if (isNaN(d.getTime())) return selectedDate;
    return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
  }, [selectedDate]);

  // Draft auto-save and recovery - Pisahkan draftFoundOnMount (Kelompok 1.3)
  const [draftFoundOnMount, setDraftFoundOnMount] = useState(false);

  // Smart Default Effect: Otomatis memilih jam kerja sesuai hari kerja & pola DUDI
  // Syarat efek tidak bergantung pada banner draf, cukup pada hasUserManuallyChangedDuration (Kelompok 1.3)
  useEffect(() => {
    if (!hasUserManuallyChangedDuration.current) {
      const d = new Date(selectedDate);
      const day = isNaN(d.getTime()) ? 1 : d.getDay();
      if (day === 6) {
        // Khusus Sabtu: Setengah hari / shift pendek = 5 Jam
        setDurationJp(5);
      } else if (day >= 1 && day <= 5) {
        // Senin - Jumat: Full day standar industri = 8 Jam
        setDurationJp(8);
      }
    }
  }, [selectedDate]);

  // Auto-save draft ke localStorage (tidak mengubah draftFoundOnMount - Kelompok 1.3)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timeout = setTimeout(() => {
      const defaultDurationForDay = isSaturday ? 5 : 8;
      if (shortNote || selectedJobCardIds.length > 1 || durationJp !== defaultDurationForDay) {
        try {
          const draftPayload = {
            selectedDate,
            attendanceType,
            isNonCompetency,
            nonCompetencyCategory,
            durationJp,
            autonomyLevel,
            cardAutonomyMap,
            shortNote,
            selectedJobCardIds,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem("vokalink_new_log_draft_v1", JSON.stringify(draftPayload));
        } catch { }
      }
    }, 600);
    return () => clearTimeout(timeout);
  }, [
    selectedDate,
    attendanceType,
    isNonCompetency,
    nonCompetencyCategory,
    durationJp,
    autonomyLevel,
    cardAutonomyMap,
    shortNote,
    selectedJobCardIds,
    isSaturday,
  ]);

  // Check draft saat mount saja (Kelompok 1.3)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vokalink_new_log_draft_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.savedAt) {
          setDraftFoundOnMount(true);
        }
      }
    } catch { }
  }, []);

  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem("vokalink_new_log_draft_v1");
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.selectedDate) {
        const isValidDate = parsed.selectedDate >= minDate && parsed.selectedDate <= today;
        setSelectedDate(isValidDate ? parsed.selectedDate : today);
      }
      if (parsed.attendanceType) setAttendanceType(parsed.attendanceType);
      if (typeof parsed.isNonCompetency === "boolean") setIsNonCompetency(parsed.isNonCompetency);
      if (parsed.nonCompetencyCategory) setNonCompetencyCategory(parsed.nonCompetencyCategory);
      if (parsed.durationJp) setDurationJp(parsed.durationJp);
      if (parsed.autonomyLevel) setAutonomyLevel(parsed.autonomyLevel);
      if (parsed.cardAutonomyMap) setCardAutonomyMap(parsed.cardAutonomyMap);
      if (parsed.shortNote) setShortNote(parsed.shortNote);
      if (parsed.selectedJobCardIds) setSelectedJobCardIds(parsed.selectedJobCardIds);
      hasUserManuallyChangedDuration.current = true;
      setDraftFoundOnMount(false);
    } catch { }
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem("vokalink_new_log_draft_v1");
      setDraftFoundOnMount(false);
    } catch { }
  };

  // 1-Click Copy Yesterday: Duplikasi kartu pekerjaan dan durasi kemarin (FR-005 UX)
  // Urutkan offlineLogs menurun berdasarkan logDate sebelum find (Kelompok 1.3)
  const recentPreviousLog = useMemo(() => {
    if (!offlineLogs || offlineLogs.length === 0) return null;
    return [...offlineLogs]
      .sort((a, b) => b.logDate.localeCompare(a.logDate))
      .find((l) => l.attendanceType === "PRESENT" && l.logDate < selectedDate);
  }, [offlineLogs, selectedDate]);

  const handleCopyYesterday = () => {
    if (!recentPreviousLog) return;
    hasUserManuallyChangedDuration.current = true;
    if (recentPreviousLog.jobCardIds && recentPreviousLog.jobCardIds.length > 0) {
      setSelectedJobCardIds(recentPreviousLog.jobCardIds);
    }
    setDurationJp(recentPreviousLog.durationJp || 8);
    setAutonomyLevel(recentPreviousLog.autonomyLevel || 3);
    setIsNonCompetency(recentPreviousLog.isNonCompetency || false);
    if (recentPreviousLog.nonCompetencyCategory) {
      setNonCompetencyCategory(recentPreviousLog.nonCompetencyCategory);
    }
  };

  // Load offline context (Active Placement & Job Cards)
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const cached = await db.refData.get("student_log_context");
        if (cached && cached.data && isMounted) {
          const data = cached.data as StudentLogContextResponse;
          if (data.activePlacement) setActivePlacement(data.activePlacement);
          if (data.jobCards && data.jobCards.length > 0) setJobCards(data.jobCards);
          if (data.nonCompetencyJobCard) setNonCompetencyJobCard(data.nonCompetencyJobCard);
        }

        const cachedVerified = await db.refData.get("student_server_verified_jp");
        if (cachedVerified && typeof cachedVerified.data === "number" && isMounted) {
          setServerVerifiedJp(cachedVerified.data);
        }

        if (typeof navigator !== "undefined" && navigator.onLine) {
          const fresh = await fetchStudentLogContext();
          if (fresh && isMounted) {
            if (fresh.activePlacement) {
              setActivePlacement(fresh.activePlacement);
              try {
                const dbLogs = await fetchStudentLogs(fresh.activePlacement.id);
                if (Array.isArray(dbLogs) && isMounted) {
                  const verifiedJp = dbLogs
                    .filter((l) => l.status === "VERIFIED")
                    .reduce((sum, l) => sum + (l.items?.reduce((s, it) => s + it.durationJp, 0) || 8), 0);
                  setServerVerifiedJp(verifiedJp);
                  await db.refData.put({
                    key: "student_server_verified_jp",
                    data: verifiedJp,
                    cachedAt: Date.now(),
                  });
                }
              } catch { }
            }
            if (fresh.jobCards && fresh.jobCards.length > 0) setJobCards(fresh.jobCards);
            if (fresh.nonCompetencyJobCard) setNonCompetencyJobCard(fresh.nonCompetencyJobCard);
            await db.refData.put({
              key: "student_log_context",
              data: fresh,
              cachedAt: Date.now(),
            });
          }
        }
      } catch (e) {
        console.warn("Context offline fallback:", e);
      } finally {
        if (isMounted) setIsLoadingContext(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Multi-select toggle handler for Job Cards (Kelompok 3.18: state setters keluar dari updater)
  const handleToggleJobCard = (cardId: string) => {
    setCardLimitError(null);
    if (formError) setFormError(null);

    const isSelected = selectedJobCardIds.includes(cardId);
    if (isSelected) {
      const updated = selectedJobCardIds.filter((id) => id !== cardId);
      setSelectedJobCardIds(updated);
    } else {
      if (selectedJobCardIds.length >= 3) {
        setCardLimitError("Maksimal 3 tugas per hari.");
        return;
      }
      const updated = [...selectedJobCardIds, cardId];
      setSelectedJobCardIds(updated);
      if (!cardAutonomyMap[cardId]) {
        setCardAutonomyMap((map) => ({ ...map, [cardId]: autonomyLevel }));
      }
      if (durationJp < updated.length) {
        setDurationJp(updated.length);
      }
    }
  };

  // Set autonomy per card
  const handleSetCardAutonomy = (cardId: string, level: 1 | 2 | 3) => {
    setCardAutonomyMap((prev) => ({ ...prev, [cardId]: level }));
    if (selectedJobCardIds.length <= 1) {
      setAutonomyLevel(level);
    }
  };

  // Reset log hari ini khusus mode demo juri (agar form kembali bersih)
  const handleResetTodayLogsForDemo = async () => {
    if (logsForSelectedDate.length === 0) return;
    try {
      for (const log of logsForSelectedDate) {
        await db.logs.delete(log.clientLogUuid);
      }
    } catch (err) {
      console.warn("Gagal mereset log demo:", err);
    }
  };

  // Kategori unik dari jobCards untuk pill filter dinamis (A. Bug 1)
  const uniqueCategories = useMemo(() => {
    const cats = Array.from(new Set(jobCards.map((c) => c.category).filter(Boolean)));
    return ["ALL", ...cats];
  }, [jobCards]);

  // Filtered Job Cards based on search and category
  const filteredJobCards = useMemo(() => {
    return jobCards.filter((card) => {
      if (jobCardCategory !== "ALL" && card.category !== jobCardCategory) {
        return false;
      }
      if (jobCardSearch.trim()) {
        const query = jobCardSearch.toLowerCase();
        const matchTitle = card.title.toLowerCase().includes(query);
        const matchTools = card.tools.some((t) => t.toLowerCase().includes(query));
        const matchSkkni = card.skkni?.toLowerCase().includes(query) ?? false;
        return matchTitle || matchTools || matchSkkni;
      }
      return true;
    });
  }, [jobCards, jobCardCategory, jobCardSearch]);


  // Detail kartu yang dipilih untuk modal sukses & ringkasan (E.6)
  const selectedJobCardsDetail = useMemo(() => {
    return jobCards.filter((card) => selectedJobCardIds.includes(card.id));
  }, [jobCards, selectedJobCardIds]);

  const processPhoto = async (file: File) => {
    try {
      setIsCompressingPhoto(true);
      const result = await compressEvidencePhoto(file);
      setCompressedPhoto(result);
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      const url = URL.createObjectURL(result.blob);
      setPhotoPreviewUrl(url);
    } catch (err) {
      showError("Gagal memproses foto: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawPhotoFile(file);
    setApplyPrivacyBlur(false);
    await processPhoto(file);
    e.target.value = "";
  };

  // Demo Instan: Menghasilkan gambar simulasi monitor kodingan DUDI yang memuat data rahasia
  const handleUseDemoPhoto = async () => {
    try {
      setIsCompressingPhoto(true);
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");
      let demoFilename = "demo-layar-koding-dudi.png";

      if (ctx) {
        if (attendanceType === "SICK") {
          demoFilename = "surat-keterangan-dokter-demo.png";
          // Latar belakang kertas surat medis
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, 800, 500);

          // Top Header Bar
          ctx.fillStyle = "#0284c7";
          ctx.fillRect(0, 0, 800, 10);

          // Kop Klinik
          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 17px sans-serif";
          ctx.fillText("KLINIK PRATAMA SEHAT MEDIKA", 50, 48);
          ctx.font = "11px sans-serif";
          ctx.fillStyle = "#64748b";
          ctx.fillText("Izin Operasional Dinkes: No. 445/1029-Dinkes/2024 · Telp: (022) 7201948", 50, 68);
          ctx.fillText("Jl. Soekarno-Hatta No. 492, Kota Bandung, Jawa Barat", 50, 84);

          // Garis pembatas
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(50, 96);
          ctx.lineTo(750, 96);
          ctx.stroke();

          // Judul Surat
          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 15px sans-serif";
          ctx.fillText("SURAT KETERANGAN ISTIRAHAT SAKIT", 235, 130);
          ctx.font = "11px sans-serif";
          ctx.fillStyle = "#64748b";
          ctx.fillText(`Nomor: SKD/MED/${selectedDate.replace(/-/g, "")}/089`, 305, 148);

          // Isi Surat
          ctx.font = "12px sans-serif";
          ctx.fillStyle = "#334155";
          ctx.fillText("Menerangkan bahwa peserta magang/PKL berikut:", 50, 185);

          ctx.font = "bold 12px sans-serif";
          ctx.fillText("Nama Siswa      : Gilang Ramadan (SMK Negeri 1 Cimahi - RPL)", 70, 215);
          ctx.fillText("Tempat Magang   : PT Nusantara Tech (Mitra DUDI)", 70, 240);
          ctx.fillText("Diagnosa Medis  : Febris / Gejala Tifoid Ringan (Perlu Istirahat Fisik)", 70, 265);
          ctx.fillText(`Masa Istirahat  : 1 (Satu) Hari Kerja — Tanggal ${selectedDate}`, 70, 290);

          ctx.font = "11.5px sans-serif";
          ctx.fillStyle = "#475569";
          ctx.fillText("Diberikan untuk dipergunakan sebagaimana mestinya sebagai lampiran dispensasi resmi presensi PKL.", 50, 330);

          // Stempel dan Tanda Tangan Dokter
          ctx.strokeStyle = "#2563eb";
          ctx.lineWidth = 2;
          ctx.strokeRect(520, 355, 200, 88);
          ctx.fillStyle = "#1d4ed8";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText("KLINIK SEHAT MEDIKA", 545, 380);
          ctx.font = "italic 10.5px sans-serif";
          ctx.fillText("dr. Hendra Setiawan, Sp.A", 545, 408);
          ctx.font = "9.5px sans-serif";
          ctx.fillText("SIP: 503/SIP-D/2022", 545, 426);

          // Privacy note
          ctx.fillStyle = "#94a3b8";
          ctx.font = "10.5px sans-serif";
          ctx.fillText("LAMPIRAN DOKUMEN MEDIS SISWA · TERENKRIPSI AMAN (UU PDP NO. 27/2022)", 50, 480);
        } else if (attendanceType === "PERMIT") {
          demoFilename = "surat-dispensasi-izin-demo.png";
          // Latar belakang surat dispensasi
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, 800, 500);

          // Top Header Bar
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(0, 0, 800, 10);

          // Kop Surat
          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 17px sans-serif";
          ctx.fillText("SURAT PERMOHONAN IZIN DISPENSASI PKL", 50, 48);
          ctx.font = "11px sans-serif";
          ctx.fillStyle = "#64748b";
          ctx.fillText("Dokumen Presensi Resmi Siswa Praktik Kerja Lapangan (PKL)", 50, 68);

          // Garis pembatas
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(50, 88);
          ctx.lineTo(750, 88);
          ctx.stroke();

          // Isi Surat
          ctx.font = "12px sans-serif";
          ctx.fillStyle = "#334155";
          ctx.fillText("Kepada Yth. Pimpinan & Mentor Lapangan PT Nusantara Tech,", 50, 125);
          ctx.fillText("Dengan hormat, yang bertanda tangan di bawah ini menyampaikan permohonan izin dispensasi tidak hadir:", 50, 155);

          ctx.font = "bold 12px sans-serif";
          ctx.fillText("Nama Siswa      : Gilang Ramadan (Kelas XII Rekayasa Perangkat Lunak)", 70, 190);
          ctx.fillText(`Tanggal Izin    : ${selectedDate}`, 70, 215);
          ctx.fillText("Alasan Izin     : Dispensasi Resmi Sekolah (Mengikuti Babak Final Lomba Web Dev)", 70, 240);
          ctx.fillText("Surat Tugas     : Surat Tugas Kepala Sekolah No. 421.5/ST-SMK/X/2026", 70, 265);

          ctx.font = "11.5px sans-serif";
          ctx.fillStyle = "#475569";
          ctx.fillText("Demikian surat permohonan izin ini kami sampaikan. Siswa bersedia mengganti tugas PKL yang tertunda.", 50, 310);

          // Tanda Tangan
          ctx.fillStyle = "#1e293b";
          ctx.font = "11px sans-serif";
          ctx.fillText("Mengetahui Orang Tua / Wali,", 80, 360);
          ctx.font = "bold 11px sans-serif";
          ctx.fillText("( Bpk. M. Ramadan )", 80, 430);

          ctx.font = "11px sans-serif";
          ctx.fillText("Guru Pembimbing PKL,", 500, 360);
          ctx.font = "bold 11px sans-serif";
          ctx.fillText("Drs. Budi Santoso, M.T.", 500, 430);
          ctx.font = "10px sans-serif";
          ctx.fillStyle = "#64748b";
          ctx.fillText("NIP: 19780512 200501 1 003", 500, 445);

          // Privacy note
          ctx.fillStyle = "#94a3b8";
          ctx.font = "10.5px sans-serif";
          ctx.fillText("DOKUMEN DISPENSASI RESMI SISWA · VOKALINK EVIDENCE SYSTEM", 50, 480);
        } else {
          // Dark IDE Screenshot for PRESENT
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 0, 800, 500);
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(0, 0, 800, 42);
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(22, 21, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.arc(40, 21, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.arc(58, 21, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#334155";
          ctx.fillRect(80, 8, 290, 34);
          ctx.fillStyle = "#38bdf8";
          ctx.font = "12px monospace";
          ctx.fillText("auth.controller.ts (RAHASIA DUDI)", 95, 30);

          ctx.font = "13px 'Courier New', Courier, monospace";
          ctx.fillStyle = "#38bdf8";
          ctx.fillText("import { verifyPin, createHmacStamp } from '@/crypto';", 35, 80);
          ctx.fillStyle = "#94a3b8";
          ctx.fillText("// Implementasi verifikasi mentor zero-login (FR-007)", 35, 110);
          ctx.fillStyle = "#c084fc";
          ctx.fillText("export async function verifyMentorAction(req: Request) {", 35, 140);
          ctx.fillStyle = "#e2e8f0";
          ctx.fillText("  const { deviceToken, mentorPin } = req.body;", 55, 170);
          ctx.fillStyle = "#f87171";
          ctx.fillText("  const databaseCluster = 'db-internal.nusantara.local';", 55, 200);
          ctx.fillStyle = "#4ade80";
          ctx.fillText("  const isValid = await verifyPinScrypt(mentorPin, databaseCluster);", 55, 230);
          ctx.fillStyle = "#e2e8f0";
          ctx.fillText("  if (!isValid) throw new AppError('PIN Salah', 401);", 55, 260);
          ctx.fillStyle = "#38bdf8";
          ctx.fillText("  return { status: 'VERIFIED', signature: createHmacStamp() };", 55, 290);
          ctx.fillStyle = "#c084fc";
          ctx.fillText("}", 35, 320);

          ctx.fillStyle = "#1e293b";
          ctx.fillRect(35, 360, 730, 80);
          ctx.strokeStyle = "#0ea5e9";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(35, 360, 730, 80);
          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText("PERINGATAN KERAHASIAAN DUDI (NDA & UU PDP NO. 27/2022):", 55, 388);
          ctx.fillStyle = "#94a3b8";
          ctx.font = "11.5px sans-serif";
          ctx.fillText("Gunakan Kuas Sensor Privasi VokaLink untuk menyamarkan baris konfigurasi privat di atas.", 55, 412);
          ctx.fillText("PT Nusantara Tech · Hak Cipta Kode Sumber Milik Mitra Industri", 55, 430);

          ctx.fillStyle = "#475569";
          ctx.font = "11px sans-serif";
          ctx.fillText("DOKUMENTASI JURNAL PKL SISWA · VOKALINK CLIENT-SIDE WEBP OPTIMIZED", 35, 480);
        }
      }

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsCompressingPhoto(false);
          return;
        }
        const file = new File([blob], demoFilename, { type: "image/png" });
        setRawPhotoFile(file);
        setApplyPrivacyBlur(false);
        await processPhoto(file);
      }, "image/png");
    } catch (err) {
      console.error("Gagal membuat foto demo:", err);
      setIsCompressingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(null);
    setCompressedPhoto(null);
    setRawPhotoFile(null);
    setApplyPrivacyBlur(false);
    setShowPrivacyStudio(false);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  // Submit to Dexie IndexedDB
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isSickOrPermit = attendanceType === "SICK" || attendanceType === "PERMIT";

    // Guard 1: Sakit / Izin sudah ada pada tanggal ini
    if (hasExistingSickOrPermit) {
      showError(`Tanggal ${selectedDate} sudah tercatat presensi Sakit/Izin resmi. Anda tidak dapat menambahkan jurnal praktik pada hari tidak hadir.`);
      return;
    }

    // Guard 2: Jika tanggal ini sudah ada jam hadir tercatat, tidak bisa mencatat Sakit/Izin
    if (isSickOrPermit && existingDailyJp > 0) {
      showError(`Tanggal ${selectedDate} sudah memiliki ${existingDailyJp} jam kerja tercatat. Dalam 1 hari kerja, Anda tidak dapat mencatat presensi Sakit/Izin jika sudah mengisi jam praktik.`);
      return;
    }

    // Guard 2.5: Wajib memilih minimal 1 kartu pekerjaan jika Hadir Praktik Teknis
    if (!isSickOrPermit && !isNonCompetency && selectedJobCardIds.length === 0) {
      showError("Harap pilih minimal 1 kartu pekerjaan yang Anda selesaikan hari ini sebelum menyimpan.");
      return;
    }

    // Guard 2.6: Presensi Sakit wajib melampirkan foto surat dokter (Kelompok 1.4)
    if (attendanceType === "SICK" && !compressedPhoto) {
      showError("Untuk presensi Sakit, surat keterangan dokter wajib dilampirkan.");
      return;
    }

    // Guard 3: Batas jam kerja harian (BR-002) - hanya untuk Hadir Praktik
    if (!isSickOrPermit && isDailyLimitReached) {
      showError(`Batas maksimal ${MAX_DAILY_JP} jam kerja harian untuk tanggal ini sudah terpenuhi (BR-002). Anda tidak dapat menambah jurnal lagi.`);
      return;
    }

    if (!isSickOrPermit && durationJp > remainingDailyQuota) {
      showError(`Alokasi waktu (${durationJp} Jam Kerja) melebihi sisa batas harian untuk tanggal ini (${remainingDailyQuota} Jam Kerja). Harap sesuaikan durasi.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const clientLogUuid = crypto.randomUUID();
      const clientCreatedAt = new Date().toISOString();

      const placementId = activePlacement?.id || DEFAULT_PLACEMENT_ID;
      const nonCompCard = nonCompetencyJobCard || DEFAULT_NON_COMPETENCY_JC;

      let targetJobCardIds: string[];
      let targetJobCardTitle: string;
      const isSickOrPermit = attendanceType === "SICK" || attendanceType === "PERMIT";

      if (isSickOrPermit) {
        targetJobCardIds = [nonCompCard.id];
        targetJobCardTitle =
          attendanceType === "SICK"
            ? "Presensi Sakit (Surat Keterangan Dokter)"
            : "Presensi Izin Resmi (Dispensasi / Keperluan)";
      } else if (isNonCompetency) {
        targetJobCardIds = [nonCompCard.id];
        targetJobCardTitle = `Bantuan Operasional (${nonCompetencyCategory})`;
      } else {
        const chosenCards = jobCards.filter((j) => selectedJobCardIds.includes(j.id));
        targetJobCardIds = chosenCards.length > 0 ? chosenCards.map((c) => c.id) : [DEFAULT_JOB_CARDS[0]!.id];
        targetJobCardTitle =
          chosenCards.length > 0
            ? chosenCards.map((c) => c.title).join(" + ")
            : "Kartu Pekerjaan Kejuruan";
      }

      // Ambil level kemandirian dominan dari kartu pertama atau global
      const primaryCardId = targetJobCardIds[0];
      const primaryAutonomy = (primaryCardId ? cardAutonomyMap[primaryCardId] : undefined) ?? autonomyLevel;

      let finalShortNote = shortNote.trim();
      if (!isSickOrPermit && durationJp >= 9 && overtimeReason && !finalShortNote.includes(overtimeReason)) {
        finalShortNote = finalShortNote
          ? `[Lembur Proyek: ${overtimeReason}] ${finalShortNote}`
          : `[Lembur Proyek: ${overtimeReason}] Selesai sesuai target operasional DUDI.`;
      }

      // 1. Simpan Log ke IndexedDB
      await db.logs.add({
        clientLogUuid,
        placementId,
        logDate: selectedDate,
        attendanceType,
        durationJp,
        autonomyLevel: primaryAutonomy,
        jobCardIds: targetJobCardIds,
        jobCardTitle: targetJobCardTitle,
        isNonCompetency: isSickOrPermit ? false : isNonCompetency,
        nonCompetencyCategory: isSickOrPermit ? undefined : isNonCompetency ? nonCompetencyCategory : undefined,
        shortNote: finalShortNote || undefined,
        clientCreatedAt,
        state: "queued",
        retryCount: 0,
      });

      // 2. Simpan Foto WebP ke IndexedDB (bila ada)
      if (compressedPhoto) {
        await db.photos.add({
          clientLogUuid,
          blob: compressedPhoto.blob,
          sha256: compressedPhoto.sha256,
          sizeBytes: compressedPhoto.sizeBytes,
          mimeType: compressedPhoto.mimeType,
          createdAt: clientCreatedAt,
        });
      }

      setSubmittedLogUuid(clientLogUuid);
      try {
        localStorage.removeItem("vokalink_new_log_draft_v1");
        setDraftFoundOnMount(false);
      } catch { }
    } catch (error) {
      showError("Terjadi kesalahan saat menyimpan ke IndexedDB: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedLogUuid(null);
    setFormError(null);
    setCardLimitError(null);
    setSelectedDate(today);
    setAttendanceType("PRESENT");
    setIsNonCompetency(false);
    setSelectedJobCardIds([]);
    const todayDate = new Date(today);
    const todayDay = isNaN(todayDate.getTime()) ? 1 : todayDate.getDay();
    setDurationJp(todayDay === 6 ? 5 : 8);
    hasUserManuallyChangedDuration.current = false;
    setAutonomyLevel(3);
    setCardAutonomyMap({});
    setShortNote("");
    setJobCardSearch("");
    setJobCardCategory("ALL");
    setStep(1);
    handleRemovePhoto();
  };

  const isSickOrPermit = attendanceType === "SICK" || attendanceType === "PERMIT";

  // Wizard Step Navigation Guards
  const isStep1Disabled =
    (hasExistingSickOrPermit && attendanceType === "PRESENT") ||
    (isSickOrPermit && existingDailyJp > 0) ||
    (!isSickOrPermit && isDailyLimitReached) ||
    (!isSickOrPermit && durationJp > remainingDailyQuota && existingDailyJp > 0);

  const isStep2Disabled = !isNonCompetency && selectedJobCardIds.length === 0;

  const handleNextStep = () => {
    if (step === 1) {
      if (hasExistingSickOrPermit && attendanceType === "PRESENT") {
        showError(`Tanggal ${selectedDate} sudah tercatat presensi Sakit/Izin resmi.`);
        return;
      }
      if (isSickOrPermit && existingDailyJp > 0) {
        showError(`Tanggal ${selectedDate} sudah memiliki ${existingDailyJp} jam kerja tercatat. Tidak dapat mencatat Sakit/Izin.`);
        return;
      }
      if (!isSickOrPermit) {
        if (remainingDailyQuota <= 0) {
          showError(`Batas maksimal ${MAX_DAILY_JP} jam per hari sudah tercapai.`);
          return;
        }
        if (durationJp > remainingDailyQuota && existingDailyJp > 0) {
          showError(`Melebihi sisa kuota hari ini (${remainingDailyQuota} jam lagi).`);
          return;
        }
        setStep(2);
      } else {
        // Sakit / Izin lewati langkah 2, langsung ke step 3
        setStep(3);
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (step === 2) {
      if (!isNonCompetency && selectedJobCardIds.length === 0) {
        showError("Harap pilih minimal 1 tugas pekerjaan yang Anda selesaikan hari ini.");
        return;
      }
      setStep(3);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePrevStep = () => {
    if (step === 3) {
      setStep(isSickOrPermit ? 1 : 2);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (step === 2) {
      setStep(1);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  // Ekstrak submitDisabled, disabledReason, dan submitLabel (Kelompok 1.5, 2.8, 2.15)
  const submitDisabled =
    isSubmitting ||
    (attendanceType === "SICK" && !compressedPhoto) ||
    (isSickOrPermit && existingDailyJp > 0) ||
    (!isSickOrPermit && isDailyLimitReached) ||
    hasExistingSickOrPermit ||
    (!isSickOrPermit && durationJp > remainingDailyQuota && existingDailyJp > 0) ||
    (!isSickOrPermit && !isNonCompetency && selectedJobCardIds.length === 0);

  const disabledReason = isSubmitting
    ? "Sedang menyimpan jurnal..."
    : attendanceType === "SICK" && !compressedPhoto
      ? "Lampirkan foto surat dokter"
      : hasExistingSickOrPermit
        ? "Sudah ada presensi sakit/izin hari ini"
        : isSickOrPermit && existingDailyJp > 0
          ? "Sudah ada jam hadir yang tercatat"
          : !isSickOrPermit && isDailyLimitReached
            ? `Batas maksimal ${MAX_DAILY_JP} jam harian sudah tercapai`
            : !isSickOrPermit && durationJp > remainingDailyQuota && existingDailyJp > 0
              ? `Melebihi sisa kuota hari ini (${remainingDailyQuota} Jam tersisa)`
              : !isSickOrPermit && !isNonCompetency && selectedJobCardIds.length === 0
                ? "Pilih minimal 1 kartu pekerjaan"
                : null;

  const submitLabel = isSubmitting
    ? "Menyimpan Jurnal..."
    : disabledReason ||
    (attendanceType === "SICK"
      ? "Kirim Presensi Sakit"
      : attendanceType === "PERMIT"
        ? "Kirim Presensi Izin"
        : "Simpan Jurnal Sekarang");


  const stepSummaryText = useMemo(() => {
    if (step === 1) {
      if (attendanceType === "PRESENT") {
        return `${formattedStickyDate} · ${durationJp} jam`;
      }
      return `${formattedStickyDate} · ${attendanceType === "SICK" ? "Sakit" : "Izin"}`;
    }
    if (step === 2) {
      if (isNonCompetency) {
        return "Tugas Non-Teknis";
      }
      return `${selectedJobCardIds.length} dari 3 tugas dipilih`;
    }
    // step === 3
    if (attendanceType === "SICK") {
      return compressedPhoto ? "Surat dokter terlampir" : "Wajib foto surat dokter";
    }
    return compressedPhoto ? "Foto terlampir" : "Opsional";
  }, [step, formattedStickyDate, durationJp, attendanceType, isNonCompetency, selectedJobCardIds.length, compressedPhoto]);

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full pb-20 md:pb-12 lg:pb-4"
    >
      {/* ─────────────────────────────────────────────────────────────────────────────
          UNIFIED WORKSPACE CANVAS (FULL-WIDTH PARITY WITH PORTAL PAGES)
          Sequential Reading Order: Header -> Presence -> Date -> Shift/K3 -> Cards/SOP -> Photo -> Note -> Submit
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="w-full bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200/80 shadow-card flex flex-col">
        <div>
          {/* ─── Header: Apple Minimalist Canvas Header ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200/70">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                Catat Jurnal Harian PKL
              </h1>
              <p className="text-xs text-slate-600 mt-1 font-normal">
                Pencatatan kartu kerja zero-typing dan presensi harian siswa SMK Kurikulum Merdeka
              </p>
            </div>

            {/* Bar Progres 792 JP & Jam Kerja Minggu Ini di header */}
            {isLoadingContext ? (
              <div className="flex flex-col sm:items-end gap-1.5 self-start sm:self-auto shrink-0 min-w-[200px] animate-pulse motion-reduce:animate-none">
                <div className="w-36 h-3.5 bg-slate-200 rounded" />
                <div className="w-48 h-2 bg-slate-200 rounded-full" />
              </div>
            ) : (
              <div className="flex flex-col sm:items-end gap-1.5 self-start sm:self-auto shrink-0 min-w-[240px]">
                <div className="flex items-center justify-between w-full text-xs gap-3">
                  <span className="font-medium text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Minggu Ini: <strong className="font-mono text-slate-800">{weeklyWorkStats.totalWeeklyHours}/{STUDENT_MAX_NORMAL_WEEKLY_HOURS} Jam</strong></span>
                  </span>
                  <span className="font-semibold text-sky-700 font-mono">
                    {hasVerifiedData ? `${currentTotalJp} / ${TOTAL_TARGET_JP} JP` : `– / ${TOTAL_TARGET_JP} JP`}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={hasVerifiedData ? currentTotalJp : undefined}
                  aria-valuemin={0}
                  aria-valuemax={TOTAL_TARGET_JP}
                  aria-label={`Target Total Jam Praktik PKL: ${TOTAL_TARGET_JP} JP`}
                  className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60 flex"
                >
                  <div
                    className="h-full bg-sky-500 rounded-l-full transition-all duration-300 motion-reduce:transition-none"
                    style={{ width: `${hasVerifiedData ? verifiedPercentage : 0}%` }}
                    title={hasVerifiedData ? `Terverifikasi: ${currentTotalJp} JP` : "Belum ada data terverifikasi"}
                  />
                  {sessionJp > 0 && (
                    <div
                      className="h-full bg-sky-300 transition-all duration-300 motion-reduce:transition-none"
                      style={{ width: `${sessionPercentage}%` }}
                      title={`Sedang Diisi: +${sessionJp} JP (${durationJp} Jam Kerja)`}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── DUDI Placement & Assignment Context Bar (Non-sticky, ringkas & elegan) ─── */}
          {isLoadingContext ? (
            <div className="mt-3.5 p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-pulse motion-reduce:animate-none">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-200" />
                <div className="space-y-1">
                  <div className="w-32 h-3.5 bg-slate-200 rounded" />
                  <div className="w-48 h-3 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="w-28 h-6 bg-slate-200 rounded-xl" />
            </div>
          ) : (
            <div className="mt-3.5 p-3.5 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0 shadow-2xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {activePlacement?.dudiName || (isDemoMode ? "PT Nusantara Tech" : "Mitra Industri PKL")}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-slate-500 border border-slate-200 text-[11px] font-medium bg-white">
                      Mitra Terdaftar
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-normal truncate">
                    Pembimbing: <span className="font-semibold text-slate-700">{activePlacement?.mentorName || (isDemoMode ? "Rizky Firmansyah (Engineering Lead)" : "Mentor Industri Lapangan")}</span>
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200/80 text-slate-700 text-xs font-medium shrink-0 self-start sm:self-auto shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verifikasi PIN Mentor</span>
              </div>
            </div>
          )}

          {/* ─── Horizontal Stepper (Apple HIG / Modern SaaS) ─── */}
          <nav aria-label="Alur Pengisian Jurnal" className="mt-4 pb-2 border-b border-slate-100">
            <ol className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { s: 1, title: "1. Kehadiran & Jam", short: "1. Kehadiran" },
                { s: 2, title: "2. Pilih Tugas", short: "2. Tugas" },
                { s: 3, title: "3. Bukti & Catatan", short: "3. Bukti" },
              ].map((item) => {
                const isCompleted = item.s < step;
                const isActive = item.s === step;

                return (
                  <li
                    key={item.s}
                    className={cn(
                      "flex items-center gap-2 p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl border text-xs transition-all",
                      isActive
                        ? "bg-sky-50/70 border-sky-300 text-sky-950 font-semibold shadow-2xs"
                        : isCompleted
                          ? "bg-sky-50/40 border-sky-200/80 text-sky-800 font-medium"
                          : "bg-slate-50/50 border-slate-200/60 text-slate-400 font-normal"
                    )}
                  >
                    <span
                      className={cn(
                        "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all",
                        isActive
                          ? "bg-sky-500 text-white shadow-2xs"
                          : isCompleted
                            ? "bg-sky-100 text-sky-700"
                            : "bg-slate-200/70 text-slate-500"
                      )}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : item.s}
                    </span>
                    <span className="truncate hidden sm:inline">{item.title}</span>
                    <span className="truncate sm:hidden">{item.short}</span>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* ─────────────────────────────────────────────────────────────────────────
              STEP 1 — “HARI INI”
              Presensi kehadiran, SmartDateSelector, dan SmartShiftSelector (bila Hadir)
          ───────────────────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="pt-4 space-y-4 animate-in fade-in duration-200">
              {/* ─── DRAFT RECOVERY BANNER (Kelompok 1.3: draftFoundOnMount) ─── */}
              {draftFoundOnMount && (
                <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sky-950 animate-in fade-in motion-reduce:animate-none">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">Ditemukan Draf Belum Tersimpan</p>
                      <p className="text-xs text-slate-600 mt-0.5 font-normal">
                        Terdapat isian jurnal sebelumnya yang tersimpan di perangkat ini.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleRestoreDraft}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition cursor-pointer shadow-2xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    >
                      Pulihkan
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200 transition cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    >
                      Abaikan
                    </button>
                  </div>
                </div>
              )}

              {/* ─── BR-002 STATUS PRESENSI SAKIT / IZIN TERDAFTAR ─── */}
              {hasExistingSickOrPermit && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs flex items-center gap-3 text-amber-900 animate-in fade-in motion-reduce:animate-none">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">Sudah Tercatat Sakit / Izin pada Tanggal Ini</p>
                    <p className="text-xs text-amber-800 mt-0.5 font-normal">
                      Tanggal {selectedDate} sudah memiliki catatan presensi Sakit/Izin resmi. Anda tidak dapat menambahkan jurnal praktik pada hari tidak hadir.
                    </p>
                  </div>
                </div>
              )}

              {/* ─── Row 1: Status Presensi & Tanggal Pelaksanaan (Berdampingan seimbang di Desktop) ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                {/* 1. Status Kehadiran (Apple Segmented Control dalam container card rapi) */}
                <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                        <span>Status Kehadiran Hari Ini</span>
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Presensi PKL
                      </span>
                    </div>

                    {/* Segmented Control iOS Style with aria-pressed */}
                    <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        aria-pressed={attendanceType === "PRESENT"}
                        onClick={() => setAttendanceType("PRESENT")}
                        className={cn(
                          "min-h-[48px] py-2 px-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 flex items-center justify-center gap-1.5",
                          attendanceType === "PRESENT"
                            ? "bg-white text-sky-600 shadow-sm font-semibold border border-sky-100/70"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        {attendanceType === "PRESENT" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                        )}
                        <span className="whitespace-nowrap">Hadir Praktik</span>
                      </button>

                      <button
                        type="button"
                        aria-pressed={attendanceType === "SICK"}
                        onClick={() => {
                          setAttendanceType("SICK");
                          setIsNonCompetency(false);
                        }}
                        className={cn(
                          "min-h-[48px] py-2 px-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 flex items-center justify-center gap-1.5",
                          attendanceType === "SICK"
                            ? "bg-white text-rose-600 shadow-sm font-semibold border border-rose-100/70"
                            : "text-slate-600 hover:text-rose-600"
                        )}
                      >
                        {attendanceType === "SICK" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        )}
                        <span className="whitespace-nowrap">Sakit</span>
                      </button>

                      <button
                        type="button"
                        aria-pressed={attendanceType === "PERMIT"}
                        onClick={() => {
                          setAttendanceType("PERMIT");
                          setIsNonCompetency(false);
                        }}
                        className={cn(
                          "min-h-[48px] py-2 px-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 flex items-center justify-center gap-1.5",
                          attendanceType === "PERMIT"
                            ? "bg-white text-amber-700 shadow-sm font-semibold border border-amber-100/70"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        {attendanceType === "PERMIT" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        )}
                        <span className="whitespace-nowrap">Izin Resmi</span>
                      </button>
                    </div>

                    {/* Attendance Notice for Sakit / Izin */}
                    {isSickOrPermit && (
                      <div
                        className={cn(
                          "p-3 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-150 motion-reduce:animate-none",
                          attendanceType === "SICK"
                            ? "bg-rose-50/80 border-rose-200/70 text-rose-900"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        )}
                      >
                        <p className="font-semibold flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>
                            {attendanceType === "SICK"
                              ? "Presensi Sakit — Surat Dokter Wajib Dilampirkan"
                              : "Presensi Izin — Lampirkan Surat Dispensasi Resmi"}
                          </span>
                        </p>
                        <p className="mt-1 text-xs opacity-90 leading-normal font-normal">
                          Status tercatat resmi dan tidak dianggap alpha. Terverifikasi oleh mentor industri via PIN.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Tanggal Pelaksanaan Kegiatan (BR-003: H to H-3) */}
                <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3">
                  <SmartDateSelector
                    selectedDate={selectedDate}
                    onSelectDate={(newDate) => setSelectedDate(newDate)}
                    minDate={minDate}
                    maxDate={today}
                    offlineLogs={offlineLogs}
                    className="py-0 border-b-0 h-full flex flex-col justify-between"
                  />
                </div>
              </div>

              {/* 3. Durasi Jam Kerja Industri (Shift Presensi - BR-002, hanya jika Hadir) */}
              {!isSickOrPermit && (
                <div className="space-y-4">
                  <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                    <SmartShiftSelector
                      durationJp={durationJp}
                      onChangeDuration={(newVal) => {
                        hasUserManuallyChangedDuration.current = true;
                        setDurationJp(newVal);
                      }}
                      overtimeReason={overtimeReason}
                      onChangeOvertimeReason={setOvertimeReason}
                      minJp={!isNonCompetency ? Math.max(MIN_DAILY_JP, selectedJobCardIds.length) : MIN_DAILY_JP}
                      maxJp={MAX_DAILY_JP}
                      isSaturday={isSaturday}
                      isWeekday={isWeekday}
                      existingDailyJp={existingDailyJp}
                      remainingDailyQuota={remainingDailyQuota}
                      onResetTodayLogs={isDemoMode ? handleResetTodayLogsForDemo : undefined}
                      className="py-0 border-b-0"
                    />
                  </div>

                  {/* Peringatan K3 Siswa & Workload Alert (Alert card tunggal dengan border semantik) */}
                  {(weeklyWorkStats.isCriticalOverwork || weeklyWorkStats.isWarningOverwork) && (
                    <div
                      className={cn(
                        "p-4 rounded-2xl border space-y-3 transition-all animate-in fade-in duration-200 motion-reduce:animate-none",
                        weeklyWorkStats.isCriticalOverwork
                          ? "bg-rose-50/70 border-rose-200 text-rose-900"
                          : "bg-amber-50/70 border-amber-200 text-amber-900"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs",
                              weeklyWorkStats.isCriticalOverwork
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            )}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">
                              {weeklyWorkStats.isCriticalOverwork
                                ? "Peringatan K3: Overwork"
                                : "Perhatian K3: Jam Tinggi"}
                            </p>
                            <p className="text-xs text-slate-600 truncate">
                              {weeklyWorkStats.isCriticalOverwork
                                ? `Melebihi ${STUDENT_OVERWORK_CRITICAL_HOURS} jam / lembur berlebih`
                                : `Mendekati ${STUDENT_MAX_NORMAL_WEEKLY_HOURS} jam normal mingguan`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-semibold block font-mono">
                            {weeklyWorkStats.totalWeeklyHours} / {STUDENT_MAX_NORMAL_WEEKLY_HOURS} Jam
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">Minggu Ini</span>
                        </div>
                      </div>

                      {/* Dual-Representation Education Callout */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="text-slate-600 flex items-center gap-1 font-normal">
                          <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                          <span>Estimasi Beban Belajar:</span>
                        </span>
                        <span className="font-semibold text-slate-800 text-xs font-mono">
                          ≈ {convertRealHoursToJp(durationJp).toFixed(1)} JP ({projectedPercentage}% target)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────
              STEP 2 — “PILIH TUGAS”
              Bagian kartu pekerjaan dan mode non-teknis dalam list vertikal satu kolom
          ───────────────────────────────────────────────────────────────────────── */}
          {step === 2 && !isSickOrPermit && (
            <div className="pt-3 space-y-4 animate-in fade-in duration-200">
              {/* Header Kartu Pekerjaan & Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest flex items-center gap-1.5 flex-wrap mb-1">
                    <Layers className="w-3.5 h-3.5 text-sky-600" />
                    <span>{isNonCompetency ? "Laporan Tugas Operasional Umum" : "Kartu Pekerjaan Ditugaskan DUDI"}</span>
                    {!isNonCompetency && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {selectedJobCardIds.length} dari 3 Dipilih
                      </span>
                    )}
                  </span>
                  <p className="text-xs text-slate-600 font-normal">
                    {isNonCompetency
                      ? `Penugasan pendukung industri dilaporkan transparan. Jam PKL tetap diakui penuh (${durationJp} Jam Kerja).`
                      : "Pilih 1 sampai 3 kartu tugas yang diarahkan pembimbing industri hari ini"}
                  </p>
                </div>

                {/* Quick Actions: Salin Kemarin & Tugas Non-Teknis */}
                <div className="flex items-center gap-2 shrink-0">
                  {recentPreviousLog && !isNonCompetency && (
                    <button
                      type="button"
                      onClick={handleCopyYesterday}
                      className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 transition cursor-pointer active:scale-95 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                      title={`Salin tugas & durasi dari log ${recentPreviousLog.logDate}`}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Salin Kemarin</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsNonCompetency(!isNonCompetency)}
                    className={cn(
                      "inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95 border shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                      isNonCompetency
                        ? "bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-2xs"
                    )}
                  >
                    <Sparkles className={cn("w-3.5 h-3.5", isNonCompetency ? "text-amber-400" : "text-slate-500")} />
                    <span>{isNonCompetency ? "Kembali ke Kartu Kejuruan" : "Tugas Non-Teknis"}</span>
                  </button>
                </div>
              </div>

              {isNonCompetency ? (
                /* Bantuan Operasional Non-RPL (Palet Netral/Slate) */
                <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in motion-reduce:animate-none duration-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                      <Sparkles className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                        Pelaporan Tugas Operasional Umum (Non-Teknis)
                      </h3>
                      <p className="text-xs text-slate-600 font-normal leading-relaxed">
                        Bila hari ini Anda ditugaskan membantu administrasi kantor, merapikan inventaris gudang, pengiriman kurir, atau kasir toko, laporkan secara apa adanya.
                      </p>
                    </div>
                  </div>

                  <div className="bg-transparent border-0 pl-0 py-1 text-xs text-slate-600 flex items-start sm:items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                    <p className="leading-relaxed">
                      <strong className="font-medium text-slate-800">Hak Kehadiran Terjamin 100%:</strong>{" "}
                      <span>
                        Jam kehadiran PKL tetap dihitung penuh dan nilai rapor tidak akan dikurangi. Data ini membantu guru pembimbing memantau kesesuaian pembelajaran Anda di DUDI.
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Pilih Kategori Tugas Operasional:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {[
                        {
                          id: "ADMIN_UMUM",
                          label: "Administrasi Dokumen",
                          desc: "Fotokopi, arsip faktur, input data",
                          icon: FileText,
                        },
                        {
                          id: "KEBERSIHAN_GUDANG",
                          label: "Gudang & Inventaris",
                          desc: "Pengecekan stok, penataan barang",
                          icon: Package,
                        },
                        {
                          id: "KURIR",
                          label: "Kurir & Distribusi",
                          desc: "Pengantaran dokumen/logistik",
                          icon: Truck,
                        },
                        {
                          id: "JAGA_TOKO",
                          label: "Kasir & Layanan Toko",
                          desc: "Pelayanan transaksi & operasional",
                          icon: Store,
                        },
                      ].map((cat) => {
                        const IconComp = cat.icon;
                        const isCatActive = nonCompetencyCategory === cat.id;

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            aria-pressed={isCatActive}
                            onClick={() => setNonCompetencyCategory(cat.id)}
                            className={cn(
                              "p-3.5 rounded-2xl text-left transition-all duration-150 cursor-pointer flex flex-col justify-between relative group active:scale-[0.98] min-h-[90px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                              isCatActive
                                ? "bg-slate-900 text-white shadow-xs"
                                : "bg-white shadow-sm hover:shadow border border-slate-100"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                                  isCatActive
                                    ? "bg-white/20 text-white border-white/30 shadow-2xs"
                                    : "bg-slate-100 text-slate-600 border-slate-200/60"
                                )}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div
                                className={cn(
                                  "w-4 h-4 rounded-full flex items-center justify-center transition-all",
                                  isCatActive
                                    ? "bg-sky-400 text-slate-950"
                                    : "border border-slate-300 bg-white"
                                )}
                              >
                                {isCatActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </div>
                            <div>
                              <p
                                className={cn(
                                  "text-xs font-semibold leading-tight",
                                  isCatActive ? "text-white" : "text-slate-900"
                                )}
                              >
                                {cat.label}
                              </p>
                              <p
                                className={cn(
                                  "text-xs font-normal mt-0.5 leading-snug",
                                  isCatActive ? "text-slate-300" : "text-slate-500"
                                )}
                              >
                                {cat.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Kartu Pekerjaan Teknis Kejuruan: List Vertikal Satu Kolom */
                <div className="space-y-3">
                  {/* Category Filter Pills & Search (Sticky top-0 di dalam area scroll) */}
                  <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md py-3 border-b border-slate-100 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
                    {/* Search Input di sebelah kiri/atas */}
                    <div className="relative w-full sm:w-64 shrink-0">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        aria-label="Cari tugas pekerjaan atau kompetensi"
                        value={jobCardSearch}
                        onChange={(e) => setJobCardSearch(e.target.value)}
                        placeholder="Cari tugas pekerjaan..."
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[38px]"
                      />
                    </div>

                    {/* Deretan Pill Kategori (Horizontal scroll tanpa wrap yang berantakan) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap pb-1 sm:pb-0">
                      {uniqueCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          aria-pressed={jobCardCategory === cat}
                          onClick={() => setJobCardCategory(cat)}
                          className={cn(
                            "min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer active:scale-95 shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                            jobCardCategory === cat
                              ? "bg-slate-900 text-white shadow-2xs"
                              : "bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100"
                          )}
                        >
                          {cat === "ALL" ? "Semua Kategori" : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Limit Warning Message */}
                  {cardLimitError && (
                    <div
                      role="alert"
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2 animate-in fade-in motion-reduce:animate-none"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{cardLimitError}</span>
                    </div>
                  )}

                  {/* Empty State with Reset Filter */}
                  {filteredJobCards.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl shadow-sm space-y-3 border border-slate-100">
                      <p className="text-xs sm:text-sm text-slate-600">
                        Tidak ada tugas yang cocok. Coba kata kunci lain.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setJobCardSearch("");
                          setJobCardCategory("ALL");
                        }}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold transition active:scale-95 cursor-pointer shadow-2xs"
                      >
                        Reset filter
                      </button>
                    </div>
                  ) : (
                    /* List Vertikal Satu Kolom (Posisi stabil menggunakan filteredJobCards tanpa layout shift) */
                    <div className="flex flex-col gap-2.5 pt-1">
                      {filteredJobCards.map((card) => {
                        const isSelected = selectedJobCardIds.includes(card.id);
                        const orderIndex = selectedJobCardIds.indexOf(card.id);
                        const isLimitReached = selectedJobCardIds.length >= 3 && !isSelected;
                        const currentCardAutonomy = cardAutonomyMap[card.id] || autonomyLevel;

                        return (
                          <div
                            key={card.id}
                            onClick={() => {
                              if (isLimitReached) return;
                              handleToggleJobCard(card.id);
                            }}
                            className={cn(
                              "p-4 sm:p-5 rounded-2xl bg-white shadow-sm text-left transition-all duration-150 flex flex-col relative border",
                              isSelected
                                ? "bg-sky-50/40 border-sky-300 ring-1 ring-sky-400/80 shadow-sm"
                                : isLimitReached
                                  ? "border-slate-100 opacity-60 cursor-not-allowed"
                                  : "border-slate-100 hover:bg-slate-50/60 hover:border-slate-200 cursor-pointer"
                            )}
                          >
                            {/* Susunan Atas: Checkbox 44x44px + Badge Kategori & SKKNI + Judul Tugas */}
                            <div className="flex items-start gap-3">
                              {/* Checkbox 44x44px di kiri */}
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={isSelected}
                                aria-disabled={isLimitReached}
                                aria-label={`Pilih tugas ${card.title}`}
                                disabled={isLimitReached}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleJobCard(card.id);
                                }}
                                className={cn(
                                  "w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer mt-0.5",
                                  isSelected
                                    ? "bg-sky-500 text-white shadow-xs"
                                    : "border-2 border-slate-200 hover:border-slate-400 bg-white"
                                )}
                              >
                                {isSelected ? (
                                  selectedJobCardIds.length > 1 ? (
                                    <span className="text-xs font-bold font-mono">#{orderIndex + 1}</span>
                                  ) : (
                                    <Check className="w-5 h-5 stroke-[2.5]" />
                                  )
                                ) : null}
                              </button>

                              {/* Judul + Badge Kategori & SKKNI di tengah secara utuh */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                                    {card.category}
                                  </span>
                                  {card.skkni && (
                                    <span className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded-md shrink-0">
                                      {card.skkni}
                                    </span>
                                  )}
                                  {isSelected && (
                                    <span className="text-[11px] font-semibold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-md shrink-0">
                                      Terpilih
                                    </span>
                                  )}
                                </div>
                                <h3
                                  className={cn(
                                    "text-xs sm:text-sm font-semibold leading-snug",
                                    isSelected ? "text-sky-950 font-bold" : "text-slate-800"
                                  )}
                                >
                                  {card.title}
                                </h3>
                              </div>
                            </div>

                            {/* Bagian Bawah: Pemilih Tingkat Penguasaan SOP (Segmented Pills 1-Tap) */}
                            {isSelected && (
                              <div
                                className="pt-3 mt-3 border-t border-sky-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="text-slate-500 font-medium">Tingkat Penguasaan:</span>
                                  <span className="text-sky-700 font-semibold font-mono">
                                    {AUTONOMY_LEVEL_OPTIONS.find((opt) => opt.level === currentCardAutonomy)?.label}
                                    <span className="text-slate-400 font-normal"> ({AUTONOMY_LEVEL_OPTIONS.find((opt) => opt.level === currentCardAutonomy)?.badge})</span>
                                  </span>
                                </div>

                                {/* 3 Tombol Segmented Pill */}
                                <div
                                  role="radiogroup"
                                  aria-label={`Tingkat penguasaan untuk ${card.title}`}
                                  className="flex items-center p-1 bg-slate-100/90 rounded-xl gap-1 shrink-0 self-start sm:self-auto"
                                >
                                  {AUTONOMY_LEVEL_OPTIONS.map((opt) => {
                                    const isLvlActive = currentCardAutonomy === opt.level;
                                    return (
                                      <button
                                        key={opt.level}
                                        type="button"
                                        role="radio"
                                        aria-checked={isLvlActive}
                                        aria-label={`${opt.label} (${opt.badge})`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSetCardAutonomy(card.id, opt.level);
                                        }}
                                        className={cn(
                                          "min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer active:scale-95 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                                          isLvlActive
                                            ? "bg-white text-sky-700 font-semibold shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                        )}
                                      >
                                        <span>{opt.label}</span>
                                        {isLvlActive && <Check className="w-3 h-3 text-sky-600 stroke-[2.5]" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Single-Line Compact Time Allocation Bar */}
                  {selectedJobCardIds.length > 0 && (
                    <div className="px-4 py-3 bg-white rounded-2xl shadow-sm text-xs flex items-center justify-between border border-slate-200/80 mt-2">
                      <span className="text-slate-600 font-normal">Alokasi Waktu ({selectedJobCardIds.length} tugas):</span>
                      <span className="font-semibold text-sky-700 text-xs">
                        {selectedJobCardIds.length === 1
                          ? `${durationJp} Jam Kerja penuh (Fokus 1 tugas)`
                          : selectedJobCardIds.length === 2
                            ? `${Math.ceil(durationJp / 2)} Jam + ${Math.floor(durationJp / 2)} Jam (${durationJp} Jam total)`
                            : `Dibagi rata ke 3 tugas (${durationJp} Jam total)`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────
              STEP 3 — “BUKTI & CATATAN”
              Upload foto bukti praktik & catatan singkat aktivitas
          ───────────────────────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="pt-3 space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                {/* 5. Upload Foto Bukti Praktik & Kuas Sensor Privasi (Sub-card seragam) */}
                <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between h-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <h3 className="text-[11px] font-medium text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-sky-600" />
                        <span>
                          {attendanceType === "SICK"
                            ? "Foto Surat Keterangan Dokter"
                            : attendanceType === "PERMIT"
                              ? "Foto Surat Izin / Dispensasi"
                              : "Foto Bukti Praktik"}
                        </span>
                      </h3>
                      <span
                        className={cn(
                          "text-[11px] font-medium px-2 py-0.5 rounded-full",
                          attendanceType === "SICK"
                            ? "bg-rose-50 text-rose-700 font-semibold"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {attendanceType === "SICK" ? "Wajib" : "Opsional"}
                      </span>
                    </div>

                    {/* Hidden file inputs: one with capture, one without */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      disabled={isCompressingPhoto}
                    />
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      disabled={isCompressingPhoto}
                    />

                    {isCompressingPhoto && (
                      <div className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-sky-50 border border-sky-200/80 text-sky-800 text-xs font-medium animate-pulse motion-reduce:animate-none shadow-2xs">
                        <Paintbrush className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none text-sky-600" />
                        <span>Sedang memproses &amp; mengompresi foto bukti otomatis...</span>
                      </div>
                    )}

                    {photoPreviewUrl && compressedPhoto ? (
                      <div className="space-y-3">
                        {/* Photo Container */}
                        <div className="relative rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-60 border border-slate-200/70 shadow-xs">
                          <img
                            src={photoPreviewUrl}
                            alt="Pratinjau bukti kerja"
                            className="max-h-60 w-auto object-contain"
                          />

                          {/* Sensor Active Badge Overlay */}
                          {applyPrivacyBlur && (
                            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-sm border border-sky-400/40 text-xs font-medium text-sky-300 flex items-center gap-1.5 shadow-sm">
                              <EyeOff className="w-3.5 h-3.5 text-sky-400" />
                              <span>Sensor Privasi DUDI Aktif</span>
                            </div>
                          )}

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            aria-label="Hapus foto bukti"
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-rose-600 transition cursor-pointer active:scale-95 shadow-sm min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Hapus foto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Info Bar & Dedicated Privacy Studio Action (Alur vertikal bersih tanpa nested boxes) */}
                        <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-slate-700 font-medium bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                              <span>{compressedPhoto.savingsText}</span>
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">Siap diverifikasi</span>
                          </div>

                          {rawPhotoFile && (
                            <button
                              type="button"
                              onClick={() => setShowPrivacyStudio(true)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{applyPrivacyBlur ? "Ubah Sensor Privasi" : "Buka Kuas Sensor"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Button 1: Kamera Langsung */}
                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            disabled={isCompressingPhoto}
                            className="p-3.5 min-h-[72px] rounded-2xl border border-dashed border-slate-300 hover:border-sky-500 bg-white hover:bg-sky-50/20 flex flex-col items-center justify-center cursor-pointer transition-all group shadow-2xs active:scale-[0.99]"
                          >
                            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                              <Camera className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-sky-600 transition">
                              Ambil Foto Kamera Langsung
                            </span>
                            <span className="text-xs text-slate-600 mt-0.5">
                              Buka kamera smartphone seketika
                            </span>
                          </button>

                          {/* Button 2: Pilih dari Galeri */}
                          <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            disabled={isCompressingPhoto}
                            className="p-3.5 min-h-[72px] rounded-2xl border border-dashed border-slate-300 hover:border-sky-500 bg-white hover:bg-sky-50/20 flex flex-col items-center justify-center cursor-pointer transition-all group shadow-2xs active:scale-[0.99]"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                              <ImageIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-sky-600 transition">
                              Pilih dari Galeri Foto
                            </span>
                            <span className="text-xs text-slate-600 mt-0.5">
                              Foto dokumentasi yang sudah diambil
                            </span>
                          </button>
                        </div>

                        {/* Button 3: Demo Instan Juri (Hanya muncul jika NEXT_PUBLIC_DEMO_MODE=true) */}
                        {isDemoMode && (
                          <button
                            type="button"
                            onClick={handleUseDemoPhoto}
                            disabled={isCompressingPhoto}
                            className="w-full min-h-[40px] py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-sky-800 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs active:scale-[0.99]"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                            <span>
                              {attendanceType === "SICK"
                                ? "Gunakan Contoh Surat Dokter (Simulasi Demo)"
                                : attendanceType === "PERMIT"
                                  ? "Gunakan Contoh Surat Dispensasi (Simulasi Demo)"
                                  : "Gunakan Foto Demo Praktik (Simulasi Layar Monitor & Kuas Sensor Privasi)"}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Catatan Singkat Aktivitas / Diagnosa Medis (Sub-card seragam) */}
                <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between h-full">
                  <div className="space-y-3 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="short-note" className="text-[11px] font-medium text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-sky-600" />
                        <span>{isSickOrPermit ? "Keterangan Sakit / Izin" : "Catatan Singkat Aktivitas"}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowSuggestions((prev) => !prev)}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-medium border border-sky-100 transition cursor-pointer active:scale-95"
                        >
                          Isi cepat
                        </button>
                        <span className="text-xs text-slate-400 font-mono">
                          {shortNote.length}/250
                        </span>
                      </div>
                    </div>

                    <textarea
                      id="short-note"
                      value={shortNote}
                      onChange={(e) => setShortNote(e.target.value)}
                      maxLength={250}
                      rows={3}
                      placeholder={
                        attendanceType === "SICK"
                          ? "Diagnosa dokter atau kondisi sakit..."
                          : attendanceType === "PERMIT"
                            ? "Alasan izin / dispensasi kegiatan..."
                            : "Ringkasan kendala atau fitur yang diselesaikan hari ini..."
                      }
                      className="w-full flex-1 min-h-[96px] text-xs sm:text-sm p-3.5 rounded-xl bg-white border border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition resize-none"
                    />

                    {/* Quick Suggestion Chips (Tersembunyi secara default, toggle dengan 'Isi cepat') */}
                    {showSuggestions && (
                      <div className="space-y-1.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                            <span>Rekomendasi Cepat (1-Klik):</span>
                          </span>
                          {shortNote && (
                            <button
                              type="button"
                              onClick={() => setShortNote("")}
                              className="text-xs text-slate-500 hover:text-rose-600 transition underline cursor-pointer"
                            >
                              Hapus Catatan
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {(attendanceType === "PRESENT"
                            ? [
                              "Menyelesaikan implementasi modul sesuai SOP industri",
                              "Melakukan pengujian fitur & penelusuran bug bersama mentor",
                              "Mengikuti daily standup briefing & evaluasi progres kerja",
                              "Mempelajari rancangan sistem baru dan dokumentasi API",
                            ]
                            : attendanceType === "SICK"
                              ? [
                                "Demam dan flu, istirahat rawat jalan anjuran dokter",
                                "Kondisi fisik menurun, surat keterangan dokter terlampir",
                                "Pemeriksaan medis di faskes terdekat",
                              ]
                              : [
                                "Dispensasi resmi mewakili kegiatan perlombaan sekolah",
                                "Keperluan administrasi keluarga mendesak",
                                "Ujian sertifikasi kompetensi kejuruan sekolah",
                              ]
                          ).map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                setShortNote((prev) => {
                                  if (!prev.trim()) return suggestion;
                                  if (prev.includes(suggestion)) return prev;
                                  const combined = `${prev.trim()}. ${suggestion}`;
                                  return combined.slice(0, 250);
                                });
                              }}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-white hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 text-slate-700 border border-slate-200/80 transition-all cursor-pointer active:scale-95 shadow-2xs text-left"
                            >
                              + {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Desktop Action Buttons Bar (Satu baris dengan tombol step) ─── */}
          <div className="hidden lg:flex items-center justify-between gap-3 pt-5 border-t border-slate-100">
            <div>
              {step === 1 ? (
                <Link
                  href="/student/home"
                  className="min-h-[44px] py-2.5 px-6 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition border border-slate-200/80"
                >
                  <span>Batalkan &amp; Kembali</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="min-h-[44px] py-2.5 px-6 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition border border-slate-200/80 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={step === 1 ? isStep1Disabled : isStep2Disabled}
                  className="min-h-[44px] py-2.5 px-8 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white rounded-full text-xs sm:text-sm font-semibold shadow-pill transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Lanjut</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  {submitDisabled && disabledReason && (
                    <span className="text-xs text-slate-700 bg-slate-50 px-3.5 py-2 rounded-full border border-slate-200 flex items-center gap-1.5 shadow-2xs animate-in fade-in motion-reduce:animate-none">
                      <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{disabledReason}</span>
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={submitDisabled}
                    className="min-h-[44px] py-2.5 px-8 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white rounded-full text-xs sm:text-sm font-semibold shadow-pill transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{submitLabel}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ─── Bottom Status & Quick Action Footer (Group E.4) ─── */}
        <div className="pt-5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-normal">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                isOnline ? "bg-emerald-500" : "bg-amber-500"
              )}
            />
            <span className="text-xs text-slate-600 font-medium">
              {isOnline
                ? "Tersimpan di HP, otomatis terkirim saat online"
                : "Mode Offline: Tersimpan di HP"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/student/log/history"
              className="text-slate-700 hover:text-slate-900 font-semibold text-xs hover:underline flex items-center gap-1 min-h-[36px]"
            >
              <span>Lihat Riwayat Jurnal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MOBILE STICKY STEP NAVIGATION BAR (Selalu satu baris sesuai Apple HIG)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 md:left-[88px] lg:left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 lg:hidden shadow-lg">
        <div className="flex items-center justify-between gap-3 min-h-[44px]">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {stepSummaryText}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="min-h-[44px] px-3.5 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={step === 1 ? isStep1Disabled : isStep2Disabled}
                className="min-h-[44px] px-5 py-2 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white rounded-full text-xs font-semibold shadow-pill transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Lanjut</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitDisabled}
                className="min-h-[44px] px-5 py-2 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white rounded-full text-xs font-semibold shadow-pill transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Menyimpan..." : "Simpan Jurnal"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Apple HIG Toast for Top Error & Notification (Slide-in, Auto-dismiss 4s) */}
      {toast && (
        <div
          role="alert"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full shadow-xl animate-in fade-in slide-in-from-top-3 flex items-center gap-2 pointer-events-auto max-w-[90vw] text-center justify-center border border-slate-700/50"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. CONFIRMATION MODAL & INSTANT MENTOR HAND-OFF
      ───────────────────────────────────────────────────────────────────────────── */}
      {submittedLogUuid && typeof document !== "undefined" && createPortal(
        <div
          ref={modalSuccessRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-success-title"
          className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-0 duration-150 motion-reduce:animate-none"
          style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-modal border border-slate-200/80 space-y-4 animate-in zoom-in-95 duration-150 motion-reduce:animate-none text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center mx-auto shadow-2xs">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div>
              <h2 id="modal-success-title" className="text-lg font-semibold text-slate-900 tracking-tight">
                Jurnal Berhasil Disimpan!
              </h2>
              <p className="text-xs text-slate-600 mt-1 font-normal">
                Data tersimpan di penyimpanan offline perangkat Anda dan siap diverifikasi oleh mentor industri.
              </p>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Status Presensi:</span>
                <span className="font-semibold text-sky-700">
                  {attendanceType === "PRESENT"
                    ? "Hadir Praktik"
                    : attendanceType === "SICK"
                      ? "Sakit (Surat Dokter)"
                      : "Izin Resmi"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Status Antrean:</span>
                <span className="font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/70 text-xs">
                  Tersimpan Offline (Siap Sinkron)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Durasi:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {durationJp} Jam Kerja
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Bukti Foto / Surat:</span>
                <span className="font-semibold text-slate-900">
                  {compressedPhoto ? `Foto Terlampir (${(compressedPhoto.sizeBytes / 1024).toFixed(1)} KB)` : "Tanpa Foto"}
                </span>
              </div>

              {/* Daftar Kartu Pekerjaan & Tingkat Per Kartu (Group E.6 & Kelompok 3.17) */}
              {attendanceType === "PRESENT" && !isNonCompetency && selectedJobCardsDetail.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Kartu Pekerjaan Terpilih:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedJobCardsDetail.map((card) => {
                      const level = cardAutonomyMap[card.id] || autonomyLevel;
                      const levelLabel =
                        level === 3 ? "Mandiri (SOP)" : level === 2 ? "Terbimbing" : "Observasi";
                      return (
                        <div
                          key={card.id}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-2"
                        >
                          <span className="font-medium text-slate-800 truncate">{card.title}</span>
                          <span className="shrink-0 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold text-xs border border-sky-100">
                            {levelLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Instant Mentor Verification Hand-Off Buttons (Pill-shaped) */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-pill cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Minta Validasi PIN Mentor Sekarang (QR)</span>
              </button>

              {(() => {
                const mentorDisplayName = activePlacement?.mentorName || (isDemoMode ? "Bpk. Rizky Firmansyah" : "Bapak/Ibu Mentor");
                const tasksSummary = isNonCompetency
                  ? "Tugas Operasional Umum"
                  : selectedJobCardsDetail.length > 0
                    ? selectedJobCardsDetail.map((c) => c.title).slice(0, 2).join(", ") + (selectedJobCardsDetail.length > 2 ? `, dan ${selectedJobCardsDetail.length - 2} tugas lainnya` : "")
                    : `${durationJp} Jam Kerja`;

                if (isDemoMode) {
                  const demoVerificationUrl = "https://vokalink.id/v/andi-pratama-rpl-2026";
                  const waMessage = `Halo ${mentorDisplayName}, saya telah mengisi jurnal PKL VokaLink hari ini (${durationJp} Jam Kerja - ${attendanceType === "PRESENT" ? tasksSummary : attendanceType === "SICK" ? "Sakit (Surat Dokter)" : "Izin Resmi"}). Mohon kesediaannya untuk memvalidasi logbook saya melalui tautan berikut: ${demoVerificationUrl}`;

                  return (
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(waMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-xs"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Kirim Tautan ke WhatsApp Mentor</span>
                    </a>
                  );
                }

                return (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 text-left flex items-start gap-2">
                    <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      Tautan verifikasi WhatsApp dapat dibagikan setelah jurnal berhasil disinkronkan ke server. Untuk verifikasi langsung di tempat saat ini, silakan tunjukkan kode QR mentor di atas.
                    </span>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="py-2.5 px-3 min-h-[40px] rounded-full bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-semibold text-xs transition cursor-pointer border border-slate-200/80"
                >
                  Catat Log Lain
                </button>
                <Link
                  href="/student/log/history"
                  className="py-2.5 px-3 min-h-[40px] rounded-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <span>Lihat Riwayat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Accessible Mentor QR Modal triggered from Confirmation Hand-off */}
      {showQrModal && (
        <MentorQrModal
          onClose={() => setShowQrModal(false)}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. PHOTO PRIVACY STUDIO MODAL (Draw-to-Blur & Pixelate Brush)
      ───────────────────────────────────────────────────────────────────────────── */}
      {showPrivacyStudio && rawPhotoFile && (
        <PhotoPrivacyStudioModal
          imageFile={rawPhotoFile}
          onSave={(result) => {
            setCompressedPhoto(result);
            if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
            setPhotoPreviewUrl(URL.createObjectURL(result.blob));
            setApplyPrivacyBlur(true);
          }}
          onClose={() => setShowPrivacyStudio(false)}
        />
      )}
    </form>
  );
}
