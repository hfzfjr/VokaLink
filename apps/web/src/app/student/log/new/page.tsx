"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { MIN_DAILY_JP, MAX_DAILY_JP } from "@vokalink/shared";
import { db } from "@/lib/pwa/db";
import { compressEvidencePhoto, type CompressedPhotoResult } from "@/lib/pwa/photo";
import { fetchStudentLogContext, type StudentLogContextResponse } from "@/lib/api";
import { cn } from "@/lib/cn";

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

  // Photo state & Privacy Blur (FR-006 & TC-003)
  const [rawPhotoFile, setRawPhotoFile] = useState<File | null>(null);
  const [applyPrivacyBlur, setApplyPrivacyBlur] = useState(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [compressedPhoto, setCompressedPhoto] = useState<CompressedPhotoResult | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Multi-Job Cards state (1 to 3 job cards per daily log, PRD FR-005 line 428)
  const [selectedJobCardIds, setSelectedJobCardIds] = useState<string[]>([
    DEFAULT_JOB_CARDS[0]?.id ?? "00000000-0000-0000-0000-000000000031",
  ]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLogUuid, setSubmittedLogUuid] = useState<string | null>(null);

  // Ambil konteks penempatan dan job cards (Cache first di Dexie.refData, fallback ke server)
  useEffect(() => {
    let isMounted = true;

    async function loadLogContext() {
      try {
        // 1. Coba baca dari cache offline Dexie
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

        // 2. Jika online, perbarui dari server
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

            // Simpan ke IndexedDB untuk penggunaan offline berikutnya
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

  // Proses kompresi foto dan penerapan blur
  const processPhoto = async (file: File, blur: boolean) => {
    try {
      setIsCompressingPhoto(true);
      const result = await compressEvidencePhoto(file, { applyPrivacyBlur: blur });
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

  // Handle Photo selection
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawPhotoFile(file);
    await processPhoto(file, applyPrivacyBlur);
  };

  // Toggle sensor privasi / blur secara dinamis
  const handleTogglePrivacyBlur = async (newBlurVal: boolean) => {
    setApplyPrivacyBlur(newBlurVal);
    if (rawPhotoFile) {
      await processPhoto(rawPhotoFile, newBlurVal);
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(null);
    setCompressedPhoto(null);
    setRawPhotoFile(null);
  };

  // Submit to Dexie IndexedDB (BUG-005 Fixed & Multi-Job Cards & Sakit/Izin)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // 1. Simpan Log ke IndexedDB dengan format UUID riil
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
    handleRemovePhoto();
  };

  const isSickOrPermit = attendanceType === "SICK" || attendanceType === "PERMIT";

  return (
    <div className="w-full flex flex-col lg:flex-row gap-5 items-stretch min-h-[840px]">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. CENTER SECTION: WORKSPACE CANVAS (FORM ENTRY)
          Identical padding (p-3.5 sm:p-5 lg:p-6), radius (rounded-2xl sm:rounded-3xl),
          border (border-[#E2E8F0]), and shadow (shadow-card) to dashboard canvas
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="flex-1 min-w-0 bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-[#E2E8F0] shadow-card flex flex-col justify-between overflow-hidden">
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
            <span className="text-slate-900 font-bold">Catat Jurnal Harian</span>
          </nav>

          {/* ─── Header: Apple Minimalist Canvas Header ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200/80">
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 text-slate-700 text-xs font-medium border border-slate-200/60 font-mono shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>Alokasi: {durationJp} JP</span>
              </div>
            </div>
          </div>

          {/* ─── Main Form Fields (Apple HIG Clean Interior Layout) ─── */}
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
                    "py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
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
                    "py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
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
                    "py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
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
                        ? "Presensi Sakit — Unggah Surat Keterangan Dokter"
                        : "Presensi Izin — Unggah Surat Dispensasi / Izin"}
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] opacity-90 leading-normal">
                    Status tercatat resmi dan tidak dianggap alpha. Jam tidak diakumulasi ke jam teknis agar metrik drift tetap objektif. Mentor industri tetap memvalidasi surat ini.
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
                  Maksimal H-3
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
                <span>Batas pengisian maksimal 3 hari ke belakang untuk mencegah pencatatan rapelan fiktif.</span>
              </p>
            </div>

            {/* 3. Pilihan Kartu Pekerjaan (Apple HIG Clean Card Grid) */}
            {!isSickOrPermit && !isNonCompetency ? (
              <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-600" />
                      <span>Pilih Kartu Pekerjaan</span>
                    </span>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      Pilih 1 sampai 3 kartu tugas yang diselesaikan hari ini
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200/70 shadow-2xs shrink-0">
                    Terpilih: <strong className="text-sky-600 font-semibold">{selectedJobCardIds.length}</strong>/3
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                  {jobCards.map((card) => {
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
                  Anda memilih kartu non-jurusan. Jam kehadiran ini tetap dihitung penuh memenuhi kewajiban PKL Anda, namun tidak akan menambah jam teknis pada CV ATS Anda.
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

              {/* Privacy Blur Toggle Control (Only for PRESENT) */}
              {attendanceType === "PRESENT" && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>Sensor Privasi / Dokumen Rahasia DUDI</span>
                        {applyPrivacyBlur && (
                          <span className="text-[9.5px] bg-sky-100 text-sky-700 font-semibold px-1.5 py-0.2 rounded font-mono">
                            AKTIF
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug font-normal">
                        Otomatis buramkan bagian tengah foto (layar monitor/faktur/dokumen klien) sebelum diunggah
                      </p>
                    </div>
                  </div>
                  {/* Apple-style iOS switch */}
                  <button
                    type="button"
                    onClick={() => handleTogglePrivacyBlur(!applyPrivacyBlur)}
                    className={cn(
                      "w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer shrink-0",
                      applyPrivacyBlur ? "bg-sky-500" : "bg-slate-300"
                    )}
                    title="Aktifkan/nonaktifkan sensor privasi"
                  >
                    <div
                      className={cn(
                        "bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ease-in-out",
                        applyPrivacyBlur ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              )}

              {photoPreviewUrl && compressedPhoto ? (
                <div className="p-3 bg-white rounded-xl border border-slate-200/70 space-y-2 shadow-2xs">
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center max-h-48">
                    <img
                      src={photoPreviewUrl}
                      alt="Pratinjau bukti terkompresi"
                      className="max-h-48 object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-rose-600 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
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
                <label className="border border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-white hover:bg-sky-50/20 group shadow-2xs">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    disabled={isCompressingPhoto}
                  />
                  <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                    <Camera className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-sky-600 transition">
                    {isCompressingPhoto
                      ? "Sedang Mengompresi WebP..."
                      : isSickOrPermit
                      ? "Ambil Foto Surat Keterangan / Resep"
                      : "Ambil Foto / Pilih Bukti Praktik"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
                    Metadata lokasi/EXIF otomatis dihapus untuk melindungi privasi Anda
                  </p>
                </label>
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
          Width (w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px]) & gap (gap-4)
          Card containers styled with rounded-2xl, p-4 sm:p-5, border-slate-200/70, shadow-card
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
        </div>

        {/* Card 2: Durasi JP Slider (BR-002: 1 to 12 JP) */}
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
            max={MAX_DAILY_JP}
            value={durationJp}
            onChange={(e) => setDurationJp(parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
          />

          <div className="flex justify-between text-[10.5px] text-slate-400 font-medium font-mono">
            <span>Min: {MIN_DAILY_JP} JP</span>
            <span className="text-slate-600 font-semibold font-sans">Ideal: 8 JP</span>
            <span>Max: {MAX_DAILY_JP} JP</span>
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
                    "p-2.5 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer border",
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
                  "w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer shrink-0",
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
                        "p-1.5 rounded-lg text-left font-medium transition cursor-pointer border text-[11px]",
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

        {/* Card 5: Catatan Singkat Aktivitas */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="short-note" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {isSickOrPermit ? "Keterangan Sakit / Izin:" : "Catatan Singkat:"}
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {shortNote.length}/250
            </span>
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
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? "Menyimpan ke IndexedDB..." : "Simpan Jurnal Sekarang"}</span>
          </button>

          <Link
            href="/student/home"
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 font-medium text-xs flex items-center justify-center gap-1 transition"
          >
            <span>Batalkan & Kembali</span>
          </Link>
        </div>
      </aside>

      {/* Confirmation Modal upon saving to Dexie IndexedDB */}
      {submittedLogUuid && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-modal border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Jurnal Berhasil Disimpan!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Data telah tersimpan di penyimpanan offline (IndexedDB) perangkat Anda dan siap diverifikasi oleh mentor.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 text-xs text-slate-600 space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Status Presensi:</span>
                <span className="font-bold text-sky-700">
                  {attendanceType === "PRESENT"
                    ? "Hadir Praktik"
                    : attendanceType === "SICK"
                    ? "Sakit (Surat Dokter)"
                    : "Izin Resmi"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Status Antrean:</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 text-[10px] font-mono">
                  QUEUED (Tersimpan Lokal)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Alokasi Waktu:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {durationJp} JP{" "}
                  {attendanceType === "PRESENT"
                    ? `(${autonomyLevel === 3 ? "Mandiri" : autonomyLevel === 2 ? "Terbimbing" : "Observasi"})`
                    : "(Administratif)"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Bukti Foto / Surat:</span>
                <span className="font-bold text-slate-900">
                  {compressedPhoto ? `WebP (${(compressedPhoto.sizeBytes / 1024).toFixed(1)} KB)` : "Tanpa Foto"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={resetForm}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Catat Log Lain
              </button>
              <Link
                href="/student/log/history"
                className="py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs hover:shadow-md"
              >
                <span>Lihat Riwayat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
