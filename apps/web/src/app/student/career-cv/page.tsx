"use client";

import React, { useState } from "react";
import {
  Printer,
  QrCode,
  ShieldCheck,
  Building2,
  Lock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function CareerCvPage() {
  const [bioSummary, setBioSummary] = useState(
    "Siswa SMK jurusan Rekayasa Perangkat Lunak dengan pengalaman magang industri selama 184 JP terverifikasi di PT Nusantara Tech, berfokus pada pengembangan backend RESTful API dan integrasi basis data."
  );

  return (
    <div className="space-y-4 py-1">
      {/* Action Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            CV ATS & Paspor Kompetensi
          </h2>
          <p className="text-xs text-slate-500">
            Portofolio resmi ber-QR berbasis jam praktik terverifikasi
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
        >
          <Printer className="w-3.5 h-3.5" />
          Cetak PDF A4
        </button>
      </div>

      {/* Lock Notice (BR-010) */}
      <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2 no-print">
        <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span>
          <strong>Integritas Data Terkunci (BR-010):</strong> Seluruh jam, DUDI, dan unit
          SKKNI ditarik langsung dari database dan tidak dapat dipalsukan.
        </span>
      </div>

      {/* CV Sheet (A4 Single Column ATS Layout) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-300 shadow-sm print:border-none print:shadow-none print:p-0 space-y-4 text-slate-900 font-sans text-xs">
        {/* CV Header */}
        <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase text-slate-900">
              Andi Pratama
            </h1>
            <p className="font-semibold text-blue-700 text-xs">
              Rekayasa Perangkat Lunak · SMK Demo VokaLink
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Surabaya, Jawa Timur · andi.pratama@siswa.vokalink.id · +62 812-9876-5001
            </p>
          </div>

          {/* QR Code to public passport */}
          <div className="text-center flex-shrink-0 ml-3">
            <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-lg flex flex-col items-center justify-center p-1">
              <QrCode className="w-10 h-10 text-slate-800" />
              <span className="text-[8px] font-bold text-slate-600 uppercase mt-0.5">
                Scan Audit
              </span>
            </div>
          </div>
        </div>

        {/* Ringkasan Profesional */}
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
            Ringkasan Profesional
          </h3>
          <p className="text-slate-700 leading-relaxed text-[11px]">{bioSummary}</p>
        </div>

        {/* Pengalaman Praktik Kerja Lapangan (Terkunci dari DB) */}
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2">
            Pengalaman Praktik Kerja Lapangan (PKL)
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-baseline font-bold text-slate-900 text-xs">
                <span>Backend Developer Intern — PT Nusantara Tech</span>
                <span className="text-slate-500 font-medium text-[11px]">Jan 2026 – Sekarang</span>
              </div>
              <p className="text-[10px] text-slate-500 italic mb-1.5">
                Penyelia: Rizky Firmansyah (Engineering Lead) · Total Jam Terverifikasi: 184 JP
              </p>

              {/* XYZ Bullets */}
              <ul className="list-disc list-outside pl-4 space-y-1 text-slate-700 text-[11px]">
                <li>
                  Mengembangkan dan menguji endpoint RESTful API menggunakan Express dan
                  TypeScript dengan total 64 JP kerja mandiri terverifikasi (SKKNI: J.620100.009.01).
                </li>
                <li>
                  Merancang skema relasional 20 entitas pada PostgreSQL menggunakan Prisma ORM
                  dan menerapkan database migration untuk 40 JP praktik terbimbing (SKKNI: J.620100.010.01).
                </li>
                <li>
                  Menerapkan sistem autentikasi Bearer JWT serta enkripsi payload dengan zero
                  keamanan bocor (SKKNI: J.620100.012.01).
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Keahlian Teknis & Tools */}
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
            Keterampilan & Penguasaan Alat
          </h3>
          <div className="text-[11px] text-slate-700 space-y-1">
            <p>
              <strong className="text-slate-900">Bahasa Pemrograman & Runtime:</strong> TypeScript,
              JavaScript (ESM), Node.js.
            </p>
            <p>
              <strong className="text-slate-900">Framework & Basis Data:</strong> Express 5, Next.js
              15, PostgreSQL, Prisma ORM, Tailwind CSS.
            </p>
            <p>
              <strong className="text-slate-900">Alat Kerja & Konsep:</strong> Git, REST API, PWA,
              IndexedDB (Dexie), Web Crypto API (HMAC-SHA256).
            </p>
          </div>
        </div>

        {/* Segel Keaslian Paspor */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tersegel Kriptografi HMAC-SHA256 VokaLink</span>
          </div>
          <Link
            href="/verify/demo-paspor-pkl"
            className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1 no-print"
          >
            Buka Halaman Audit Paspor <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
