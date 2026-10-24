"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  ArrowLeft,
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
  WifiOff,
  Paintbrush,
  EyeOff,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { MIN_DAILY_JP, MAX_DAILY_JP, TOTAL_TARGET_JP } from "@vokalink/shared";
import { db } from "@/lib/pwa/db";
import { compressEvidencePhoto, type CompressedPhotoResult } from "@/lib/pwa/photo";
import { fetchStudentLogContext, type StudentLogContextResponse } from "@/lib/api";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/cn";
import { MentorQrModal } from "@/components/student/home/MentorQrModal";
import { PhotoPrivacyStudioModal } from "@/components/student/log/PhotoPrivacyStudioModal";

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

// ─── SMART QUICK CHIPS UNTUK PENGUATAN ZERO-TYPING ───
const JOB_CARD_QUICK_CHIPS: Record<string, string[]> = {
  "00000000-0000-0000-0000-000000000031": [
    "Selesai endpoint CRUD & router",
    "Validasi schema Zod & error handling",
    "Testing response middleware Express",
  ],
  "00000000-0000-0000-0000-000000000032": [
    "Slicing komponen responsif mobile & tablet",
    "Penerapan Apple HIG & Tailwind tokens",
    "Optimasi layout & micro-interactions",
  ],
  "00000000-0000-0000-0000-000000000033": [
    "Perancangan relasi skema PostgreSQL",
    "Migrasi schema Prisma & indexing",
    "Trigger DB audit & immutability",
  ],
  "00000000-0000-0000-0000-000000000035": [
    "Penulisan unit test Vitest 100% passing",
    "Uji skenario boundary & edge cases",
    "Pengujian integrasi endpoint API",
  ],
};

const GENERIC_QUICK_CHIPS = [
  "Bimbingan sprint & review bersama mentor",
  "Refactor & standarisasi clean code",
  "Penyelesaian kendala teknis mandiri",
];

const SICK_QUICK_CHIPS = [
  "Pemeriksaan kesehatan di faskes/klinik",
  "Istirahat pemulihan sesuai anjuran dokter",
  "Kondisi demam/flu butuh istirahat di rumah",
];

const PERMIT_QUICK_CHIPS = [
  "Urusan keluarga mendesak",
  "Dispensasi kegiatan resmi perwakilan sekolah",
  "Surat izin resmi telah terlampir",
];

