"use client";

import React, { useState, useEffect } from "react";
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
  Target,
  Layers,
  FileCheck,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { TOTAL_TARGET_JP } from "@vokalink/shared";
import { db, type OfflineLog } from "@/lib/pwa/db";
import { fetchStudentLogContext, type StudentLogContextResponse } from "@/lib/api";

const CP_ELEMENTS = [
  { id: "backend", label: "Backend API", skkni: "J.620100.009", score: 88, jp: 64, targetJp: 72 },
  { id: "frontend", label: "Frontend UI", skkni: "J.620100.012", score: 92, jp: 56, targetJp: 60 },
  { id: "database", label: "Basis Data", skkni: "J.620100.010", score: 80, jp: 40, targetJp: 50 },
  { id: "qa", label: "Testing & QA", skkni: "J.620100.015", score: 75, jp: 24, targetJp: 32 },
  { id: "softskill", label: "Etos Industri", skkni: "J.620100.001", score: 95, jp: 48, targetJp: 50 },
];

export default function StudentHomePage() {
  const [placementInfo, setPlacementInfo] = useState<{
    dudiName: string;
    dudiCity: string;
    mentorName: string;
  } | null>(null);

  // 1. Live Dexie Query for Student Logs (Reactive offline-first state)
  const offlineLogs = useLiveQuery(() => db.logs.toArray(), []) || [];

  // 2. Load context from IndexedDB cache or server fallback
  useEffect(() => {
    let isMounted = true;
    async function loadPlacementContext() {
      try {
        const cached = await db.refData.get("student_log_context");
        if (cached && cached.data && isMounted) {
          const data = cached.data as StudentLogContextResponse;
          if (data.activePlacement) {
            setPlacementInfo({
              dudiName: data.activePlacement.dudiName,
              dudiCity: data.activePlacement.dudiCity,
              mentorName: data.activePlacement.mentorName,
            });
          }
        }

        if (typeof navigator !== "undefined" && navigator.onLine) {
          const fresh = await fetchStudentLogContext();
          if (fresh && fresh.activePlacement && isMounted) {
            setPlacementInfo({
              dudiName: fresh.activePlacement.dudiName,
              dudiCity: fresh.activePlacement.dudiCity,
              mentorName: fresh.activePlacement.mentorName,
            });
          }
        }
      } catch (err) {
        console.warn("Konteks penempatan offline fallback:", err);
      }
    }
    loadPlacementContext();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Dynamically calculate JP from seed base + Dexie logs
  const baseVerifiedJp = 184;
  const dexieVerifiedJp = offlineLogs
    .filter((l) => l.state === "verified")
    .reduce((acc, curr) => acc + curr.durationJp, 0);

  const totalVerifiedJp = baseVerifiedJp + dexieVerifiedJp;

  const totalPendingJp = offlineLogs
    .filter((l) => l.state === "queued" || l.state === "meta_synced" || l.state === "synced")
    .reduce((acc, curr) => acc + curr.durationJp, 0);

  const displayPendingJp = totalPendingJp > 0 ? totalPendingJp : 16;
  const progressPercentage = Math.min(100, Math.round((totalVerifiedJp / TOTAL_TARGET_JP) * 100));

  const student = {
    name: "Andi Pratama",
    nisn: "0078901234",
    school: "SMK Demo VokaLink",
    major: "Rekayasa Perangkat Lunak (RPL)",
    dudi: placementInfo?.dudiName || "PT Nusantara Tech",
    mentor: placementInfo?.mentorName || "Rizky Firmansyah (Engineering Lead)",
    city: placementInfo?.dudiCity || "Surabaya, Jawa Timur",
    verifiedJp: totalVerifiedJp,
    pendingJp: displayPendingJp,
    targetJp: TOTAL_TARGET_JP,
  };

  // Recent activity logs: prioritize IndexedDB logs, fallback to sample records
  const recentLogs: Array<{
    id: string;
    title: string;
    date: string;
    jp: number;
    autonomy: string;
    state: string;
  }> =
    offlineLogs.length > 0
      ? offlineLogs
          .slice()
          .sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime())
          .slice(0, 4)
          .map((l: OfflineLog) => ({
            id: l.clientLogUuid,
            title: l.jobCardTitle || "Jurnal Praktik Harian",
            date: l.logDate,
            jp: l.durationJp,
            autonomy: l.autonomyLevel === 3 ? "Mandiri" : l.autonomyLevel === 2 ? "Terbimbing" : "Observasi",
            state: l.state === "verified" ? "VERIFIED" : l.state === "revision_required" ? "REVISI" : "PENDING",
          }))
      : [
          {
            id: "sample-1",
            title: "Implementasi REST API & Router Express",
            date: "20 Okt 2026",
            jp: 8,
            autonomy: "Kerja Mandiri",
            state: "VERIFIED",
          },
          {
            id: "sample-2",
            title: "Refactoring Skema Database & Migration",
            date: "19 Okt 2026",
            jp: 8,
            autonomy: "Terbimbing",
            state: "PENDING",
          },
        ];

  // Pure SVG Radar Coordinates Calculation
  const R = 85;
  const cx = 140;
  const cy = 130;

  const getPolygonPoints = (radiusRatio: number) => {
    return CP_ELEMENTS.map((_, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / CP_ELEMENTS.length;
      const x = cx + R * radiusRatio * Math.cos(angle);
      const y = cy + R * radiusRatio * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  };

  const dataPoints = CP_ELEMENTS.map((elem, i) => {
    const ratio = elem.score / 100;
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / CP_ELEMENTS.length;
    const x = cx + R * ratio * Math.cos(angle);
    const y = cy + R * ratio * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

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
              <span className="text-xs text-blue-200 hidden sm:inline-block font-mono">
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
              <span className="ml-auto inline-flex items-center gap-1 text-sm font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <TrendingUp className="w-3.5 h-3.5" /> {progressPercentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
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
              Sisa {Math.max(0, student.targetJp - student.verifiedJp)} JP
            </span>
          </div>
        </section>
      </div>

      {/* Quick Action Grid (3 columns on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Catat Jurnal */}
        <Link
          href="/student/log/new"
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm hover:shadow-md transition active:scale-[0.99] flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">Catat Jurnal Harian</h3>
              <p className="text-xs text-blue-100 mt-0.5">Presensi & kartu tugas multi-select</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-200 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Card 2: Verifikasi QR */}
        <Link
          href="/student/log/history"
          className="p-5 rounded-2xl bg-white border border-slate-200/90 text-slate-900 shadow-xs hover:border-slate-300 hover:shadow-sm transition active:scale-[0.99] flex items-center justify-between group cursor-pointer"
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
          className="p-5 rounded-2xl bg-slate-900 text-white shadow-xs hover:bg-slate-800 transition active:scale-[0.99] flex items-center justify-between group sm:col-span-2 lg:col-span-1 cursor-pointer"
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

      {/* Capaian Elemen Kompetensi CP & Pure SVG Radar Chart (PRD lines 420 & 983) */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <h2 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                Distribusi Capaian Pembelajaran (CP) Kejuruan
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemetaan realisasi jam kerja faktual terhadap elemen kurikulum Merdeka SMK RPL (PRD FR-005 & TC-005)
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 self-start sm:self-auto">
            <Layers className="w-3.5 h-3.5" />
            <span>5 Elemen SKKNI Terpetakan</span>
          </div>
        </div>

        {/* 2 Columns: Pure SVG Radar Chart + Horizontal CP Progress Bars */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Radar Chart (5 cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <div className="w-full max-w-[280px] aspect-square relative flex items-center justify-center">
              <svg viewBox="0 0 280 260" className="w-full h-full overflow-visible">
                <defs>
                  {/* Radar Area Gradient Fill */}
                  <linearGradient id="radarAreaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.20" />
                  </linearGradient>
                </defs>

                {/* Concentric Background Pentagon Grids */}
                {[0.25, 0.5, 0.75, 1.0].map((level) => (
                  <polygon
                    key={level}
                    points={getPolygonPoints(level)}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={level === 1.0 ? "1.5" : "1"}
                    strokeDasharray={level < 1.0 ? "3,3" : undefined}
                  />
                ))}

                {/* Radial Axis Spokes */}
                {CP_ELEMENTS.map((_, i) => {
                  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / CP_ELEMENTS.length;
                  const x = cx + R * Math.cos(angle);
                  const y = cy + R * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={cx}
                      y1={cy}
                      x2={x}
                      y2={y}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Real Data Polygon Area */}
                <polygon
                  points={dataPoints}
                  fill="url(#radarAreaGradient)"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />

                {/* Data Vertex Nodes */}
                {CP_ELEMENTS.map((elem, i) => {
                  const ratio = elem.score / 100;
                  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / CP_ELEMENTS.length;
                  const x = cx + R * ratio * Math.cos(angle);
                  const y = cy + R * ratio * Math.sin(angle);
                  return (
                    <circle
                      key={elem.id}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#4f46e5"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* Perimeter Axis Labels */}
                {CP_ELEMENTS.map((elem, i) => {
                  const labelRadius = R + 24;
                  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / CP_ELEMENTS.length;
                  const x = cx + labelRadius * Math.cos(angle);
                  const y = cy + labelRadius * Math.sin(angle);
                  return (
                    <text
                      key={elem.id}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[10px] font-extrabold fill-slate-700 tracking-tight"
                    >
                      {elem.label}
                    </text>
                  );
                })}
              </svg>
            </div>
            <p className="text-[11px] text-slate-400 font-medium text-center mt-2">
              Visualisasi Poligon Radar Penguasaan Kompetensi (PRD FR-005)
            </p>
          </div>

          {/* Detailed CP Competency Progress Bars (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-3">
            {CP_ELEMENTS.map((elem) => {
              const isAchieved = elem.score >= 75;
              return (
                <div
                  key={elem.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 hover:bg-slate-100/60 transition"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 block">
                        {elem.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        SKKNI {elem.skkni} · {elem.jp} JP / {elem.targetJp} JP
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900">
                        {elem.score}%
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isAchieved
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {isAchieved ? "Kompeten" : "Berkembang"}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAchieved
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                          : "bg-gradient-to-r from-amber-500 to-amber-600"
                      }`}
                      style={{ width: `${elem.score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Riwayat Kegiatan Terakhir (Full width responsive card list from Dexie) */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base text-slate-900">
              Riwayat Jurnal Terakhir (Tersinkron Lokal)
            </h2>
            <p className="text-xs text-slate-500">
              Catatan jurnal harian terkini yang tersimpan di perangkat offline Anda
            </p>
          </div>
          <Link
            href="/student/log/history"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua Riwayat <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {recentLogs.map((log) => {
            const isVerified = log.state === "VERIFIED";
            return (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:bg-slate-50 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isVerified
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {isVerified ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                      {log.title}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {log.date} · {log.jp} JP · {log.autonomy}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border whitespace-nowrap ${
                    isVerified
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {log.state}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
