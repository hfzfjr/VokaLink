"use client";

import React, { useState } from "react";
import {
  Printer,
  QrCode,
  ShieldCheck,
  Lock,
  Sparkles,
  ExternalLink,
  CheckCircle,
  FileCheck,
  Check,
  Share2,
} from "lucide-react";
import Link from "next/link";

export default function CareerCvPage() {
  const [bioSummary, setBioSummary] = useState(
    "Siswa SMK jurusan Rekayasa Perangkat Lunak dengan pengalaman magang industri selama 184 JP terverifikasi di PT Nusantara Tech, berfokus pada pengembangan backend RESTful API dan integrasi basis data PostgreSQL."
  );
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText("http://localhost:3000/verify/demo-paspor-pkl");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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
          {/* Lock Notice Banner (BR-010) */}
          <div className="w-full mb-4 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3 no-print">
            <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Integritas Data Terkunci (BR-010):</p>
              <p className="text-blue-800 leading-snug">
                Seluruh klaim jam praktik (184 JP), nama DUDI mitra, dan unit kompetensi SKKNI ditarik otomatis dari database logbook terverifikasi tanpa dapat dimanipulasi secara manual.
              </p>
            </div>
          </div>

          {/* Actual CV Document Sheet (Styled as an A4 document preview) */}
          <div className="w-full bg-white rounded-2xl p-6 sm:p-10 border border-slate-300 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6 text-slate-900 font-sans text-xs">
            {/* CV Header: Student Identity & Dynamic QR */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start gap-4">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-slate-900">
                  Andi Pratama
                </h1>
                <p className="font-bold text-blue-700 text-xs sm:text-sm">
                  Rekayasa Perangkat Lunak · SMK Demo VokaLink
                </p>
                <p className="text-[11px] text-slate-600 pt-0.5">
                  Surabaya, Jawa Timur · andi.pratama@siswa.vokalink.id · +62 812-9876-5001
                </p>
              </div>

              {/* QR Code Audit Stamp */}
              <div className="text-center flex-shrink-0">
                <div className="w-20 h-20 bg-slate-50 border-2 border-slate-900 rounded-xl flex flex-col items-center justify-center p-1.5 shadow-2xs">
                  <QrCode className="w-12 h-12 text-slate-900" />
                  <span className="text-[8px] font-black text-slate-800 uppercase mt-0.5 tracking-wider">
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

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between font-bold text-slate-900 text-xs sm:text-sm">
                  <span>Backend Developer Intern — PT Nusantara Tech</span>
                  <span className="text-slate-500 font-medium text-xs">Jan 2026 – Sekarang</span>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Penyelia: Rizky Firmansyah (Engineering Lead) · Total Jam Terverifikasi: 184 JP (100% Mandiri/Terbimbing)
                </p>

                {/* XYZ Bullet points strictly formatted for ATS */}
                <ul className="list-disc list-outside pl-4 space-y-1.5 text-slate-700 text-xs leading-relaxed">
                  <li>
                    Mengembangkan dan menguji endpoint RESTful API menggunakan Express dan TypeScript dengan total 64 JP kerja mandiri terverifikasi (SKKNI: J.620100.009.01).
                  </li>
                  <li>
                    Merancang skema relasional 20 entitas pada PostgreSQL menggunakan Prisma ORM dan menerapkan database migration untuk 40 JP praktik terbimbing (SKKNI: J.620100.010.01).
                  </li>
                  <li>
                    Menerapkan sistem autentikasi Bearer JWT serta enkripsi payload dengan zero celah keamanan lolos audit mentor (SKKNI: J.620100.012.01).
                  </li>
                  <li>
                    Mengonfigurasi Service Worker PWA (Serwist) dan IndexedDB untuk sinkronisasi antrean logbook offline-first 72 JP.
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 3: Keterampilan & Penguasaan Alat */}
            <div className="space-y-2">
              <h2 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Keterampilan & Penguasaan Alat
              </h2>
              <div className="text-xs text-slate-700 space-y-1 leading-relaxed">
                <p>
                  <strong className="text-slate-900 font-bold">Bahasa Pemrograman:</strong> TypeScript, JavaScript (ESM, Node.js runtime), SQL.
                </p>
                <p>
                  <strong className="text-slate-900 font-bold">Framework & Database:</strong> Express 5, Next.js 15, PostgreSQL, Prisma ORM, Tailwind CSS.
                </p>
                <p>
                  <strong className="text-slate-900 font-bold">Alat Kerja & Konsep:</strong> Git, RESTful API, PWA (Progressive Web App), IndexedDB (Dexie), Web Crypto API (HMAC-SHA256).
                </p>
              </div>
            </div>

            {/* Section 4: Pendidikan */}
            <div className="space-y-1.5">
              <h2 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Pendidikan Formal
              </h2>
              <div className="flex justify-between items-baseline text-xs">
                <div>
                  <p className="font-bold text-slate-900">SMK Demo VokaLink</p>
                  <p className="text-slate-600">Konsentrasi Rekayasa Perangkat Lunak (Fase F)</p>
                </div>
                <span className="text-slate-500 font-medium">2024 – 2027 (Diharapkan)</span>
              </div>
            </div>

            {/* Section 5: Segel Digital & Audit Paspor (BR-010) */}
            <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Tersegel Kriptografis HMAC-SHA256 VokaLink</span>
              </div>
              <Link
                href="/verify/demo-paspor-pkl"
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
                <span>Format Kolom Tunggal murni (single column) tanpa tabel multi-kolom yang membingungkan parser.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Heading standar industri (EXPERIENCE, SKILLS, EDUCATION).</span>
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
            <p className="text-[11px] text-slate-500 leading-snug">
              Tip: Sorot jumlah jam PKL yang telah Anda selesaikan dan bidang spesialisasi yang Anda kuasai.
            </p>
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
            <Link
              href="/verify/demo-paspor-pkl"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition"
            >
              Uji Coba Verifikasi Publik <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
