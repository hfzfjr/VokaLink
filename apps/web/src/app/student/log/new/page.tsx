"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Calendar,
  Layers,
  Sparkles,
  Camera,
  ShieldCheck,
  Check,
  Clock,
  Info,
  X,
  ArrowRight,
  HeartPulse,
  FileText,
  UserCheck,
  Building2,
  ChevronRight,
  Search,
  Image as ImageIcon,
  QrCode,
  Share2,
  AlertTriangle,
  TrendingUp,
  Paintbrush,
  EyeOff,
  Minus,
  Plus,
  ChevronDown,
  SlidersHorizontal,
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
import { fetchStudentLogContext, type StudentLogContextResponse } from "@/lib/api";
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
    id: "00000000-0000-0000-0000-000000000031",
    title: "Implementasi REST API & Router Express",
    tools: ["Express", "TypeScript"],
    skkni: "J.620100.009.01",
    category: "Backend Development",
  },
  {
    id: "00000000-0000-0000-0000-000000000032",
    title: "Slicing UI Responsif Tailwind CSS",
    tools: ["Next.js", "Tailwind CSS"],
    skkni: "J.620100.012.01",
    category: "Frontend UI/UX",
  },
  {
    id: "00000000-0000-0000-0000-000000000033",
    title: "Desain Skema Database & Migrasi Prisma",
    tools: ["PostgreSQL", "Prisma ORM"],
    skkni: "J.620100.010.01",
    category: "Database & Storage",
  },
  {
    id: "00000000-0000-0000-0000-000000000035",
    title: "Pengujian Unit Testing & Integrasi API",
    tools: ["Vitest", "Supertest"],
    skkni: "J.620100.015.01",
    category: "Quality Assurance",
  },
];

const DEFAULT_NON_COMPETENCY_JC = {
  id: "00000000-0000-0000-0000-000000000037",
  title: "Bantuan Operasional Umum",
};

