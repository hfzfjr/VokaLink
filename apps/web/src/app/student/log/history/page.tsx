"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
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
  Image as ImageIcon,
  Share2,
  Trash2,
  RefreshCw,
  HeartPulse,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/pwa/db";
import { generateVerificationLink } from "@/lib/api";
import { QrCodeView } from "@/components/ui/QrCodeView";
import { useSyncManager } from "@/lib/pwa/hooks/useSyncManager";
import { cn } from "@/lib/cn";

interface LogEntry {
  id: string;
  date: string;
  title: string;
  durationJp: number;
  autonomy: "Mandiri" | "Terbimbing" | "Observasi";
  autonomyScore: number;
  skkniCode?: string;
  status: "VERIFIED" | "PENDING_VERIFICATION";
  attendanceType?: "PRESENT" | "SICK" | "PERMIT";
  verifiedAt?: string | null;
  mentor: string;
  hasPhoto: boolean;
  isNonCompetency?: boolean;
  nonCompetencyCategory?: string;
  notes?: string;
  syncState?: "queued" | "meta_synced" | "synced" | "verified" | "revision_required" | "failed";
  isLocalOnly?: boolean;
}

const SAMPLE_LOGS: LogEntry[] = [
  {
    id: "log-1",
    date: "2026-10-20",
    title: "Implementasi REST API & Router Express",
    durationJp: 8,
    autonomy: "Mandiri",
    autonomyScore: 100,
    skkniCode: "J.620100.009.01",
    status: "VERIFIED",
    attendanceType: "PRESENT",
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
    attendanceType: "PRESENT",
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
    attendanceType: "PRESENT",
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
    attendanceType: "PRESENT",
    verifiedAt: "17 Okt 2026, 17:15 WIB",
    mentor: "Rizky Firmansyah",
    hasPhoto: true,
    notes: "Implementasi responsive header, bottom navigation bar, dan status sync Dexie.",
  },
];

