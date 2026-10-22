"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Filter,
  Search,
  RefreshCw,
  MessageCircle,
  TrendingUp,
  ShieldAlert,
  X,
  AlertOctagon,
  Sparkles,
  Repeat,
  Send,
  Calendar,
} from "lucide-react";
import {
  fetchTeacherHeatmap,
  triggerEvaluateDriftAlerts,
  fetchInterventionDraft,
  submitIntervention,
  executePlacementRotation,
  fetchSecurityFlags,
  acknowledgeSecurityFlag,
} from "@/lib/api";
import type {
  HeatmapResponse,
  HeatmapStudentRow,
  DriftAlertItem,
  SecurityFlagItem,
} from "@vokalink/shared";

export default function TeacherHeatmapPage() {
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters state
  const [selectedDudi, setSelectedDudi] = useState<string>("ALL");
  const [driftOnlyFilter, setDriftOnlyFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Student Detail Modal state
  const [selectedStudent, setSelectedStudent] = useState<HeatmapStudentRow | null>(null);

  // FR-009: Smart Intervention & Rotation Modal state
  const [interventionStudent, setInterventionStudent] = useState<HeatmapStudentRow | null>(null);
  const [interventionAlert, setInterventionAlert] = useState<DriftAlertItem | null>(null);
  const [interventionTab, setInterventionTab] = useState<"WA_COORDINATION" | "SITE_VISIT" | "DUDI_ROTATION">("WA_COORDINATION");
  const [draftMessage, setDraftMessage] = useState("");
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false);
  const [interventionSuccessMsg, setInterventionSuccessMsg] = useState<string | null>(null);
  const [targetDudiId, setTargetDudiId] = useState("");
  const [rotationReason, setRotationReason] = useState("");
  const [siteVisitDate, setSiteVisitDate] = useState("");

  // FR-007 A2 & TC-006: Security Audit Flags state
  const [securityFlags, setSecurityFlags] = useState<SecurityFlagItem[]>([]);
  const [isAcknowledgingFlag, setIsAcknowledgingFlag] = useState<string | null>(null);

  // Load security audit flags
  const loadSecurityFlags = useCallback(async () => {
    try {
      const res = await fetchSecurityFlags();
      setSecurityFlags(res.flags || []);
    } catch {
      // Silent fallback
    }
  }, []);

  const handleAcknowledgeFlag = async (flagId: string) => {
    setIsAcknowledgingFlag(flagId);
    try {
      await acknowledgeSecurityFlag(flagId);
      setSecurityFlags((prev) => prev.filter((f) => f.id !== flagId));
    } catch (err: any) {
      alert(err.message || "Gagal menandai bendera audit");
    } finally {
      setIsAcknowledgingFlag(null);
    }
  };

  // Load heatmap data from API
  const loadHeatmapData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchTeacherHeatmap({
        driftOnly: driftOnlyFilter,
      });
      setData(res);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memuat matriks heatmap kompetensi");
    } finally {
      setIsLoading(false);
    }
  }, [driftOnlyFilter]);

  useEffect(() => {
    loadHeatmapData();
    loadSecurityFlags();
  }, [loadHeatmapData, loadSecurityFlags]);

  // Trigger on-demand drift evaluation
  const handleTriggerEvaluate = async () => {
    setIsEvaluating(true);
    try {
      await triggerEvaluateDriftAlerts();
      await loadHeatmapData();
    } catch (err: any) {
      alert(err.message || "Gagal menjalankan evaluasi drift");
    } finally {
      setIsEvaluating(false);
    }
  };

  // FR-009: Buka Modal Intervensi & Ambil Draf Otomatis
  const openInterventionModal = async (
    student: HeatmapStudentRow,
    alert?: DriftAlertItem
  ) => {
    setInterventionStudent(student);
    setInterventionAlert(alert || student.driftAlerts[0] || null);
    setInterventionTab("WA_COORDINATION");
    setInterventionSuccessMsg(null);
    setTargetDudiId("");
    setRotationReason("");
    setSiteVisitDate(new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0] || "");
    setIsDraftLoading(true);

    try {
      const draft = await fetchInterventionDraft({
        studentId: student.studentId,
        placementId: student.placement.id,
        driftAlertId: alert?.id || student.driftAlerts[0]?.id,
        alertType: (alert?.alertType || student.driftAlerts[0]?.alertType || "GENERAL") as any,
      });
      setDraftMessage(draft.messageText);
    } catch {
      setDraftMessage(
        `Yth. Bapak/Ibu ${student.placement.mentorName}, ${student.placement.dudiName}\n\nSalam hormat, saya Guru Pembimbing dari ${student.fullName}. Mohon waktu koordinasi terkait capaian kompetensi magang ananda.`
      );
    } finally {
      setIsDraftLoading(false);
    }
  };

  // FR-009: Eksekusi Kirim WhatsApp & Catat Log Intervensi
  const handleSendWaIntervention = async () => {
    if (!interventionStudent) return;
    setIsSubmittingIntervention(true);
    try {
      await submitIntervention({
        studentId: interventionStudent.studentId,
        placementId: interventionStudent.placement.id,
        driftAlertId: interventionAlert?.id,
        actionType: "WA_COORDINATION",
        messageSent: draftMessage,
      });

      const rawPhone = interventionStudent.placement.mentorPhone || "";
      const phone = rawPhone.replace(/\D/g, "");
      const normalizedPhone = phone.startsWith("0") ? "62" + phone.slice(1) : phone;
      if (normalizedPhone) {
        const waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(draftMessage)}`;
        window.open(waUrl, "_blank");
      }

      setInterventionSuccessMsg("Pesan koordinasi berhasil dicatat dan jendela WhatsApp telah dibuka!");
      await loadHeatmapData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat intervensi pembimbing");
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  // FR-009: Catat Kunjungan Lapangan
  const handleRecordSiteVisit = async () => {
    if (!interventionStudent) return;
    setIsSubmittingIntervention(true);
    try {
      await submitIntervention({
        studentId: interventionStudent.studentId,
        placementId: interventionStudent.placement.id,
        driftAlertId: interventionAlert?.id,
        actionType: "SITE_VISIT",
        messageSent: `Rencana kunjungan supervisi lapangan dijadwalkan pada ${siteVisitDate || "minggu depan"}. Catatan agenda: ${draftMessage}`,
      });
      setInterventionSuccessMsg("Jadwal kunjungan supervisi lapangan berhasil disimpan ke riwayat intervensi!");
      await loadHeatmapData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat jadwal kunjungan lapangan");
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  // FR-009: Eksekusi Rotasi Mitra DUDI Tengah Semester (TC-009)
  const handleExecuteRotation = async () => {
    if (!interventionStudent || !targetDudiId) {
      alert("Pilih mitra DUDI tujuan baru terlebih dahulu");
      return;
    }
    setIsSubmittingIntervention(true);
    try {
      const res = await executePlacementRotation({
        studentId: interventionStudent.studentId,
        fromPlacementId: interventionStudent.placement.id,
        toDudiId: targetDudiId,
        driftAlertId: interventionAlert?.id,
        reason: rotationReason || "Rotasi tengah semester untuk pemenuhan elemen kompetensi kurikulum (TC-009).",
      });

      setInterventionSuccessMsg(
        `Sukses! Siswa berhasil dirotasi ke ${res.newPlacement.dudiName}. Total ${res.cumulativeVerifiedJp} JP terverifikasi tetap tersimpan utuh di portofolio siswa (TC-009).`
      );
      await loadHeatmapData();
    } catch (err: any) {
      alert(err.message || "Gagal mengeksekusi rotasi mitra DUDI");
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  // Unique DUDI partners for filter
  const dudiOptions = useMemo(() => {
    if (!data?.students) return [];
    const map = new Map<string, string>();
    for (const s of data.students) {
      map.set(s.placement.dudiId, s.placement.dudiName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    return data.students.filter((student) => {
      // DUDI filter
      if (selectedDudi !== "ALL" && student.placement.dudiId !== selectedDudi) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = student.fullName.toLowerCase().includes(q);
        const matchesNisn = student.nisn.includes(q);
        const matchesDudi = student.placement.dudiName.toLowerCase().includes(q);
        if (!matchesName && !matchesNisn && !matchesDudi) return false;
      }
      return true;
    });
  }, [data, selectedDudi, searchQuery]);

  // Priority Drift Alerts extracted from all students
  const priorityAlerts = useMemo(() => {
    if (!data?.students) return [];
    const alerts: { student: HeatmapStudentRow; alert: DriftAlertItem }[] = [];
    for (const student of data.students) {
      for (const alert of student.driftAlerts) {
        alerts.push({ student, alert });
      }
    }

    const priorityMap: Record<string, number> = {
      NON_COMPETENCY_OVERLOAD: 1,
      SKILL_MONOTONY: 2,
      APPROVAL_DORMANCY: 3,
    };

    return alerts.sort(
      (a, b) =>
        (priorityMap[a.alert.alertType] || 99) - (priorityMap[b.alert.alertType] || 99)
    );
  }, [data]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5 UI CONDITIONS: 1. LOADING SKELETON
  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-10 bg-slate-200 rounded-xl w-72 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5 UI CONDITIONS: 2. ERROR RECOVERY
  // ─────────────────────────────────────────────────────────────────────────────
  if (errorMessage && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Gagal Memuat Dasbor Heatmap</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{errorMessage}</p>
          <button
            type="button"
            onClick={loadHeatmapData}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Coba Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  const cpElements = data?.cpElements || [];
  const summary = data?.summary || {
    totalStudents: 0,
    studentsWithDrift: 0,
    averageCompetencyPercentage: 0,
    activeAlertsCount: { nonCompetency: 0, skillMonotony: 0, approvalDormancy: 0 },
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 1. Header Bar: Teacher Portal & Department Context */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              HM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Portal Guru Pembimbing
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {data?.department.name} ({data?.department.sectorCode})
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                Live Competency Heatmap & Drift Alert (FR-008)
              </h1>
            </div>
          </div>

          {/* Action Button: Scan Algoritma Drift */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerEvaluate}
              disabled={isEvaluating}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin text-blue-600" : ""}`} />
              <span>{isEvaluating ? "Memindai..." : "Pindai Algoritma Drift"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* FR-007 A2 & TC-006: Bendera Peringatan Audit Keamanan (Security Audit Flags) */}
        {securityFlags.length > 0 && (
          <div className="bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 rounded-2xl border-2 border-rose-300 shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-rose-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-extrabold text-rose-950">
                      Bendera Peringatan Audit Keamanan (TC-006)
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wide">
                      {securityFlags.length} INSIDEN AKTIF
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 font-medium mt-0.5">
                    Sistem mendeteksi percobaan verifikasi jurnal siswa dari perangkat tidak terdaftar (HP Siswa/Incognito) atau penguncian PIN mentor.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {securityFlags.map((flag) => {
                const isUntrusted = flag.kind === "UNTRUSTED_DEVICE";
                const isPinLockout = flag.kind === "PIN_LOCKOUT";

                return (
                  <div
                    key={flag.id}
                    className="p-3.5 rounded-xl bg-white/95 backdrop-blur-xs border border-rose-200 shadow-2xs space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isUntrusted
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : isPinLockout
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-purple-100 text-purple-900 border border-purple-200"
                          }`}
                        >
                          {isUntrusted
                            ? "⛔ Perangkat Asing / Bukan HP Mentor"
                            : isPinLockout
                            ? "🔒 PIN Terkunci (Salah 5 Kali)"
                            : "⚠️ Pakai Ulang Tautan"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {new Date(flag.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-black text-slate-900">
                          {flag.studentName}{" "}
                          <span className="text-[11px] font-semibold text-slate-500">
                            (NISN: {flag.nisn})
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-600 font-medium">
                          {flag.dudiName} • Mentor: {flag.mentorName}
                        </p>
                      </div>

                      <p className="text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded-lg border border-rose-100 leading-snug font-medium">
                        {flag.meta?.note ||
                          flag.meta?.reason ||
                          "Percobaan persetujuan jurnal ditolak demi menjaga integritas validasi."}
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 italic">
                        Perlu ditinjau pembimbing
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAcknowledgeFlag(flag.id)}
                        disabled={isAcknowledgingFlag === flag.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {isAcknowledgingFlag === flag.id
                            ? "Menandai..."
                            : "Tandai Telah Ditinjau"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Overview KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Siswa */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                Siswa Binaan
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {summary.totalStudents}{" "}
              <span className="text-xs font-semibold text-slate-400">Siswa Aktif</span>
            </p>
          </div>

          {/* Card 2: Siswa Mengalami Drift (Anomali) */}
          <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xs ${
            summary.studentsWithDrift > 0
              ? "bg-rose-50/50 border-rose-200 text-rose-900"
              : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                summary.studentsWithDrift > 0 ? "text-rose-600" : "text-slate-400"
              }`}>
                Peringatan Drift
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                summary.studentsWithDrift > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"
              }`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black mt-2">
              {summary.studentsWithDrift}{" "}
              <span className="text-xs font-semibold opacity-75">Perlu Intervensi</span>
            </p>
          </div>

          {/* Card 3: Rata-Rata Ketercapaian Kelas */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                Rata-Rata Capaian CP
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {summary.averageCompetencyPercentage}%{" "}
              <span className="text-xs font-semibold text-slate-400">dari 792 JP</span>
            </p>
          </div>

          {/* Card 4: Anomali Tertinggi */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                Rincian Anomali
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs font-bold">
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                {summary.activeAlertsCount.nonCompetency} Overload
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                {summary.activeAlertsCount.skillMonotony} Stagnasi
              </span>
            </div>
          </div>
        </div>

        {/* 3. Panel Prioritas Intervensi (Competency Drift Alert Cards) */}
        {priorityAlerts.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h2 className="text-sm font-extrabold text-slate-900">
                  Panel Prioritas Intervensi Pembimbing ({priorityAlerts.length} Anomali Terdeteksi)
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Diurutkan berdasarkan tingkat urgensi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {priorityAlerts.map(({ student, alert }) => {
                const isOverload = alert.alertType === "NON_COMPETENCY_OVERLOAD";
                const isMonotony = alert.alertType === "SKILL_MONOTONY";

                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border space-y-2.5 transition ${
                      isOverload
                        ? "bg-rose-50/40 border-rose-200"
                        : isMonotony
                        ? "bg-amber-50/40 border-amber-200"
                        : "bg-purple-50/40 border-purple-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-extrabold text-xs text-slate-900">{student.fullName}</p>
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          {student.placement.dudiName}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isOverload
                            ? "bg-rose-100 text-rose-800"
                            : isMonotony
                            ? "bg-amber-100 text-amber-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {isOverload
                          ? "Overload Non-Kejuruan"
                          : isMonotony
                          ? "Stagnasi Materi"
                          : "Validasi Tertunda"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-snug">
                      {alert.metricSnapshot.detectedReason || "Terdeteksi deviasi ketercapaian kompetensi."}
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100/80">
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(student)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Lihat Jam Kerja →
                      </button>

                      <button
                        type="button"
                        onClick={() => openInterventionModal(student, alert)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tindak Lanjuti / Rotasi →</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Filter & Search Strip */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari siswa atau DUDI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Filter DUDI Dropdown */}
            {dudiOptions.length > 0 && (
              <select
                value={selectedDudi}
                onChange={(e) => setSelectedDudi(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="ALL">Semua Mitra DUDI ({dudiOptions.length})</option>
                {dudiOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Toggle Drift Only Filter */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDriftOnlyFilter((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                driftOnlyFilter
                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Hanya yang Bermasalah (Drift)</span>
            </button>
          </div>
        </div>

        {/* 5. Interactive Competency Heatmap Matrix (Desktop & Mobile) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Matriks Ketercapaian Capaian Pembelajaran ({filteredStudents.length} Siswa)
              </h2>
              <p className="text-[11px] text-slate-500">
                Pewarnaan sel memenuhi pedoman WCAG AA (Ikon + Angka + Persentase Capaian)
              </p>
            </div>

            {/* Legend Indicators */}
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" /> 0% Belum
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300 inline-block" /> 1–74% Berjalan
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> ≥75% Tuntas
              </span>
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Drift
              </span>
            </div>
          </div>

          {/* Desktop Matrix Table (>= lg) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider w-64 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    Siswa & Lokasi DUDI
                  </th>
                  {cpElements.map((cp) => (
                    <th key={cp.id} className="py-3 px-3 font-bold text-center min-w-[130px] border-r border-slate-100">
                      <p className="font-mono text-[10px] text-blue-600 font-extrabold">{cp.code}</p>
                      <p className="text-[11px] text-slate-800 line-clamp-1 font-bold mt-0.5" title={cp.title}>
                        {cp.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-normal">Target: {cp.targetJp} JP</p>
                    </th>
                  ))}
                  <th className="py-3 px-4 font-bold text-center w-36">
                    Total Capaian
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={cpElements.length + 2} className="py-12 text-center text-slate-400">
                      Tidak ada data siswa yang memenuhi filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.studentId}
                      onClick={() => setSelectedStudent(student)}
                      className={`hover:bg-blue-50/30 transition cursor-pointer ${
                        student.hasDriftWarning ? "bg-rose-50/20" : ""
                      }`}
                    >
                      {/* Fixed Left Column: Student Profile */}
                      <td className="py-3 px-4 sticky left-0 bg-white hover:bg-slate-50/90 z-10 border-r border-slate-200">
                        <div className="flex items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{student.fullName}</span>
                              {student.hasDriftWarning && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Siswa Mengalami Anomali Drift" />
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-[170px]">{student.placement.dudiName}</span>
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {student.nisn.slice(-4)}
                          </span>
                        </div>
                      </td>

                      {/* CP Element Cells */}
                      {student.cpProgress.map((cp) => {
                        const isAchieved = cp.status === "ACHIEVED";
                        const isInProgress = cp.status === "IN_PROGRESS";

                        return (
                          <td
                            key={cp.cpElementId}
                            className="py-2.5 px-2 text-center border-r border-slate-100"
                          >
                            <div
                              className={`p-2 rounded-xl text-center space-y-0.5 transition ${
                                isAchieved
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : isInProgress
                                  ? "bg-amber-50 text-amber-900 border border-amber-200"
                                  : "bg-slate-50 text-slate-400 border border-slate-100"
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                {isAchieved ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ) : isInProgress ? (
                                  <Clock className="w-3 h-3 text-amber-600" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                )}
                                <span className="font-extrabold text-xs">{cp.percentage}%</span>
                              </div>
                              <p className="text-[10px] font-semibold opacity-75">
                                {cp.verifiedJp}/{cp.targetJp} JP
                              </p>
                            </div>
                          </td>
                        );
                      })}

                      {/* Total Overall Progress Column */}
                      <td className="py-3 px-4 text-center">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-800">{student.overallPercentage}%</span>
                            <span className="text-slate-500 font-mono text-[10px]">
                              {student.totalVerifiedJp} JP
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                student.hasDriftWarning
                                  ? "bg-rose-500"
                                  : student.overallPercentage >= 75
                                  ? "bg-emerald-500"
                                  : "bg-blue-600"
                              }`}
                              style={{ width: `${Math.min(100, student.overallPercentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card Feed (< lg) */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada data siswa yang memenuhi filter ini.
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.studentId}
                  onClick={() => setSelectedStudent(student)}
                  className="p-4 space-y-3 hover:bg-slate-50/50 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{student.fullName}</span>
                        {student.hasDriftWarning && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            Drift Warning
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{student.placement.dudiName}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900">
                        {student.overallPercentage}%
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {student.totalVerifiedJp}/792 JP
                      </p>
                    </div>
                  </div>

                  {/* Mobile mini CP pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {student.cpProgress.map((cp) => (
                      <div
                        key={cp.cpElementId}
                        className={`p-2 rounded-xl text-xs space-y-0.5 border ${
                          cp.status === "ACHIEVED"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : cp.status === "IN_PROGRESS"
                            ? "bg-amber-50 border-amber-200 text-amber-900"
                            : "bg-slate-50 border-slate-100 text-slate-400"
                        }`}
                      >
                        <p className="text-[10px] font-mono font-bold truncate">{cp.code}</p>
                        <div className="flex items-center justify-between font-extrabold">
                          <span>{cp.percentage}%</span>
                          <span className="text-[10px] font-normal opacity-80">{cp.verifiedJp} JP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL DETAIL SISWA & BREAKDOWN DISTRIBUSI JAM
         ───────────────────────────────────────────────────────────────────────────── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Rincian Pengawasan Siswa
                </span>
                <h3 className="font-extrabold text-base text-slate-900">{selectedStudent.fullName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profil & Penempatan DUDI */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">NISN:</span>
                <span className="font-mono font-bold text-slate-800">{selectedStudent.nisn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">Tempat Magang:</span>
                <span className="font-bold text-slate-800">{selectedStudent.placement.dudiName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">Mentor Industri:</span>
                <span className="font-medium text-slate-700">
                  {selectedStudent.placement.mentorName}{" "}
                  {selectedStudent.placement.mentorPhone && `(${selectedStudent.placement.mentorPhone})`}
                </span>
              </div>
            </div>

            {/* Workload Breakdown: Teknis vs Tombol Jujur Non-Kompetensi */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Distribusi Jam Kerja 14 Hari Terakhir:
              </p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                  <p className="text-[10px] font-bold uppercase">Jam Teknis Kejuruan</p>
                  <p className="text-lg font-black mt-0.5">
                    {selectedStudent.totalJpLast14Days - selectedStudent.nonCompetencyJpLast14Days} JP
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${
                  selectedStudent.nonCompetencyJpLast14Days > 0
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-slate-50 border-slate-100 text-slate-600"
                }`}>
                  <p className="text-[10px] font-bold uppercase">Tugas Non-Kejuruan (Tombol Jujur)</p>
                  <p className="text-lg font-black mt-0.5">
                    {selectedStudent.nonCompetencyJpLast14Days} JP
                  </p>
                </div>
              </div>
            </div>

            {/* Rincian per Elemen CP */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Capaian Tiap Elemen CP (dari Target 792 JP):
              </p>
              <div className="space-y-2">
                {selectedStudent.cpProgress.map((cp) => (
                  <div
                    key={cp.cpElementId}
                    className="p-3 rounded-xl border border-slate-100 bg-white text-xs space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{cp.title}</span>
                      <span
                        className={`font-black px-2 py-0.5 rounded text-[10px] ${
                          cp.status === "ACHIEVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : cp.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {cp.percentage}% ({cp.verifiedJp}/{cp.targetJp} JP)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cp.percentage >= 75 ? "bg-emerald-500" : "bg-blue-600"
                        }`}
                        style={{ width: `${Math.min(100, cp.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  const st = selectedStudent;
                  setSelectedStudent(null);
                  openInterventionModal(st);
                }}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Buka Smart Intervention Dispatcher & Rotasi (FR-009)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          MODAL 2: Smart Intervention Dispatcher & Mid-Term Rotation (FR-009)
          ───────────────────────────────────────────────────────────────────────── */}
      {interventionStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 space-y-5 my-8">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Smart Intervention Dispatcher
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Bimbingan & Rotasi Mitra untuk <span className="font-bold text-slate-800">{interventionStudent.fullName}</span> ({interventionStudent.nisn})
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInterventionStudent(null);
                  setInterventionSuccessMsg(null);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner Sukses Jika Aksi Berhasil */}
            {interventionSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Aksi Berhasil Diproses!</p>
                  <p>{interventionSuccessMsg}</p>
                </div>
              </div>
            )}

            {/* Profil Singkat Penempatan Saat Ini */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mitra DUDI Aktif:</p>
                  <p className="font-extrabold text-slate-800 text-sm">{interventionStudent.placement.dudiName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mentor Pembimbing:</p>
                  <p className="font-bold text-slate-800">
                    {interventionStudent.placement.mentorName}{" "}
                    <span className="font-mono text-emerald-600 font-semibold">({interventionStudent.placement.mentorPhone || "WA Siap"})</span>
                  </p>
                </div>
              </div>
              {interventionAlert && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pemicu Anomali:</span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                    {interventionAlert.alertType}
                  </span>
                  <span className="text-[11px] text-slate-600 truncate">
                    {interventionAlert.metricSnapshot.detectedReason}
                  </span>
                </div>
              )}
            </div>

            {/* Navigasi Tab Tipe Intervensi */}
            <div className="flex border-b border-slate-200 gap-2">
              <button
                type="button"
                onClick={() => setInterventionTab("WA_COORDINATION")}
                className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  interventionTab === "WA_COORDINATION"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Koordinasi WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setInterventionTab("SITE_VISIT")}
                className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  interventionTab === "SITE_VISIT"
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Kunjungan Lapangan</span>
              </button>

              <button
                type="button"
                onClick={() => setInterventionTab("DUDI_ROTATION")}
                className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  interventionTab === "DUDI_ROTATION"
                    ? "border-amber-600 text-amber-700"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                <Repeat className="w-4 h-4" />
                <span>Rotasi Mitra (TC-009)</span>
              </button>
            </div>

            {/* Tab 1: Koordinasi WhatsApp */}
            {interventionTab === "WA_COORDINATION" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Draf Pesan Koordinasi Otomatis (Data-Driven):</span>
                  <span className="text-slate-400 text-[11px] font-medium">Bisa disunting sebelum kirim</span>
                </div>

                <div className="relative">
                  {isDraftLoading ? (
                    <div className="h-44 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Menyusun pesan sopan berbasis data capaian...
                    </div>
                  ) : (
                    <textarea
                      rows={7}
                      value={draftMessage}
                      onChange={(e) => setDraftMessage(e.target.value)}
                      className="w-full text-xs p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed text-slate-800 resize-none"
                      placeholder="Draf pesan koordinasi..."
                    />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500">
                    Format nomor tujuan: <span className="font-mono font-bold">{interventionStudent.placement.mentorPhone || "08..."}</span>
                  </span>

                  <button
                    type="button"
                    disabled={isSubmittingIntervention || !draftMessage.trim()}
                    onClick={handleSendWaIntervention}
                    className="w-full sm:w-auto h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingIntervention ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mencatat Intervensi...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Kirim via WhatsApp & Catat Intervensi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Kunjungan Lapangan (Site Visit) */}
            {interventionTab === "SITE_VISIT" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Rencana Supervisi:
                    </label>
                    <input
                      type="date"
                      value={siteVisitDate}
                      onChange={(e) => setSiteVisitDate(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lokasi Kunjungan:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${interventionStudent.placement.dudiName}`}
                      className="w-full text-xs p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Agenda Pembahasan / Catatan Bimbingan:
                  </label>
                  <textarea
                    rows={4}
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-slate-800 resize-none"
                    placeholder="Contoh: Evaluasi langsung penugasan teknis dengan pimpinan unit, sinkronisasi jadwal rotasi pekerjaan..."
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={isSubmittingIntervention}
                    onClick={handleRecordSiteVisit}
                    className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingIntervention ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyimpan Jadwal...</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Simpan Jadwal Kunjungan Lapangan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Rotasi Mitra DUDI Tengah Semester (TC-009) */}
            {interventionTab === "DUDI_ROTATION" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <Repeat className="w-4 h-4" />
                    <span>Prinsip Rotasi Mitra Berkelanjutan (Aturan Bisnis BR-010 & TC-009)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-900/90">
                    Siswa telah mengumpulkan <span className="font-extrabold">{interventionStudent.totalVerifiedJp} JP</span> terverifikasi di <span className="font-bold">{interventionStudent.placement.dudiName}</span>. 
                    Saat rotasi dieksekusi, status penempatan lama menjadi <span className="font-mono font-bold">ROTATED_OUT</span>, seluruh jam tetap tersimpan utuh di e-Rapor dan CV ATS, serta kedua mitra DUDI akan tercantum resmi pada portofolio karier siswa.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilih Mitra DUDI Tujuan Baru:
                    </label>
                    <select
                      value={targetDudiId}
                      onChange={(e) => setTargetDudiId(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-800 cursor-pointer"
                    >
                      <option value="">-- Pilih Mitra DUDI Pelengkap --</option>
                      {dudiOptions
                        .filter((d) => d.id !== interventionStudent.placement.dudiId)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} (Kapasitas Elemen Tersedia)
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alasan Rotasi Resmi (Audit Trail):
                    </label>
                    <textarea
                      rows={3}
                      value={rotationReason}
                      onChange={(e) => setRotationReason(e.target.value)}
                      placeholder="Contoh: Pemenuhan kompetensi pengujian QA dan Cloud CI/CD yang tidak tersedia di DUDI pertama."
                      className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans text-slate-800 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={isSubmittingIntervention || !targetDudiId}
                    onClick={handleExecuteRotation}
                    className="h-12 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingIntervention ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Memproses Rotasi...</span>
                      </>
                    ) : (
                      <>
                        <Repeat className="w-4 h-4" />
                        <span>Konfirmasi Eksekusi Rotasi Mitra DUDI (TC-009)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