const DEFAULT_PLACEMENT_ID = "00000000-0000-0000-0000-000000000051";

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

  // Multi-Job Cards state (1 to 3 job cards per daily log, PRD FR-005)
  const [selectedJobCardIds, setSelectedJobCardIds] = useState<string[]>([]);

  // Submission state & Modals
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLogUuid, setSubmittedLogUuid] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

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

  // 2. Kalkulasi Dampak Progres Terhadap Target 792 JP
  const baseVerifiedJp = 288;
  const currentTotalJp = baseVerifiedJp + offlineLogs.reduce((acc, curr) => acc + curr.durationJp, 0);
  const projectedTotalJp = currentTotalJp + (attendanceType === "PRESENT" ? durationJp : 0);
  const projectedPercentage = Math.min(100, Math.round((projectedTotalJp / TOTAL_TARGET_JP) * 100));

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

  // State ekspander untuk pengaturan jam kustom (1–12)
  const [showCustomHours, setShowCustomHours] = useState(false);

  const isSaturday = useMemo(() => {
    const d = new Date(selectedDate);
    return !isNaN(d.getTime()) && d.getDay() === 6;
  }, [selectedDate]);

  const isWeekday = useMemo(() => {
    const d = new Date(selectedDate);
    return !isNaN(d.getTime()) && d.getDay() >= 1 && d.getDay() <= 5;
  }, [selectedDate]);

  const currentShiftSummary = useMemo(() => {
    switch (durationJp) {
      case 8:
        return "Full Day (5 Hari Kerja)";
      case 7:
        return "Full Day (6 Hari Kerja)";
      case 6:
        return "Shift Pagi / Sore";
      case 5:
        return "Shift Sabtu";
      case 4:
        return "Setengah Hari";
      case 9:
        return "Jam Tambahan (9 Jam)";
      case 10:
        return "Jam Tambahan (10 Jam)";
      default:
        return `${durationJp} Jam Kerja Industri`;
    }
  }, [durationJp]);

  // Draft auto-save and recovery
  const [hasDraft, setHasDraft] = useState(false);

  // Smart Default Effect: Otomatis memilih jam kerja sesuai hari kerja & pola DUDI (FR-003 / Permendikbud)
  useEffect(() => {
    if (!hasDraft && !hasUserManuallyChangedDuration.current) {
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
  }, [selectedDate, hasDraft]);

  // Auto-save draft ke localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timeout = setTimeout(() => {
      if (shortNote || selectedJobCardIds.length > 1 || durationJp !== 8) {
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
          setHasDraft(true);
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
  ]);

  // Check draft saat mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vokalink_new_log_draft_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.savedAt) {
          setHasDraft(true);
        }
      }
    } catch { }
  }, []);

  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem("vokalink_new_log_draft_v1");
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.selectedDate) setSelectedDate(parsed.selectedDate);
      if (parsed.attendanceType) setAttendanceType(parsed.attendanceType);
      if (typeof parsed.isNonCompetency === "boolean") setIsNonCompetency(parsed.isNonCompetency);
      if (parsed.nonCompetencyCategory) setNonCompetencyCategory(parsed.nonCompetencyCategory);
      if (parsed.durationJp) setDurationJp(parsed.durationJp);
      if (parsed.autonomyLevel) setAutonomyLevel(parsed.autonomyLevel);
      if (parsed.cardAutonomyMap) setCardAutonomyMap(parsed.cardAutonomyMap);
      if (parsed.shortNote) setShortNote(parsed.shortNote);
      if (parsed.selectedJobCardIds) setSelectedJobCardIds(parsed.selectedJobCardIds);
      setHasDraft(false);
    } catch { }
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem("vokalink_new_log_draft_v1");
      setHasDraft(false);
    } catch { }
  };

  // 1-Click Copy Yesterday: Duplikasi kartu pekerjaan dan durasi kemarin (FR-005 UX)
  const recentPreviousLog = useMemo(() => {
    if (!offlineLogs || offlineLogs.length === 0) return null;
    return offlineLogs.find((l) => l.attendanceType === "PRESENT" && l.logDate < selectedDate);
  }, [offlineLogs, selectedDate]);

  const handleCopyYesterday = () => {
    if (!recentPreviousLog) return;
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

        if (typeof navigator !== "undefined" && navigator.onLine) {
          const fresh = await fetchStudentLogContext();
          if (fresh && isMounted) {
            if (fresh.activePlacement) setActivePlacement(fresh.activePlacement);
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
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Multi-select toggle handler for Job Cards
  const handleToggleJobCard = (cardId: string) => {
    setSelectedJobCardIds((prev) => {
      let updated: string[];
      if (prev.includes(cardId)) {
        updated = prev.filter((id) => id !== cardId);
      } else {
        if (prev.length >= 3) {
          return prev;
        }
        updated = [...prev, cardId];
        // Initialize autonomy for the new card if not present
        if (!cardAutonomyMap[cardId]) {
          setCardAutonomyMap((map) => ({ ...map, [cardId]: autonomyLevel }));
        }
      }
      if (updated.length > 0 && durationJp < updated.length) {
        setDurationJp(updated.length);
      }
      return updated;
    });
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

  // Proses kompresi foto awal
  const processPhoto = async (file: File) => {
    try {
      setIsCompressingPhoto(true);
      const result = await compressEvidencePhoto(file);
      setCompressedPhoto(result);
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      const url = URL.createObjectURL(result.blob);
      setPhotoPreviewUrl(url);
    } catch (err) {
      alert("Gagal memproses foto: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  // Handle Photo selection from camera or gallery
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
          ctx.fillText("LAMPIRAN DOKUMEN MEDIS SISWA · TERENKRIPSI SHA-256 (UU PDP NO. 27/2022)", 50, 480);
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
      alert(`Tanggal ${selectedDate} sudah tercatat presensi Sakit/Izin resmi. Anda tidak dapat menambahkan jurnal praktik pada hari tidak hadir.`);
      return;
    }

    // Guard 2: Jika tanggal ini sudah ada jam hadir tercatat, tidak bisa mencatat Sakit/Izin
    if (isSickOrPermit && existingDailyJp > 0) {
      alert(`Tanggal ${selectedDate} sudah memiliki ${existingDailyJp} jam kerja tercatat. Dalam 1 hari kerja, Anda tidak dapat mencatat presensi Sakit/Izin jika sudah mengisi jam praktik.`);
      return;
    }

    // Guard 2.5: Wajib memilih minimal 1 kartu pekerjaan jika Hadir Praktik Teknis
    if (!isSickOrPermit && !isNonCompetency && selectedJobCardIds.length === 0) {
      alert("Harap pilih minimal 1 kartu pekerjaan yang Anda selesaikan hari ini sebelum menyimpan.");
      return;
    }

    // Guard 3: Batas jam kerja harian (BR-002) - hanya untuk Hadir Praktik
    if (!isSickOrPermit && isDailyLimitReached) {
      alert("Batas maksimal jam kerja harian untuk tanggal ini sudah terpenuhi (BR-002). Anda tidak dapat menambah jurnal lagi.");
      return;
    }

    if (!isSickOrPermit && durationJp > remainingDailyQuota) {
      alert(`Alokasi waktu (${durationJp} Jam Kerja) melebihi sisa batas harian untuk tanggal ini (${remainingDailyQuota} Jam Kerja). Harap sesuaikan durasi.`);
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
        shortNote: shortNote.trim() || undefined,
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
        setHasDraft(false);
      } catch { }
    } catch (error) {
      alert("Terjadi kesalahan saat menyimpan ke IndexedDB: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedLogUuid(null);
    setSelectedDate(today);
    setAttendanceType("PRESENT");
    setIsNonCompetency(false);
    setSelectedJobCardIds([jobCards[0]?.id || DEFAULT_JOB_CARDS[0]!.id]);
    setDurationJp(8);
    setAutonomyLevel(3);
    setCardAutonomyMap({});
    setShortNote("");
    setJobCardSearch("");
    setJobCardCategory("ALL");
    handleRemovePhoto();
  };

  const isSickOrPermit = attendanceType === "SICK" || attendanceType === "PERMIT";

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col lg:flex-row gap-4 sm:gap-5 items-stretch min-h-0 lg:min-h-[840px]"
    >
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. CENTER SECTION: WORKSPACE CANVAS (FORM ENTRY)
          Linear Mobile-First Reading Order: Presence -> Date -> Shift -> Cards/SOP -> Photo
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="flex-1 min-w-0 bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-slate-200/70 shadow-card flex flex-col justify-between overflow-hidden">
        <div>
          {/* ─── Header: Apple Minimalist Canvas Header ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200/70">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                Catat Jurnal Harian PKL
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                Pencatatan kartu kerja zero-typing dan presensi harian siswa SMK Kurikulum Merdeka
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 text-slate-700 text-xs font-medium border border-slate-200/60 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>Presensi: {durationJp} Jam Kerja</span>
              </div>
            </div>
          </div>

          {/* ─── DRAFT RECOVERY BANNER ─── */}
          {hasDraft && (
            <div className="mt-4 p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sky-950 animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Ditemukan Draf Belum Tersimpan</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
                    Terdapat isian jurnal sebelumnya yang tersimpan di perangkat ini.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleRestoreDraft}
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition cursor-pointer shadow-2xs active:scale-95"
                >
                  Pulihkan
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 font-medium text-xs border border-slate-200 transition cursor-pointer active:scale-95"
                >
                  Abaikan
                </button>
              </div>
            </div>
          )}

          {/* ─── BR-002 STATUS PRESENSI SAKIT / IZIN TERDAFTAR ─── */}
          {hasExistingSickOrPermit && (
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs flex items-center gap-3 text-amber-900 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Sudah Tercatat Sakit / Izin pada Tanggal Ini</p>
                <p className="text-[11px] text-amber-700 mt-0.5 font-normal">
                  Tanggal {selectedDate} sudah memiliki catatan presensi Sakit/Izin resmi. Anda tidak dapat menambahkan jurnal praktik pada hari tidak hadir.
                </p>
              </div>
            </div>
          )}

          {/* ─── Main Form Fields (Linear Sequence) ─── */}
          <div className="pt-4 space-y-4 sm:space-y-4.5">
            {/* 1. Status Kehadiran (Apple Segmented Control) */}
            <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-4.5 border border-slate-200/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Status Kehadiran Hari Ini</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Presensi PKL
                </span>
              </div>

              {/* Segmented Control iOS Style */}
              <div className="bg-slate-200/50 p-1 rounded-xl grid grid-cols-3 gap-1 border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setAttendanceType("PRESENT")}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95",
                    attendanceType === "PRESENT"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                  )}
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Hadir Praktik</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAttendanceType("SICK");
                    setIsNonCompetency(false);
                  }}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95",
                    attendanceType === "SICK"
                      ? "bg-white text-rose-700 shadow-xs"
                      : "text-slate-600 hover:text-rose-600 hover:bg-white/40"
                  )}
                >
                  <HeartPulse className="w-3.5 h-3.5 shrink-0" />
                  <span>Sakit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAttendanceType("PERMIT");
                    setIsNonCompetency(false);
                  }}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95",
                    attendanceType === "PERMIT"
                      ? "bg-white text-amber-700 shadow-xs"
                      : "text-slate-600 hover:text-amber-600 hover:bg-white/40"
                  )}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Izin Resmi</span>
                </button>
              </div>

              {/* Attendance Notice for Sakit / Izin */}
              {isSickOrPermit && (
                <div
                  className={cn(
                    "p-3 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-150",
                    attendanceType === "SICK"
                      ? "bg-rose-50/80 border-rose-200/70 text-rose-900"
                      : "bg-amber-50/80 border-amber-200/70 text-amber-900"
                  )}
                >
                  <p className="font-semibold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {attendanceType === "SICK"
                        ? "Presensi Sakit — Lampirkan Surat Dokter / Resep"
                        : "Presensi Izin — Lampirkan Surat Dispensasi Resmi"}
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] opacity-90 leading-normal font-normal">
                    Status tercatat resmi dan tidak dianggap alpha. Jam tidak dimasukkan ke jam kompetensi agar analisis drift tetap objektif. Mentor industri tetap memverifikasi surat ini via PIN.
                  </p>
                </div>
              )}
            </div>

            {/* 2. Tanggal Pelaksanaan Kegiatan (BR-003: H to H-3) */}
            <SmartDateSelector
              selectedDate={selectedDate}
              onSelectDate={(newDate) => setSelectedDate(newDate)}
              minDate={minDate}
              maxDate={today}
              offlineLogs={offlineLogs}
            />

            {/* 3. Durasi Jam Kerja Industri (Shift Presensi - BR-002) */}
            {!isSickOrPermit && (
              <SmartShiftSelector
                durationJp={durationJp}
                onChangeDuration={(newVal) => {
                  hasUserManuallyChangedDuration.current = true;
                  setDurationJp(newVal);
                }}
                minJp={!isNonCompetency ? Math.max(MIN_DAILY_JP, selectedJobCardIds.length) : MIN_DAILY_JP}
                maxJp={MAX_DAILY_JP}
                isSaturday={isSaturday}
                isWeekday={isWeekday}
                existingDailyJp={existingDailyJp}
                remainingDailyQuota={remainingDailyQuota}
                onResetTodayLogs={handleResetTodayLogsForDemo}
              />
            )}

            {/* 4. Pilihan Kartu Pekerjaan & Penguasaan SOP (dengan Tombol Jujur Terintegrasi) */}
            {!isSickOrPermit && (
              <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-3.5">
                {/* Header Kartu Pekerjaan & Mode Switcher Tombol Jujur */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/60">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-600" />
                      <span>{isNonCompetency ? "Laporan Tugas Operasional Umum" : "Pilih Kartu Pekerjaan"}</span>
                    </span>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      {isNonCompetency
                        ? "Penugasan pendukung industri dilaporkan transparan. Jam PKL tetap diakui penuh."
                        : "Pilih 1 sampai 3 kartu tugas yang diselesaikan hari ini"}
                    </p>
                  </div>

                  {/* Quick Actions: Salin Kemarin & Tombol Jujur */}
                  <div className="flex items-center gap-2">
                    {recentPreviousLog && !isNonCompetency && (
                      <button
                        type="button"
                        onClick={handleCopyYesterday}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 transition cursor-pointer active:scale-95 shadow-2xs"
                        title={`Salin tugas & durasi dari log ${recentPreviousLog.logDate}`}
                      >
                        <RotateCcw className="w-3 h-3 text-slate-500" />
                        <span>Salin Kemarin</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsNonCompetency(!isNonCompetency)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95 border shrink-0",
                        isNonCompetency
                          ? "bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-2xs"
                          : "bg-white text-slate-700 border-amber-300 hover:bg-amber-50/80 text-amber-900 shadow-2xs"
                      )}
                    >
                      <Sparkles className={cn("w-3.5 h-3.5", isNonCompetency ? "text-amber-400" : "text-amber-500")} />
                      <span>{isNonCompetency ? "Kembali ke Kartu Kejuruan" : "Tombol Jujur (Tugas Non-Teknis)"}</span>
                    </button>
                  </div>
                </div>

                {isNonCompetency ? (
                  /* Bantuan Operasional Non-RPL (100% Transparan & Melindungi Hak Belajar Siswa) */
                  <div className="bg-gradient-to-b from-amber-50/40 via-white to-white p-5 rounded-3xl border border-amber-200/70 space-y-4 animate-in fade-in duration-200 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                        <Sparkles className="w-5 h-5 text-amber-600" />
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

                    {/* Reassuring Trust Banner */}
                    <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/70 text-xs text-emerald-950 flex items-start sm:items-center gap-3 shadow-2xs">
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                      <div className="leading-relaxed">
                        <strong className="font-semibold text-emerald-900">Hak Kehadiran Terjamin 100%:</strong>{" "}
                        <span className="text-emerald-800 font-normal">
                          Jam kehadiran PKL tetap dihitung penuh dan nilai rapor tidak akan dikurangi. Data ini membantu guru pembimbing memantau kesesuaian pembelajaran Anda di DUDI.
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
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
                              onClick={() => setNonCompetencyCategory(cat.id)}
                              className={cn(
                                "p-3.5 rounded-2xl text-left transition-all duration-150 cursor-pointer border flex flex-col justify-between relative group active:scale-[0.98]",
                                isCatActive
                                  ? "bg-amber-50/60 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                                  : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div
                                  className={cn(
                                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                                    isCatActive
                                      ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                                      : "bg-slate-100 text-slate-500 border-slate-200/60 group-hover:bg-amber-50 group-hover:text-amber-700"
                                  )}
                                >
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div
                                  className={cn(
                                    "w-4 h-4 rounded-full flex items-center justify-center transition-all",
                                    isCatActive
                                      ? "bg-amber-500 text-white"
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
                                    isCatActive ? "text-amber-950" : "text-slate-900"
                                  )}
                                >
                                  {cat.label}
                                </p>
                                <p className="text-[10px] text-slate-500 font-normal mt-0.5 leading-snug">
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
                  /* Kartu Pekerjaan Teknis Kejuruan (dengan Inline Autonomy Selector per kartu) */
                  <div className="space-y-3">
                    {/* Category Filter Pills & Search */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-between">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { id: "ALL", label: "Semua Kategori" },
                          { id: "Backend Development", label: "Backend" },
                          { id: "Frontend UI/UX", label: "Frontend" },
                          { id: "Database & Storage", label: "Database" },
                          { id: "Quality Assurance", label: "QA" },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setJobCardCategory(cat.id)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer active:scale-95",
                              jobCardCategory === cat.id
                                ? "bg-slate-900 text-white shadow-2xs"
                                : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-100"
                            )}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative min-w-[180px]">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={jobCardSearch}
                          onChange={(e) => setJobCardSearch(e.target.value)}
                          placeholder="Cari tugas / tools..."
                          className="w-full pl-8 pr-3 py-1 rounded-lg bg-white border border-slate-200/80 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    {/* Job Cards Grid (Fixed-Height Slots: 100% Simetris, Tanpa Scroll, Tanpa Pergeseran) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {filteredJobCards.map((card) => {
                        const isSelected = selectedJobCardIds.includes(card.id);
                        const orderIndex = selectedJobCardIds.indexOf(card.id);
                        const currentCardAutonomy = cardAutonomyMap[card.id] || autonomyLevel;

                        return (
                          <div
                            key={card.id}
                            onClick={() => handleToggleJobCard(card.id)}
                            className={cn(
                              "p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer group flex flex-col justify-between relative min-h-[120px]",
                              isSelected
                                ? "bg-sky-50/40 border-sky-500 ring-2 ring-sky-500/20 shadow-xs"
                                : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
                            )}
                          >
                            {/* Card Top: Category & Selection Badge */}
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[10px] font-medium text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md">
                                  {card.category}
                                </span>
                                <div
                                  className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-200",
                                    isSelected
                                      ? "bg-sky-500 text-white shadow-xs"
                                      : "border-[1.5px] border-slate-300 group-hover:border-slate-400 bg-white"
                                  )}
                                >
                                  {isSelected ? (
                                    selectedJobCardIds.length > 1 ? (
                                      `#${orderIndex + 1}`
                                    ) : (
                                      <Check className="w-3 h-3 stroke-[2.5]" />
                                    )
                                  ) : null}
                                </div>
                              </div>

                              {/* Card Title (Locked to 2 Lines for 100% Height Consistency) */}
                              <h3
                                className={cn(
                                  "text-xs sm:text-[13px] font-semibold leading-snug transition-colors line-clamp-2 h-[38px] flex items-center",
                                  isSelected ? "text-sky-950" : "text-slate-800 group-hover:text-sky-600"
                                )}
                              >
                                {card.title}
                              </h3>
                            </div>

                            {/* Card Footer: Fixed-Height Slot (h-8) — Tinggi Kartu Selalu 100% Konsisten */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100/90 h-8 flex items-center justify-between">
                              {isSelected ? (
                                <div
                                  className="w-full flex items-center justify-between gap-1.5 animate-in fade-in duration-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="text-[10.5px] font-semibold text-slate-600 shrink-0">
                                    Tingkat:
                                  </span>
                                  <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                                    {AUTONOMY_LEVEL_OPTIONS.map((opt) => (
                                      <button
                                        key={opt.level}
                                        type="button"
                                        onClick={() => handleSetCardAutonomy(card.id, opt.level)}
                                        className={cn(
                                          "px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer active:scale-95",
                                          currentCardAutonomy === opt.level
                                            ? "bg-sky-500 text-white font-semibold shadow-2xs"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                                        )}
                                        title={`${opt.label}: ${opt.desc}`}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full flex items-center justify-between text-slate-400 group-hover:text-sky-600 text-[10.5px] transition-colors">
                                  <span className="font-normal flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-sky-400 transition-colors" />
                                    Pilih tugas ini
                                  </span>
                                  <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    Klik untuk memilih →
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Single-Line Compact Time Allocation Bar */}
                    {selectedJobCardIds.length > 0 && (
                      <div className="px-3.5 py-2.5 bg-white/90 rounded-xl border border-slate-200/70 text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
                        <span className="text-slate-500 font-normal">Alokasi Waktu ({selectedJobCardIds.length} tugas):</span>
                        <span className="font-semibold text-sky-700 text-[11.5px]">
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

            {/* 5. Upload Foto Bukti Praktik (WebP) & Kuas Sensor Privasi */}
            <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-4.5 border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-sky-600" />
                  <span>
                    {attendanceType === "SICK"
                      ? "Foto Surat Keterangan Dokter"
                      : attendanceType === "PERMIT"
                        ? "Foto Surat Izin / Dispensasi"
                        : "Foto Bukti Praktik (WebP)"}
                  </span>
                </span>
                <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200/70 px-2 py-0.5 rounded-full shadow-2xs">
                  Maks 150 KB
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
                <div className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-sky-50 border border-sky-200/80 text-sky-800 text-xs font-medium animate-pulse shadow-2xs">
                  <Paintbrush className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Sedang memproses &amp; mengompresi foto bukti (&lt; 150 KB)...</span>
                </div>
              )}

              {photoPreviewUrl && compressedPhoto ? (
                <div className="p-3 bg-white rounded-2xl border border-slate-200/70 space-y-3 shadow-2xs">
                  {/* Photo Container */}
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-56">
                    <img
                      src={photoPreviewUrl}
                      alt="Pratinjau bukti kerja"
                      className="max-h-56 w-auto object-contain"
                    />

                    {/* Sensor Active Badge Overlay */}
                    {applyPrivacyBlur && (
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-sm border border-sky-400/40 text-[10px] font-medium text-sky-300 flex items-center gap-1.5 shadow-sm">
                        <EyeOff className="w-3 h-3 text-sky-400" />
                        <span>Sensor Privasi DUDI Aktif</span>
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-rose-600 transition cursor-pointer active:scale-95 shadow-sm"
                      title="Hapus foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dedicated Privacy Sensor Action Bar */}
                  {rawPhotoFile && (
                    <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>
                              {attendanceType === "SICK"
                                ? "Sensor Data Medis / Privasi Pasien"
                                : attendanceType === "PERMIT"
                                  ? "Sensor Data Pribadi Dokumen"
                                  : "Sensor Dokumen / Layar DUDI"}
                            </span>
                            {applyPrivacyBlur && (
                              <span className="text-[9.5px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                                TERPASANG
                              </span>
                            )}
                          </p>
                          <p className="text-[10.5px] text-slate-500 font-normal">
                            {attendanceType === "SICK"
                              ? "Gunakan kuas sensor untuk menyamarkan diagnosa khusus atau NIK di surat dokter"
                              : attendanceType === "PERMIT"
                                ? "Gunakan kuas sensor untuk menyamarkan tanda tangan atau kontak pribadi"
                                : "Tarik kotak atau kuas untuk menyamarkan kodingan & token rahasia"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowPrivacyStudio(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{applyPrivacyBlur ? "Ubah Sensor Privasi" : "Buka Kuas Sensor"}</span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70 text-[11px]">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>{compressedPhoto.savingsText}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      SHA-256: {compressedPhoto.sha256.substring(0, 10)}...
                    </span>
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
                      className="p-3.5 rounded-2xl border border-dashed border-slate-300 hover:border-sky-500 bg-white hover:bg-sky-50/20 flex flex-col items-center justify-center cursor-pointer transition-all group shadow-2xs active:scale-[0.99]"
                    >
                      <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                        <Camera className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-sky-600 transition">
                        Ambil Foto Kamera Langsung
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Buka kamera smartphone seketika
                      </span>
                    </button>

                    {/* Button 2: Pilih dari Galeri */}
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isCompressingPhoto}
                      className="p-3.5 rounded-2xl border border-dashed border-slate-300 hover:border-sky-500 bg-white hover:bg-sky-50/20 flex flex-col items-center justify-center cursor-pointer transition-all group shadow-2xs active:scale-[0.99]"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-sky-600 transition">
                        Pilih dari Galeri Foto
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Foto dokumentasi yang sudah diambil
                      </span>
                    </button>
                  </div>

                  {/* Button 3: Demo Instan Juri (Simulasi Monitor Kodingan DUDI / Surat Medis / Dispensasi & Kuas Sensor) */}
                  <button
                    type="button"
                    onClick={handleUseDemoPhoto}
                    disabled={isCompressingPhoto}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-50 via-indigo-50 to-blue-50 hover:from-sky-100 hover:via-indigo-100 hover:to-blue-100 border border-sky-200/80 text-sky-900 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs active:scale-[0.99]"
                  >
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>
                      {attendanceType === "SICK"
                        ? "Gunakan Contoh Surat Dokter (Simulasi Demo)"
                        : attendanceType === "PERMIT"
                          ? "Gunakan Contoh Surat Dispensasi (Simulasi Demo)"
                          : "Gunakan Foto Demo Praktik (Simulasi Layar Monitor & Kuas Sensor Privasi)"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Bottom Status & Quick Action Footer ─── */}
        <div className="pt-5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-normal">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px]">Dexie IndexedDB Aktif · Data tersimpan offline-first</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/student/log/history"
              className="text-slate-600 hover:text-slate-900 font-semibold text-xs hover:underline flex items-center gap-1"
            >
              <span>Lihat Riwayat Jurnal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. RIGHT SECTION: SIDEBAR & SUBMIT CONTROLLER (APPLE HIG INSPECTOR STYLE)
          Telemetry Live: DUDI Partner -> Ringkasan Jurnal -> K3 Workload -> Note -> Submit
      ───────────────────────────────────────────────────────────────────────────── */}
      <aside className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px] flex flex-col gap-4 flex-shrink-0">
        {/* Card 1: DUDI & Mentor Info */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Kemitraan DUDI Aktif
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 text-[10px] font-medium">
              Kurikulum Merdeka
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <Building2 className="w-5 h-5 text-sky-400" />
            </div>
            <div className="truncate">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                {activePlacement?.dudiName || "PT Nusantara Tech"}
              </h4>
              <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                {activePlacement?.dudiCity || "Kota Bandung"}
              </p>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-normal">Mentor Lapangan:</span>
            <span className="font-semibold text-slate-900">
              {activePlacement?.mentorName || "Rizky Firmansyah"}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-normal">Jam Kerja Minggu Ini:</span>
            <span className="font-semibold text-slate-700 font-mono">
              {weeklyWorkStats.totalWeeklyHours} / 40 Jam
            </span>
          </div>
        </div>

        {/* Card 2: Student Welfare & K3 Workload Alert (Hanya muncul saat mendekati/melebihi batas overwork) */}
        {!isSickOrPermit && (weeklyWorkStats.isCriticalOverwork || weeklyWorkStats.isWarningOverwork) && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Peringatan K3 Siswa
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                Permendikbud 50/2020
              </span>
            </div>

            <div
              className={cn(
                "p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all",
                weeklyWorkStats.isCriticalOverwork
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : weeklyWorkStats.isWarningOverwork
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-emerald-50/70 border-emerald-200/70 text-emerald-900"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs",
                    weeklyWorkStats.isCriticalOverwork
                      ? "bg-rose-100 text-rose-700"
                      : weeklyWorkStats.isWarningOverwork
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                  )}
                >
                  {weeklyWorkStats.isCriticalOverwork || weeklyWorkStats.isWarningOverwork ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold truncate">
                    {weeklyWorkStats.isCriticalOverwork
                      ? "Peringatan K3: Overwork"
                      : weeklyWorkStats.isWarningOverwork
                        ? "Perhatian K3: Jam Tinggi"
                        : "Status K3: Aman & Sehat"}
                  </p>
                  <p className="text-[9.5px] text-slate-500 truncate">
                    {weeklyWorkStats.isCriticalOverwork
                      ? "Melebihi 45 jam / lembur berlebih"
                      : weeklyWorkStats.isWarningOverwork
                        ? "Mendekati 40 jam normal mingguan"
                        : "Sesuai batas normal jam belajar"}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-semibold block">
                  {weeklyWorkStats.totalWeeklyHours} / 40 Jam
                </span>
                <span className="text-[9px] text-slate-400 font-medium">Minggu Ini</span>
              </div>
            </div>

            {/* Dual-Representation Education Callout */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 flex items-center gap-1 font-normal">
                <TrendingUp className="w-3 h-3 text-sky-600" />
                <span>Beban Belajar:</span>
              </span>
              <span className="font-semibold text-slate-800 text-[11px]">
                ≈ {convertRealHoursToJp(durationJp).toFixed(1)} JP ({projectedPercentage}% total)
              </span>
            </div>
          </div>
        )}


        {/* Card 4: Catatan Singkat Aktivitas */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="short-note" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {isSickOrPermit ? "Keterangan Sakit / Izin:" : "Catatan Singkat:"}
            </label>
            <span className="text-[10px] text-slate-400 font-medium">
              {shortNote.length}/250
            </span>
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
                  : "Ringkasan kendala atau fitur yang diselesaikan..."
            }
            className="w-full text-xs p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition"
          />
        </div>

        {/* Card 5: Submit Actions */}
        <div className="space-y-2 pt-1">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (isSickOrPermit && existingDailyJp > 0) ||
              (!isSickOrPermit && isDailyLimitReached) ||
              hasExistingSickOrPermit ||
              (!isSickOrPermit && durationJp > remainingDailyQuota && existingDailyJp > 0) ||
              (!isSickOrPermit && !isNonCompetency && selectedJobCardIds.length === 0)
            }
            className="w-full py-3 px-5 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white rounded-full text-xs sm:text-sm font-semibold shadow-pill transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isSubmitting
                ? "Menyimpan Jurnal..."
                : hasExistingSickOrPermit
                  ? "Sudah Ada Presensi Sakit/Izin"
                  : isSickOrPermit && existingDailyJp > 0
                    ? "Sudah Ada Jam Hadir Tercatat"
                    : !isSickOrPermit && isDailyLimitReached
                      ? "Batas Jam Harian Terpenuhi"
                      : !isSickOrPermit && durationJp > remainingDailyQuota && existingDailyJp > 0
                        ? `Melebihi Batas (${remainingDailyQuota} Jam Sisa)`
                        : !isSickOrPermit && !isNonCompetency && selectedJobCardIds.length === 0
                          ? "Pilih Minimal 1 Pekerjaan"
                          : attendanceType === "SICK"
                            ? "Kirim Presensi Sakit"
                            : attendanceType === "PERMIT"
                              ? "Kirim Presensi Izin"
                              : "Simpan Jurnal Sekarang"}
            </span>
          </button>

          <Link
            href="/student/home"
            className="w-full py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center justify-center gap-1 transition active:scale-[0.98] border border-slate-200/80"
          >
            <span>Batalkan &amp; Kembali</span>
          </Link>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. CONFIRMATION MODAL & INSTANT MENTOR HAND-OFF
      ───────────────────────────────────────────────────────────────────────────── */}
      {submittedLogUuid && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
          style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-modal border border-slate-200/80 space-y-4 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center mx-auto shadow-2xs">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                Jurnal Berhasil Disimpan!
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                Data tersimpan di penyimpanan offline perangkat Anda dan siap diverifikasi oleh mentor industri.
              </p>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Status Presensi:</span>
                <span className="font-semibold text-sky-700">
                  {attendanceType === "PRESENT"
                    ? "Hadir Praktik"
                    : attendanceType === "SICK"
                      ? "Sakit (Surat Dokter)"
                      : "Izin Resmi"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Status Antrean:</span>
                <span className="font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/70 text-[10px]">
                  Tersimpan Offline (Siap Sinkron)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Durasi &amp; Level SOP:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {durationJp} Jam Kerja{" "}
                  <span className="font-sans font-normal text-slate-600">
                    {attendanceType === "PRESENT"
                      ? `· ${autonomyLevel === 3 ? "Mandiri (SOP)" : autonomyLevel === 2 ? "Terbimbing" : "Observasi"}`
                      : "· Administratif"}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Bukti Foto / Surat:</span>
                <span className="font-semibold text-slate-900">
                  {compressedPhoto ? `WebP (${(compressedPhoto.sizeBytes / 1024).toFixed(1)} KB)` : "Tanpa Foto"}
                </span>
              </div>
            </div>

            {/* Instant Mentor Verification Hand-Off Buttons (Pill-shaped) */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="w-full py-2.5 px-4 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-pill cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Minta Validasi PIN Mentor Sekarang (QR)</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Halo Bapak/Ibu ${activePlacement?.mentorName || "Mentor"}, saya telah mengisi jurnal PKL VokaLink hari ini (${durationJp} Jam Kerja - ${autonomyLevel === 3 ? "Mandiri Sesuai SOP" : autonomyLevel === 2 ? "Terbimbing" : "Observasi"}). Mohon kesediaannya untuk memvalidasi logbook saya melalui tautan berikut: https://vokalink.id/v/andi-pratama-rpl-2026`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                <span>Kirim Tautan ke WhatsApp Mentor</span>
              </a>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="py-2.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-semibold text-xs transition cursor-pointer border border-slate-200/80"
                >
                  Catat Log Lain
                </button>
                <Link
                  href="/student/log/history"
                  className="py-2.5 px-3 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
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