export default function LogHistoryPage() {
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "VERIFIED" | "NON_COMPETENCY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState<LogEntry | null>(null);

  // Photo viewer state for modal
  const [detailPhotoUrl, setDetailPhotoUrl] = useState<string | null>(null);
  const [isLoadingDetailPhoto, setIsLoadingDetailPhoto] = useState(false);

  // Sync Manager
  const { isOnline, pendingCount, isSyncing, syncNow } = useSyncManager();

  // Dynamic verification link state (FR-007)
  const [activeLinkData, setActiveLinkData] = useState<{
    token: string;
    verificationUrl: string;
    fullUrl: string;
    waShareUrl: string | null;
    expiresAt: string;
  } | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // 1. Reactive Query dari Dexie IndexedDB
  const offlineLogs = useLiveQuery(() => db.logs.toArray(), []) || [];

  const convertedOfflineLogs: LogEntry[] = useMemo(() => {
    return offlineLogs.map((ol) => ({
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
      attendanceType: ol.attendanceType || "PRESENT",
      verifiedAt: ol.verifiedAt || null,
      mentor: "Rizky Firmansyah",
      hasPhoto: true,
      isNonCompetency: ol.isNonCompetency,
      nonCompetencyCategory: ol.nonCompetencyCategory,
      notes: ol.shortNote,
      syncState: ol.state,
      isLocalOnly: true,
    }));
  }, [offlineLogs]);

  // Gabungkan entri offline lokal dengan sampel riwayat
  const allLogs = useMemo(() => {
    return [...convertedOfflineLogs, ...SAMPLE_LOGS];
  }, [convertedOfflineLogs]);

  // Statistik Real-Time
  const totalVerifiedJp = useMemo(
    () => allLogs.filter((l) => l.status === "VERIFIED").reduce((acc, curr) => acc + curr.durationJp, 0),
    [allLogs]
  );

  const totalPendingJp = useMemo(
    () => allLogs.filter((l) => l.status === "PENDING_VERIFICATION").reduce((acc, curr) => acc + curr.durationJp, 0),
    [allLogs]
  );

  const totalNonCompetencyJp = useMemo(
    () => allLogs.filter((l) => l.isNonCompetency).reduce((acc, curr) => acc + curr.durationJp, 0),
    [allLogs]
  );

  const pendingCountTotal = useMemo(
    () => allLogs.filter((l) => l.status === "PENDING_VERIFICATION").length,
    [allLogs]
  );

  // Filter & Pencarian
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      if (filter === "VERIFIED" && log.status !== "VERIFIED") return false;
      if (filter === "PENDING" && log.status !== "PENDING_VERIFICATION") return false;
      if (filter === "NON_COMPETENCY" && !log.isNonCompetency) return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchTitle = log.title.toLowerCase().includes(q);
        const matchSkkni = log.skkniCode?.toLowerCase().includes(q);
        const matchDate = log.date.includes(q);
        const matchNotes = log.notes?.toLowerCase().includes(q);
        if (!matchTitle && !matchSkkni && !matchDate && !matchNotes) return false;
      }

      return true;
    });
  }, [allLogs, filter, searchQuery]);

  // Effect untuk memuat foto dari Dexie saat modal detail dibuka
  useEffect(() => {
    let isMounted = true;
    if (!selectedLogDetail) {
      setDetailPhotoUrl(null);
      return;
    }

    async function fetchPhoto() {
      setIsLoadingDetailPhoto(true);
      try {
        const photo = await db.photos.get(selectedLogDetail!.id);
        if (photo && photo.blob && isMounted) {
          const url = URL.createObjectURL(photo.blob);
          setDetailPhotoUrl(url);
        } else {
          setDetailPhotoUrl(null);
        }
      } catch (err) {
        console.warn("Gagal memuat foto dari Dexie:", err);
        setDetailPhotoUrl(null);
      } finally {
        if (isMounted) setIsLoadingDetailPhoto(false);
      }
    }

    fetchPhoto();

    return () => {
      isMounted = false;
      if (detailPhotoUrl) {
        URL.revokeObjectURL(detailPhotoUrl);
      }
    };
  }, [selectedLogDetail]);

  // Handler Hapus Log Offline Lokal
  const handleDeleteOfflineLog = async (logId: string) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus antrean jurnal ini? Data yang belum tersinkronisasi akan dihapus dari penyimpanan perangkat Anda."
      )
    ) {
      return;
    }

    try {
      await db.logs.delete(logId);
      await db.photos.delete(logId);
      setSelectedLogDetail(null);
    } catch (err) {
      alert("Gagal menghapus jurnal lokal: " + String(err));
    }
  };

  // Handler Membuka Modal QR Verifikasi
  const handleOpenVerifyModal = async () => {
    setShowQrModal(true);
    setIsGeneratingLink(true);
    try {
      const cachedContext = await db.refData.get("student_log_context");
      const placementId =
        (cachedContext?.data as any)?.activePlacement?.id ||
        "00000000-0000-0000-0000-000000000051";

      const res = await generateVerificationLink({
        placementId,
        mode: "WA_BATCH",
      });
      setActiveLinkData(res);
    } catch {
      setActiveLinkData({
        token: "mock-demo-token-123",
        verificationUrl: "/v/mock-demo-token-123",
        fullUrl: "http://localhost:3000/v/mock-demo-token-123",
        waShareUrl: null,
        expiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const fullUrl = activeLinkData
      ? activeLinkData.fullUrl || `${origin}${activeLinkData.verificationUrl}`
      : `${origin}/v/mock-demo-token-123`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HEADER & ACTION BAR
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              Riwayat Logbook PKL
            </h1>
            {pendingCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 text-[11px] font-medium font-mono">
                <Clock className="w-3 h-3 text-amber-600" />
                {pendingCount} Antre Offline
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[11px] font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Tersinkron Penuh
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Daftar seluruh aktivitas harian, bukti foto kerja, dan status verifikasi pembimbing DUDI
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => syncNow()}
              disabled={isSyncing || !isOnline}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-xs font-semibold border border-slate-200/80 transition disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-sky-600", isSyncing && "animate-spin")} />
              <span>{isSyncing ? "Menyinkronkan..." : "Sinkronkan"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenVerifyModal}
            disabled={isGeneratingLink}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Minta Verifikasi (QR)</span>
            {pendingCountTotal > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-emerald-800 text-[10px] font-bold">
                {pendingCountTotal}
              </span>
            )}
          </button>

          <Link
            href="/student/log/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Catat Baru</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. OVERVIEW STATS CARDS (Apple HIG Squircles)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* Card 1: Jam Terverifikasi */}
        <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/70 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Terverifikasi
            </p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-mono">
              {totalVerifiedJp} <span className="text-xs font-normal text-slate-500 font-sans">JP</span>
            </p>
          </div>
        </div>

        {/* Card 2: Menunggu Verifikasi */}
        <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/70 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Menunggu
            </p>
            <p className="text-lg sm:text-xl font-bold text-amber-600 tracking-tight font-mono">
              {totalPendingJp} <span className="text-xs font-normal text-slate-500 font-sans">JP</span>
            </p>
          </div>
        </div>

        {/* Card 3: Total Entri Jurnal (Reaktif dari Dexie + Sampel) */}
        <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/70 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/70 flex items-center justify-center shrink-0 shadow-2xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Entri
            </p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-mono">
              {allLogs.length} <span className="text-xs font-normal text-slate-500 font-sans">Jurnal</span>
            </p>
          </div>
        </div>

        {/* Card 4: Tugas Non-Jurusan (BR-004) */}
        <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/70 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/70 flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Non-Jurusan
            </p>
            <p className="text-lg sm:text-xl font-bold text-purple-700 tracking-tight font-mono">
              {totalNonCompetencyJp} <span className="text-xs font-normal text-slate-500 font-sans">JP</span>
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. SEARCH BAR & SEGMENTED FILTER CONTROL (Apple HIG)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-50/60 p-3 sm:p-3.5 rounded-2xl border border-slate-200/70 space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan judul kegiatan, SKKNI, catatan, atau tanggal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl text-xs font-medium text-slate-600 overflow-x-auto border border-slate-200/50">
            {[
              { id: "ALL" as const, label: "Semua" },
              { id: "PENDING" as const, label: `Menunggu (${pendingCountTotal})` },
              { id: "VERIFIED" as const, label: "Terverifikasi" },
              { id: "NON_COMPETENCY" as const, label: "Non-Jurusan" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg whitespace-nowrap text-xs transition cursor-pointer active:scale-95",
                  filter === tab.id
                    ? "bg-white text-slate-900 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. LOG CARDS GRID
      ───────────────────────────────────────────────────────────────────────────── */}
      {filteredLogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredLogs.map((log) => {
            const isVerified = log.status === "VERIFIED";
            const isSickOrPermit = log.attendanceType === "SICK" || log.attendanceType === "PERMIT";

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLogDetail(log)}
                className="bg-white rounded-2xl p-4.5 border border-slate-200/70 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
              >
                <div className="space-y-2.5">
                  {/* Card Header: Date & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {log.date}
                    </span>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border tracking-wide",
                        isVerified
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                          : log.syncState === "queued"
                          ? "bg-amber-50 text-amber-700 border-amber-200/70"
                          : log.syncState === "meta_synced"
                          ? "bg-sky-50 text-sky-700 border-sky-200/70"
                          : log.syncState === "failed"
                          ? "bg-rose-50 text-rose-700 border-rose-200/70"
                          : "bg-blue-50 text-blue-700 border-blue-200/70"
                      )}
                    >
                      {isVerified ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Terverifikasi</span>
                        </>
                      ) : log.syncState === "queued" ? (
                        <>
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Antrean Offline</span>
                        </>
                      ) : log.syncState === "meta_synced" ? (
                        <>
                          <Clock className="w-3 h-3 animate-spin text-sky-600" />
                          <span>Upload Foto</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>Menunggu Mentor</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Log Title */}
                  <h3 className="font-semibold text-sm text-slate-900 group-hover:text-sky-600 transition-colors leading-snug line-clamp-2">
                    {log.title}
                  </h3>

                  {/* Tags (Attendance, SKKNI, Non-Jurusan, Foto) */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isSickOrPermit ? (
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <HeartPulse className="w-3 h-3" />
                        {log.attendanceType === "SICK" ? "Presensi Sakit" : "Presensi Izin"}
                      </span>
                    ) : log.skkniCode ? (
                      <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200/70 px-2 py-0.5 rounded-md">
                        SKKNI {log.skkniCode}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {log.nonCompetencyCategory || "Non-Jurusan (BR-004)"}
                      </span>
                    )}

                    {log.hasPhoto && (
                      <span className="text-[10px] font-medium text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200/50">
                        <ImageIcon className="w-3 h-3 text-slate-400" />
                        Bukti WebP
                      </span>
                    )}
                  </div>

                  {/* Notes Snippet */}
                  {log.notes && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                      {log.notes}
                    </p>
                  )}
                </div>

                {/* Card Footer: JP, Autonomy, Chevron */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono text-[11px]">
                      {log.durationJp} JP
                    </span>
                    <span className="text-slate-500 font-normal text-[11.5px]">
                      {isSickOrPermit
                        ? "Dispensasi"
                        : log.autonomy}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-50/60 rounded-2xl p-10 border border-slate-200/70 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200/70">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              Tidak Ada Logbook yang Sesuai
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-normal">
              Silakan ubah filter status atau kata kunci pencarian Anda untuk melihat log lainnya.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFilter("ALL");
              setSearchQuery("");
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer active:scale-95"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. MODAL MINTA VERIFIKASI QR (BR-007 Zero-Login Mentor Hand-Off)
      ───────────────────────────────────────────────────────────────────────────── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-modal border border-slate-200/70 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shadow-xs">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Minta Verifikasi Mentor</h3>
                  <p className="text-[11px] text-slate-500 font-normal">Scan QR atau kirim tautan sekali pakai</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR View Box */}
            <div className="p-5 bg-slate-50/70 border border-slate-200/70 rounded-2xl flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-48 h-48 bg-white border border-slate-200/80 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-xs relative">
                <QrCodeView
                  value={
                    activeLinkData?.fullUrl ||
                    (typeof window !== "undefined"
                      ? `${window.location.origin}${activeLinkData?.verificationUrl || "/v/mock-demo-token-123"}`
                      : `http://localhost:3000${activeLinkData?.verificationUrl || "/v/mock-demo-token-123"}`)
                  }
                  size={170}
                  errorCorrectionLevel="M"
                />
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 text-[11px] font-semibold font-mono">
                  <Clock className="w-3 h-3 text-amber-600" /> Berlaku 24 Jam
                </span>
                <p className="text-xs text-slate-500 font-normal">
                  Arahkan kamera smartphone mentor DUDI ke kode QR di atas.
                </p>
              </div>
            </div>

            {/* Security Explanation */}
            <div className="text-xs text-slate-600 bg-sky-50/70 p-3 rounded-xl border border-sky-200/60 space-y-1 leading-relaxed">
              <p className="font-semibold text-sky-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                Bebas Akun untuk Mentor (BR-007):
              </p>
              <p className="text-sky-800 text-[11px] font-normal">
                Mentor industri tidak perlu mendaftar atau mengunduh aplikasi. Cukup scan QR atau klik tautan WhatsApp, lalu masukkan 4 digit PIN mentor yang terdaftar.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Halo Bapak/Ibu Mentor, saya telah mengumpulkan logbook PKL VokaLink. Mohon kesediaannya untuk memvalidasi jurnal saya melalui tautan berikut: https://vokalink.id/v/andi-pratama-rpl-2026`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                <span>Kirim Langsung ke WhatsApp Mentor</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? "Tautan Berhasil Disalin!" : "Salin Tautan Verifikasi"}</span>
              </button>

              <Link
                href={activeLinkData?.verificationUrl || "/v/mock-demo-token-123"}
                target="_blank"
                className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <span>Buka Tampilan Mentor (/v/[token])</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          6. MODAL RINCIAN LOG & PENAMPIL FOTO EVIDENCE
      ───────────────────────────────────────────────────────────────────────────── */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-modal border border-slate-200/70 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {selectedLogDetail.date}
              </span>
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase",
                    selectedLogDetail.status === "VERIFIED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                      : "bg-amber-50 text-amber-700 border-amber-200/70"
                  )}
                >
                  {selectedLogDetail.status === "VERIFIED" ? "Terverifikasi" : "Menunggu Verifikasi"}
                </span>

                {selectedLogDetail.skkniCode && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/70">
                    SKKNI {selectedLogDetail.skkniCode}
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                {selectedLogDetail.title}
              </h2>
            </div>

            {/* Bukti Foto Terlampir (IndexedDB Blob atau Mock Server) */}
            {isLoadingDetailPhoto ? (
              <div className="h-44 rounded-2xl bg-slate-100 flex items-center justify-center animate-pulse text-xs text-slate-400">
                Memuat pratinjau bukti foto...
              </div>
            ) : detailPhotoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-950 flex items-center justify-center max-h-56">
                <img
                  src={detailPhotoUrl}
                  alt="Bukti Foto Jurnal"
                  className="w-full h-auto max-h-56 object-contain"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/75 backdrop-blur-xs text-[10px] font-mono text-white flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> WebP Terkompresi
                </div>
              </div>
            ) : selectedLogDetail.hasPhoto ? (
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">Bukti Foto Terlampir</p>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Foto dokumentasi kerja telah tersimpan aman di server penyimpanan bukti DUDI.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-50/60 border border-slate-200/60 text-xs text-slate-400 text-center font-normal">
                Tanpa lampiran foto pada entri ini
              </div>
            )}

            {/* Grid Informasi Metrik */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/70 text-xs">
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Durasi Pembelajaran</p>
                <p className="font-semibold text-slate-900 mt-0.5 font-mono">{selectedLogDetail.durationJp} JP</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Kemandirian (Bobot)</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedLogDetail.attendanceType === "SICK" || selectedLogDetail.attendanceType === "PERMIT"
                    ? "Dispensasi"
                    : `${selectedLogDetail.autonomy} (${selectedLogDetail.autonomyScore}%)`}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Pembimbing DUDI</p>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedLogDetail.mentor}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Waktu Verifikasi</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedLogDetail.verifiedAt || "Menunggu persetujuan"}
                </p>
              </div>
            </div>

            {/* Catatan Siswa */}
            {selectedLogDetail.notes && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-700">Catatan Siswa:</p>
                <p className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 leading-relaxed font-normal">
                  {selectedLogDetail.notes}
                </p>
              </div>
            )}

            {/* Actions: Hapus jika masih antrean offline, atau Tutup */}
            <div className="space-y-2 pt-1">
              {selectedLogDetail.isLocalOnly && selectedLogDetail.syncState === "queued" && (
                <button
                  type="button"
                  onClick={() => handleDeleteOfflineLog(selectedLogDetail.id)}
                  className="w-full py-2.5 rounded-xl border border-rose-200/80 text-rose-600 hover:bg-rose-50 active:scale-[0.98] font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Antrean Jurnal Ini</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold text-xs transition cursor-pointer shadow-xs"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
