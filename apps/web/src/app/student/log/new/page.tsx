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
} from "lucide-react";
import {
  MIN_DAILY_JP,
  MAX_DAILY_JP,
} from "@vokalink/shared";
import { db } from "@/lib/pwa/db";
import { compressEvidencePhoto, type CompressedPhotoResult } from "@/lib/pwa/photo";
import { fetchStudentLogContext, type StudentLogContextResponse } from "@/lib/api";

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
  const [selectedDate, setSelectedDate] = useState(today);
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

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLogUuid, setSubmittedLogUuid] = useState<string | null>(null);
  const [selectedJobCardId, setSelectedJobCardId] = useState<string>(
    DEFAULT_JOB_CARDS[0]?.id ?? "00000000-0000-0000-0000-000000000031"
  );

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
            if (firstId) setSelectedJobCardId(firstId);
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
              const firstId = fresh.jobCards[0]?.id;
              setSelectedJobCardId((prev) =>
                fresh.jobCards.some((j) => j.id === prev)
                  ? prev
                  : (firstId ?? "00000000-0000-0000-0000-000000000031")
              );
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

  // Submit to Dexie IndexedDB (BUG-005 Fixed)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const clientLogUuid = crypto.randomUUID();
      const clientCreatedAt = new Date().toISOString();

      const placementId = activePlacement?.id || DEFAULT_PLACEMENT_ID;
      const technicalCard = jobCards.find((j) => j.id === selectedJobCardId) || jobCards[0];
      const nonCompCard = nonCompetencyJobCard || DEFAULT_NON_COMPETENCY_JC;

      const targetJobCardId = isNonCompetency
        ? nonCompCard.id
        : (technicalCard?.id || DEFAULT_JOB_CARDS[0]?.id || "00000000-0000-0000-0000-000000000031");
      const targetJobCardTitle = isNonCompetency
        ? `Bantuan Operasional (${nonCompetencyCategory})`
        : (technicalCard?.title || "Kartu Pekerjaan Kejuruan");

      // 1. Simpan Log ke IndexedDB dengan format UUID riil
      await db.logs.add({
        clientLogUuid,
        placementId,
        logDate: selectedDate,
        durationJp,
        autonomyLevel,
        jobCardIds: [targetJobCardId],
        jobCardTitle: targetJobCardTitle,
        isNonCompetency,
        nonCompetencyCategory: isNonCompetency ? nonCompetencyCategory : undefined,
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
    setIsNonCompetency(false);
    setDurationJp(8);
    setAutonomyLevel(3);
    setShortNote("");
    handleRemovePhoto();
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Catat Jurnal Harian PKL
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Pilih kartu tugas yang telah Anda selesaikan hari ini tanpa perlu mengetik paragraf panjang
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5" />
          <span>Alokasi: {durationJp} JP Terpilih</span>
        </div>
      </div>

      {/* Main Form Grid (2 Columns on Desktop) */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* LEFT COLUMN: Date & Job Cards Selection (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Date Selector (BR-003: H to H-3) */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="log-date"
                className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                Tanggal Pelaksanaan Kegiatan
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                Maksimal H-3 (BR-003)
              </span>
            </div>
            <input
              id="log-date"
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 leading-snug">
              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              Sistem membatasi backdate hingga 3 hari kalender ke belakang untuk mencegah pengisian rapelan fiktif di akhir bulan.
            </p>
          </section>

          {/* 2. Job Card Selection (If competency) */}
          {!isNonCompetency ? (
            <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Pilih Kartu Pekerjaan (Job Cards Mitra)
                </label>
                <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                  {jobCards.length} Kartu Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {jobCards.map((card) => {
                  const isSelected = selectedJobCardId === card.id;
                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedJobCardId(card.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition active:scale-[0.99] flex flex-col justify-between ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                            {card.skkni || "SKKNI Kejuruan"}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "border-2 border-slate-300"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {card.title}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-slate-100">
                        {card.tools.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Pelaporan Tugas Non-Kejuruan (Bantuan Operasional Umum)</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Anda memilih kartu non-jurusan. Jam kehadiran ini tetap dihitung penuh memenuhi kewajiban PKL Anda (BR-004), namun tidak akan menambah jam teknis pada CV ATS Anda.
              </p>
            </section>
          )}

          {/* 3. Upload Foto Bukti Praktik (Kompresi WebP Canvas + Sensor Privasi DUDI) */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                Foto Bukti Kegiatan (Otomatis Kompresi WebP)
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                Maks 150 KB
              </span>
            </div>

            {/* Privacy Blur Toggle Control (FR-006 & TC-003) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/90">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Sensor Privasi / Dokumen Rahasia DUDI</span>
                    {applyPrivacyBlur && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 font-black px-1.5 py-0.2 rounded">
                        AKTIF
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Otomatis buramkan bagian tengah foto (layar monitor/faktur/dokumen klien) sebelum diunggah
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePrivacyBlur(!applyPrivacyBlur)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer flex-shrink-0 ${
                  applyPrivacyBlur ? "bg-indigo-600" : "bg-slate-300"
                }`}
                title="Aktifkan/nonaktifkan sensor privasi"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ease-in-out ${
                    applyPrivacyBlur ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {photoPreviewUrl && compressedPhoto ? (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="relative rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center max-h-48">
                  <img
                    src={photoPreviewUrl}
                    alt="Pratinjau bukti terkompresi"
                    className="max-h-48 object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <Check className="w-3.5 h-3.5" />
                    {compressedPhoto.savingsText}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    SHA-256: {compressedPhoto.sha256.substring(0, 8)}...
                  </span>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 hover:bg-blue-50/30">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  disabled={isCompressingPhoto}
                />
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                  <Camera className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {isCompressingPhoto ? "Sedang Mengompresi WebP..." : "Ambil Foto / Pilih dari Galeri"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Metadata lokasi/EXIF otomatis dihapus untuk keamanan privasi Anda
                </p>
              </label>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Tombol Jujur, Slider, Autonomy, Submit (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 4. Tombol Jujur (BR-004: Non-Competency Whistleblower) */}
          <section className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200/80 shadow-2xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="p-1.5 rounded-lg bg-amber-500 text-white mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Tombol Jujur (Tugas Non-Jurusan)
                  </h3>
                  <p className="text-xs text-slate-600 leading-snug mt-0.5">
                    Ditugaskan pekerjaan di luar keahlian RPL? Laporkan secara aman di sini.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNonCompetency(!isNonCompetency)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none flex-shrink-0 ${
                  isNonCompetency ? "bg-amber-600" : "bg-slate-300"
                }`}
                aria-pressed={isNonCompetency}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    isNonCompetency ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {isNonCompetency && (
              <div className="pt-3 border-t border-amber-200/60 space-y-2.5 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-amber-900">
                  Kategori Pekerjaan yang Diberikan:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "ADMIN_UMUM", label: "Administrasi Umum" },
                    { id: "KEBERSIHAN_GUDANG", label: "Kebersihan / Gudang" },
                    { id: "KURIR", label: "Kurir / Pengantaran" },
                    { id: "JAGA_TOKO", label: "Jaga Toko / Resepsionis" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNonCompetencyCategory(cat.id)}
                      className={`p-2.5 rounded-xl text-left font-medium transition ${
                        nonCompetencyCategory === cat.id
                          ? "bg-amber-600 text-white font-bold shadow-xs"
                          : "bg-white text-slate-700 border border-amber-200 hover:bg-amber-100/50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 5. Durasi JP Slider (BR-002: 1 to 12 JP) */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-slate-800">
                Durasi Waktu Praktik Harian:
              </label>
              <span className="text-sm font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                {durationJp} Jam Pelajaran (JP)
              </span>
            </div>
            <input
              type="range"
              min={MIN_DAILY_JP}
              max={MAX_DAILY_JP}
              value={durationJp}
              onChange={(e) => setDurationJp(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
              <span>Min: {MIN_DAILY_JP} JP</span>
              <span className="text-slate-600 font-bold">Rekomendasi: 8–10 JP</span>
              <span>Max: {MAX_DAILY_JP} JP (BR-002)</span>
            </div>
          </section>

          {/* 6. Autonomy Level (BR-009) */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <label className="text-xs sm:text-sm font-bold text-slate-800">
              Tingkat Kemandirian Pengerjaan Tugas:
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { level: 1 as const, label: "Observasi", score: "Bobot 75", desc: "Melihat / Membantu" },
                { level: 2 as const, label: "Terbimbing", score: "Bobot 88", desc: "Didampingi Mentor" },
                { level: 3 as const, label: "Mandiri", score: "Bobot 100", desc: "Mengerjakan Sendiri" },
              ].map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setAutonomyLevel(item.level)}
                  className={`p-3 rounded-2xl text-center flex flex-col items-center justify-center transition ${
                    autonomyLevel === item.level
                      ? "bg-blue-600 text-white font-bold shadow-md ring-2 ring-blue-600/30"
                      : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-xs sm:text-sm font-bold">{item.label}</span>
                  <span
                    className={`text-[10px] font-semibold mt-0.5 ${
                      autonomyLevel === item.level ? "text-blue-100" : "text-blue-600"
                    }`}
                  >
                    {item.score}
                  </span>
                  <span
                    className={`text-[9px] mt-1 line-clamp-1 ${
                      autonomyLevel === item.level ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* 7. Catatan Singkat */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="short-note" className="text-xs sm:text-sm font-bold text-slate-800">
                Catatan Singkat (Opsional):
              </label>
              <span className="text-[11px] text-slate-400">
                {shortNote.length}/250
              </span>
            </div>
            <textarea
              id="short-note"
              value={shortNote}
              onChange={(e) => setShortNote(e.target.value)}
              maxLength={250}
              rows={2}
              placeholder="Tuliskan ringkasan kendala atau fitur spesifik yang Anda selesaikan..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </section>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-sm sm:text-base shadow-md hover:from-blue-700 hover:to-indigo-700 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            <ShieldCheck className="w-5 h-5" />
            {isSubmitting ? "Menyimpan ke IndexedDB..." : "Simpan Jurnal Harian Sekarang"}
          </button>
        </div>
      </form>

      {/* Confirmation Modal upon saving to Dexie IndexedDB */}
      {submittedLogUuid && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">
                Jurnal Berhasil Disimpan!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Data telah tersimpan di penyimpanan offline (IndexedDB) perangkat Anda dan siap diverifikasi oleh mentor.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Status Antrean:</span>
                <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  QUEUED (Tersimpan Lokal)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Alokasi Waktu:</span>
                <span className="font-bold text-slate-900">{durationJp} JP ({autonomyLevel === 3 ? "Mandiri" : autonomyLevel === 2 ? "Terbimbing" : "Observasi"})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Bukti Foto:</span>
                <span className="font-bold text-slate-900">
                  {compressedPhoto ? `WebP (${(compressedPhoto.sizeBytes / 1024).toFixed(1)} KB)` : "Tanpa Foto"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Catat Log Lain
              </button>
              <Link
                href="/student/log/history"
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
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
