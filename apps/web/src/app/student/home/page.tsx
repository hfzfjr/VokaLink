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
  ChevronRight,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";

export default function StudentHomePage() {
  const student = {
    name: "Andi Pratama",
    nisn: "0078901234",
    school: "SMK Demo VokaLink",
    major: "Rekayasa Perangkat Lunak (RPL)",
    dudi: "PT Nusantara Tech",
    mentor: "Rizky Firmansyah (Engineering Lead)",
    city: "Surabaya, Jawa Timur",
    verifiedJp: 184,
    pendingJp: 16,
    targetJp: TOTAL_TARGET_JP,
  };

  const progressPercentage = Math.round((student.verifiedJp / student.targetJp) * 100);

  return (
    <div className="space-y-6">
      {/* Top Section Grid (Hero Card + Progress Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1. Student Identity Hero Card (7 cols on desktop) */}
        <section className="lg:col-span-7 bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Siswa PKL Aktif · Semester Genap 2025/2026
              </div>
              <span className="text-xs text-blue-200 hidden sm:inline-block">
                NISN: {student.nisn}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-lg font-black shadow-inner flex-shrink-0">
                AP
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  {student.name}
                </h1>
                <p className="text-xs sm:text-sm text-blue-200 font-medium mt-0.5">
                  {student.major} · {student.school}
                </p>
              </div>
            </div>
          </div>

          {/* DUDI info snippet footer */}
          <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-100 relative z-10">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-300" />
              <span>Mitra: <strong className="text-white font-bold">{student.dudi}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-blue-200 text-[11px] sm:text-xs">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {student.city}
              </span>
              <span>•</span>
              <span>Mentor: {student.mentor.split("(")[0]}</span>
            </div>
          </div>
        </section>

        {/* 2. Target JP Progress Card (5 cols on desktop) */}
        <section className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">
                Target Jam Pembelajaran (JP)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                <Clock className="w-3.5 h-3.5" /> {student.pendingJp} JP Menunggu
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 tracking-tight">
                {student.verifiedJp}
              </span>
              <span className="text-base font-bold text-slate-500">
                / {student.targetJp} JP
              </span>
              <span className="ml-auto inline-flex items-center gap-1 text-sm font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" /> {progressPercentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                role="progressbar"
                aria-valuenow={student.verifiedJp}
                aria-valuemin={0}
                aria-valuemax={student.targetJp}
              />
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Sesuai Permendikbudristek No. 12/2024</span>
            <span className="font-extrabold text-blue-700">
              Sisa {student.targetJp - student.verifiedJp} JP
            </span>
          </div>
        </section>
      </div>

      {/* Quick Action Grid (3 columns on desktop, 2 on tablet, 1 on small mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Catat Jurnal */}
        <Link
          href="/student/log/new"
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm hover:shadow-md transition active:scale-[0.99] flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">Catat Jurnal Harian</h3>
              <p className="text-xs text-blue-100 mt-0.5">Pilih kartu tugas tanpa ketik bebas</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-200 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Card 2: Verifikasi QR */}
        <Link
          href="/student/log/history"
          className="p-5 rounded-2xl bg-white border border-slate-200/90 text-slate-900 shadow-xs hover:border-slate-300 hover:shadow-sm transition active:scale-[0.99] flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">Minta Verifikasi Mentor</h3>
              <p className="text-xs text-slate-500 mt-0.5">Scan QR langsung di HP penyelia</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Card 3: CV ATS & Paspor */}
        <Link
          href="/student/career-cv"
          className="p-5 rounded-2xl bg-slate-900 text-white shadow-xs hover:bg-slate-800 transition active:scale-[0.99] flex items-center justify-between group sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">CV ATS & Paspor</h3>
              <p className="text-xs text-slate-400 mt-0.5">Portofolio resmi ber-QR terverifikasi</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Riwayat Kegiatan Terakhir (Full width responsive card list) */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base text-slate-900">
              Riwayat Kegiatan Terakhir
            </h2>
            <p className="text-xs text-slate-500">
              Catatan jurnal harian yang telah dikirimkan ke pembimbing
            </p>
          </div>
          <Link
            href="/student/log/history"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
          >
            Lihat Semua Riwayat <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* Item 1 - Verified */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:bg-slate-50 transition flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  Implementasi REST API & Router Express
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> 20 Okt 2026 · 8 JP · Kerja Mandiri
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 whitespace-nowrap">
              VERIFIED
            </span>
          </div>

          {/* Item 2 - Pending Verification */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:bg-slate-50 transition flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  Refactoring Skema Database & Migration
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> 19 Okt 2026 · 8 JP · Terbimbing
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 whitespace-nowrap">
              PENDING
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
