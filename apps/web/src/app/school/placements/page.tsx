"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Users,
  MapPin,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  RefreshCw,
  Search,
  Check,
  X,
  UserCheck,
} from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import {
  fetchPlacementCandidates,
  fetchPlacements,
  createPlacement,
  batchCreatePlacements,
  updateStudentCoordinates,
  type PlacementCandidateData,
  type PlacementCandidateStudent,
  type PlacementRecordItem,
} from "@/lib/api";
import { matchPlacementsGreedy } from "@vokalink/core";

// Mock Fallback jika backend offline / demo awal
const MOCK_DATA: PlacementCandidateData = {
  period: { id: "p-1", name: "PKL Genap 2025/2026", targetTotalJp: 792 },
  schoolCoordinates: { latitude: -7.2575, longitude: 112.7521 },
  teachers: [
    { id: "t-1", fullName: "Dra. Siti Rahayu, M.Pd", identityNumber: "198001012005012001" },
    { id: "t-2", fullName: "Bambang Sutrisno, S.T", identityNumber: "198203152008011002" },
  ],
  dudis: [
    {
      id: "d-1",
      name: "PT Inovasi Digital Nusantara",
      sectorCategory: "Teknologi Informasi & Software",
      address: "Jl. Pemuda No. 45, Embong Kaliasin",
      city: "Surabaya",
      latitude: -7.2625,
      longitude: 112.7483,
      maxQuota: 6,
      activePlacementsCount: 3,
      remainingQuota: 3,
      mentors: [
        { id: "m-1", fullName: "Hendra Wijaya, S.Kom", jobTitle: "Lead Engineer", isBound: true },
      ],
    },
    {
      id: "d-2",
      name: "Studio Desain Kreasi Visual",
      sectorCategory: "Desain Komunikasi Visual & Kreatif",
      address: "Jl. Basuki Rahmat No. 12",
      city: "Surabaya",
      latitude: -7.268,
      longitude: 112.742,
      maxQuota: 4,
      activePlacementsCount: 2,
      remainingQuota: 2,
      mentors: [
        { id: "m-2", fullName: "Maya Anggraini, S.Ds", jobTitle: "Creative Director", isBound: true },
      ],
    },
    {
      id: "d-3",
      name: "CV Bengkel Mesin Presisi",
      sectorCategory: "Teknik Mesin & Otomasi",
      address: "Kawasan Industri Rungkut Megah Blok B-4",
      city: "Surabaya",
      latitude: -7.325,
      longitude: 112.768,
      maxQuota: 2,
      activePlacementsCount: 2,
      remainingQuota: 0, // Kuota penuh
      mentors: [],
    },
  ],
  students: [
    {
      studentId: "s-1",
      fullName: "Ahmad Rizky Pratama",
      identityNumber: "0012345678",
      department: { id: "dept-rpl", name: "Rekayasa Perangkat Lunak" },
      hasCustomCoordinates: true,
      homeLatitude: -7.26,
      homeLongitude: 112.753,
      isPlaced: false,
      activePlacementId: null,
      recommendations: [
        {
          dudiId: "d-1",
          dudiName: "PT Inovasi Digital Nusantara",
          totalScore: 94.2,
          competencyScore: 91.7,
          distanceScore: 100,
          distanceKm: 0.85,
          requiresMidtermRotation: false,
          remainingQuota: 3,
        },
        {
          dudiId: "d-2",
          dudiName: "Studio Desain Kreasi Visual",
          totalScore: 61.4,
          competencyScore: 45.0,
          distanceScore: 99.5,
          distanceKm: 1.5,
          requiresMidtermRotation: true,
          remainingQuota: 2,
        },
      ],
      bestRecommendation: {
        dudiId: "d-1",
        dudiName: "PT Inovasi Digital Nusantara",
        totalScore: 94.2,
        competencyScore: 91.7,
        distanceScore: 100,
        distanceKm: 0.85,
        requiresMidtermRotation: false,
        remainingQuota: 3,
      },
    },
    {
      studentId: "s-2",
      fullName: "Dewi Sekar Sari",
      identityNumber: "0012345679",
      department: { id: "dept-rpl", name: "Rekayasa Perangkat Lunak" },
      hasCustomCoordinates: false,
      homeLatitude: -7.2575,
      homeLongitude: 112.7521,
      isPlaced: false,
      activePlacementId: null,
      recommendations: [
        {
          dudiId: "d-1",
          dudiName: "PT Inovasi Digital Nusantara",
          totalScore: 93.5,
          competencyScore: 91.7,
          distanceScore: 97.8,
          distanceKm: 0.95,
          requiresMidtermRotation: false,
          remainingQuota: 3,
        },
        {
          dudiId: "d-2",
          dudiName: "Studio Desain Kreasi Visual",
          totalScore: 59.8,
          competencyScore: 42.5,
          distanceScore: 100,
          distanceKm: 1.2,
          requiresMidtermRotation: true,
          remainingQuota: 2,
        },
      ],
      bestRecommendation: {
        dudiId: "d-1",
        dudiName: "PT Inovasi Digital Nusantara",
        totalScore: 93.5,
        competencyScore: 91.7,
        distanceScore: 97.8,
        distanceKm: 0.95,
        requiresMidtermRotation: false,
        remainingQuota: 3,
      },
    },
  ],
};

