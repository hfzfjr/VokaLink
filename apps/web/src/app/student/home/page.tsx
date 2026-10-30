"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  PlusCircle,
  QrCode,
  ChevronRight,
  Calendar,
  Check,
  Building2,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { TOTAL_TARGET_JP, convertRealHoursToJp } from "@vokalink/shared";
import { db } from "@/lib/pwa/db";
import {
  fetchStudentLogContext,
  fetchStudentLogs,
  type StudentLogContextResponse,
  type StudentDailyLogItem,
} from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/cn";

import {
  type CategoryColor,
  type KanbanTask,
  type StudentInfo,
  formatLogDate,
} from "@/components/student/home/types";
import { DailyTimelineFeed } from "@/components/student/home/DailyTimelineFeed";
import { EvidenceGalleryView } from "@/components/student/home/EvidenceGalleryView";
import { StudentWidgetPanel } from "@/components/student/home/StudentWidgetPanel";
import { TaskDetailModal } from "@/components/student/home/TaskDetailModal";
import { MentorQrModal } from "@/components/student/home/MentorQrModal";
import { MentorNotificationModal } from "@/components/student/home/MentorNotificationModal";
import { HomeSkeleton } from "@/components/student/home/HomeSkeleton";

export default function StudentHomePage() {
  const { user, token } = useAuth();

  const [placementInfo, setPlacementInfo] = useState<{
    id?: string;
    dudiName?: string;
    dudiCity?: string;
    mentorName?: string;
  } | null>(null);

  const [studentProfile, setStudentProfile] = useState<{
    id?: string;
    fullName?: string;
    identityNumber?: string | null;
    departmentName?: string;
    schoolName?: string;
    email?: string | null;
  } | null>(() => (user ? {
    id: user.id,
    fullName: user.fullName,
    identityNumber: user.identityNumber,
    departmentName: user.department?.name,
    schoolName: user.school?.name,
    email: user.email,
  } : null));

  useEffect(() => {
    if (user) {
      setStudentProfile({
        id: user.id,
        fullName: user.fullName,
        identityNumber: user.identityNumber,
        departmentName: user.department?.name,
        schoolName: user.school?.name,
        email: user.email,
      });
    }
  }, [user]);

  const [serverLogs, setServerLogs] = useState<StudentDailyLogItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // View Mode: Timeline (default) | Evidence Gallery
  const [viewMode, setViewMode] = useState<"timeline" | "evidence">("timeline");
  const [selectedTaskModal, setSelectedTaskModal] = useState<KanbanTask | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // 1. Live Dexie Query for Student Logs (Reactive offline-first state)
  const offlineLogs = useLiveQuery(() => db.logs.toArray(), []) || [];

  // Today ISO Date string (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // 2. Load context from IndexedDB cache or server fallback
  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();
    const safetyTimer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 1200);

    async function loadPlacementContext() {
      try {
        const cacheKey = user?.id ? `student_log_context_${user.id}` : "student_log_context";
        const cached = await db.refData.get(cacheKey);
        if (cached && cached.data && isMounted) {
          const data = cached.data as StudentLogContextResponse;
          if (!user?.id || data.student?.id === user.id) {
            if (data.student) setStudentProfile(data.student);
            if (data.activePlacement) {
              setPlacementInfo({
                id: data.activePlacement.id,
                dudiName: data.activePlacement.dudiName,
                dudiCity: data.activePlacement.dudiCity,
                mentorName: data.activePlacement.mentorName,
              });
            }
          }
        }

        if (typeof navigator !== "undefined" && navigator.onLine) {
          const fresh = await fetchStudentLogContext(user?.id, token || undefined);
          if (fresh && isMounted) {
            if (fresh.student) setStudentProfile(fresh.student);
            if (fresh.activePlacement) {
              setPlacementInfo({
                id: fresh.activePlacement.id,
                dudiName: fresh.activePlacement.dudiName,
                dudiCity: fresh.activePlacement.dudiCity,
                mentorName: fresh.activePlacement.mentorName,
              });

              try {
                const dbLogs = await fetchStudentLogs(fresh.activePlacement.id);
                if (isMounted && Array.isArray(dbLogs)) {
                  setServerLogs(dbLogs);

                  // Sinkronisasi status log Dexie lokal bila di server sudah TERVERIFIKASI atau REVISI
                  try {
                    for (const sl of dbLogs) {
                      if (sl.clientLogUuid) {
                        const local = await db.logs.get(sl.clientLogUuid);
                        if (sl.status === "VERIFIED" && local && local.state !== "verified") {
                          await db.logs.update(sl.clientLogUuid, {
                            state: "verified",
                            verifiedAt: sl.verifiedAt || new Date().toISOString(),
                          });
                        } else if (sl.status === "REVISION_REQUIRED" && local && local.state !== "revision_required") {
                          await db.logs.update(sl.clientLogUuid, {
                            state: "revision_required",
                            lastError: sl.rejectionReason || "Mentor meminta revisi",
                          });
                        }
                      }
                    }
                  } catch {}
                }
              } catch (logErr) {
                console.warn("Gagal menarik logs server:", logErr);
              }
            }
            await db.refData.put({
              key: cacheKey,
              data: fresh,
              cachedAt: Date.now(),
            });
          }
        }
      } catch (err) {
        console.warn("Konteks penempatan offline fallback:", err);
      } finally {
        if (isMounted) {
          const elapsed = Date.now() - startTime;
          const delay = Math.max(0, 350 - elapsed);
          setTimeout(() => {
            if (isMounted) {
              setIsLoading(false);
              clearTimeout(safetyTimer);
            }
          }, delay);
        }
      }
    }
    loadPlacementContext();
    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [user?.id, token]);

  // 3. Transform Dexie offline logs reactively into KanbanTask objects
  const dexieTasks: KanbanTask[] = useMemo(() => {
    return offlineLogs.map((log) => {
      const isVerified = log.state === "verified";
      const isInReview =
        log.state === "queued" ||
        log.state === "meta_synced" ||
        log.state === "synced";
      const autonomyLabel =
        log.autonomyLevel === 3
          ? "Mandiri"
          : log.autonomyLevel === 2
          ? "Terbimbing"
          : "Observasi";
      const category = log.isNonCompetency
        ? log.nonCompetencyCategory || "Tugas Umum Non-Kompetensi"
        : "Pemrograman Web & Mobile";
      const categoryColor: CategoryColor = log.isNonCompetency ? "rose" : "sky";

      const syncStatusText =
        log.state === "queued"
          ? "Tersimpan di HP (Offline)"
          : log.state === "meta_synced" || log.state === "synced"
          ? "Tersinkron (Menunggu PIN)"
          : log.state === "verified"
          ? "Sah Terverifikasi"
          : "Perlu Revisi";

      return {
        id: log.clientLogUuid,
        title: log.jobCardTitle || log.shortNote || "Pencatatan Jurnal Praktik",
        category,
        categoryColor,
        date: formatLogDate(log.logDate),
        durationJp: log.durationJp,
        progressPercent: isVerified ? 100 : isInReview ? 85 : 40,
        autonomyLabel,
        skkniUnitCode: log.isNonCompetency ? "NON-KOMPETENSI" : "J.620100.009.01",
        status: isVerified ? "verified" : isInReview ? "in_review" : "in_progress",
        isoDate: log.logDate,
        tools: log.isNonCompetency ? ["SOP Industri"] : ["Logbook PKL", "SOP Industri"],
        submittedAt: syncStatusText,
        mentorSignature: isVerified
          ? placementInfo?.mentorName || "Mentor Industri"
          : undefined,
        hmacVerified: isVerified,
        syncState: log.state,
        isLocalDexie: true,
        shortNote: log.shortNote,
      };
    });
  }, [offlineLogs, placementInfo]);

  // Transform Server database logs into KanbanTask objects (Murni dari Database PostgreSQL)
  const serverTasks: KanbanTask[] = useMemo(() => {
    return serverLogs.map((sl) => {
      const firstItem = sl.items?.[0];
      const durationJp = sl.items?.reduce((acc, it) => acc + it.durationJp, 0) || 8;
      const autonomyLevel = firstItem?.autonomyLevel || 3;
      const isVerified = sl.status === "VERIFIED";
      const isRevision = sl.status === "REVISION_REQUIRED";
      const isInReview = sl.status === "PENDING_VERIFICATION";
      const autonomyLabel =
        autonomyLevel === 3 ? "Mandiri" : autonomyLevel === 2 ? "Terbimbing" : "Observasi";
      const isNonCompetency = Boolean(
        firstItem?.jobCard?.isNonCompetency || firstItem?.nonCompetencyCategory
      );
      const category = isNonCompetency
        ? firstItem?.nonCompetencyCategory || "Tugas Umum Non-Kompetensi"
        : "Pemrograman Web & Mobile";
      const categoryColor: CategoryColor = isNonCompetency ? "rose" : "sky";

      return {
        id: sl.clientLogUuid || sl.id,
        title:
          firstItem?.jobCard?.title ||
          sl.shortNote ||
          "Pencatatan Jurnal Praktik",
        category,
        categoryColor,
        date: formatLogDate(sl.logDate),
        durationJp,
        progressPercent: isVerified ? 100 : isInReview ? 85 : 40,
        autonomyLabel,
        skkniUnitCode: isNonCompetency
          ? "NON-KOMPETENSI"
          : firstItem?.jobCard?.skkniUnitCode || "J.620100.009.01",
        status: isVerified ? "verified" : isInReview ? "in_review" : "in_progress",
        isoDate: sl.logDate ? sl.logDate.slice(0, 10) : undefined,
        tools: isNonCompetency ? ["SOP Industri"] : ["Logbook PKL", "SOP Industri"],
        submittedAt: isVerified
          ? "Sah Terverifikasi"
          : isRevision
          ? "Perlu Revisi (Ditolak Mentor)"
          : "Tersinkron (Menunggu PIN)",
        mentorSignature: isVerified ? placementInfo?.mentorName || "Mentor Industri" : undefined,
        hmacVerified: isVerified,
        syncState: isVerified ? "verified" : isRevision ? "revision_required" : "synced",
        isLocalDexie: false,
        shortNote: sl.shortNote || undefined,
        samplePhotoUrl: sl.evidenceWebpUrl || undefined,
      };
    });
  }, [serverLogs, placementInfo]);

  // Combine Dexie logs (recent first) with real server database logs (NO DUMMY TASKS)
  const allTasks = useMemo(() => {
    const serverMap = new Map(serverTasks.map((st) => [st.id, st]));
    const mergedDexie = dexieTasks.map((dt) => {
      const serverTask = serverMap.get(dt.id);
      if (!serverTask) return dt;
      // Bila di server sudah terverifikasi sah, utamakan status server
      if (serverTask.status === "verified") {
        return {
          ...dt,
          status: "verified" as const,
          progressPercent: 100,
          submittedAt: "Sah Terverifikasi",
          mentorSignature: serverTask.mentorSignature || dt.mentorSignature,
          hmacVerified: true,
          samplePhotoUrl: serverTask.samplePhotoUrl || dt.samplePhotoUrl,
        };
      }
      if (serverTask.status === "in_review" && dt.status === "in_progress") {
        return {
          ...dt,
          status: "in_review" as const,
          progressPercent: 85,
          submittedAt: "Tersinkron (Menunggu PIN)",
        };
      }
      return dt;
    });

    const dexieIdSet = new Set(dexieTasks.map((t) => t.id));
    const nonDuplicatedServer = serverTasks.filter((st) => !dexieIdSet.has(st.id));
    return [...mergedDexie, ...nonDuplicatedServer];
  }, [dexieTasks, serverTasks]);

  // Detect whether student has already logged for today across both offline & server
  const todayLog = useMemo(() => {
    const serverToday = serverLogs.find((sl) => (sl.logDate || "").slice(0, 10) === todayStr);
    const offlineToday = offlineLogs.find((l) => (l.logDate || "").slice(0, 10) === todayStr);

    if (offlineToday) {
      // Jika di server sudah terverifikasi, gunakan status verified
      const isServerVerified = serverToday?.status === "VERIFIED";
      return {
        durationJp: offlineToday.durationJp,
        state: isServerVerified ? ("verified" as const) : offlineToday.state,
        jobCardTitle: offlineToday.jobCardTitle,
      };
    }
    if (serverToday) {
      const firstItem = serverToday.items?.[0];
      const duration = serverToday.items?.reduce((acc, it) => acc + it.durationJp, 0) || 8;
      return {
        durationJp: duration,
        state: serverToday.status === "VERIFIED" ? ("verified" as const) : ("synced" as const),
        jobCardTitle: firstItem?.jobCard?.title || serverToday.shortNote || "Pencatatan Jurnal Praktik",
      };
    }
    return undefined;
  }, [offlineLogs, serverLogs, todayStr]);

  // Dynamically calculate JP purely from combined real database logs
  const totalVerifiedHours = useMemo(() => {
    return allTasks
      .filter((t) => t.status === "verified")
      .reduce((acc, curr) => acc + curr.durationJp, 0);
  }, [allTasks]);

  const totalPendingHours = useMemo(() => {
    return allTasks
      .filter((t) => t.status === "in_review" || t.syncState === "queued" || t.syncState === "synced")
      .reduce((acc, curr) => acc + curr.durationJp, 0);
  }, [allTasks]);

  const totalVerifiedJp = useMemo(() => convertRealHoursToJp(totalVerifiedHours), [totalVerifiedHours]);
  const totalPendingJp = useMemo(() => convertRealHoursToJp(totalPendingHours), [totalPendingHours]);

  const progressPercentage = Math.min(100, Math.round((totalVerifiedJp / TOTAL_TARGET_JP) * 100));

  const currentStudentName = user?.fullName || studentProfile?.fullName || "Siswa VokaLink";
  const currentStudentEmail = user?.email || studentProfile?.email || `${currentStudentName.toLowerCase().replace(/[^a-z0-9]+/g, "")}@smktelkom1medan.sch.id`;
  const currentStudentNisn = user?.identityNumber || studentProfile?.identityNumber || "-";
  const currentSchoolName = user?.school?.name || studentProfile?.schoolName || "SMK VokaLink";
  const currentMajorName = user?.department?.name || studentProfile?.departmentName || "Kejuruan";
  const currentDudiName = placementInfo?.dudiName || "PT Telkom Indonesia Witel Sumut";
  const currentMentorName = placementInfo?.mentorName || "Mentor Industri";
  const currentCity = placementInfo?.dudiCity || user?.school?.city || "Medan";

  const student: StudentInfo = {
    name: currentStudentName,
    email: currentStudentEmail,
    nisn: currentStudentNisn,
    school: currentSchoolName,
    major: currentMajorName,
    dudi: currentDudiName,
    mentor: currentMentorName,
    city: currentCity,
    verifiedJp: totalVerifiedJp,
    pendingJp: totalPendingJp,
    targetJp: TOTAL_TARGET_JP,
  };

  // 5. Hitung dinamika 5 hari kerja pekan berjalan (Senin s/d Jumat) murni dari database
  const workDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMon = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const currMon = new Date(now);
    currMon.setDate(diffToMon);
    currMon.setHours(0, 0, 0, 0);

    const sortedIsoDates = allTasks
      .map((t) => t.isoDate)
      .filter((d): d is string => Boolean(d))
      .sort((a, b) => (a < b ? 1 : -1));

    let mondayDate = currMon;
    if (sortedIsoDates.length > 0) {
      const latestTaskDate = new Date(sortedIsoDates[0] + "T00:00:00");
      if (!isNaN(latestTaskDate.getTime())) {
        const lDay = latestTaskDate.getDay();
        const lDiff = latestTaskDate.getDate() - lDay + (lDay === 0 ? -6 : 1);
        const lMon = new Date(latestTaskDate);
        lMon.setDate(lDiff);
        lMon.setHours(0, 0, 0, 0);

        const hasLogsInCurrentWeek = allTasks.some((t) => {
          if (!t.isoDate) return false;
          const td = new Date(t.isoDate + "T00:00:00");
          return td >= currMon && td <= new Date(currMon.getTime() + 5 * 24 * 60 * 60 * 1000);
        });

        if (!hasLogsInCurrentWeek) {
          mondayDate = lMon;
        }
      }
    }

    const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum"];
    return dayNames.map((name, i) => {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const isoStr = `${year}-${month}-${day}`;

      const matchedTask = allTasks.find((t) => t.isoDate === isoStr);
      const isToday = isoStr === todayStr;

      if (matchedTask) {
        const isVer = matchedTask.status === "verified";
        return {
          day: name,
          jp: matchedTask.durationJp,
          status: isVer ? ("verified" as const) : ("in_review" as const),
          label: isVer ? "Sah" : "Pending",
        };
      }

      if (isToday) {
        return {
          day: name,
          jp: todayLog?.durationJp || 0,
          status: todayLog
            ? todayLog.state === "verified"
              ? ("verified" as const)
              : ("in_review" as const)
            : ("today" as const),
          label: todayLog ? (todayLog.state === "verified" ? "Sah" : "Pending") : "Hari Ini",
        };
      }

      return {
        day: name,
        jp: 0,
        status: "empty" as const,
        label: "Kosong",
      };
    });
  }, [allTasks, todayLog, todayStr]);

  const weeklyVerifiedJp = useMemo(() => {
    return workDays
      .filter((d) => d.status === "verified")
      .reduce((acc, curr) => acc + curr.jp, 0);
  }, [workDays]);

  const weeklyPercent = Math.min(100, Math.round((weeklyVerifiedJp / 40) * 100));

  // ─── 5 UI States: 1. Loading Skeleton Condition ───
  if (isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 sm:gap-5 items-stretch min-h-0 lg:min-h-[840px]">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. CENTER SECTION: WORKSPACE CANVAS (TIMELINE / MATRIX / EVIDENCE)
          Apple Design System HIG: Seamless Mobile Cards, Refined Desktop Canvas
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="flex-1 min-w-0 bg-transparent rounded-none p-0 border-0 shadow-none flex flex-col justify-between gap-4 lg:gap-5">
        <div className="flex flex-col gap-3.5 sm:gap-4">
          {/* ─── A.1 TAMPILAN KHUSUS MOBILE: HERO, AKSI HARI INI & PRESENSI PEKAN INI (< lg) ─── */}
          <div className="block lg:hidden space-y-3 font-sans">
            {/* Context Pill Siswa & DUDI */}
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">{student.dudi}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500 truncate">{student.city.split(",")[0]}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Aktif</span>
              </span>
            </div>

            {/* Card Aksi Utama Hari Ini */}
            {todayLog ? (
              <div className="bg-white rounded-2xl p-4 border border-emerald-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-800">
                      Jurnal Hari Ini Tercatat ({todayLog.durationJp} JP)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{formatLogDate(todayStr)}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {todayLog.jobCardTitle || "Pencatatan Kegiatan Praktik Industri"}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    {todayLog.state === "verified"
                      ? "Jurnal hari ini telah diverifikasi sah oleh mentor industri."
                      : "Jurnal tersimpan. Tunjukkan QR kepada mentor atau minta verifikasi PIN."}
                  </p>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-sky-400" />
                    <span>Tampilkan QR ke Mentor</span>
                  </button>
                  <Link
                    href="/student/log/history"
                    className="h-11 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <span>Riwayat</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-sky-600 rounded-2xl p-4 sm:p-5 text-white shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                    <span>Belum Ada Jurnal Hari Ini</span>
                  </span>
                  <span className="text-xs text-sky-100 font-medium">{formatLogDate(todayStr)}</span>
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Waktunya mengisi jurnal magang!
                  </h3>
                  <p className="text-xs text-sky-100/90 leading-relaxed font-normal">
                    Catat penugasan industri hari ini (target 8 JP). Batas pengisian H-3.
                  </p>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <Link
                    href="/student/log/new"
                    className="flex-1 h-11 bg-white hover:bg-sky-50 active:scale-[0.98] text-sky-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>Catat Jurnal Sekarang</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="h-11 px-3.5 bg-sky-700/80 hover:bg-sky-700 active:scale-[0.98] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-sky-400/40 cursor-pointer"
                    title="QR Validasi Mentor"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QR</span>
                  </button>
                </div>
              </div>
            )}

            {/* Presensi 5 Hari Kerja Pekan Ini (Sen - Jum) di Mobile */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-xs font-bold text-slate-900">Presensi Pekan Ini</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  {weeklyVerifiedJp} / 40 JP ({weeklyPercent}%)
                </span>
              </div>

              {/* 5 Workday Pills */}
              <div className="grid grid-cols-5 gap-1.5">
                {workDays.map((d) => {
                  const isToday = d.status === "today";
                  return (
                    <div
                      key={d.day}
                      className={`flex flex-col items-center justify-between py-1.5 px-0.5 rounded-xl border text-center transition ${
                        isToday
                          ? "bg-sky-50/80 border-sky-400 ring-2 ring-sky-500/15"
                          : "bg-slate-50/70 border-slate-200/80"
                      }`}
                    >
                      <span className={`text-[9.5px] font-bold uppercase ${isToday ? "text-sky-700" : "text-slate-400"}`}>
                        {d.day}
                      </span>
                      <span className={`text-[11px] font-bold my-0.5 ${isToday ? "text-sky-600" : "text-slate-900"}`}>
                        {d.jp} <span className="text-[9px] font-normal text-slate-400">JP</span>
                      </span>
                      {isToday ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-sky-500 text-white text-[8px] font-bold leading-none whitespace-nowrap">
                          Hari Ini
                        </span>
                      ) : d.status === "verified" ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[8px] font-bold leading-none whitespace-nowrap">
                          <Check className="w-2 h-2 stroke-[2.5]" />
                          <span>Sah</span>
                        </span>
                      ) : d.status === "in_review" ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[8px] font-bold leading-none whitespace-nowrap">
                          Pending
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[8px] font-medium leading-none whitespace-nowrap">
                          -
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Target Kelulusan PKL 792 JP Mobile Card */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 text-[10.5px] uppercase tracking-wider">
                  Target Kelulusan PKL
                </span>
                <div className="flex items-baseline gap-1 font-sans tabular-nums">
                  <span className="text-sm font-bold text-slate-900">{student.verifiedJp}</span>
                  <span className="text-slate-400 font-normal">/ {TOTAL_TARGET_JP} JP</span>
                  <span className="text-xs font-bold text-sky-600 ml-1">({progressPercentage}%)</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                <div
                  style={{ width: `${Math.min(100, (student.verifiedJp / TOTAL_TARGET_JP) * 100)}%` }}
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                />
                <div
                  style={{ width: `${Math.min(100, (student.pendingJp / TOTAL_TARGET_JP) * 100)}%` }}
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                />
              </div>

              {/* 3 Metric Pills */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-center">
                  <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Jam Sah</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{student.verifiedJp} <span className="text-[10px] font-normal text-slate-400">JP</span></span>
                  <span className="text-[9.5px] font-semibold text-emerald-700 flex items-center justify-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Sah
                  </span>
                </div>

                <div
                  onClick={() => setShowQrModal(true)}
                  className="p-2 rounded-xl bg-slate-50/80 hover:bg-amber-50/60 border border-slate-100 hover:border-amber-200 text-center cursor-pointer transition active:scale-95"
                >
                  <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Antrean</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{student.pendingJp} <span className="text-[10px] font-normal text-slate-400">JP</span></span>
                  <span className="text-[9.5px] font-semibold text-amber-700 flex items-center justify-center gap-0.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Validasi ›
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-center">
                  <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Sisa Target</span>
                  <span className="text-sm font-bold text-slate-700 mt-0.5 block">{Math.max(0, TOTAL_TARGET_JP - student.verifiedJp)} <span className="text-[10px] font-normal text-slate-400">JP</span></span>
                  <span className="text-[9.5px] font-normal text-slate-400 mt-0.5 block">/ 792 JP</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── A.2 TAMPILAN KHUSUS DESKTOP: HEADER SAPAAN + AKSI UTAMA (≥ lg) ─── */}
          <div className="hidden lg:flex lg:h-[86px] items-center justify-between gap-6 bg-white rounded-2xl px-5 border border-slate-200/70 shadow-2xs shrink-0">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                  Halo, {student.name.split(" ")[0]}!
                </h2>
                {todayLog ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-medium leading-none">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>
                      Hari ini {todayLog.durationJp} JP · {todayLog.state === "verified" ? "Sah" : "Menunggu PIN"}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 text-[11px] font-medium leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Jurnal hari ini belum diisi</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate max-w-xl leading-normal">
                {formatLogDate(todayStr)} ·{" "}
                {todayLog
                  ? todayLog.jobCardTitle || "Pencatatan kegiatan praktik industri"
                  : "Target 8 JP per hari, batas pengisian H-3."}
              </p>
            </div>

            {todayLog ? (
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
              >
                <QrCode className="w-3.5 h-3.5 text-sky-300" />
                <span>Tampilkan QR Mentor</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Buka QR Verifikasi Mentor"
                >
                  <QrCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>QR Mentor</span>
                </button>
                <Link
                  href="/student/log/new"
                  className="h-10 px-5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs whitespace-nowrap shrink-0"
                >
                  <PlusCircle className="w-4 h-4 stroke-[2.5] shrink-0" />
                  <span>Catat Jurnal</span>
                </Link>
              </div>
            )}
          </div>

          {/* ─── C. VIEW CONTROLLER (Judul + Tab Utama dalam satu baris) ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Dokumentasi Praktik Industri
            </h2>

            {/* Apple Segmented Control Bar (Timeline vs Galeri Bukti) */}
            <div className="grid grid-cols-2 sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={cn(
                  "px-3 sm:px-4 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap text-center text-xs flex items-center justify-center gap-1",
                  viewMode === "timeline"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
                )}
              >
                <span>Timeline</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("evidence")}
                className={cn(
                  "px-3 sm:px-4 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap text-center text-xs flex items-center justify-center gap-1",
                  viewMode === "evidence"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium"
                )}
              >
                <span>Galeri Bukti</span>
              </button>
            </div>
          </div>

          {/* ─── D. ACTIVE VIEW RENDER ─── */}
          {viewMode === "timeline" && (
            <DailyTimelineFeed
              tasks={allTasks}
              onSelectTask={setSelectedTaskModal}
              onOpenQrModal={() => setShowQrModal(true)}
            />
          )}

          {viewMode === "evidence" && (
            <EvidenceGalleryView
              serverLogs={serverLogs}
              mentorName={placementInfo?.mentorName}
            />
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. RIGHT SECTION: WIDGET PANEL (Profile + Presensi Pekan Ini + Ulasan Mentor)
      ───────────────────────────────────────────────────────────────────────────── */}
      <StudentWidgetPanel
        student={student}
        tasks={allTasks}
        todayLog={todayLog}
        workDays={workDays}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenQrModal={() => setShowQrModal(true)}
      />

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. ACCESSIBLE MODALS
      ───────────────────────────────────────────────────────────────────────────── */}
      {selectedTaskModal && (
        <TaskDetailModal
          task={selectedTaskModal}
          onClose={() => setSelectedTaskModal(null)}
        />
      )}

      {showNotifications && (
        <MentorNotificationModal
          onClose={() => setShowNotifications(false)}
        />
      )}

      {showQrModal && (
        <MentorQrModal
          onClose={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
}