export default function NewLogPage() {
  const today = new Date().toISOString().split("T")[0]!;
  const minDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]!;
  const [selectedDate, setSelectedDate] = useState(today);
  const [attendanceType, setAttendanceType] = useState<"PRESENT" | "SICK" | "PERMIT">("PRESENT");
  const [isNonCompetency, setIsNonCompetency] = useState(false);
  const [nonCompetencyCategory, setNonCompetencyCategory] = useState("ADMIN_UMUM");
  const [durationJp, setDurationJp] = useState(8);
  const [autonomyLevel, setAutonomyLevel] = useState<1 | 2 | 3>(3);
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
  const [selectedJobCardIds, setSelectedJobCardIds] = useState<string[]>([
    DEFAULT_JOB_CARDS[0]?.id ?? "00000000-0000-0000-0000-000000000031",
  ]);

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

  // Online/Offline status
  const isOnline = useOnlineStatus();

  // Draft auto-save and recovery
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vokalink_new_log_draft_v1");
      if (saved) {
        setHasDraft(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (shortNote.trim() || selectedJobCardIds.length > 1 || attendanceType !== "PRESENT") {
          localStorage.setItem(
            "vokalink_new_log_draft_v1",
            JSON.stringify({
              selectedDate,
              attendanceType,
              isNonCompetency,
              nonCompetencyCategory,
              durationJp,
              autonomyLevel,
              selectedJobCardIds,
              shortNote,
            })
          );
        }
      } catch {}
    }, 800);
    return () => clearTimeout(timer);
  }, [
    selectedDate,
    attendanceType,
    isNonCompetency,
    nonCompetencyCategory,
    durationJp,
    autonomyLevel,
    selectedJobCardIds,
    shortNote,
  ]);

  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem("vokalink_new_log_draft_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.attendanceType) setAttendanceType(parsed.attendanceType);
        if (parsed.isNonCompetency !== undefined) setIsNonCompetency(parsed.isNonCompetency);
        if (parsed.nonCompetencyCategory) setNonCompetencyCategory(parsed.nonCompetencyCategory);
        if (parsed.durationJp) setDurationJp(parsed.durationJp);
        if (parsed.autonomyLevel) setAutonomyLevel(parsed.autonomyLevel);
        if (parsed.selectedJobCardIds && parsed.selectedJobCardIds.length > 0) {
          setSelectedJobCardIds(parsed.selectedJobCardIds);
        }
        if (parsed.shortNote) setShortNote(parsed.shortNote);
        setHasDraft(false);
      }
    } catch {}
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem("vokalink_new_log_draft_v1");
    } catch {}
    setHasDraft(false);
  };

  // Ambil log terakhir yang dicatat untuk fitur template cepat
  const recentPreviousLog = useMemo(() => {
    if (offlineLogs && offlineLogs.length > 0) {
      return offlineLogs[offlineLogs.length - 1];
    }
    return null;
  }, [offlineLogs]);

  const handleApplyPreviousTemplate = () => {
    if (!recentPreviousLog) return;
    if (recentPreviousLog.jobCardIds && recentPreviousLog.jobCardIds.length > 0) {
      setSelectedJobCardIds(recentPreviousLog.jobCardIds);
    }
    setDurationJp(recentPreviousLog.durationJp || 8);
    setAutonomyLevel(recentPreviousLog.autonomyLevel || 3);
    if (recentPreviousLog.shortNote) {
      setShortNote((prev) => (prev ? prev : `[Lanjutan] ${recentPreviousLog.shortNote}`));
    }
  };

  // 3. Ambil konteks penempatan dan job cards (Cache first di Dexie.refData, fallback ke server)
  useEffect(() => {
    let isMounted = true;

    async function loadLogContext() {
      try {
        const cached = await db.refData.get("student_log_context");
        if (cached && cached.data && isMounted) {
          const data = cached.data as StudentLogContextResponse;
          if (data.jobCards && data.jobCards.length > 0) {
            setJobCards(data.jobCards);
            const firstId = data.jobCards[0]?.id;
            if (firstId) setSelectedJobCardIds([firstId]);
          }
          if (data.nonCompetencyJobCard) {
            setNonCompetencyJobCard(data.nonCompetencyJobCard);
          }
          if (data.activePlacement) {
            setActivePlacement(data.activePlacement);
          }
        }

        if (typeof navigator !== "undefined" && navigator.onLine) {
          const fresh = await fetchStudentLogContext();
          if (fresh && isMounted) {
            if (fresh.jobCards && fresh.jobCards.length > 0) {
              setJobCards(fresh.jobCards);
              setSelectedJobCardIds((prev) => {
                const valid = prev.filter((id) => fresh.jobCards.some((j) => j.id === id));
                if (valid.length > 0) return valid;
                const firstId = fresh.jobCards[0]?.id;
                return firstId ? [firstId] : [DEFAULT_JOB_CARDS[0]!.id];
              });
            }
            if (fresh.nonCompetencyJobCard) {
              setNonCompetencyJobCard(fresh.nonCompetencyJobCard);
            }
            if (fresh.activePlacement) {
              setActivePlacement(fresh.activePlacement);
            }

            await db.refData.put({
              key: "student_log_context",
              data: fresh,
              cachedAt: Date.now(),
            });
          }
        }
      } catch (err) {
        console.warn("Menggunakan fallback konteks job cards:", err);
      }
    }

    loadLogContext();
    return () => {
      isMounted = false;
    };
  }, []);

  // Multi-card selection toggle handler (1 to 3 job cards, PRD FR-005)
  const handleToggleJobCard = (cardId: string) => {
    setSelectedJobCardIds((prev) => {
      let updated: string[];
      if (prev.includes(cardId)) {
        if (prev.length <= 1) {
          return prev; // Pertahankan minimal 1 kartu
        }
        updated = prev.filter((id) => id !== cardId);
      } else {
        if (prev.length >= 3) {
          alert("Maksimal 3 kartu pekerjaan per hari (PRD FR-005). Hapus satu pilihan terlebih dahulu bila ingin mengganti.");
          return prev;
        }
        updated = [...prev, cardId];
      }
      // Pastikan durasi JP minimal mencukupi jumlah kartu yang dipilih
      if (durationJp < updated.length) {
        setDurationJp(updated.length);
      }
      return updated;
    });
  };

  // Filter Kategori Job Cards
  const availableCategories = useMemo(() => {
    const set = new Set(jobCards.map((j) => j.category));
    return ["ALL", ...Array.from(set)];
  }, [jobCards]);

  const filteredJobCards = useMemo(() => {
    return jobCards.filter((card) => {
      if (jobCardCategory !== "ALL" && card.category !== jobCardCategory) return false;
      if (jobCardSearch.trim()) {
        const q = jobCardSearch.toLowerCase();
        const matchTitle = card.title.toLowerCase().includes(q);
        const matchTools = card.tools.some((t) => t.toLowerCase().includes(q));
        const matchSkkni = card.skkni?.toLowerCase().includes(q);
        if (!matchTitle && !matchTools && !matchSkkni) return false;
      }
      return true;
    });
  }, [jobCards, jobCardCategory, jobCardSearch]);

  // Dynamic Quick Chips Generator
  const activeQuickChips = useMemo(() => {
    if (attendanceType === "SICK") return SICK_QUICK_CHIPS;
    if (attendanceType === "PERMIT") return PERMIT_QUICK_CHIPS;

    const chips: string[] = [];
    selectedJobCardIds.forEach((id) => {
      const specific = JOB_CARD_QUICK_CHIPS[id];
      if (specific) {
        chips.push(...specific);
      }
    });
    // Add generic chips if needed
    GENERIC_QUICK_CHIPS.forEach((gc) => {
      if (!chips.includes(gc) && chips.length < 6) {
        chips.push(gc);
      }
    });
    return chips;
  }, [attendanceType, selectedJobCardIds]);

  const handleToggleQuickChip = (chipText: string) => {
    setShortNote((prev) => {
      if (prev.includes(chipText)) {
        // Hapus chip jika sudah ada
        const cleaned = prev
          .replace(chipText, "")
          .replace(/,\s*,/g, ",")
          .replace(/^[\s,]+|[\s,]+$/g, "")
          .trim();
        return cleaned;
      } else {
        // Tambahkan chip
        if (!prev.trim()) return chipText;
        return `${prev.trim()}, ${chipText}`.slice(0, 250);
      }
    });
  };

  // Proses kompresi foto awal
  const processPhoto = async (file: File) => {
    try {
      setIsCompressingPhoto(true);
      const result = await compressEvidencePhoto(file);
      setCompressedPhoto(result);

      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      const preview = URL.createObjectURL(result.blob);
      setPhotoPreviewUrl(preview);
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
    // Reset input value so same file can be re-selected if needed
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(null);
    setCompressedPhoto(null);
    setRawPhotoFile(null);
    setApplyPrivacyBlur(false);
    setShowPrivacyStudio(false);
  };

  // Submit to Dexie IndexedDB
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard: Sakit / Izin sudah ada pada tanggal ini
    if (hasExistingSickOrPermit) {
      alert(`Tanggal ${selectedDate} sudah tercatat presensi Sakit/Izin resmi. Anda tidak dapat menambahkan jurnal praktik pada hari tidak hadir.`);
      return;
    }

    // Guard: Batas 12 JP harian
    if (isDailyLimitReached) {
      alert("Batas maksimal 12 JP untuk tanggal ini sudah terpenuhi (BR-002). Anda tidak dapat menambah jurnal lagi.");
      return;
    }

    if (durationJp > remainingDailyQuota) {
      alert(`Alokasi waktu (${durationJp} JP) melebihi sisa kuota untuk tanggal ini (${remainingDailyQuota} JP). Harap sesuaikan durasi.`);
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

      // 1. Simpan Log ke IndexedDB
      await db.logs.add({
        clientLogUuid,
        placementId,
        logDate: selectedDate,
        attendanceType,
        durationJp,
        autonomyLevel,
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
      } catch {}
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
    setShortNote("");
    setJobCardSearch("");
    setJobCardCategory("ALL");
    handleRemovePhoto();
  };

  const isSickOrPermit = attendanceType === "SICK" || attendanceType === "PERMIT";

  return (
    <div className="w-full flex flex-col lg:flex-row gap-5 items-stretch min-h-[840px]">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. CENTER SECTION: WORKSPACE CANVAS (FORM ENTRY)
          Apple Design System HIG: Clean Surface, Hairline Border, Refined Spacing
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="flex-1 min-w-0 bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-slate-200/70 shadow-card flex flex-col justify-between overflow-hidden">
        <div>
          {/* ─── Breadcrumb Navigation ─── */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <Link
              href="/student/home"
              className="hover:text-slate-900 transition flex items-center gap-1 font-semibold group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
              <span>Beranda Siswa</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Catat Jurnal Harian</span>
          </nav>

          {/* ─── Header: Apple Minimalist Canvas Header ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200/70">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                  Catat Jurnal Harian PKL
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 text-[11px] font-medium font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span>Fase F</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                Pencatatan kartu kerja zero-typing dan presensi harian siswa SMK Kurikulum Merdeka
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {isOnline ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 text-[11px] font-medium font-mono">
                  <WifiOff className="w-3 h-3 text-amber-600" />
                  <span>Mode Offline (Dexie)</span>
                </div>
              )}

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 text-slate-700 text-xs font-medium border border-slate-200/60 font-mono shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>Alokasi: {durationJp} JP</span>
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

          {/* ─── BR-002 DUPLICATE & DAILY CAP GUARD BANNER ─── */}
          {hasExistingSickOrPermit ? (
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs flex items-center gap-3 text-amber-900 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Sudah Tercatat Sakit / Izin pada Tanggal Ini</p>
                <p className="text-[11px] text-amber-700 mt-0.5 font-normal">
                  Tanggal {selectedDate} sudah memiliki catatan presensi Sakit/Izin resmi. Anda tidak dapat menambahkan jurnal praktik pada hari tidak hadir.
                </p>
              </div>
            </div>
          ) : isDailyLimitReached ? (
            <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-xs flex items-center gap-3 text-rose-900 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Batas Kuota 12 JP Harian Terpenuhi (BR-002)</p>
                <p className="text-[11px] text-rose-700 mt-0.5 font-normal">
                  Tanggal {selectedDate} sudah memiliki catatan {existingDailyJp} JP ({logsForSelectedDate.length} jurnal). Sistem mengunci penambahan untuk mencegah jam lembur tak wajar.
                </p>
              </div>
            </div>
          ) : existingDailyJp > 0 ? (
            <div className="mt-4 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs flex items-center justify-between gap-3 text-amber-900 animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="truncate text-[11.5px]">
                  Sudah ada <strong className="font-semibold">{existingDailyJp} JP</strong> pada tanggal ini. Sisa kuota aman: <strong className="font-semibold">{remainingDailyQuota} JP</strong>.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold shrink-0">
                Maks 12 JP/hari
              </span>
            </div>
          ) : null}

          {/* ─── Main Form Fields ─── */}
          <div className="pt-4 space-y-4 sm:space-y-4.5">
            {/* 1. Status Kehadiran (Apple Segmented Control) */}
            <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-4.5 border border-slate-200/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Status Kehadiran Hari Ini</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
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
            <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-4.5 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="log-date"
                  className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>Tanggal Pelaksanaan Kegiatan</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  Maksimal H-3 (72 Jam)
                </span>
              </div>

              <input
                id="log-date"
                type="date"
                value={selectedDate}
                min={minDate}
                max={today}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs"
              />

              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 leading-snug font-normal">
                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>Batas pengisian maksimal 3 hari kerja ke belakang (BR-003) untuk mencegah pencatatan rapelan fiktif.</span>
              </p>
            </div>

            {/* 3. Pilihan Kartu Pekerjaan (Dengan Search & Category Filter) */}
            {!isSickOrPermit && !isNonCompetency ? (
              <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-600" />
                      <span>Pilih Kartu Pekerjaan</span>
                    </span>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      Pilih 1 sampai 3 kartu tugas yang diselesaikan hari ini
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {recentPreviousLog && (
                      <button
                        type="button"
                        onClick={handleApplyPreviousTemplate}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-800 text-[11px] font-medium border border-amber-200/70 transition cursor-pointer shadow-2xs"
                        title="Salin kartu tugas dan durasi dari jurnal terakhir"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Salin Log Terakhir</span>
                      </button>
                    )}
                    <span className="text-xs font-medium text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200/70 shadow-2xs">
                      Terpilih: <strong className="text-sky-600 font-semibold">{selectedJobCardIds.length}</strong>/3
                    </span>
                  </div>
                </div>

                {/* Search & Category Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={jobCardSearch}
                      onChange={(e) => setJobCardSearch(e.target.value)}
                      placeholder="Cari kartu tugas atau tools..."
                      className="w-full bg-white text-xs pl-8 pr-7 py-2 rounded-xl border border-slate-200/70 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs"
                    />
                    {jobCardSearch && (
                      <button
                        type="button"
                        onClick={() => setJobCardSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {availableCategories.length > 2 && (
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                      {availableCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setJobCardCategory(cat)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[10.5px] font-medium transition cursor-pointer shrink-0 border",
                            jobCardCategory === cat
                              ? "bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs"
                              : "bg-white text-slate-600 border-slate-200/70 hover:bg-slate-50"
                          )}
                        >
                          {cat === "ALL" ? "Semua" : cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Job Cards Grid */}
                {filteredJobCards.length === 0 ? (
                  <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-white/60 text-center text-xs text-slate-500">
                    Tidak ditemukan kartu pekerjaan dengan kata kunci &quot;{jobCardSearch}&quot;.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                    {filteredJobCards.map((card) => {
                      const isSelected = selectedJobCardIds.includes(card.id);
                      const orderIndex = selectedJobCardIds.indexOf(card.id);

                      return (
                        <div
                          key={card.id}
                          onClick={() => handleToggleJobCard(card.id)}
                          className={cn(
                            "p-4 rounded-2xl border cursor-pointer transition-all duration-200 ease-out active:scale-[0.99] flex flex-col justify-between group",
                            isSelected
                              ? "bg-sky-50/40 border-sky-500/80 shadow-[0_2px_12px_-2px_rgba(14,165,233,0.12)] ring-1 ring-sky-500/30"
                              : "bg-white border-slate-200/70 hover:border-slate-300 hover:shadow-xs"
                          )}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10.5px] font-mono font-medium text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md">
                                {card.skkni || "SKKNI Kejuruan"}
                              </span>

                              {/* Apple-style circular indicator */}
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0 transition-all duration-200",
                                  isSelected
                                    ? "bg-sky-500 text-white shadow-xs"
                                    : "border-[1.5px] border-slate-300 group-hover:border-slate-400"
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

                            <h3 className="text-[13.5px] font-semibold text-slate-900 leading-snug group-hover:text-sky-600 transition-colors">
                              {card.title}
                            </h3>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-3.5 pt-2.5 border-t border-slate-100/90">
                            {card.tools.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] font-medium text-slate-500 bg-slate-100/70 px-2 py-0.5 rounded-md border border-slate-200/40"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Apple Callout Bar for JP Distribution */}
                <div className="px-3.5 py-2.5 bg-white/90 rounded-xl border border-slate-200/70 text-xs flex items-center justify-between shadow-2xs">
                  <span className="text-slate-500 font-normal">Distribusi Jam Belajar:</span>
                  <span className="font-semibold text-sky-700 font-mono">
                    {selectedJobCardIds.length === 1
                      ? `${durationJp} JP penuh untuk 1 tugas`
                      : selectedJobCardIds.length === 2
                      ? `${Math.ceil(durationJp / 2)} JP + ${Math.floor(durationJp / 2)} JP (${durationJp} JP total)`
                      : `Dibagi rata ke 3 tugas (${durationJp} JP total)`}
                  </span>
                </div>
              </div>
            ) : isNonCompetency && !isSickOrPermit ? (
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/70 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pelaporan Tugas Non-Kejuruan (Bantuan Operasional Umum)</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-normal">
                  Anda memilih kartu non-jurusan. Jam kehadiran ini tetap dihitung penuh memenuhi kewajiban PKL Anda, namun tidak akan menambah jam teknis pada CV ATS Anda (BR-004).
                </p>
              </div>
            ) : null}

            {/* 4. Upload Foto Bukti Praktik / Surat Keterangan */}
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
                <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200/70 px-2 py-0.5 rounded-full font-mono shadow-2xs">
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
                  <span>Sedang memproses & mengompresi foto bukti (&lt; 150 KB)...</span>
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
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-sm border border-sky-400/40 text-[10px] font-mono text-sky-300 flex items-center gap-1.5 shadow-sm">
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
                  {attendanceType === "PRESENT" && rawPhotoFile && (
                    <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>Sensor Dokumen / Layar DUDI</span>
                            {applyPrivacyBlur && (
                              <span className="text-[9.5px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded font-mono">
                                TERPASANG
                              </span>
                            )}
                          </p>
                          <p className="text-[10.5px] text-slate-500 font-normal">
                            Tarik kotak atau coret untuk menyamarkan monitor kodingan & berkas rahasia
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowPrivacyStudio(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{applyPrivacyBlur ? "Ubah Sensor Privasi" : "Buka Studio Sensor"}</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Button 1: Kamera Langsung */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isCompressingPhoto}
                    className="p-4 rounded-2xl border border-dashed border-slate-300 hover:border-sky-500 bg-white hover:bg-sky-50/20 flex flex-col items-center justify-center cursor-pointer transition-all group shadow-2xs active:scale-[0.99]"
                  >
                    <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                      <Camera className="w-4.5 h-4.5" />
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
                    className="p-4 rounded-2xl border border-dashed border-slate-300 hover:border-sky-500 bg-white hover:bg-sky-50/20 flex flex-col items-center justify-center cursor-pointer transition-all group shadow-2xs active:scale-[0.99]"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                      <ImageIcon className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-900 group-hover:text-sky-600 transition">
                      Pilih dari Galeri Foto
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Foto dokumentasi yang sudah diambil
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Bottom Status & Quick Action Footer ─── */}
        <div className="pt-4 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-normal">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px]">Dexie IndexedDB Aktif · Data tersinkron offline-first</span>
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
          2. RIGHT SECTION: SIDEBAR & SUBMIT CONTROLLER (APPLE INSPECTOR STYLE)
      ───────────────────────────────────────────────────────────────────────────── */}
      <aside className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px] flex flex-col gap-4 flex-shrink-0">
        {/* Card 1: DUDI & Mentor Info */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Kemitraan DUDI Aktif
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 text-[10px] font-medium font-mono">
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
        </div>

        {/* Card 2: Durasi JP Slider (BR-002: 1 to 12 JP) & Live Impact */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Durasi Waktu Praktik:
            </label>
            <span className="text-xs sm:text-sm font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100 font-mono">
              {durationJp} JP
            </span>
          </div>

          <input
            type="range"
            min={!isSickOrPermit && !isNonCompetency ? Math.max(MIN_DAILY_JP, selectedJobCardIds.length) : MIN_DAILY_JP}
            max={Math.max(1, Math.min(MAX_DAILY_JP, remainingDailyQuota || MAX_DAILY_JP))}
            value={durationJp}
            disabled={isDailyLimitReached}
            onChange={(e) => setDurationJp(parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none disabled:opacity-50"
          />

          <div className="flex justify-between text-[10.5px] text-slate-400 font-medium font-mono">
            <span>Min: {MIN_DAILY_JP} JP</span>
            <span className="text-slate-600 font-semibold font-sans">Ideal: 8 JP</span>
            <span>Sisa Kuota: {remainingDailyQuota} JP</span>
          </div>

          {/* Live Progress Impact Preview */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-sky-600" />
              <span>Target 792 JP:</span>
            </span>
            <span className="font-semibold text-slate-800 font-mono">
              {projectedTotalJp} JP ({projectedPercentage}%)
            </span>
          </div>
        </div>

        {/* Card 3: Autonomy Level (BR-009 - Only for PRESENT) */}
        {!isSickOrPermit && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Kemandirian Tugas
              </label>
              <span className="text-[10px] text-slate-400 font-normal">Bobot Capaian</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { level: 1 as const, label: "Observasi", score: "75", desc: "Membantu" },
                { level: 2 as const, label: "Terbimbing", score: "88", desc: "Didampingi" },
                { level: 3 as const, label: "Mandiri", score: "100", desc: "Mandiri" },
              ].map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setAutonomyLevel(item.level)}
                  className={cn(
                    "p-2.5 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer border active:scale-95",
                    autonomyLevel === item.level
                      ? "bg-sky-500 text-white font-semibold border-sky-500 shadow-xs ring-2 ring-sky-500/20"
                      : "bg-slate-50/70 text-slate-700 border-slate-200/70 hover:bg-slate-100 hover:border-slate-300"
                  )}
                >
                  <span className="text-xs font-semibold leading-tight">{item.label}</span>
                  <span
                    className={cn(
                      "text-[10px] font-mono mt-0.5",
                      autonomyLevel === item.level ? "text-sky-100" : "text-sky-700"
                    )}
                  >
                    {item.score}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] mt-0.5 line-clamp-1",
                      autonomyLevel === item.level ? "text-sky-100/90" : "text-slate-400"
                    )}
                  >
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card 4: Tombol Jujur (Non-Jurusan Whistleblower BR-004) */}
        {!isSickOrPermit && (
          <div className="bg-amber-50/60 rounded-2xl p-4 sm:p-5 border border-amber-200/70 shadow-card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="p-1.5 rounded-lg bg-amber-500 text-white mt-0.5 shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    Tombol Jujur
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-snug mt-0.5 font-normal">
                    Ditugaskan pekerjaan non-RPL? Lapor aman di sini.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNonCompetency(!isNonCompetency)}
                className={cn(
                  "w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 active:scale-95",
                  isNonCompetency ? "bg-amber-600" : "bg-slate-300"
                )}
                aria-pressed={isNonCompetency}
              >
                <div
                  className={cn(
                    "bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ease-in-out",
                    isNonCompetency ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {isNonCompetency && (
              <div className="pt-2 border-t border-amber-200/60 space-y-2 animate-in fade-in duration-200">
                <label className="text-[11px] font-semibold text-amber-900">
                  Kategori Tugas Diberikan:
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { id: "ADMIN_UMUM", label: "Admin Umum" },
                    { id: "KEBERSIHAN_GUDANG", label: "Gudang" },
                    { id: "KURIR", label: "Kurir" },
                    { id: "JAGA_TOKO", label: "Kasir/Toko" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNonCompetencyCategory(cat.id)}
                      className={cn(
                        "p-1.5 rounded-lg text-left font-medium transition cursor-pointer border text-[11px] active:scale-95",
                        nonCompetencyCategory === cat.id
                          ? "bg-amber-600 text-white font-semibold border-amber-600 shadow-xs"
                          : "bg-white text-slate-700 border-amber-200/80 hover:bg-amber-100/50"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Card 5: Catatan Singkat Aktivitas & Smart Quick-Fill Chips */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="short-note" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {isSickOrPermit ? "Keterangan Sakit / Izin:" : "Catatan Singkat:"}
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {shortNote.length}/250
            </span>
          </div>

          {/* Smart Quick-Fill Chips (Zero-Typing Reinforcement) */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-normal block">
              Template Catatan Cepat (Tap untuk isi):
            </span>
            <div className="flex flex-wrap gap-1">
              {activeQuickChips.map((chip) => {
                const isSelected = shortNote.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleToggleQuickChip(chip)}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer text-left active:scale-95 leading-tight",
                      isSelected
                        ? "bg-sky-500 text-white border-sky-500 font-medium shadow-2xs"
                        : "bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-slate-100 hover:border-slate-300"
                    )}
                  >
                    {isSelected ? `✓ ${chip}` : `+ ${chip}`}
                  </button>
                );
              })}
            </div>
          </div>

          <textarea
            id="short-note"
            value={shortNote}
            onChange={(e) => setShortNote(e.target.value)}
            maxLength={250}
            rows={2}
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

        {/* Card 6: Submit Actions */}
        <div className="space-y-2 pt-1">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || isDailyLimitReached || hasExistingSickOrPermit}
            className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isSubmitting
                ? "Menyimpan ke IndexedDB..."
                : hasExistingSickOrPermit
                ? "Sudah Ada Presensi Sakit/Izin"
                : isDailyLimitReached
                ? "Batas 12 JP Terpenuhi"
                : "Simpan Jurnal Sekarang"}
            </span>
          </button>

          <Link
            href="/student/home"
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 font-medium text-xs flex items-center justify-center gap-1 transition active:scale-[0.98]"
          >
            <span>Batalkan & Kembali</span>
          </Link>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. CONFIRMATION MODAL & INSTANT MENTOR HAND-OFF
      ───────────────────────────────────────────────────────────────────────────── */}
      {submittedLogUuid && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-modal border border-slate-200/70 space-y-4 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                Jurnal Berhasil Disimpan!
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                Data tersimpan di penyimpanan offline (IndexedDB) perangkat Anda dan siap diverifikasi oleh mentor industri.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs text-slate-600 space-y-2 text-left">
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
                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70 text-[10px] font-mono">
                  QUEUED (Tersimpan Lokal)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Alokasi Waktu:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {durationJp} JP{" "}
                  {attendanceType === "PRESENT"
                    ? `(${autonomyLevel === 3 ? "Mandiri" : autonomyLevel === 2 ? "Terbimbing" : "Observasi"})`
                    : "(Administratif)"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Bukti Foto / Surat:</span>
                <span className="font-semibold text-slate-900">
                  {compressedPhoto ? `WebP (${(compressedPhoto.sizeBytes / 1024).toFixed(1)} KB)` : "Tanpa Foto"}
                </span>
              </div>
            </div>

            {/* Instant Mentor Verification Hand-Off Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Minta Validasi PIN Mentor Sekarang (QR)</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Halo Bapak/Ibu ${activePlacement?.mentorName || "Mentor"}, saya telah mengisi jurnal PKL VokaLink hari ini (${durationJp} JP). Mohon kesediaannya untuk memvalidasi logbook saya melalui tautan berikut: https://vokalink.id/v/andi-pratama-rpl-2026`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                <span>Kirim Tautan ke WhatsApp Mentor</span>
              </a>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Catat Log Lain
                </button>
                <Link
                  href="/student/log/history"
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <span>Lihat Riwayat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
}
