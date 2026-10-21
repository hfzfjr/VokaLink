"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle,
  Clock,
  QrCode,
  FileText,
  Search,
  PlusCircle,
  X,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  ImageIcon,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/pwa/db";

interface LogEntry {
  id: string;
  date: string;
  title: string;
  durationJp: number;
  autonomy: "Mandiri" | "Terbimbing" | "Observasi";
  autonomyScore: number;
  skkniCode?: string;
  status: "VERIFIED" | "PENDING_VERIFICATION";
  verifiedAt?: string | null;
  mentor: string;
  hasPhoto: boolean;
  isNonCompetency?: boolean;
  nonCompetencyCategory?: string;
  notes?: string;
  syncState?: "queued" | "meta_synced" | "synced" | "verified" | "revision_required" | "failed";
}

export default function LogHistoryPage() {
  const [filter, setFilter] = useState<"ALL" | "VERIFIED" | "PENDING" | "NON_COMPETENCY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState<LogEntry | null>(null);

  const sampleLogs: LogEntry[] = [
    {
      id: "log-1",
      date: "2026-10-20",
      title: "Implementasi REST API & Router Express",
      durationJp: 8,
      autonomy: "Mandiri",
      autonomyScore: 100,
      skkniCode: "J.620100.009.01",
      status: "VERIFIED",
      verifiedAt: "20 Okt 2026, 17:30 WIB",
      mentor: "Rizky Firmansyah",
      hasPhoto: true,
      notes: "Menyelesaikan 4 router Express v5 dan validasi schema Zod untuk modul daily logs.",
    },
    {
      id: "log-2",
      date: "2026-10-19",
      title: "Refactoring Skema Database & Migration",
      durationJp: 8,
      autonomy: "Terbimbing",
      autonomyScore: 88,
      skkniCode: "J.620100.010.01",
      status: "PENDING_VERIFICATION",
      verifiedAt: null,
      mentor: "Rizky Firmansyah",
      hasPhoto: true,
      notes: "Menambahkan trigger PostgreSQL block_verified_log_update pada skema Prisma.",
    },
    {
      id: "log-3",
      date: "2026-10-18",
      title: "Bantuan Operasional Umum (Administrasi)",
      durationJp: 4,
      autonomy: "Mandiri",
      autonomyScore: 100,
      status: "VERIFIED",
      verifiedAt: "18 Okt 2026, 18:00 WIB",
      mentor: "Rizky Firmansyah",
      hasPhoto: false,
      isNonCompetency: true,
      nonCompetencyCategory: "Administrasi Dokumen Kantor",
      notes: "Membantu arsip faktur pengiriman barang mitra DUDI. Jam dihitung penuh (BR-004).",
    },
    {
      id: "log-4",
      date: "2026-10-17",
      title: "Desain Komponen UI Mobile-First PWA",
      durationJp: 8,
      autonomy: "Mandiri",
      autonomyScore: 100,
      skkniCode: "J.620100.012.01",
      status: "VERIFIED",
      verifiedAt: "17 Okt 2026, 17:15 WIB",
      mentor: "Rizky Firmansyah",
      hasPhoto: true,
      notes: "Implementasi responsive header, bottom navigation bar, dan status sync Dexie.",
    },
  ];

  const offlineLogs = useLiveQuery(() => db.logs.toArray(), [], []);

  const convertedOfflineLogs: LogEntry[] = (offlineLogs || []).map((ol) => ({
    id: ol.clientLogUuid,
    date: ol.logDate,
    title:
      ol.jobCardTitle ||
      (ol.isNonCompetency
        ? `Bantuan Operasional (${ol.nonCompetencyCategory || "Non-Jurusan"})`
        : ol.jobCardIds[0] === "00000000-0000-0000-0000-000000000033" || ol.jobCardIds[0] === "jc-2"
        ? "Desain Skema Database & Migrasi Prisma"
        : ol.jobCardIds[0] === "00000000-0000-0000-0000-000000000032" || ol.jobCardIds[0] === "jc-3"
        ? "Slicing UI Responsif Tailwind CSS"
        : ol.jobCardIds[0] === "00000000-0000-0000-0000-000000000035" || ol.jobCardIds[0] === "jc-4"
        ? "Pengujian Unit Testing & Integrasi API"
        : "Implementasi REST API & Router Express"),
    durationJp: ol.durationJp,
    autonomy: ol.autonomyLevel === 3 ? "Mandiri" : ol.autonomyLevel === 2 ? "Terbimbing" : "Observasi",
    autonomyScore: ol.autonomyLevel === 3 ? 100 : ol.autonomyLevel === 2 ? 88 : 75,
    skkniCode: ol.isNonCompetency ? undefined : "J.620100.009.01",
    status: ol.state === "verified" ? "VERIFIED" : "PENDING_VERIFICATION",
    verifiedAt: ol.verifiedAt || null,
    mentor: "Rizky Firmansyah",
    hasPhoto: true,
    isNonCompetency: ol.isNonCompetency,
    nonCompetencyCategory: ol.nonCompetencyCategory,
    notes: ol.shortNote,
    syncState: ol.state,
  }));

  // Gabungkan antrean offline lokal dengan riwayat sample
  const allLogs = [...convertedOfflineLogs, ...sampleLogs];

  const totalVerifiedJp = allLogs
    .filter((l) => l.status === "VERIFIED")
    .reduce((acc, curr) => acc + curr.durationJp, 0);

  const totalPendingJp = allLogs
    .filter((l) => l.status === "PENDING_VERIFICATION")
    .reduce((acc, curr) => acc + curr.durationJp, 0);

  const pendingCount = allLogs.filter((l) => l.status === "PENDING_VERIFICATION").length;

  const filteredLogs = allLogs.filter((log) => {
    // Filter status tab
    if (filter === "VERIFIED" && log.status !== "VERIFIED") return false;
    if (filter === "PENDING" && log.status !== "PENDING_VERIFICATION") return false;
    if (filter === "NON_COMPETENCY" && !log.isNonCompetency) return false;

    // Filter search
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchTitle = log.title.toLowerCase().includes(q);
      const matchSkkni = log.skkniCode?.toLowerCase().includes(q);
      const matchDate = log.date.includes(q);
      if (!matchTitle && !matchSkkni && !matchDate) return false;
    }

    return true;
  });

  const handleCopyLink = () => {
    navigator.clipboard?.writeText("http://localhost:3000/v/mock-demo-token-123");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Riwayat Logbook PKL
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Daftar seluruh aktivitas harian, status verifikasi penyelia, dan validasi jam praktik
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition active:scale-[0.99] cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Minta Verifikasi</span>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-emerald-800 text-[10px] font-black flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          <Link
            href="/student/log/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-[0.99]"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Catat Baru</span>
          </Link>
        </div>
      </div>

      {/* 2. Overview Stats Cards Grid (4 Columns on Desktop, 2 on Tablet/Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Jam Terverifikasi */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Terverifikasi
            </p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {totalVerifiedJp} <span className="text-xs sm:text-sm font-semibold text-slate-500">JP</span>
            </p>
          </div>
        </div>

        {/* Card 2: Menunggu Verifikasi */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Menunggu
            </p>
            <p className="text-lg sm:text-2xl font-black text-amber-600 tracking-tight leading-tight">
              {totalPendingJp} <span className="text-xs sm:text-sm font-semibold text-slate-500">JP</span>
            </p>
          </div>
        </div>

        {/* Card 3: Total Entri Jurnal */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Entri
            </p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {sampleLogs.length} <span className="text-xs sm:text-sm font-semibold text-slate-500">Hari</span>
            </p>
          </div>
        </div>

        {/* Card 4: Tugas Non-Jurusan (BR-004) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Non-Jurusan
            </p>
            <p className="text-lg sm:text-2xl font-black text-purple-700 tracking-tight leading-tight">
              4 <span className="text-xs sm:text-sm font-semibold text-slate-500">JP (BR-004)</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search Bar & Filter Tabs */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan judul kegiatan, SKKNI, atau tanggal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 overflow-x-auto">
            {[
              { id: "ALL" as const, label: "Semua" },
              { id: "PENDING" as const, label: `Menunggu (${pendingCount})` },
              { id: "VERIFIED" as const, label: "Terverifikasi" },
              { id: "NON_COMPETENCY" as const, label: "Non-Jurusan" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                  filter === tab.id
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Log Cards Grid (3 Columns on Desktop, 2 on Tablet, 1 on Mobile) */}
      {filteredLogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLogs.map((log) => {
            const isVerified = log.status === "VERIFIED";
            return (
              <div
                key={log.id}
                onClick={() => setSelectedLogDetail(log)}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-slate-300 transition cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
              >
                <div className="space-y-3">
                  {/* Card Header: Date & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {log.date}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider ${
                        isVerified
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : log.syncState === "queued"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : log.syncState === "meta_synced"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : log.syncState === "failed"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {isVerified ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> Terverifikasi
                        </>
                      ) : log.syncState === "queued" ? (
                        <>
                          <Clock className="w-3 h-3" /> Antrean Lokal
                        </>
                      ) : log.syncState === "meta_synced" ? (
                        <>
                          <Clock className="w-3 h-3 animate-spin" /> Upload Foto
                        </>
                      ) : log.syncState === "failed" ? (
                        <>
                          <Clock className="w-3 h-3" /> Gagal Sinkron
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> Menunggu Mentor
                        </>
                      )}
                    </span>
                  </div>

                  {/* Log Title */}
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {log.title}
                  </h3>

                  {/* SKKNI or Non-Competency Tag */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {log.skkniCode ? (
                      <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        SKKNI {log.skkniCode}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {log.nonCompetencyCategory || "Non-Jurusan (BR-004)"}
                      </span>
                    )}

                    {log.hasPhoto && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-slate-400" />
                        Foto WebP
                      </span>
                    )}
                  </div>

                  {/* Notes snippet */}
                  {log.notes && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {log.notes}
                    </p>
                  )}
                </div>

                {/* Card Footer: JP, Autonomy, Mentor */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {log.durationJp} JP
                    </span>
                    <span className="font-medium text-slate-500">{log.autonomy}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">
            Tidak ada logbook yang sesuai
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Silakan ubah filter status atau kata kunci pencarian Anda untuk melihat log lainnya.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter("ALL");
              setSearchQuery("");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* 5. Modal Minta Verifikasi QR */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Minta Verifikasi Mentor</h3>
                  <p className="text-[11px] text-slate-500">Scan QR atau kirim tautan sekali pakai</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Mock Display */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-48 h-48 bg-white border-2 border-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner relative">
                <QrCode className="w-36 h-36 text-slate-900" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-300 shadow-md flex items-center justify-center font-black text-xs text-blue-600">
                    VL
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                  <Clock className="w-3 h-3" /> Berlaku 24 Jam
                </span>
                <p className="text-xs text-slate-600">
                  Arahkan kamera smartphone mentor DUDI ke kode QR di atas.
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-xs text-slate-600 bg-blue-50 p-3 rounded-xl border border-blue-200 space-y-1 leading-relaxed">
              <p className="font-bold text-blue-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Bebas Akun untuk Mentor (BR-007):
              </p>
              <p className="text-blue-800 text-[11px]">
                Mentor DUDI tidak perlu membuat akun atau mengunduh aplikasi. Cukup scan QR atau klik tautan WhatsApp, lalu masukkan 4 digit PIN mentor yang terdaftar (BR-007).
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? "Tautan Berhasil Disalin!" : "Salin Tautan Verifikasi (WhatsApp)"}
              </button>

              <Link
                href="/v/mock-demo-token-123"
                target="_blank"
                className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                Simulasikan Tampilan Mentor (/v/[token])
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Log Detail */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {selectedLogDetail.date}
              </span>
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${
                    selectedLogDetail.status === "VERIFIED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {selectedLogDetail.status === "VERIFIED" ? "TERVERIFIKASI" : "MENUNGGU VERIFIKASI"}
                </span>
                {selectedLogDetail.skkniCode && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    SKKNI {selectedLogDetail.skkniCode}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {selectedLogDetail.title}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Durasi Pembelajaran</p>
                <p className="font-extrabold text-slate-900 mt-0.5">{selectedLogDetail.durationJp} JP</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Kemandirian (Bobot)</p>
                <p className="font-extrabold text-slate-900 mt-0.5">
                  {selectedLogDetail.autonomy} ({selectedLogDetail.autonomyScore})
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Mentor Pembimbing</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedLogDetail.mentor}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Waktu Verifikasi</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {selectedLogDetail.verifiedAt || "Menunggu persetujuan"}
                </p>
              </div>
            </div>

            {selectedLogDetail.notes && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">Catatan Siswa:</p>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {selectedLogDetail.notes}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedLogDetail(null)}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
