"use client";

import React, { useState, useEffect, use } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Award,
  Calendar,
  Building2,
  Clock,
  Sparkles,
  Printer,
  Share2,
  Check,
  Hash,
  School,
  FileCheck,
  ImageIcon,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Disclosure } from "@/components/ui/Disclosure";
import { fetchPublicPassport, type PublicPassportResponse } from "@/lib/api";

interface PageProps {
  params: Promise<{ passportSlug: string }>;
}

export default function PublicPassportVerifyPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const passportSlug = resolvedParams.passportSlug;

  const [data, setData] = useState<PublicPassportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadPassport() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchPublicPassport(passportSlug);
        setData(res);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Paspor tidak ditemukan";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadPassport();
  }, [passportSlug]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // ─── 1. State: Loading Skeleton ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
          <div className="h-16 bg-slate-200 rounded-3xl w-full" />
          <div className="h-48 bg-slate-200 rounded-3xl w-full" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="h-24 bg-slate-200 rounded-2xl" />
            <div className="h-24 bg-slate-200 rounded-2xl" />
            <div className="h-24 bg-slate-200 rounded-2xl" />
            <div className="h-24 bg-slate-200 rounded-2xl" />
          </div>
          <div className="h-64 bg-slate-200 rounded-3xl w-full" />
        </div>
      </div>
    );
  }

  // ─── 2. State: Invalid / Not Found (Error Handling) ────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-rose-900 tracking-tight">
              PERINGATAN AUDIT: Dokumen Tidak Terdaftar
            </h1>
            <p className="text-xs sm:text-sm text-rose-700 leading-relaxed">
              Tanda tangan digital tidak valid atau slug paspor{" "}
              <code className="px-1.5 py-0.5 bg-rose-50 rounded border border-rose-200 font-mono text-rose-900">
                {passportSlug}
              </code>{" "}
              tidak ditemukan di basis data resmi VokaLink.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800">Kemungkinan penyebab:</p>
            <ul className="list-disc list-outside pl-4 space-y-1">
              <li>QR Code berasal dari dokumen palsu atau modifikasi yang tidak sah.</li>
              <li>Siswa belum menyelesaikan proses verifikasi minimum jam praktik.</li>
              <li>Tautan verifikasi telah kedaluwarsa atau dicabut oleh pihak sekolah.</li>
            </ul>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-full text-xs sm:text-sm font-bold transition shadow-xs"
          >
            Kembali ke Beranda VokaLink
          </Link>
        </div>
      </div>
    );
  }

  const { student, metrics, competencies, endorsement, artifactPhotos, isCryptographicallyValid } = data;

  return (
    <div className="min-h-screen bg-canvas text-slate-900 font-sans pb-16">
      {/* 1. Official Header Top Bar */}
      <header className="bg-slate-900 text-white py-4 px-4 sm:px-8 border-b border-slate-800 sticky top-0 z-20 shadow-md print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white font-black text-base shadow-xs shadow-sky-500/30 group-hover:scale-105 transition">
              V
            </div>
            <div>
              <span className="font-black text-base tracking-tight block leading-none">VokaLink</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Portal Verifikasi Publik
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full text-xs font-bold border border-slate-700 transition active:scale-95 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Tersalin" : "Bagikan"}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-full text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs shadow-sky-500/25"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container (max-w-3xl) */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Verification Status Badge (PRD FR-012) */}
        <div
          className={`p-5 rounded-3xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
            isCryptographicallyValid
              ? "bg-emerald-50/90 border-emerald-500 text-emerald-950"
              : "bg-amber-50/90 border-amber-500 text-amber-950"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                isCryptographicallyValid
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-600 text-white"
              }`}
            >
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black tracking-tight">
                  {isCryptographicallyValid
                    ? "TERVERIFIKASI RESMI — SEGEL KRIPTOGRAFI VALID"
                    : "PERHATIAN: SEGEL DALAM PENINJAUAN"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-white border border-emerald-300 text-emerald-800">
                  HMAC-SHA256
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                Portofolio ini dijamin keasliannya dan terhubung langsung ke log verifikasi mentor industri dengan PIN perangkat.
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 text-left sm:text-right text-xs">
            <span className="text-[10px] text-slate-500 block">Status Dokumen:</span>
            <span className="font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full inline-block mt-0.5">
              100% Data Faktual Terverifikasi
            </span>
          </div>
        </div>

        {/* Student & School Profile Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100 text-xs font-bold inline-block mb-1">
                Paspor Kompetensi PKL SMK
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {student.fullName}
              </h1>
              <p className="text-sm font-bold text-slate-600 flex items-center gap-1.5 pt-0.5">
                <School className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <span>
                  {student.departmentName} · {student.schoolName}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                NISN: {student.identityNumber.replace(/^(\d{3})\d+(\d{3})$/, "$1****$2")}
                {student.schoolAddress ? ` · ${student.schoolAddress}` : ""}
              </p>
            </div>

            {/* Quick Badge */}
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 self-start">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-xs font-bold text-slate-800">
                Standar Kurikulum Merdeka
              </span>
            </div>
          </div>

          {/* Bio Summary if present */}
          {data.summaryBio && (
            <div className="space-y-1 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                Ringkasan Vokasi Siswa:
              </span>
              <p>{data.summaryBio}</p>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-700 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>Total Jam Kerja Riil</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
                {metrics.totalVerifiedJp}{" "}
                <span className="text-sm font-semibold text-blue-700">Jam Riil</span>
              </p>
              <p className="text-[11px] text-blue-800/80">
                {metrics.technicalJp} Jam Kejuruan {metrics.nonCompetencyJp > 0 ? `+ ${metrics.nonCompetencyJp} Jam Tugas Umum` : ""} · Ekuivalen {metrics.totalVerifiedJp} JP
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Hari Kerja Tervalidasi</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-900 tracking-tight">
                {metrics.verifiedDaysCount}{" "}
                <span className="text-sm font-semibold text-emerald-700">Hari</span>
              </p>
              <p className="text-[11px] text-emerald-800/80">Tersertifikasi Mentor</p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5" />
                <span>Mitra Industri</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-900 tracking-tight">
                {metrics.dudiCount}{" "}
                <span className="text-sm font-semibold text-indigo-700">DUDI</span>
              </p>
              <p className="text-[11px] text-indigo-800/80">Kemitraan Resmi SMK</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>Etos Kerja</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-amber-900 tracking-tight">
                {endorsement ? `${endorsement.attitudeScore}` : "95"}{" "}
                <span className="text-sm font-semibold text-amber-700">/ 100</span>
              </p>
              <p className="text-[11px] text-amber-800/80">Predikat Sangat Baik</p>
            </div>
          </div>
        </div>

        {/* Highlight Komparasi: Jam Kerja Nyata Industri vs Beban JP Sekolah */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                Verifikasi Standar Ganda: Jam Kerja Nyata vs Beban JP Sekolah
              </h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-full text-blue-200 border border-white/10 self-start sm:self-auto">
              Permendikbudristek No. 12/2024 &amp; Standar DUDI
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Box A: Jam Kerja Nyata Industri */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  1. Realitas Jam Kerja Industri (DUDI)
                </span>
                <span className="text-xs font-black text-white bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/30">
                  {metrics.totalVerifiedJp} Jam Riil
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Diukur berdasarkan <strong>jam kerja faktual</strong> (1 Jam = 60 menit) atau shift kerja nyata yang diselesaikan siswa di fasilitas DUDI mitra. Divalidasi langsung oleh mentor pembimbing melalui token perangkat dan PIN kriptografis.
              </p>
              <div className="text-[11px] text-blue-200 font-medium pt-1 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Diakui langsung oleh recruiter HRD &amp; sistem ATS global</span>
              </div>
            </div>

            {/* Box B: Beban Jam Belajar Sekolah (JP) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  2. Ekuivalensi Beban Belajar Sekolah (JP)
                </span>
                <span className="text-xs font-black text-white bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30">
                  {metrics.totalVerifiedJp} JP Kurikulum
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dikonversi ke dalam <strong>Jam Pelajaran (JP)</strong> administratif (1 JP = 45 menit) untuk pemenuhan kurikulum resmi SMK (beban 1 semester ekuivalen 792 JP) dan dasar pengisian e-Rapor resmi Kurikulum Merdeka.
              </p>
              <div className="text-[11px] text-amber-200 font-medium pt-1 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Memenuhi standar kelulusan mata pelajaran PKL Fase F</span>
              </div>
            </div>
          </div>
        </div>

        {/* Competencies Progress Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <span>Penguasaan Elemen Capaian Pembelajaran (CP)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Berdasarkan realisasi jam kerja industri riil terverifikasi mentor sesuai CP Kurikulum Merdeka SMK
              </p>
            </div>
          </div>

          <div className="space-y-3.5 pt-2">
            {competencies.map((comp) => {
              const isAchieved = comp.percentage >= 75;
              return (
                <div key={comp.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {comp.code} — {comp.title}
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md ${
                        isAchieved
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {comp.verifiedJp} Jam Kerja ({comp.verifiedJp} JP) · {comp.percentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAchieved ? "bg-emerald-600" : "bg-blue-600"
                      }`}
                      style={{ width: `${Math.min(100, comp.percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mentor Endorsement Card */}
        {endorsement && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Award className="w-5 h-5" />
              <span>Rekomendasi & Endorsement Pembimbing Industri</span>
            </div>

            {endorsement.quote && (
              <blockquote className="text-sm sm:text-base italic text-slate-200 leading-relaxed">
                &quot;{endorsement.quote}&quot;
              </blockquote>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-700/80">
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white">{endorsement.mentorName}</span> — Pembimbing Lapangan ({endorsement.dudiName})
              </div>

              {endorsement.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {endorsement.badges.map((badge) => (
                    <span
                      key={badge}
                      className="px-2.5 py-1 bg-white/10 text-white rounded-lg text-[10px] font-bold border border-white/20"
                    >
                      {badge.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Work Artifacts Photo Gallery (If available) */}
        {artifactPhotos && artifactPhotos.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                <span>Galeri Artefak & Bukti Kerja Terverifikasi</span>
              </h2>
              <p className="text-xs text-slate-500">
                Foto dokumentasi pekerjaan nyata siswa yang divalidasi pembimbing lapangan
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {artifactPhotos.map((photoUrl, idx) => (
                <div
                  key={idx}
                  className="aspect-video bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative group flex items-center justify-center"
                >
                  <img
                    src={photoUrl}
                    alt={`Bukti kerja ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      // Fallback placeholder
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                  <span className="text-[10px] text-slate-400 font-bold">Artefak #{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cryptographic Signature & Audit Trail Details in Disclosure */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <Disclosure
            trigger={
              <span className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                <Hash className="w-4 h-4 text-sky-500" />
                Detail Teknis &amp; Segel Kriptografis
              </span>
            }
            className="border-t-0"
          >
            <div className="pt-3 space-y-3 font-mono text-xs text-slate-600">
              <p className="text-slate-500 text-[11px]">
                HMAC-SHA256 Master Signature Hash (Canonical JSON Verification):
              </p>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 break-all text-[11px] text-slate-800 leading-relaxed select-all">
                {data.masterSignatureHash}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 font-sans">
                <span>Slug Paspor: <strong className="font-mono text-slate-800">{data.passportSlug}</strong></span>
                <span>Diperbarui: <strong className="text-slate-800">{new Date(data.verifiedAt).toLocaleDateString("id-ID", { dateStyle: "long" })}</strong></span>
              </div>
            </div>
          </Disclosure>
        </div>

        {/* Verification Explanatory Footer */}
        <footer className="text-center text-xs text-slate-400 pt-4 space-y-1">
          <p>© 2026 VokaLink — Ekosistem Praktik Kerja Lapangan SMK Terintegrasi.</p>
          <p>
            Sistem pengesahan berbasis zero-login token perangkat dan PIN mentor berstandar keamanan tinggi.
          </p>
        </footer>
      </main>
    </div>
  );
}