export default function SmartPlacementPage() {
  const [activeTab, setActiveTab] = useState<"RECOMMENDATIONS" | "ACTIVE_LIST">("RECOMMENDATIONS");

  // State data
  const [data, setData] = useState<PlacementCandidateData>(MOCK_DATA);
  const [activePlacements, setActivePlacements] = useState<PlacementRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Pencarian
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Penempatan Tunggal
  const [assignModalStudent, setAssignModalStudent] = useState<PlacementCandidateStudent | null>(null);
  const [chosenDudiId, setChosenDudiId] = useState<string>("");
  const [chosenTeacherId, setChosenTeacherId] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [submittingPlacement, setSubmittingPlacement] = useState(false);

  // Modal Titik Lokasi Siswa
  const [coordModalStudent, setCoordModalStudent] = useState<PlacementCandidateStudent | null>(null);
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [savingCoord, setSavingCoord] = useState(false);

  // Modal Batch Auto-Greedy
  const [isBatchPreviewOpen, setIsBatchPreviewOpen] = useState(false);
  const [submittingBatch, setSubmittingBatch] = useState(false);

  const schoolId = "00000000-0000-0000-0000-000000000002"; // ID Demo Sandbox

  // Muat data dari API
  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const candidates = await fetchPlacementCandidates(
        schoolId,
        selectedDeptId !== "ALL" ? selectedDeptId : undefined
      );
      setData(candidates);

      const records = await fetchPlacements(schoolId);
      setActivePlacements(records);
    } catch (err: any) {
      console.warn("API Error, using fallback seed data:", err);
      // Data fallback MOCK_DATA tetap dipakai jika API belum terhubung
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDeptId]);

  // Daftar jurusan unik untuk filter
  const departmentsList = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of data.students) {
      if (s.department) {
        map.set(s.department.id, s.department.name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data.students]);

  // Siswa belum ditempatkan yang difilter
  const unplacedStudents = useMemo(() => {
    return data.students.filter((s) => {
      if (s.isPlaced) return false;
      if (selectedDeptId !== "ALL" && s.department?.id !== selectedDeptId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.fullName.toLowerCase().includes(q) ||
          s.identityNumber.toLowerCase().includes(q) ||
          (s.department?.name.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [data.students, selectedDeptId, searchQuery]);

  // Rekomendasi Greedy Massal untuk Preview
  const greedyMatchResult = useMemo(() => {
    const candidateStudents = unplacedStudents.map((s) => ({
      studentId: s.studentId,
      name: s.fullName,
      homeLatitude: s.homeLatitude,
      homeLongitude: s.homeLongitude,
    }));

    const candidateDudis = data.dudis.map((d) => ({
      dudiId: d.id,
      name: d.name,
      latitude: d.latitude,
      longitude: d.longitude,
      remainingQuota: d.remainingQuota,
      supportedCpJp: 600, // Default kalkulasi estimasi
    }));

    return matchPlacementsGreedy(
      candidateStudents,
      candidateDudis,
      data.period?.targetTotalJp ?? 792
    );
  }, [unplacedStudents, data.dudis, data.period]);

  // Buka Modal Penempatan Tunggal
  const handleOpenAssignModal = (student: PlacementCandidateStudent) => {
    setAssignModalStudent(student);
    const bestDudi = student.bestRecommendation?.dudiId || data.dudis[0]?.id || "";
    setChosenDudiId(bestDudi);
    setChosenTeacherId(data.teachers[0]?.id || "");
    setOverrideReason("");
  };

  // Submit Penempatan Tunggal
  const handleConfirmPlacement = async () => {
    if (!assignModalStudent || !chosenDudiId || !chosenTeacherId) return;

    setSubmittingPlacement(true);
    setErrorMsg(null);
    try {
      await createPlacement(schoolId, {
        studentId: assignModalStudent.studentId,
        dudiPartnerId: chosenDudiId,
        teacherId: chosenTeacherId,
        overrideReason: overrideReason.trim() ? overrideReason.trim() : undefined,
      });

      setSuccessMsg(`Berhasil menempatkan ${assignModalStudent.fullName}!`);
      setAssignModalStudent(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengonfirmasi penempatan.");
    } finally {
      setSubmittingPlacement(false);
    }
  };

  // Submit Penugasan Massal (Batch Auto-Greedy)
  const handleConfirmBatchAssignment = async () => {
    if (greedyMatchResult.assigned.length === 0) return;
    const defaultTeacherId = data.teachers[0]?.id;
    if (!defaultTeacherId) {
      setErrorMsg("Belum ada guru pembimbing yang terdaftar di sekolah.");
      return;
    }

    setSubmittingBatch(true);
    setErrorMsg(null);
    try {
      const payload = {
        placements: greedyMatchResult.assigned.map((a) => ({
          studentId: a.studentId,
          dudiPartnerId: a.dudiId,
          teacherId: defaultTeacherId,
        })),
      };

      await batchCreatePlacements(schoolId, payload);
      setSuccessMsg(`Sukses! ${greedyMatchResult.assigned.length} siswa berhasil ditempatkan massal.`);
      setIsBatchPreviewOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal melakukan penempatan massal.");
    } finally {
      setSubmittingBatch(false);
    }
  };

  // Simpan koordinat domisili siswa
  const handleSaveStudentCoordinates = async () => {
    if (!coordModalStudent) return;
    const latNum = parseFloat(editLat);
    const lngNum = parseFloat(editLng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      setErrorMsg("Koordinat latitude dan longitude harus berupa angka valid.");
      return;
    }

    setSavingCoord(true);
    try {
      await updateStudentCoordinates(schoolId, coordModalStudent.studentId, {
        homeLatitude: latNum,
        homeLongitude: lngNum,
      });
      setSuccessMsg(`Koordinat domisili ${coordModalStudent.fullName} berhasil diperbarui.`);
      setCoordModalStudent(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memperbarui koordinat domisili siswa.");
    } finally {
      setSavingCoord(false);
    }
  };

  // Ambil GPS perangkat untuk modal koordinat siswa
  const handleGetStudentGps = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setEditLat(pos.coords.latitude.toFixed(6));
          setEditLng(pos.coords.longitude.toFixed(6));
        },
        () => {
          setErrorMsg("Izin sensor GPS ditolak. Silakan masukkan koordinat secara manual.");
        }
      );
    }
  };

  return (
    <div className="space-y-6">
        {/* Breadcrumb & Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/school/dashboard"
                className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600" /> FR-004 Smart Placement
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {data.period?.name || "Periode Aktif"}
                </span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Penempatan Cerdas & Kesesuaian Spasial
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Algoritma pencocokan multi-kriteria berbasis bobot kompetensi kurikulum (70%) dan efisiensi jarak Haversine (30%) tanpa API berbayar.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsBatchPreviewOpen(true)}
              disabled={unplacedStudents.length === 0}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition flex items-center gap-2 min-h-[48px]"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              Auto-Greedy Massal ({unplacedStudents.length})
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition min-h-[48px] min-w-[48px] flex items-center justify-center"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Feedback Alert Banners */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed font-semibold">{successMsg}</div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Switcher & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("RECOMMENDATIONS")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 min-h-[44px] ${
                activeTab === "RECOMMENDATIONS"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Siswa Belum Ditempatkan ({unplacedStudents.length})
            </button>
            <button
              onClick={() => setActiveTab("ACTIVE_LIST")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 min-h-[44px] ${
                activeTab === "ACTIVE_LIST"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Penempatan Aktif ({activePlacements.length})
            </button>
          </div>

          {activeTab === "RECOMMENDATIONS" && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari siswa atau NISN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Filter Jurusan */}
              <div className="relative">
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">Semua Jurusan</option>
                  {departmentsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Penempatan Cerdas (Recommendations) */}
        {activeTab === "RECOMMENDATIONS" && (
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5 bg-white rounded-3xl border border-slate-200 space-y-3">
                    <Skeleton width="40%" height="24px" />
                    <Skeleton width="100%" height="60px" />
                    <Skeleton width="70%" height="20px" />
                  </div>
                ))}
              </div>
            ) : unplacedStudents.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Semua Siswa Telah Ditempatkan!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Tidak ada siswa pada jurusan ini yang berstatus belum memiliki tempat magang aktif. Anda dapat memantau penempatan di tab Penempatan Aktif.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {unplacedStudents.map((student) => {
                  const best = student.bestRecommendation;
                  const isLowCoverage = best?.requiresMidtermRotation ?? false;

                  return (
                    <div
                      key={student.studentId}
                      className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition flex flex-col md:flex-row md:items-center justify-between gap-5"
                    >
                      {/* Kolom Informasi Siswa & Domisili */}
                      <div className="space-y-2 md:w-1/3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {student.department?.name || "Jurusan"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            NISN {student.identityNumber}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                          {student.fullName}
                        </h3>

                        {/* Status Koordinat Domisili Siswa */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {student.hasCustomCoordinates
                              ? `Domisili: (${student.homeLatitude.toFixed(4)}, ${student.homeLongitude.toFixed(4)})`
                              : "Domisili: Titik Tengah Sekolah (Default)"}
                          </span>
                          <button
                            onClick={() => {
                              setCoordModalStudent(student);
                              setEditLat(student.homeLatitude.toString());
                              setEditLng(student.homeLongitude.toString());
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:underline ml-1 shrink-0"
                          >
                            Ubah
                          </button>
                        </div>
                      </div>

                      {/* Kolom Rekomendasi Teratas ($S_{total}$) */}
                      <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Rekomendasi Teratas (Peringkat #1)
                          </span>
                          {best && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400 font-semibold">Skor Total:</span>
                              <span className="text-sm font-black text-blue-600 font-mono">
                                {best.totalScore}
                              </span>
                            </div>
                          )}
                        </div>

                        {best ? (
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {best.dudiName}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  best.remainingQuota > 0
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                Sisa Kuota: {best.remainingQuota} siswa
                              </span>
                            </div>

                            {/* Indikator Skor: Kompetensi & Spasial Haversine */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2 bg-white rounded-xl border border-slate-200">
                                <span className="text-[10px] text-slate-400 block font-semibold">
                                  Cakupan CP (70%)
                                </span>
                                <span className="font-extrabold text-slate-800 font-mono">
                                  {best.competencyScore}%
                                </span>
                              </div>
                              <div className="p-2 bg-white rounded-xl border border-slate-200">
                                <span className="text-[10px] text-slate-400 block font-semibold">
                                  Jarak Spasial (30%)
                                </span>
                                <span className="font-extrabold text-slate-800 font-mono">
                                  {best.distanceKm} km (Skor {best.distanceScore})
                                </span>
                              </div>
                            </div>

                            {/* Lencana Peringatan Kuning WCAG AA bila Cakupan < 50% */}
                            {isLowCoverage && (
                              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <span>
                                  <strong>Wajib Rotasi Tengah Semester:</strong> Cakupan kompetensi DUDI ini hanya {best.competencyScore}%. Siswa membutuhkan rotasi mitra di paruh kedua PKL.
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            Belum ada mitra DUDI yang terdaftar untuk jurusan ini.
                          </p>
                        )}
                      </div>

                      {/* Aksi Konfirmasi */}
                      <div className="shrink-0 flex items-center justify-end">
                        <button
                          onClick={() => handleOpenAssignModal(student)}
                          className="w-full md:w-auto px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 min-h-[48px]"
                        >
                          Tempatkan Siswa
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Daftar Penempatan Aktif */}
        {activeTab === "ACTIVE_LIST" && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {activePlacements.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-sm">Belum ada penempatan aktif</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Gunakan tab Penempatan Cerdas untuk menempatkan siswa ke mitra DUDI berdasarkan rekomendasi skor.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activePlacements.map((p) => (
                  <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                        {p.requiresMidtermRotation && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Wajib Rotasi
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                          NISN {p.student.identityNumber}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {p.student.fullName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {p.student.schoolDepartment?.name || "Jurusan"} · Guru Pembimbing: <strong>{p.teacher.fullName}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 sm:text-right">
                      <div>
                        <span className="font-extrabold text-slate-900 block text-sm">
                          {p.dudiPartner.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {p.dudiPartner.city} · {p.distanceKm} km
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-100 text-center min-w-[70px]">
                        <span className="text-[9px] text-slate-400 block font-semibold">Skor Total</span>
                        <span className="text-xs font-black text-blue-700 font-mono">
                          {p.compatibilityScore}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Modal 1: Konfirmasi Penempatan Siswa (Tunggal) */}
      {assignModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Konfirmasi Penempatan Siswa</h3>
                <p className="text-xs text-slate-500">{assignModalStudent.fullName}</p>
              </div>
              <button
                onClick={() => setAssignModalStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Pilihan DUDI */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Mitra DUDI *</label>
                <select
                  value={chosenDudiId}
                  onChange={(e) => setChosenDudiId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {assignModalStudent.recommendations.map((r, idx) => (
                    <option key={r.dudiId} value={r.dudiId}>
                      #{idx + 1} {r.dudiName} (Skor: {r.totalScore} | Sisa Kuota: {r.remainingQuota})
                    </option>
                  ))}
                  {/* DUDI lain di luar rekomendasi */}
                  {data.dudis
                    .filter((d) => !assignModalStudent.recommendations.some((r) => r.dudiId === d.id))
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (Sisa Kuota: {d.remainingQuota})
                      </option>
                    ))}
                </select>
              </div>

              {/* Pilihan Guru Pembimbing */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Guru Pembimbing (TEACHER) *</label>
                <select
                  value={chosenTeacherId}
                  onChange={(e) => setChosenTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {data.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} (NIP: {t.identityNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* A1 Manual Override Reason */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Catatan / Alasan Penempatan Manual (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Isi jika menempatkan siswa pada kuota tambahan khusus atau alasan diskresi pokja PKL..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignModalStudent(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPlacement}
                disabled={submittingPlacement || !chosenDudiId || !chosenTeacherId}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 min-h-[44px] flex items-center gap-1.5"
              >
                {submittingPlacement ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Konfirmasi Penempatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Koordinat Domisili Siswa */}
      {coordModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Titik Lokasi Domisili</h3>
                <p className="text-xs text-slate-500">{coordModalStudent.fullName}</p>
              </div>
              <button onClick={() => setCoordModalStudent(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Titik koordinat digunakan untuk menghitung jarak spasial Haversine ke lokasi mitra DUDI.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={editLat}
                  onChange={(e) => setEditLat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={editLng}
                  onChange={(e) => setEditLng(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleGetStudentGps}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Compass className="w-4 h-4 text-emerald-600" />
                Ambil dari GPS Perangkat Saat Ini
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCoordModalStudent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStudentCoordinates}
                disabled={savingCoord}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 min-h-[44px]"
              >
                {savingCoord ? "Menyimpan..." : "Simpan Koordinat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Preview Auto-Greedy Massal */}
      {isBatchPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Pratinjau Penugasan Otomatis Massal
                </h3>
                <p className="text-xs text-slate-500">
                  Algoritma Greedy dengan Penegakan Batas Kuota DUDI
                </p>
              </div>
              <button onClick={() => setIsBatchPreviewOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Sistem akan menugaskan <strong>{greedyMatchResult.assigned.length} siswa</strong> secara instan ke mitra DUDI terbaik yang kuotanya masih tersedia.
              </p>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                {greedyMatchResult.assigned.map((a) => (
                  <div key={a.studentId} className="p-3 text-xs flex items-center justify-between gap-3">
                    <div>
                      <span className="font-extrabold text-slate-900 block">{a.studentName}</span>
                      <span className="text-[10px] text-slate-400">Ke: {a.dudiName}</span>
                    </div>
                    <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded-lg">
                      Skor {a.score.totalScore}
                    </span>
                  </div>
                ))}
              </div>

              {greedyMatchResult.unassigned.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                  <strong>{greedyMatchResult.unassigned.length} siswa</strong> tidak dapat ditempatkan otomatis karena kuota seluruh DUDI pilihan telah habis.
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBatchPreviewOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchAssignment}
                disabled={submittingBatch || greedyMatchResult.assigned.length === 0}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 min-h-[44px] flex items-center gap-1.5"
              >
                {submittingBatch ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Terapkan Penugasan ({greedyMatchResult.assigned.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
