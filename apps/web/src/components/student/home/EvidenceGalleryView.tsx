"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Clock,
  Search,
  X,
  LayoutList,
  LayoutGrid,
  Maximize2,
  Inbox,
  FileText,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/pwa/db";
import { formatLogDate } from "./types";
import { cn } from "@/lib/cn";

export interface EvidenceItem {
  id: string;
  title: string;
  jp: number;
  date: string;
  size: string;
  category: string;
  note: string;
  sha256?: string;
  status: "verified" | "in_review";
  verifiedAt?: string;
  mentor?: string;
  isNonCompetency?: boolean;
  photoUrl: string;
}

const SAMPLE_EVIDENCES: EvidenceItem[] = [
  {
    id: "ev-1",
    title: "Implementasi Alur Autentikasi Pengguna & Keamanan API",
    jp: 8,
    date: "20 Okt 2026",
    size: "138 KB (WebP)",
    category: "Pemrograman Web",
    note: "Membangun alur otorisasi pengguna berbasis token sesi, proteksi rute halaman, dan validasi formulir input terenkripsi.",
    status: "verified",
    verifiedAt: "20 Okt 2026, 17:30 WIB",
    mentor: "Rizky Firmansyah (Mentor DUDI)",
    photoUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ev-2",
    title: "Perancangan Skema Basis Data Relasional & Audit Log",
    jp: 8,
    date: "19 Okt 2026",
    size: "112 KB (WebP)",
    category: "Basis Data",
    note: "Menyusun normalisasi tabel data master, indeks performa kueri transaksi, dan proteksi integritas logbook magang.",
    status: "in_review",
    mentor: "Rizky Firmansyah (Mentor DUDI)",
    photoUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ev-3",
    title: "Pengujian Otomatis Fitur & Validasi Alur Logbook",
    jp: 8,
    date: "18 Okt 2026",
    size: "84 KB (WebP)",
    category: "Testing & QA",
    note: "Menjalankan skenario pengujian unit otomatis end-to-end dan validasi respons transaksi formulir magang industri.",
    status: "verified",
    verifiedAt: "18 Okt 2026, 18:00 WIB",
    mentor: "Rizky Firmansyah (Mentor DUDI)",
    photoUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ev-4",
    title: "Slicing Antarmuka Responsif Mobile-First Web",
    jp: 8,
    date: "17 Okt 2026",
    size: "124 KB (WebP)",
    category: "Frontend Web",
    note: "Menata komponen kartu aktivitas kerja agar responsif, proporsional, dan nyaman diakses di smartphone maupun desktop.",
    status: "verified",
    verifiedAt: "17 Okt 2026, 17:15 WIB",
    mentor: "Rizky Firmansyah (Mentor DUDI)",
    photoUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ev-5",
    title: "Bantuan Administrasi & Pengarsipan Faktur Kantor",
    jp: 4,
    date: "16 Okt 2026",
    size: "96 KB (WebP)",
    category: "Non-Kompetensi",
    note: "Membantu penataan dokumen faktur pengiriman barang, pencocokan nomor arsip berkas, dan perapian dokumen kantor DUDI.",
    status: "verified",
    verifiedAt: "16 Okt 2026, 17:00 WIB",
    mentor: "Rizky Firmansyah (Mentor DUDI)",
    isNonCompetency: true,
    photoUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ev-6",
    title: "Konfigurasi Lingkungan Deployment & Integrasi Server",
    jp: 8,
    date: "15 Okt 2026",
    size: "142 KB (WebP)",
    category: "Infrastruktur & Cloud",
    note: "Menyiapkan konfigurasi otomasi rilis build sistem dan pengujian kesiapan integrasi server staging industri.",
    status: "in_review",
    mentor: "Rizky Firmansyah (Mentor DUDI)",
    photoUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1000&q=80",
  },
];

