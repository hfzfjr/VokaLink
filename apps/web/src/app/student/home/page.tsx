"use client";

import React from "react";
import Link from "next/link";
import {
  PlusCircle,
  QrCode,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Award,
} from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";

export default function StudentHomePage() {
  // Demo simulation state for Hari 1
  const student = {
    name: "Andi Pratama",
    nisn: "0078901234",
    school: "SMK Demo VokaLink",
    major: "Rekayasa Perangkat Lunak (RPL)",
    dudi: "PT Nusantara Tech",
    mentor: "Rizky Firmansyah (Engineering Lead)",
    verifiedJp: 184,
    pendingJp: 16,
    targetJp: TOTAL_TARGET_JP,
  };

  const progressPercentage = Math.round((student.verifiedJp / student.targetJp) * 100);

  return (
    <div className="space-y-4 py-1">
      {/* 1. Student Identity Header Card */}
      <section className="bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 text-blue-100 text-[11px] font-semibold mb-1 backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Siswa PKL Aktif
            </div>
            <h2 className="text-lg font-extrabold tracking-tight leading-tight">
              {student.name}
            </h2>
            <p className="text-xs text-blue-200 font-medium">
              NISN: {student.nisn} · {student.major}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-sm font-black shadow-inner">
            AP
          </div>
        </div>

        {/* DUDI info snippet */}
        <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-blue-100">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-300" />
            <span className="font-semibold truncate max-w-[200px]">{student.dudi}</span>
          </div>
          <span className="text-[11px] text-blue-200">Surabaya</span>
        </div>
      </section>

      {/* 2. Target JP Progress Card (BR-001: 792 JP Target) */}
      <section className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Progres Capaian PKL
            </h3>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {student.verifiedJp}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                / {student.targetJp} JP ({progressPercentage}%)
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
              <Clock className="w-3 h-3" /> {student.pendingJp} JP Tunggu
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            role="progressbar"
            aria-valuenow={student.verifiedJp}
            aria-valuemin={0}
            aria-valuemax={student.targetJp}
          />
        </div>

        <p className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
          <span>Target Kurikulum Merdeka (Permendikbud 12/2024)</span>
          <span className="font-bold text-blue-700">Sisa {student.targetJp - student.verifiedJp} JP</span>
        </p>
      </section>

      {/* 3. Action Cards Grid */}
      <section className="grid grid-cols-2 gap-3">
        {/* Catat Jurnal */}
        <Link
          href="/student/log/new"
          className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm hover:shadow-md transition active:scale-[0.98] flex flex-col justify-between min-h-[110px]"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <PlusCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight">Catat Jurnal</h4>
            <p className="text-[11px] text-blue-100 mt-0.5">Zero-typing & offline</p>
          </div>
        </Link>

        {/* Minta Verifikasi QR */}
        <Link
          href="/student/log/history"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-xs hover:border-slate-300 transition active:scale-[0.98] flex flex-col justify-between min-h-[110px]"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight">Verifikasi QR</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Scan HP Mentor &lt;10 dtk</p>
          </div>
        </Link>
      </section>

      {/* 4. Banner CV ATS & Paspor Publik */}
      <section className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs">Portofolio CV & Paspor</h4>
            <p className="text-[11px] text-slate-400">Tersusun otomatis dari log verified</p>
          </div>
        </div>
        <Link
          href="/student/career-cv"
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          aria-label="Buka CV dan Paspor"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* 5. Riwayat Kegiatan Terakhir */}
      <section className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-xs text-slate-800">Kegiatan Terakhir</h3>
          <Link
            href="/student/log/history"
            className="text-[11px] font-bold text-blue-600 hover:underline"
          >
            Lihat Semua
          </Link>
        </div>

        <div className="space-y-2">
          {/* Item 1 - Verified */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-slate-900">
                  Implementasi REST API & Router Express
                </h5>
                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" /> 20 Okt 2026 · 8 JP · Mandiri
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              VERIFIED
            </span>
          </div>

          {/* Item 2 - Pending Verification */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-slate-900">
                  Refactoring Skema Database & Migration
                </h5>
                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" /> 19 Okt 2026 · 8 JP · Terbimbing
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
              PENDING
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
