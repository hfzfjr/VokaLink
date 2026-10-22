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
} from "lucide-react";
import {
  fetchTeacherHeatmap,
  triggerEvaluateDriftAlerts,
} from "@/lib/api";
import type {
  HeatmapResponse,
  HeatmapStudentRow,
  DriftAlertItem,
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
  }, [loadHeatmapData]);

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

                    <div className="pt-1 flex items-center justify-between border-t border-slate-100/80">
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(student)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Lihat Rincian Jam →
                      </button>

                      {student.placement.mentorPhone && (
                        <a
                          href={`https://wa.me/${student.placement.mentorPhone.replace(/^0/, "62")}?text=${encodeURIComponent(
                            `Halo Bapak/Ibu ${student.placement.mentorName} dari ${student.placement.dudiName}, saya Guru Pembimbing dari ${student.fullName}. Mohon waktu koordinasi terkait capaian magang ananda.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Draf WA</span>
                        </a>
                      )}
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

            {/* Quick WA Action */}
            {selectedStudent.placement.mentorPhone && (
              <div className="pt-2">
                <a
                  href={`https://wa.me/${selectedStudent.placement.mentorPhone.replace(/^0/, "62")}?text=${encodeURIComponent(
                    `Halo Bapak/Ibu ${selectedStudent.placement.mentorName} dari ${selectedStudent.placement.dudiName}, saya Guru Pembimbing dari ${selectedStudent.fullName}. Mohon waktu koordinasi terkait capaian magang ananda.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Kirim Pesan Koordinasi WhatsApp ke Mentor</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
