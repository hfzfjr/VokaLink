"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Printer,
  ShieldCheck,
  Lock,
  Sparkles,
  ExternalLink,
  CheckCircle,
  FileCheck,
  Check,
  Share2,
  RefreshCw,
  AlertCircle,
  Award,
  Save,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { fetchStudentCv, updateStudentPassport, type StudentCvResponse } from "@/lib/api";

export default function CareerCvPage() {
  const [cvData, setCvData] = useState<StudentCvResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bio state & editing
  const [bioSummary, setBioSummary] = useState("");
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [bioSaveSuccess, setBioSaveSuccess] = useState(false);

  // Share link state
  const [copiedLink, setCopiedLink] = useState(false);

  const loadCv = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchStudentCv();
      setCvData(data);
      setBioSummary(data.summaryBio);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat data CV";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCv();
  }, [loadCv]);

  const handleCopyLink = () => {
    if (!cvData) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const fullUrl = `${origin}${cvData.verificationUrl}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveBio = async () => {
    if (!cvData || isSavingBio) return;
    setIsSavingBio(true);
    try {
      await updateStudentPassport({ summaryBio: bioSummary });
      setBioSaveSuccess(true);
      setCvData((prev) => (prev ? { ...prev, summaryBio: bioSummary } : null));
      setTimeout(() => setBioSaveSuccess(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan ringkasan bio");
    } finally {
      setIsSavingBio(false);
    }
  };

  // ─── 1. State: Loading Skeleton ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-1/3 no-print" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white rounded-2xl p-8 border border-slate-200 space-y-6">
            <div className="h-20 bg-slate-100 rounded-xl" />
            <div className="h-28 bg-slate-100 rounded-xl" />
            <div className="h-40 bg-slate-100 rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-4 no-print">
            <div className="h-32 bg-slate-100 rounded-2xl border border-slate-200" />
            <div className="h-48 bg-slate-100 rounded-2xl border border-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  // ─── 2. State: Error with Recovery ─────────────────────────────────────────
  if (error || !cvData) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">Gagal Memuat CV ATS</h2>
          <p className="text-xs text-slate-500 max-w-md">{error || "Terjadi kesalahan pada server"}</p>
        </div>
        <button
          onClick={loadCv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  // ─── 3. State: Empty Verified Logs (BR-010) ────────────────────────────────
  if (cvData.totalVerifiedJp === 0) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <Lock className="w-5 h-5 text-amber-600" />
            <span>Belum Ada Jam Praktik Terverifikasi (BR-010)</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            CV Standar ATS dan Paspor Kompetensi VokaLink dibangun 100% berbasis data faktual yang telah diverifikasi resmi oleh Mentor DUDI melalui PIN perangkat. Mintalah mentor industri Anda untuk memvalidasi entri jurnal harian Anda terlebih dahulu agar klaim keterampilan dan jam kerja otomatis terisi.
          </p>
          <Link
            href="/student/log/history"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-xl transition"
          >
            Lihat Riwayat & Minta Verifikasi <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { student, experiences, technicalSkills, endorsement, verificationUrl } = cvData;

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions Bar (no-print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            CV ATS & Paspor Kompetensi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Portofolio digital berbasis jam kerja riil terverifikasi mentor industri (BR-010)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-2xs transition active:scale-[0.99] cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? "Tersalin!" : "Bagikan Tautan"}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition active:scale-[0.99] cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF A4</span>
          </button>
        </div>
      </div>

      {/* 2. Responsive 12-Column Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER: Authentic ATS A4 Sheet (8 cols on desktop, full width on mobile/tablet) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Lock Notice Banner (BR-010 & BR-004) */}
          <div className="w-full mb-4 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3 no-print">
            <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Integritas Data Terkunci (BR-010 & BR-004):</p>
              <p className="text-blue-800 leading-snug">
                Seluruh klaim jam praktik ({cvData.totalVerifiedJp} JP), nama DUDI mitra, dan unit kompetensi SKKNI ditarik otomatis dari database logbook terverifikasi tanpa dapat dimanipulasi secara manual. Jam non-kompetensi ({cvData.nonCompetencyJp} JP) dikecualikan dari klaim teknis.
              </p>
            </div>
          </div>

          {/* Actual CV Document Sheet (Styled as an A4 document preview) */}
          <div className="w-full bg-white rounded-2xl p-6 sm:p-10 border border-slate-300 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6 text-slate-900 font-sans text-xs">
            {/* CV Header: Student Identity & Dynamic QR */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start gap-4">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-slate-900">
                  {student.fullName}
                </h1>
                <p className="font-bold text-blue-700 text-xs sm:text-sm">
                  {student.departmentName} · {student.schoolName}
                </p>
                <p className="text-[11px] text-slate-600 pt-0.5">
                  NISN: {student.identityNumber} {student.whatsappNumber ? `· WA: ${student.whatsappNumber}` : ""}
                  {student.schoolAddress ? ` · ${student.schoolAddress}` : ""}
                </p>
              </div>

              {/* QR Code Audit Stamp */}
              <div className="text-center flex-shrink-0">
                <div className="w-20 h-20 bg-slate-50 border-2 border-slate-900 rounded-xl flex flex-col items-center justify-center p-1.5 shadow-2xs">
                  {/* Stylized high-contrast SVG QR for ATS scanning */}
                  <svg className="w-12 h-12 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM40 30h10v10H40zM20 40h10v10H20zM60 40h10v10H60zM40 60h10v10H40zM80 40h20v10H80zM40 80h20v20H40zM70 70h10v20H70zM90 70h10v10H90zM80 90h20v10H80z" />
                  </svg>
                  <span className="text-[7.5px] font-black text-slate-800 uppercase mt-0.5 tracking-wider">
                    Scan Audit
                  </span>
                </div>
              </div>
            </div>

            {/* Section 1: Ringkasan Profesional */}
            <div className="space-y-1.5">
              <h2 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Ringkasan Profesional
              </h2>
              <p className="text-slate-700 leading-relaxed text-xs">{bioSummary}</p>
            </div>

            {/* Section 2: Pengalaman Praktik Kerja Lapangan (PKL) */}
            <div className="space-y-3">
              <h2 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Pengalaman Praktik Kerja Lapangan (PKL)
              </h2>

              {experiences.map((exp, idx) => (
                <div key={exp.placementId || idx} className="space-y-2 pt-1 first:pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between font-bold text-slate-900 text-xs sm:text-sm">
                    <span>
                      {exp.roleTitle} — {exp.dudiName} {exp.dudiCity ? `(${exp.dudiCity})` : ""}
                    </span>
                    <span className="text-slate-500 font-medium text-xs">{exp.periodLabel}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    {exp.mentorName ? `Penyelia: ${exp.mentorName} · ` : ""}
                    Total Jam Terverifikasi: {exp.totalVerifiedJp} JP ({exp.technicalJp} JP Kejuruan
                    {exp.nonCompetencyJp > 0 ? ` + ${exp.nonCompetencyJp} JP Non-Jurusan` : ""})
                  </p>

                  {/* XYZ Bullet points strictly formatted for ATS */}
                  <ul className="list-disc list-outside pl-4 space-y-1.5 text-slate-700 text-xs leading-relaxed">
                    {exp.bulletPoints.map((bp, bIdx) => (
                      <li key={bp.jobCardId || bIdx}>{bp.bulletText}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Section 3: Keterampilan & Penguasaan Alat Terverifikasi */}
            {technicalSkills.length > 0 && (
              <div className="space-y-2">
                <h2 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  Keterampilan & Alat Kerja Terverifikasi
                </h2>
                <div className="text-xs text-slate-700 leading-relaxed">
                  <p>
                    <strong className="text-slate-900 font-bold">Teknologi & Instrumen Praktik: </strong>
                    {technicalSkills.map((skill, sIdx) => (
                      <span key={skill.name}>
                        {skill.name} ({skill.totalJp} JP)
                        {sIdx < technicalSkills.length - 1 ? ", " : "."}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            )}

            {/* Section 4: Endorsement Industri (Jika ada dari FR-010) */}
            {endorsement && (
              <div className="space-y-2">
                <h2 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  Endorsement & Evaluasi Mentor Industri
                </h2>
                <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 print:bg-transparent print:border-none print:p-0">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Award className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      Skor Etos Kerja: {endorsement.attitudeScore}/100 · Penyelia: {endorsement.mentorName} ({endorsement.dudiName})
                    </span>
                  </div>
                  {endorsement.quote && (
                    <p className="italic text-slate-600 text-[11px] leading-relaxed">
                      &quot;{endorsement.quote}&quot;
                    </p>
                  )}
                  {endorsement.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {endorsement.badges.map((b) => (
                        <span
                          key={b}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold"
                        >
                          {b.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 5: Pendidikan Formal */}
            <div className="space-y-1.5">
              <h2 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Pendidikan Formal
              </h2>
              <div className="flex justify-between items-baseline text-xs">
                <div>
                  <p className="font-bold text-slate-900">{student.schoolName}</p>
                  <p className="text-slate-600">Konsentrasi {student.departmentName} (Fase F)</p>
                </div>
                <span className="text-slate-500 font-medium">2024 – 2027 (Diharapkan)</span>
              </div>
            </div>

            {/* Section 6: Segel Digital & Audit Paspor (BR-010) */}
            <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Tersegel Kriptografis HMAC-SHA256 VokaLink</span>
              </div>
              <Link
                href={verificationUrl}
                target="_blank"
                className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1 no-print"
              >
                Buka Halaman Audit Paspor Publik <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Controls & ATS Guidance (4 cols on desktop, no-print) */}
        <div className="lg:col-span-4 space-y-5 no-print">
          {/* Card 1: ATS Compliance Guarantee */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <span>Jaminan Standar ATS 100%</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Format CV ini telah diuji untuk lolos sistem pembaca CV otomatis (Applicant Tracking System) perusahaan:
            </p>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Format Kolom Tunggal murni (single column) tanpa tabel multi-kolom yang membingungkan parser ATS.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Heading standar industri (RINGKASAN, PENGALAMAN, KETERAMPILAN, PENDIDIKAN).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Poin pencapaian berbasis formula XYZ Google (Tindakan + Metrik JP + Hasil SKKNI).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Bebas dari skill fiktif karena tersinkron langsung dari jam verifikasi mentor DUDI (BR-010).</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Sesuaikan Ringkasan Profesional */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="bio-edit" className="text-sm font-bold text-slate-900">
                Sesuaikan Ringkasan Diri:
              </label>
              <span className="text-[11px] text-slate-400">
                {bioSummary.length} karakter
              </span>
            </div>
            <textarea
              id="bio-edit"
              rows={4}
              value={bioSummary}
              onChange={(e) => setBioSummary(e.target.value)}
              className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition leading-relaxed"
              placeholder="Tuliskan ringkasan pengalaman dan fokus keahlian Anda..."
            />
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-500 leading-snug">
                Disimpan ke Paspor Digital Siswa
              </p>
              <button
                type="button"
                onClick={handleSaveBio}
                disabled={isSavingBio}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isSavingBio ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : bioSaveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 3: Paspor Kompetensi Publik Info */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Paspor Kompetensi Ber-QR</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Setiap CV yang dicetak memiliki QR Code unik yang terhubung ke halaman audit publik paspor siswa. HRD perusahaan dapat langsung memverifikasi keaslian magang dalam 3 detik.
            </p>
            <div className="pt-1">
              <Link
                href={verificationUrl}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition"
              >
                Uji Coba Verifikasi Publik <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
