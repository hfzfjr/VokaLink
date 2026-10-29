"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  QrCode,
  FileText,
  Search,
  PlusCircle,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  HeartPulse,
  Award,
  Building2,
  UserCheck,
  LayoutList,
  LayoutGrid,
  Sparkles,
  Maximize2,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { convertRealHoursToJp, TOTAL_TARGET_JP } from "@vokalink/shared";
import { db } from "@/lib/pwa/db";
import {
  fetchStudentLogContext,
  fetchStudentLogs,
  type StudentLogContextResponse,
} from "@/lib/api";
import { MentorQrModal } from "@/components/student/home/MentorQrModal";
import { useSyncManager } from "@/lib/pwa/hooks/useSyncManager";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/cn";
import HistoryLoading from "./loading";

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
  samplePhotoUrl?: string;
  isNonCompetency?: boolean;
  nonCompetencyCategory?: string;
  notes?: string;
  syncState?: "queued" | "meta_synced" | "synced" | "verified" | "revision_required" | "failed";
  isLocalOnly?: boolean;
}

function formatCategoryLabel(cat?: string | null): string {
  if (!cat) return "Operasional";
  const map: Record<string, string> = {
    ADMIN_UMUM: "Administrasi & Dokumen",
    GUDANG_LOGISTIK: "Gudang & Logistik",
    PELAYANAN_TOKO: "Pelayanan Toko / Kasir",
    KURIR_DISTRIBUSI: "Kurir & Distribusi",
    LAINNYA: "Operasional Umum",
  };
  return map[cat] || cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateIndo(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const cleanDate = dateStr.slice(0, 10);
    const d = new Date(cleanDate + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function parseDateParts(dateStr: string) {
  if (!dateStr) return { day: "--", month: "---", weekday: "---" };
  try {
    const cleanDate = dateStr.slice(0, 10);
    const d = new Date(cleanDate + "T00:00:00");
    if (isNaN(d.getTime())) return { day: "--", month: "---", weekday: "---" };
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleDateString("id-ID", { month: "short" }).replace(".", "");
    const weekday = d.toLocaleDateString("id-ID", { weekday: "short" }).replace(".", "");
    return { day, month, weekday };
  } catch {
    return { day: "--", month: "---", weekday: "---" };
  }
}

export default function LogHistoryPage() {
  const { user, token } = useAuth();
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "VERIFIED" | "NON_COMPETENCY">("ALL");
  const [monthFilter, setMonthFilter] = useState<string>("ALL");
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const monthDropdownRef = useRef<HTMLDivElement>(null);

  // Close custom month dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsMonthDropdownOpen(false);
      }
    }
    if (isMonthDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMonthDropdownOpen]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"LIST" | "GRID">("LIST");
  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState<LogEntry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    };
  }, []);

  // Photo viewer state for modal & fullscreen lightbox
  const [detailPhotoUrl, setDetailPhotoUrl] = useState<string | null>(null);
  const [isLoadingDetailPhoto, setIsLoadingDetailPhoto] = useState(false);
  const [lightboxPhotoUrl, setLightboxPhotoUrl] = useState<string | null>(null);
  const [isMountedState, setIsMountedState] = useState(false);

  useEffect(() => {
    setIsMountedState(true);
  }, []);

  // Active Placement Info
  const [placementInfo, setPlacementInfo] = useState<{
    dudiName: string;
    dudiCity: string;
    mentorName: string;
  }>({
    dudiName: "PT Nusantara Tech",
    dudiCity: "Surabaya",
    mentorName: "Rizky Firmansyah",
  });

  // Sync Manager
  const { isOnline, pendingCount, isSyncing, syncNow } = useSyncManager();

  const [serverLogs, setServerLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load placement context and live database logs
  const loadPlacementAndLogs = React.useCallback(async () => {
    let activePlacementId = "3ffec674-ad55-482a-a566-9dff84ab71be";
    let activeMentorName = placementInfo.mentorName;

    try {
      const cacheKey = user?.id ? `student_log_context_${user.id}` : "student_log_context";
      const cached = (await db.refData.get(cacheKey)) || (await db.refData.get("student_log_context"));
      if (cached && cached.data) {
        const data = cached.data as StudentLogContextResponse;
        if (data.activePlacement) {
          activePlacementId = data.activePlacement.id;
          activeMentorName = data.activePlacement.mentorName || activeMentorName;
          setPlacementInfo({
            dudiName: data.activePlacement.dudiName,
            dudiCity: data.activePlacement.dudiCity,
            mentorName: data.activePlacement.mentorName,
          });
        }
      }

      if (typeof navigator !== "undefined" && navigator.onLine) {
        const fresh = await fetchStudentLogContext(user?.id, token || undefined);
        if (fresh && fresh.activePlacement) {
          activePlacementId = fresh.activePlacement.id;
          activeMentorName = fresh.activePlacement.mentorName || activeMentorName;
          setPlacementInfo({
            dudiName: fresh.activePlacement.dudiName,
            dudiCity: fresh.activePlacement.dudiCity,
            mentorName: fresh.activePlacement.mentorName,
          });
        }

        // Tarik riwayat resmi dari database PostgreSQL
        try {
          const dbLogs = await fetchStudentLogs(activePlacementId);
          if (Array.isArray(dbLogs)) {
            const mapped: LogEntry[] = dbLogs.map((sl) => {
              const firstItem = sl.items?.[0];
              const durationJp = sl.items?.reduce((acc, it) => acc + it.durationJp, 0) || 8;
              const autonomyLevel = firstItem?.autonomyLevel || 3;
              const isNonCompetency = Boolean(
                firstItem?.jobCard?.isNonCompetency || firstItem?.nonCompetencyCategory
              );
              return {
                id: sl.clientLogUuid || sl.id,
                date: (sl.logDate || "").slice(0, 10),
                title:
                  firstItem?.jobCard?.title ||
                  sl.shortNote ||
                  (isNonCompetency ? `Bantuan Operasional (${formatCategoryLabel(firstItem?.nonCompetencyCategory)})` : "Pencatatan Jurnal Praktik"),
                durationJp,
                autonomy:
                  autonomyLevel === 3
                    ? "Mandiri"
                    : autonomyLevel === 2
                    ? "Terbimbing"
                    : "Observasi",
                autonomyScore:
                  autonomyLevel === 3 ? 100 : autonomyLevel === 2 ? 88 : 75,
                skkniCode: isNonCompetency
                  ? undefined
                  : firstItem?.jobCard?.skkniUnitCode || "J.620100.020.02",
                status: sl.status === "VERIFIED" ? "VERIFIED" : "PENDING_VERIFICATION",
                attendanceType: sl.attendanceType || "PRESENT",
                verifiedAt: sl.verifiedAt
                  ? formatDateIndo(sl.verifiedAt.slice(0, 10))
                  : null,
                mentor: activeMentorName || "Rizky Firmansyah",
                hasPhoto: Boolean(sl.evidenceWebpUrl),
                samplePhotoUrl: sl.evidenceWebpUrl || undefined,
                isNonCompetency,
                nonCompetencyCategory: firstItem?.nonCompetencyCategory || undefined,
                notes: sl.shortNote || undefined,
                syncState: sl.status === "VERIFIED" ? "verified" : "synced",
                isLocalOnly: false,
              };
            });
            setServerLogs(mapped);

            // Perbarui status log Dexie lokal bila di server sudah TERVERIFIKASI
            try {
              for (const sl of dbLogs) {
                if (sl.status === "VERIFIED" && sl.clientLogUuid) {
                  const local = await db.logs.get(sl.clientLogUuid);
                  if (local && local.state !== "verified") {
                    await db.logs.update(sl.clientLogUuid, {
                      state: "verified",
                      verifiedAt: sl.verifiedAt || new Date().toISOString(),
                    });
                  }
                }
              }
            } catch {}
          }
        } catch (logErr) {
          console.warn("Koneksi riwayat log server offline fallback:", logErr);
        }
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, token, placementInfo.mentorName]);

  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();
    loadPlacementAndLogs().finally(() => {
      if (isMounted) {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 300 - elapsed);
        setTimeout(() => {
          if (isMounted) setIsLoading(false);
        }, delay);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadPlacementAndLogs]);

  // Re-fetch saat sinkronisasi selesai
  const prevSyncingRef = useRef(isSyncing);
  useEffect(() => {
    if (prevSyncingRef.current && !isSyncing && isOnline) {
      loadPlacementAndLogs();
    }
    prevSyncingRef.current = isSyncing;
  }, [isSyncing, isOnline, loadPlacementAndLogs]);

  // 1. Reactive Query dari IndexedDB lokal
  const offlineLogs = useLiveQuery(() => db.logs.toArray(), []) || [];
  const offlinePhotos = useLiveQuery(() => db.photos.toArray(), []) || [];

  const photoUuidSet = useMemo(() => {
    return new Set(offlinePhotos.map((p) => p.clientLogUuid));
  }, [offlinePhotos]);

  const convertedOfflineLogs: LogEntry[] = useMemo(() => {
    return offlineLogs.map((ol) => {
      const firstJobCardId = ol.jobCardIds?.[0];
      const isNonComp = Boolean(ol.isNonCompetency);
      return {
        id: ol.clientLogUuid,
        date: (ol.logDate || "").slice(0, 10),
        title:
          ol.jobCardTitle ||
          (isNonComp
            ? `Bantuan Operasional (${formatCategoryLabel(ol.nonCompetencyCategory)})`
            : firstJobCardId === "00000000-0000-0000-0000-000000000033" || firstJobCardId === "jc-2"
            ? "Perancangan Skema Basis Data Relasional & Audit Log"
            : firstJobCardId === "00000000-0000-0000-0000-000000000032" || firstJobCardId === "jc-3"
            ? "Slicing Antarmuka Responsif Mobile-First Web"
            : firstJobCardId === "00000000-0000-0000-0000-000000000035" || firstJobCardId === "jc-4"
            ? "Pengujian Mutu Perangkat Lunak & Alur Logbook"
            : "Implementasi Alur Autentikasi Pengguna & Keamanan Sistem"),
        durationJp: ol.durationJp,
        autonomy: ol.autonomyLevel === 3 ? "Mandiri" : ol.autonomyLevel === 2 ? "Terbimbing" : "Observasi",
        autonomyScore: ol.autonomyLevel === 3 ? 100 : ol.autonomyLevel === 2 ? 88 : 75,
        skkniCode: isNonComp ? undefined : "J.620100.009.01",
        status: ol.state === "verified" ? "VERIFIED" : "PENDING_VERIFICATION",
        attendanceType: ol.attendanceType || "PRESENT",
        verifiedAt: ol.verifiedAt ? formatDateIndo(ol.verifiedAt.slice(0, 10)) : null,
        mentor: placementInfo.mentorName || "Rizky Firmansyah",
        hasPhoto: photoUuidSet.has(ol.clientLogUuid),
        isNonCompetency: isNonComp,
        nonCompetencyCategory: ol.nonCompetencyCategory,
        notes: ol.shortNote,
        syncState: ol.state,
        isLocalOnly: true,
      };
    });
  }, [offlineLogs, photoUuidSet, placementInfo.mentorName]);

  // Gabungkan entri offline lokal dengan data resmi database secara cerdas & deduplikasi
  const allLogs = useMemo(() => {
    const offlineMap = new Map(convertedOfflineLogs.map((l) => [l.id, l]));
    const mergedList: LogEntry[] = [];
    const processedIds = new Set<string>();

    // 1. Proses log server: pertahankan bukti foto lokal atau catatan bila server belum selesai memproses biner
    for (const sLog of serverLogs) {
      processedIds.add(sLog.id);
      const offLog = offlineMap.get(sLog.id);
      if (offLog) {
        const isServerVerified = sLog.status === "VERIFIED";
        mergedList.push({
          ...sLog,
          title: sLog.title || offLog.title,
          hasPhoto: sLog.hasPhoto || offLog.hasPhoto,
          samplePhotoUrl: sLog.samplePhotoUrl || offLog.samplePhotoUrl,
          notes: sLog.notes || offLog.notes,
          status: isServerVerified ? "VERIFIED" : offLog.status === "VERIFIED" ? "VERIFIED" : sLog.status,
          verifiedAt: sLog.verifiedAt || offLog.verifiedAt,
          syncState: isServerVerified ? "verified" : sLog.syncState,
          isLocalOnly: false,
        });
      } else {
        mergedList.push(sLog);
      }
    }

    // 2. Tambahkan log lokal yang belum terkirim ke server (antrean offline)
    for (const offLog of convertedOfflineLogs) {
      if (!processedIds.has(offLog.id)) {
        mergedList.push(offLog);
      }
    }

    return mergedList.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [convertedOfflineLogs, serverLogs]);

  // Statistik Real-Time Sesuai Standar 792 JP Intrakurikuler PKL
  const totalVerifiedJp = useMemo(
    () => allLogs.filter((l) => l.status === "VERIFIED").reduce((acc, curr) => acc + curr.durationJp, 0),
    [allLogs]
  );

  const totalPendingJp = useMemo(
    () => allLogs.filter((l) => l.status === "PENDING_VERIFICATION").reduce((acc, curr) => acc + curr.durationJp, 0),
    [allLogs]
  );

  const pendingCountTotal = useMemo(
    () => allLogs.filter((l) => l.status === "PENDING_VERIFICATION").length,
    [allLogs]
  );

  const verifiedCountTotal = useMemo(
    () => allLogs.filter((l) => l.status === "VERIFIED").length,
    [allLogs]
  );

  const nonCompetencyCountTotal = useMemo(
    () => allLogs.filter((l) => l.isNonCompetency).length,
    [allLogs]
  );

  // Rata-rata Kemandirian SOP Siswa (Menentukan 60% e-Rapor)
  const mandiriPercentage = useMemo(() => {
    if (allLogs.length === 0) return 100;
    const mandiriCount = allLogs.filter((l) => l.autonomy === "Mandiri").length;
    return Math.round((mandiriCount / allLogs.length) * 100);
  }, [allLogs]);

  // Persentase Ketercapaian Target 792 JP (Multi-segment: Verified + Pending)
  const verifiedJpEquivalent = useMemo(
    () => convertRealHoursToJp(totalVerifiedJp),
    [totalVerifiedJp]
  );
  const pendingJpEquivalent = useMemo(
    () => convertRealHoursToJp(totalPendingJp),
    [totalPendingJp]
  );
  const verifiedPercent = useMemo(
    () => Math.min(100, (verifiedJpEquivalent / TOTAL_TARGET_JP) * 100),
    [verifiedJpEquivalent]
  );
  const pendingPercent = useMemo(
    () => Math.min(100 - verifiedPercent, (pendingJpEquivalent / TOTAL_TARGET_JP) * 100),
    [pendingJpEquivalent, verifiedPercent]
  );
  const targetProgressPercent = useMemo(
    () => Math.min(100, Math.round(verifiedPercent)),
    [verifiedPercent]
  );

  // Ekstrak daftar bulan yang tersedia dari data jurnal (Sama persis dengan Dashboard)
  const availableMonths = useMemo(() => {
    const map = new Map<string, string>();
    allLogs.forEach((log) => {
      const cleanDate = (log.date || "").slice(0, 10);
      if (cleanDate.length >= 7) {
        const ym = cleanDate.slice(0, 7);
        if (!map.has(ym)) {
          const d = new Date(cleanDate + "T00:00:00");
          if (!isNaN(d.getTime())) {
            const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
            map.set(ym, label);
          }
        }
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, label]) => ({ key, label }));
  }, [allLogs]);

  // Label periode bulan yang sedang aktif
  const currentMonthLabel = useMemo(() => {
    if (monthFilter === "ALL") return "Semua Bulan";
    const found = availableMonths.find((m) => m.key === monthFilter);
    return found ? found.label : monthFilter;
  }, [monthFilter, availableMonths]);

  // Filter & Pencarian
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      if (filter === "VERIFIED" && log.status !== "VERIFIED") return false;
      if (filter === "PENDING" && log.status !== "PENDING_VERIFICATION") return false;
      if (filter === "NON_COMPETENCY" && !log.isNonCompetency) return false;

      // Filter Periode Bulan
      if (monthFilter !== "ALL") {
        if (!log.date.startsWith(monthFilter)) return false;
      }

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
  }, [allLogs, filter, monthFilter, searchQuery]);

  // Reset ke halaman 1 setiap kali filter/pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, monthFilter, searchQuery]);

  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Item yang dipaginasi agar rapi dan tidak terjadi scroll tak terbatas (Identik Dashboard)
  const paginatedLogs = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, safeCurrentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    listContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Pengelompokan Kronologis per Bulan (Monthly Grouping) pada halaman aktif
  const groupedLogs = useMemo<{
    key: string;
    title: string;
    totalHours: number;
    totalJp: number;
    logs: LogEntry[];
  }[]>(() => {
    const groups: {
      [key: string]: {
        key: string;
        title: string;
        totalHours: number;
        totalJp: number;
        logs: LogEntry[];
      };
    } = {};
    const order: string[] = [];

    for (const log of paginatedLogs) {
      const cleanDate = (log.date || "").slice(0, 10);
      const ym = cleanDate.slice(0, 7); // e.g. "2026-10"
      if (!groups[ym]) {
        let title = ym;
        try {
          const d = new Date(ym + "-01T00:00:00");
          if (!isNaN(d.getTime())) {
            title = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
          }
        } catch {}
        groups[ym] = {
          key: ym,
          title,
          totalHours: 0,
          totalJp: 0,
          logs: [],
        };
        order.push(ym);
      }
      groups[ym].logs.push(log);
      groups[ym].totalHours += log.durationJp;
      groups[ym].totalJp += convertRealHoursToJp(log.durationJp);
    }

    return order.map((k) => groups[k]).filter((g): g is NonNullable<typeof g> => Boolean(g));
  }, [paginatedLogs]);

  // Auto-buka rincian log jika ada query parameter ?logId=... dari Dashboard
  useEffect(() => {
    if (typeof window !== "undefined" && allLogs.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get("logId");
      if (targetId) {
        const found = allLogs.find((l) => l.id === targetId);
        if (found) {
          setSelectedLogDetail(found);
        }
      }
    }
  }, [allLogs]);

  // Memuat foto dari IndexedDB saat modal detail dibuka (Bebas stale closure)
  useEffect(() => {
    let isMounted = true;
    let createdBlobUrl: string | null = null;

    if (!selectedLogDetail) {
      setDetailPhotoUrl(null);
      setConfirmDeleteId(null);
      return;
    }

    async function fetchPhoto() {
      setIsLoadingDetailPhoto(true);
      try {
        const photo = await db.photos.get(selectedLogDetail!.id);
        if (photo && photo.blob && isMounted) {
          createdBlobUrl = URL.createObjectURL(photo.blob);
          setDetailPhotoUrl(createdBlobUrl);
        } else if (selectedLogDetail?.samplePhotoUrl && isMounted) {
          setDetailPhotoUrl(selectedLogDetail.samplePhotoUrl);
        } else if (selectedLogDetail?.hasPhoto && isMounted) {
          setDetailPhotoUrl("https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80");
        } else {
          setDetailPhotoUrl(null);
        }
      } catch (err) {
        console.warn("Gagal memuat foto lokal:", err);
        if (selectedLogDetail?.samplePhotoUrl && isMounted) {
          setDetailPhotoUrl(selectedLogDetail.samplePhotoUrl);
        } else {
          setDetailPhotoUrl(null);
        }
      } finally {
        if (isMounted) setIsLoadingDetailPhoto(false);
      }
    }

    fetchPhoto();

    return () => {
      isMounted = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [selectedLogDetail]);

  // Close Modals on Escape Key & lock body scroll
  useEffect(() => {
    const isAnyModalOpen = Boolean(lightboxPhotoUrl || selectedLogDetail || showQrModal);
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxPhotoUrl) {
          setLightboxPhotoUrl(null);
        } else if (selectedLogDetail) {
          setSelectedLogDetail(null);
        } else if (showQrModal) {
          setShowQrModal(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [lightboxPhotoUrl, selectedLogDetail, showQrModal]);

  // Handler Hapus Log Offline Lokal (Two-step inline confirmation)
  const handleDeleteOfflineLog = async (logId: string) => {
    if (confirmDeleteId !== logId) {
      setConfirmDeleteId(logId);
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = setTimeout(() => {
        setConfirmDeleteId(null);
      }, 3000);
      return;
    }

    if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    setConfirmDeleteId(null);
    try {
      await db.logs.delete(logId);
      await db.photos.delete(logId);
      setSelectedLogDetail(null);
    } catch (err) {
      alert("Gagal menghapus jurnal lokal: " + String(err));
    }
  };

  // Handler Membuka Modal QR Verifikasi
  const handleOpenVerifyModal = () => {
    setShowQrModal(true);
  };

  if (isLoading) {
    return <HistoryLoading />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HEADER & ACTION BAR (KONSISTEN DENGAN PORTAL SISWA)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              Riwayat Logbook
            </h1>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{pendingCount} Antrean Offline</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Arsip aktivitas harian, presensi industri, dan status validasi mentor DUDI
          </p>
        </div>

        {/* Action Buttons: Solid Pill Buttons with generous mobile touch target */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => syncNow()}
              disabled={isSyncing || !isOnline}
              style={{ paddingLeft: "20px", paddingRight: "20px" }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 h-11 rounded-full bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 text-xs sm:text-sm font-semibold border border-slate-200/80 transition disabled:opacity-50 cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <RefreshCw className={cn("w-4 h-4 text-sky-600 shrink-0", isSyncing && "animate-spin")} />
              <span>{isSyncing ? "Sinkron..." : "Sinkronkan"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenVerifyModal}
            style={{ paddingLeft: "22px", paddingRight: "22px" }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 h-11 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer whitespace-nowrap"
          >
            <QrCode className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="sm:hidden">Validasi</span>
            <span className="hidden sm:inline">Minta Validasi (QR)</span>
            {pendingCountTotal > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-sky-500 text-white text-[11px] font-bold">
                {pendingCountTotal}
              </span>
            )}
          </button>

          <Link
            href="/student/log/new"
            style={{ paddingLeft: "24px", paddingRight: "24px" }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Catat Jurnal</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. ACTIVITY SUMMARY WIDGET (UNIFIED SQUIRCLE CARD)
          Satu kartu aktivitas terpadu dengan tipografi sans yang bersih dan proporsional
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        {/* Multi-Segment Stacked Progress Bar Target 792 JP */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>Akumulasi Jam Pembelajaran PKL</span>
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline font-normal">
                (Target 792 JP Kurikulum Merdeka)
              </span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-900">
                {verifiedJpEquivalent.toFixed(1)} / {TOTAL_TARGET_JP} JP
              </span>
              <span className="text-slate-400 font-normal ml-1.5 text-xs">
                ({targetProgressPercent}%)
              </span>
            </div>
          </div>

          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden flex relative">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${verifiedPercent}%` }}
              title={`Tervalidasi: ${verifiedJpEquivalent.toFixed(1)} JP (${Math.round(verifiedPercent)}%)`}
            />
            {pendingPercent > 0 && (
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${pendingPercent}%` }}
                title={`Menunggu PIN: ${pendingJpEquivalent.toFixed(1)} JP (${Math.round(pendingPercent)}%)`}
              />
            )}
          </div>

          {/* Legenda Progress Bar */}
          <div className="flex items-center gap-4 pt-0.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Tervalidasi: <strong className="text-slate-700 font-mono font-semibold">{verifiedJpEquivalent.toFixed(1)} JP</strong></span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span>Menunggu PIN: <strong className="text-slate-700 font-mono font-semibold">{pendingJpEquivalent.toFixed(1)} JP</strong></span>
            </span>
          </div>
        </div>

        {/* 4 Metric Tiles: Tipografi Konsisten dengan StudentWidgetPanel */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-1 border-t border-slate-100">
          {/* Tile 1: Terverifikasi */}
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                Tervalidasi
              </p>
              <p className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight leading-none mt-0.5">
                {totalVerifiedJp} <span className="text-xs font-normal text-slate-500">Jam</span>
              </p>
              <span className="text-[10px] sm:text-xs text-emerald-700 font-normal truncate block mt-0.5">
                ≈ {convertRealHoursToJp(totalVerifiedJp).toFixed(1)} JP
              </span>
            </div>
          </div>

          {/* Tile 2: Menunggu PIN */}
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                Menunggu PIN
              </p>
              <p className="text-sm sm:text-lg font-bold text-amber-700 tracking-tight leading-none mt-0.5">
                {totalPendingJp} <span className="text-xs font-normal text-slate-500">Jam</span>
              </p>
              <span className="text-[10px] sm:text-xs text-amber-700 font-normal truncate block mt-0.5">
                {pendingCountTotal} pending
              </span>
            </div>
          </div>

          {/* Tile 3: Hari Kehadiran */}
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/70 flex items-center justify-center shrink-0 shadow-2xs">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                Hari Praktik
              </p>
              <p className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight leading-none mt-0.5">
                {allLogs.length} <span className="text-xs font-normal text-slate-500">Hari</span>
              </p>
              <span className="text-[10px] sm:text-xs text-slate-500 font-normal truncate block mt-0.5">
                Presensi teratur
              </span>
            </div>
          </div>

          {/* Tile 4: Kemandirian */}
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/70 flex items-center justify-center shrink-0 shadow-2xs">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                Kemandirian
              </p>
              <p className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight leading-none mt-0.5">
                {mandiriPercentage}%
              </p>
              <span className="text-[10px] sm:text-xs text-slate-500 font-normal truncate block mt-0.5">
                Bobot e-Rapor 60%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. APPLE SEGMENTED CONTROL, SEARCH & VIEW SWITCHER (LIST vs GRID)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div ref={listContainerRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Baris 1 di mobile: Segmented Filter Tabs + Mobile-only View Switcher */}
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-full border border-slate-200 text-xs font-medium overflow-x-auto flex-1 sm:flex-initial scrollbar-none">
            {/* 1. Semua Jurnal */}
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={cn(
                "flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-full whitespace-nowrap text-[11px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95",
                filter === "ALL"
                  ? "bg-white text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 font-medium"
              )}
            >
              <span className="sm:hidden">Semua</span>
              <span className="hidden sm:inline">Semua Jurnal</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                  filter === "ALL"
                    ? "bg-slate-100 text-slate-800"
                    : "bg-slate-300/60 text-slate-600"
                )}
              >
                {allLogs.length}
              </span>
            </button>

            {/* 2. Sah Terverifikasi */}
            <button
              type="button"
              onClick={() => setFilter("VERIFIED")}
              className={cn(
                "flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-full whitespace-nowrap text-[11px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95",
                filter === "VERIFIED"
                  ? "bg-white text-emerald-800 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 font-medium"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="sm:hidden">Sah</span>
              <span className="hidden sm:inline">Sah Terverifikasi</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                  filter === "VERIFIED"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-300/60 text-slate-600"
                )}
              >
                {verifiedCountTotal}
              </span>
            </button>

            {/* 3. Menunggu Validasi */}
            <button
              type="button"
              onClick={() => setFilter("PENDING")}
              className={cn(
                "flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-full whitespace-nowrap text-[11px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95",
                filter === "PENDING"
                  ? "bg-white text-amber-800 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 font-medium"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="sm:hidden">Pending</span>
              <span className="hidden sm:inline">Menunggu Validasi</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                  filter === "PENDING"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-300/60 text-slate-600"
                )}
              >
                {pendingCountTotal}
              </span>
            </button>

            {/* 4. Non-Kejuruan */}
            <button
              type="button"
              onClick={() => setFilter("NON_COMPETENCY")}
              className={cn(
                "flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-full whitespace-nowrap text-[11px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95",
                filter === "NON_COMPETENCY"
                  ? "bg-white text-indigo-800 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 font-medium"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span className="sm:hidden">Umum</span>
              <span className="hidden sm:inline">Non-Kejuruan</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                  filter === "NON_COMPETENCY"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-slate-300/60 text-slate-600"
                )}
              >
                {nonCompetencyCountTotal}
              </span>
            </button>
          </div>

          {/* Mobile-Only View Mode Switcher Toggle */}
          <div className="flex sm:hidden items-center h-10 bg-slate-200/60 p-1 rounded-full border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              aria-label="Tampilan Baris Rapi (List View)"
              title="Tampilan Baris Rapi"
              className={cn(
                "h-8 px-2 rounded-full transition-all cursor-pointer flex items-center justify-center",
                viewMode === "LIST"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              aria-label="Tampilan Kartu (Grid View)"
              title="Tampilan Kartu Visual"
              className={cn(
                "h-8 px-2 rounded-full transition-all cursor-pointer flex items-center justify-center",
                viewMode === "GRID"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Baris 2: Month Selector + Search Bar + Desktop View Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {/* Quick Month Filter Custom Popover Dropdown */}
          {availableMonths.length >= 1 && (
            <div ref={monthDropdownRef} className="relative shrink-0">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isMonthDropdownOpen}
                onClick={() => setIsMonthDropdownOpen((prev) => !prev)}
                className={cn(
                  "h-10 px-3 sm:px-4 rounded-full bg-white border text-xs font-semibold flex items-center justify-between gap-2 transition-all duration-150 cursor-pointer shadow-2xs select-none",
                  isMonthDropdownOpen
                    ? "border-sky-500 ring-2 ring-sky-500/20 text-sky-700 bg-sky-50/30 shadow-xs"
                    : "border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <CalendarDays
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isMonthDropdownOpen ? "text-sky-600" : "text-slate-400"
                    )}
                  />
                  <span className="truncate max-w-[85px] sm:max-w-none">{currentMonthLabel}</span>
                </div>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200",
                    isMonthDropdownOpen && "rotate-180 text-sky-600"
                  )}
                />
              </button>

              {/* Popover Menu Floating Card */}
              {isMonthDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 top-full mt-1.5 z-50 min-w-[190px] sm:min-w-[210px] bg-white/98 backdrop-blur-xs rounded-2xl border border-slate-200/90 shadow-xl p-1.5 space-y-0.5 animate-in fade-in-0 zoom-in-95 duration-150"
                >
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Periode Jurnal
                  </div>

                  {/* Opsi: Semua Bulan */}
                  <button
                    type="button"
                    role="option"
                    aria-selected={monthFilter === "ALL"}
                    onClick={() => {
                      setMonthFilter("ALL");
                      setIsMonthDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer text-left",
                      monthFilter === "ALL"
                        ? "bg-sky-50 text-sky-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    )}
                  >
                    <span>Semua Bulan</span>
                    {monthFilter === "ALL" && (
                      <Check className="w-3.5 h-3.5 text-sky-600 stroke-[2.5] shrink-0" />
                    )}
                  </button>

                  {/* Opsi: Tiap Bulan dari Riwayat */}
                  {availableMonths.map((m) => {
                    const isSelected = monthFilter === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setMonthFilter(m.key);
                          setIsMonthDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer text-left",
                          isSelected
                            ? "bg-sky-50 text-sky-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                        )}
                      >
                        <span>{m.label}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-sky-600 stroke-[2.5] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pill Search Bar — Luas di mobile */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari tugas, SKKNI, catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "40px", paddingRight: "36px" }}
              className="w-full h-10 rounded-full bg-white border border-slate-200/90 text-xs text-slate-900 placeholder:text-slate-400 font-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop-Only View Mode Switcher Toggle */}
          <div className="hidden sm:flex items-center h-10 bg-slate-200/60 p-1 rounded-full border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              aria-label="Tampilan Baris Rapi (List View)"
              title="Tampilan Baris Rapi"
              className={cn(
                "h-8 px-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center",
                viewMode === "LIST"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              aria-label="Tampilan Kartu (Grid View)"
              title="Tampilan Kartu Visual"
              className={cn(
                "h-8 px-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center",
                viewMode === "GRID"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. INSET GROUPED LIST (DEFAULT VIEW: SANGAT RAPI, KRONOLOGIS & MUDAH DISCAN)
      ───────────────────────────────────────────────────────────────────────────── */}
      {filteredLogs.length > 0 ? (
        <>
          {viewMode === "LIST" ? (
          /* ─── TAMPILAN A: INSET GROUPED LIST TABLE (SUPER CLEAN) ─── */
          <div className="space-y-6">
            {groupedLogs.map((group) => (
              <div key={group.key} className="space-y-2">
                {/* Sub-header Bulan & Total Jam */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {group.title}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Total {group.totalHours} Jam ({group.totalJp.toFixed(1)} JP)
                  </span>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
                  {group.logs.map((log) => {
                    const isVerified = log.status === "VERIFIED";
                    const isSickOrPermit = log.attendanceType === "SICK" || log.attendanceType === "PERMIT";

                    return (
                      <div
                        key={log.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedLogDetail(log)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedLogDetail(log);
                          }
                        }}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-4 sm:px-5 hover:bg-slate-50/80 focus:bg-slate-50/80 focus:outline-none transition-colors duration-150 cursor-pointer select-none gap-3"
                      >
                        {/* Bagian Kiri: Date Badge + Info Utama */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
                          {/* Sleek Minimalist Date Badge */}
                          <div className="shrink-0 flex items-center sm:w-38">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 text-xs font-semibold text-slate-700 border border-slate-200/70 group-hover:bg-sky-50 group-hover:text-sky-700 group-hover:border-sky-200 transition-colors whitespace-nowrap">
                              <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span>{formatDateIndo(log.date)}</span>
                            </span>
                          </div>

                          {/* Judul & Detail */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                                {log.title}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap text-slate-500 text-xs">
                              {isSickOrPermit ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/70 text-[10px] font-medium">
                                  <HeartPulse className="w-2.5 h-2.5" />
                                  <span>{log.attendanceType === "SICK" ? "Sakit" : "Izin Resmi"}</span>
                                </span>
                              ) : log.isNonCompetency ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 text-[10px] font-medium">
                                  <span>Non-Kejuruan: {formatCategoryLabel(log.nonCompetencyCategory)}</span>
                                </span>
                              ) : (
                                <>
                                  {log.skkniCode && (
                                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                      {log.skkniCode}
                                    </span>
                                  )}
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                      log.autonomy === "Mandiri"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                                        : "bg-sky-50 text-sky-700 border-sky-200/70"
                                    )}
                                  >
                                    {log.autonomy}
                                  </span>
                                </>
                              )}

                              {log.hasPhoto && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                                  <ImageIcon className="w-2.5 h-2.5 text-slate-400" />
                                  <span>Foto</span>
                                </span>
                              )}

                              {log.notes && (
                                <span className="text-slate-400 truncate max-w-[200px] sm:max-w-xs hidden md:inline font-normal">
                                  &quot;{log.notes}&quot;
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bagian Kanan: Jam, Status Badge & Chevron */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-left sm:text-right">
                            <span className="font-semibold text-xs sm:text-sm text-slate-900 block leading-tight">
                              {log.durationJp} Jam Kerja
                            </span>
                            <span className="text-xs text-slate-400 block font-normal">
                              ≈ {convertRealHoursToJp(log.durationJp).toFixed(1)} JP
                            </span>
                          </div>

                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border",
                              isVerified
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                : log.syncState === "queued"
                                ? "bg-amber-50 text-amber-800 border-amber-200/80"
                                : "bg-amber-50 text-amber-700 border-amber-200/80"
                            )}
                          >
                            {isVerified ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                                <span>Terverifikasi</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Menunggu PIN</span>
                              </>
                            )}
                          </span>

                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ─── TAMPILAN B: UNIFIED NOTION-STYLE BENTO CARDS (RAPI, PENUH & SERAGAM) ─── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4.5">
            {paginatedLogs.map((log) => {
              const isVerified = log.status === "VERIFIED";
              const isSickOrPermit = log.attendanceType === "SICK" || log.attendanceType === "PERMIT";
              const { day, month } = parseDateParts(log.date);

              return (
                <div
                  key={log.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedLogDetail(log)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedLogDetail(log);
                    }
                  }}
                  className="group relative bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 hover:border-sky-300 hover:shadow-card transition-all duration-200 cursor-pointer active:scale-[0.99] flex flex-col justify-between shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <div className="space-y-3">
                    {/* Header Kartu: Tanggal + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 flex flex-col items-center justify-center shrink-0 shadow-2xs font-sans">
                          <span className="text-[9px] font-bold uppercase leading-none text-sky-600 tracking-wider">
                            {month}
                          </span>
                          <span className="text-xs font-black leading-none text-slate-900 mt-0.5">
                            {day}
                          </span>
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-900 block truncate leading-tight">
                            {formatDateIndo(log.date)}
                          </span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            {log.durationJp} Jam Kerja (≈ {convertRealHoursToJp(log.durationJp).toFixed(1)} JP)
                          </span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold border shrink-0 whitespace-nowrap",
                          isVerified
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                            : "bg-amber-50 text-amber-700 border-amber-200/80"
                        )}
                      >
                        {isVerified ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                            <span>Sah</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Menunggu PIN</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Judul Aktivitas: Selalu 2 baris agar tinggi kartu seragam */}
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug line-clamp-2 min-h-[40px]">
                      {log.title}
                    </h3>

                    {/* Chips Metadata: Kemandirian, SKKNI, Foto */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isSickOrPermit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-rose-50 text-rose-700 border border-rose-200/70">
                          <HeartPulse className="w-3 h-3" />
                          <span>{log.attendanceType === "SICK" ? "Sakit" : "Izin Resmi"}</span>
                        </span>
                      ) : log.isNonCompetency ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-amber-50 text-amber-800 border border-amber-200/70">
                          <span>Non-Kejuruan: {formatCategoryLabel(log.nonCompetencyCategory)}</span>
                        </span>
                      ) : (
                        <>
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10.5px] font-medium border",
                              log.autonomy === "Mandiri"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                                : "bg-sky-50 text-sky-700 border-sky-200/70"
                            )}
                          >
                            {log.autonomy}
                          </span>

                          {log.skkniCode && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200/80">
                              {log.skkniCode}
                            </span>
                          )}
                        </>
                      )}

                      {log.hasPhoto && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                          <ImageIcon className="w-2.5 h-2.5 text-slate-400" />
                          <span>Foto</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer: Mentor + Link Detail */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-normal text-[11px] truncate max-w-[180px] flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{log.mentor}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 group-hover:text-sky-600 transition-colors flex items-center gap-0.5 shrink-0">
                      <span>Detail</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Modern Minimalist Centered Pagination (Identik dengan Dashboard) ─── */}
        {totalPages > 1 && (
          <div className="pt-4 border-t border-slate-200/60 flex items-center justify-center">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))}
                className="h-9 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer shadow-2xs"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <div className="flex items-center gap-1 sm:gap-1.5 mx-0.5 sm:mx-1">
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
                        {showEllipsis && <span className="px-1 text-slate-400 text-xs sm:text-sm">...</span>}
                        <button
                          type="button"
                          onClick={() => handlePageChange(page)}
                          className={cn(
                            "min-w-[36px] h-9 px-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer",
                            safeCurrentPage === page
                              ? "bg-sky-500 text-white font-bold shadow-xs border border-sky-500"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
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
                onClick={() => handlePageChange(Math.min(totalPages, safeCurrentPage + 1))}
                className="h-9 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer shadow-2xs"
                title="Halaman Berikutnya"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </>
    ) : (
      /* Empty State */
      <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-200/80 text-center space-y-3.5 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mx-auto shadow-2xs">
          <FileText className="w-5 h-5 stroke-[1.5]" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900">
            Tidak Ada Jurnal yang Sesuai
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-normal">
            Silakan sesuaikan filter status atau gunakan kata kunci pencarian lain untuk menemukan catatan aktivitas Anda.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              setFilter("ALL");
              setMonthFilter("ALL");
              setSearchQuery("");
            }}
            className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold border border-slate-200/80 transition cursor-pointer active:scale-95"
          >
            Reset Filter
          </button>
          <Link
            href="/student/log/new"
            style={{ paddingLeft: "24px", paddingRight: "24px" }}
            className="inline-flex items-center justify-center gap-2 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-semibold transition active:scale-95 shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Catat Jurnal</span>
          </Link>
        </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. MODAL MINTA VALIDASI QR (KONSISTEN DENGAN PORTAL SISWA)
      ───────────────────────────────────────────────────────────────────────────── */}
      {isMountedState && showQrModal && (
        <MentorQrModal onClose={() => setShowQrModal(false)} />
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          6. MODAL RINCIAN LOG (INSPECTOR SHEET)
      ───────────────────────────────────────────────────────────────────────────── */}
      {isMountedState && selectedLogDetail && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedLogDetail(null)}
          className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in-0 duration-150"
          style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-modal border border-slate-200/80 space-y-4 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar scrollbar-none"
          >
            {/* Mobile Sheet Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>{formatDateIndo(selectedLogDetail.date)}</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Title & Status Badges */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "px-3 py-0.5 rounded-full text-[10px] font-medium border",
                    selectedLogDetail.status === "VERIFIED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                      : "bg-amber-50 text-amber-700 border-amber-200/70"
                  )}
                >
                  {selectedLogDetail.status === "VERIFIED" ? "Terverifikasi (Segel Digital Valid)" : "Menunggu Validasi PIN"}
                </span>

                {selectedLogDetail.skkniCode && !selectedLogDetail.isNonCompetency && (
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200/70 font-mono">
                    SKKNI {selectedLogDetail.skkniCode}
                  </span>
                )}

                {selectedLogDetail.isNonCompetency && (
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/70">
                    Non-Kejuruan: {formatCategoryLabel(selectedLogDetail.nonCompetencyCategory)}
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                {selectedLogDetail.title}
              </h2>
            </div>

            {/* Bukti Foto Terlampir & Lightbox Zoomable */}
            {isLoadingDetailPhoto ? (
              <div className="h-44 rounded-2xl bg-slate-100 flex items-center justify-center animate-pulse text-xs text-slate-400">
                Memuat pratinjau bukti foto...
              </div>
            ) : detailPhotoUrl ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                    <span>Bukti Foto Dokumentasi Kerja</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Klik foto untuk perbesar
                  </span>
                </div>

                <div
                  onClick={() => setLightboxPhotoUrl(detailPhotoUrl)}
                  className="relative rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-950 group cursor-pointer shadow-2xs hover:shadow-card transition-all duration-200"
                  title="Klik untuk membuka foto layar penuh"
                >
                  <img
                    src={detailPhotoUrl}
                    alt="Bukti Foto Jurnal"
                    className="w-full h-44 sm:h-52 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Floating badge */}
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-xs text-[10px] font-semibold text-white flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
                    <span>WebP &bull; Terverifikasi Valid</span>
                  </div>

                  {/* Hover overlay hint with Zoom icon */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[1px]">
                    <Maximize2 className="w-4 h-4" />
                    <span>Perbesar Layar Penuh</span>
                  </div>
                </div>
              </div>
            ) : selectedLogDetail.hasPhoto ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                  <ImageIcon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">Bukti Foto Terlampir</p>
                  <p className="text-xs text-slate-500 font-normal">
                    Dokumentasi kerja tersimpan aman di penyimpanan terenkripsi perangkat.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Grid Informasi Metrik (Key-Value Specification Grid) */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 text-xs space-y-2.5">
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-normal">Mitra DUDI:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>{placementInfo.dudiName}</span>
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-normal">Mentor Pembimbing:</span>
                <span className="font-semibold text-slate-800">{selectedLogDetail.mentor}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-normal">Alokasi Waktu:</span>
                <span className="font-semibold text-slate-800 text-xs">
                  {selectedLogDetail.durationJp} Jam Kerja{" "}
                  <span className="text-slate-400 font-normal">
                    (≈ {convertRealHoursToJp(selectedLogDetail.durationJp).toFixed(1)} JP)
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-normal">Tingkat Kemandirian:</span>
                <span className="font-semibold text-slate-800">
                  {selectedLogDetail.attendanceType === "SICK" || selectedLogDetail.attendanceType === "PERMIT"
                    ? "Dispensasi Medis / Resmi"
                    : selectedLogDetail.isNonCompetency
                    ? `Bantuan Operasional (${formatCategoryLabel(selectedLogDetail.nonCompetencyCategory)})`
                    : `${selectedLogDetail.autonomy} Sesuai SOP (Skor ${selectedLogDetail.autonomyScore})`}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-normal">Status Verifikasi:</span>
                <span className="font-semibold text-slate-800">
                  {selectedLogDetail.verifiedAt ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{selectedLogDetail.verifiedAt}</span>
                    </span>
                  ) : (
                    <span className="text-amber-700">Menunggu validasi PIN mentor</span>
                  )}
                </span>
              </div>
            </div>

            {/* Catatan Aktivitas Siswa */}
            {selectedLogDetail.notes && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-700">Catatan Aktivitas Siswa:</p>
                <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 leading-relaxed font-normal">
                  &quot;{selectedLogDetail.notes}&quot;
                </p>
              </div>
            )}

            {/* Actions: Pill-shaped Buttons */}
            <div className="space-y-2 pt-1">
              {selectedLogDetail.status === "PENDING_VERIFICATION" && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLogDetail(null);
                    setShowQrModal(true);
                  }}
                  className="w-full py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Minta Validasi Mentor (QR)</span>
                </button>
              )}

              {selectedLogDetail.isLocalOnly && selectedLogDetail.syncState === "queued" && (
                <button
                  type="button"
                  onClick={() => handleDeleteOfflineLog(selectedLogDetail.id)}
                  className={cn(
                    "w-full py-2.5 rounded-full font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.98] border",
                    confirmDeleteId === selectedLogDetail.id
                      ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700 animate-pulse"
                      : "border-rose-200 text-rose-600 hover:bg-rose-50"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {confirmDeleteId === selectedLogDetail.id
                      ? "Yakin hapus? Klik lagi untuk konfirmasi"
                      : "Hapus dari Antrean Offline"}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="w-full py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold text-xs transition cursor-pointer shadow-xs"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          7. FULL-SCREEN PURE PHOTO VIEWER (PORTAL KE BODY: NO LEAK, IDENTICAL BLUR)
      ───────────────────────────────────────────────────────────────────────────── */}
      {isMountedState && lightboxPhotoUrl && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxPhotoUrl(null)}
          className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8 cursor-zoom-out select-none animate-in fade-in-0 duration-150"
          style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
        >
          {/* Tombol Tutup Bulat Minimalis di Pojok Kanan Atas */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxPhotoUrl(null);
            }}
            aria-label="Tutup Foto"
            className="fixed top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900/80 active:scale-95 text-white/90 hover:text-white border border-white/20 backdrop-blur-xs flex items-center justify-center transition cursor-pointer z-10 shadow-xl"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Foto Murni Beresolusi Penuh (Tanpa Informasi Apapun) */}
          <img
            src={lightboxPhotoUrl}
            alt="Dokumentasi Bukti Kerja"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] w-auto h-auto object-contain rounded-2xl sm:rounded-3xl shadow-2xl animate-in zoom-in-95 duration-150 cursor-default ring-1 ring-black/10"
          />
        </div>,
        document.body
      )}
    </div>
  );
}