export function EvidenceGalleryView() {
  const [galleryLayout, setGalleryLayout] = useState<"GRID" | "LIST">("GRID");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VERIFIED" | "IN_REVIEW">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);

  // 1. Live Query dari IndexedDB lokal (Foto dan Jurnal Nyata Siswa)
  const offlineLogs = useLiveQuery(() => db.logs.toArray(), []) || [];
  const offlinePhotos = useLiveQuery(() => db.photos.toArray(), []) || [];

  const offlineEvidences: EvidenceItem[] = useMemo(() => {
    return offlineLogs
      .filter((l) => offlinePhotos.some((p) => p.clientLogUuid === l.clientLogUuid))
      .map((l) => {
        const photo = offlinePhotos.find((p) => p.clientLogUuid === l.clientLogUuid);
        const kbSize = photo ? `${Math.round(photo.sizeBytes / 1024)} KB (WebP)` : "120 KB (WebP)";
        const photoUrl = photo?.blob
          ? URL.createObjectURL(photo.blob)
          : "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80";
        return {
          id: l.clientLogUuid,
          title: l.jobCardTitle || l.shortNote || "Dokumentasi Praktik Industri",
          jp: l.durationJp,
          date: formatLogDate(l.logDate),
          size: kbSize,
          category: l.isNonCompetency ? "Non-Kompetensi" : "Dokumentasi Kerja",
          note: l.shortNote || "Dokumentasi foto bukti pelaksanaan tugas magang industri siswa.",
          status: l.state === "verified" ? "verified" : "in_review",
          verifiedAt: l.verifiedAt || undefined,
          mentor: "Rizky Firmansyah (Mentor DUDI)",
          isNonCompetency: l.isNonCompetency,
          photoUrl,
        };
      });
  }, [offlineLogs, offlinePhotos]);

  const allEvidences = useMemo(() => {
    return [...offlineEvidences, ...SAMPLE_EVIDENCES];
  }, [offlineEvidences]);

  const verifiedCount = useMemo(
    () => allEvidences.filter((e) => e.status === "verified").length,
    [allEvidences]
  );
  const pendingCount = useMemo(
    () => allEvidences.filter((e) => e.status === "in_review").length,
    [allEvidences]
  );

  const filteredEvidences = useMemo(() => {
    return allEvidences.filter((ev) => {
      // 1. Status Filter
      if (statusFilter === "VERIFIED" && ev.status !== "verified") return false;
      if (statusFilter === "IN_REVIEW" && ev.status !== "in_review") return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesCategory = ev.category.toLowerCase().includes(q);
        const matchesNote = ev.note.toLowerCase().includes(q);
        const matchesDate = ev.date.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesNote && !matchesDate) {
          return false;
        }
      }

      return true;
    });
  }, [allEvidences, statusFilter, searchQuery]);

  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState<number>(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const totalItems = filteredEvidences.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEvidences = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredEvidences.slice(start, start + PAGE_SIZE);
  }, [filteredEvidences, safeCurrentPage]);

  return (
    <div className="space-y-4 pt-1 pb-6 animate-in fade-in duration-200">
      {/* ─── Control Bar: Status chips (sekunder) | Cari & List/Grid ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto scrollbar-none">
          {(
            [
              { key: "ALL", label: "Semua", count: allEvidences.length, dot: null },
              { key: "VERIFIED", label: "Sah", count: verifiedCount, dot: "bg-emerald-500" },
              { key: "IN_REVIEW", label: "Menunggu", count: pendingCount, dot: "bg-amber-500" },
            ] as const
          ).map((chip) => {
            const active = statusFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStatusFilter(chip.key)}
                aria-pressed={active}
                className={cn(
                  "h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer",
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {chip.dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", chip.dot)} />}
                <span>{chip.label}</span>
                <span className={cn("tabular-nums", active ? "text-white/70" : "text-slate-400")}>
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar + View Mode Switcher (List vs Grid) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Pill Search Input */}
          <div className="relative flex-1 sm:w-60 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari bukti kegiatan..."
              className="w-full h-8 pl-9 pr-8 rounded-full bg-white border border-slate-200/90 text-xs text-slate-900 placeholder:text-slate-400 font-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Switcher: LIST vs GRID Toggle */}
          <div className="flex items-center bg-slate-200/60 p-0.5 rounded-full border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setGalleryLayout("LIST")}
              aria-label="Tampilan Baris Rapi (List View)"
              title="Tampilan Baris Rapi (List)"
              className={cn(
                "p-1.5 rounded-full transition-all cursor-pointer",
                galleryLayout === "LIST"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setGalleryLayout("GRID")}
              aria-label="Tampilan Kartu (Grid View)"
              title="Tampilan Kartu Visual (Grid)"
              className={cn(
                "p-1.5 rounded-full transition-all cursor-pointer",
                galleryLayout === "GRID"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Empty Search State ─── */}
      {filteredEvidences.length === 0 && (
        <div className="py-12 bg-white rounded-3xl border border-slate-200/80 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Bukti Praktik Tidak Ditemukan</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ada dokumentasi bukti yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* ─── Mode 1: GRID VIEW (Notion Minimalist Bento Photo Showcase) ─── */}
      {galleryLayout === "GRID" && filteredEvidences.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 pt-1 animate-in fade-in duration-150">
          {paginatedEvidences.map((ev) => (
            <div
              key={ev.id}
              onClick={() => setSelectedItem(ev)}
              className="group bg-white rounded-2xl border border-slate-200/70 hover:border-slate-300 hover:shadow-xs transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer active:scale-[0.99] shadow-2xs"
            >
              <div>
                {/* Full-Bleed Photo Hero */}
                <div className="w-full h-40 sm:h-44 relative overflow-hidden bg-slate-900">
                  <img
                    src={ev.photoUrl}
                    alt={ev.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {/* Left Pill (Only if Non-Kompetensi) */}
                  {ev.isNonCompetency && (
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-amber-600/90 backdrop-blur-md text-[10px] font-semibold text-white shadow-xs border border-white/20">
                      Non-Kompetensi
                    </div>
                  )}

                  {/* Subtle Zoom Pill on Hover */}
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                    <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-slate-900 text-xs font-semibold shadow-md flex items-center gap-1.5 transform scale-95 group-hover:scale-100 transition-transform duration-300">
                      <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
                      <span>Buka Bukti</span>
                    </div>
                  </div>
                </div>

                {/* Card Header & Content */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>{ev.date}</span>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 font-semibold text-[10px] text-slate-700 font-mono">
                        {ev.jp} Jam
                      </span>
                    </div>

                    {ev.status === "verified" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10.5px] font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                        <span>Sah</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70 text-[10.5px] font-medium">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Menunggu PIN</span>
                      </span>
                    )}
                  </div>

                  {/* Category Pill Tag */}
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 text-[10.5px] font-medium text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                      <span className="truncate">{ev.category}</span>
                    </span>
                    {ev.isNonCompetency && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/70 text-[10.5px] font-medium text-amber-800">
                        Non-Kompetensi
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-[13.5px] sm:text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug line-clamp-2">
                    {ev.title}
                  </h3>
                </div>
              </div>

              {/* Card Footer: Mentor + WebP Size */}
              <div className="px-4 pb-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-normal text-[11px] truncate max-w-[150px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{ev.mentor || "Mentor DUDI"}</span>
                </span>

                <span className="text-[10px] text-slate-400 font-mono">
                  {ev.size}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Mode 2: LIST VIEW ─── */}
      {galleryLayout === "LIST" && filteredEvidences.length > 0 && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          {paginatedEvidences.map((ev) => (
            <div
              key={ev.id}
              onClick={() => setSelectedItem(ev)}
              className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/70 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer group"
            >
              {/* Left: Real Photo Thumbnail + Title + Metadata */}
              <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200/90 relative bg-slate-100 group-hover:border-slate-300 transition">
                  {ev.photoUrl ? (
                    <img
                      src={ev.photoUrl}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-1 flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight group-hover:text-sky-600 transition-colors line-clamp-1">
                    {ev.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-normal flex-wrap">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                      <span>{ev.category}</span>
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-slate-800 font-semibold">
                      <Calendar className="w-3 h-3 text-sky-600 shrink-0" />
                      <span>{ev.date}</span>
                    </span>
                    {ev.isNonCompetency && (
                      <>
                        <span>·</span>
                        <span className="text-amber-700 font-medium">Non-Kompetensi</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: JP + Status Badge + Quick Action */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className="font-semibold text-slate-900 text-xs">{ev.jp} JP Praktik</span>

                {ev.status === "verified" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10.5px] font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                    <span>Sah</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70 text-[10.5px] font-medium">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Menunggu PIN</span>
                  </span>
                )}

                <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-sky-50 text-slate-400 group-hover:text-sky-600 flex items-center justify-center transition">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Modern Minimalist Centered Pagination for Gallery ─── */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-slate-200/60 flex items-center justify-center">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-2xs"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 5) return true;
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - safeCurrentPage) <= 1
                  );
                })
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && page - prev > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-8.5 h-8.5 rounded-xl text-xs font-semibold flex items-center justify-center transition cursor-pointer shadow-2xs",
                          safeCurrentPage === page
                            ? "bg-slate-900 text-white font-bold"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-2xs"
              title="Halaman Berikutnya"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Evidence Detail Lightbox Modal (Clean, No SHA) ─── */}
      {selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in-0 duration-150"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                    <span>{selectedItem.category}</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-400 font-normal">{selectedItem.date}</span>
                  {selectedItem.isNonCompetency && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                      Non-Kompetensi
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 text-base leading-snug">
                  {selectedItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Clean Hero Photo */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-950 shadow-inner">
              <img
                src={selectedItem.photoUrl}
                alt={selectedItem.title}
                className="w-full max-h-80 object-cover"
              />
            </div>

            {/* Activity Description / Workplace Note */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Catatan Bukti Kegiatan</span>
                <span className="text-slate-500 text-xs font-semibold">{selectedItem.jp} JP Praktik</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {selectedItem.note}
              </p>
              <div className="pt-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11.5px] text-slate-500">
                <span className="font-medium text-slate-600">Status Verifikasi:</span>
                {selectedItem.status === "verified" ? (
                  <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Disahkan {selectedItem.mentor} ({selectedItem.verifiedAt})</span>
                  </span>
                ) : (
                  <span className="font-semibold text-amber-700 inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Menunggu Validasi PIN Mentor</span>
                  </span>
                )}
              </div>
            </div>

            {/* Footer Close Button */}
            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs text-center"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvidenceGalleryView;
