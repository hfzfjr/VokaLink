"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  FileSpreadsheet,
  Edit3,
  Check,
  X,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Skeleton from "@/components/ui/Skeleton";
import {
  fetchEraporData,
  downloadEraporCsv,
  type EraporStudentRecord,
  type EraporSummaryResponse,
} from "@/lib/api";

// Fallback seed demo jika backend offline
const MOCK_ERAPOR_DATA: EraporSummaryResponse = {
  school: { id: "sch-1", name: "SMK Negeri 1 Surabaya" },
  totalStudents: 3,
  studentsWithPendingLogsCount: 1,
  warningMessage:
    "Terdapat 1 siswa yang masih memiliki jurnal belum divalidasi mentor. Selesaikan validasi terlebih dahulu agar nilai optimal.",
  records: [
    {
      placementId: "p-1",
      student: {
        id: "s-1",
        fullName: "Ahmad Rizky Pratama",
        identityNumber: "0012345678",
        department: { id: "dept-1", name: "Rekayasa Perangkat Lunak" },
      },
      dudiPartner: {
        id: "d-1",
        name: "PT Inovasi Digital Nusantara",
        city: "Surabaya",
      },
      teacher: {
        id: "t-1",
        fullName: "Dra. Siti Rahayu, M.Pd",
      },
      totalVerifiedJp: 792,
      pendingLogsCount: 0,
      elements: [
        {
          elementId: "el-1",
          elementCode: "RPL-CP-01",
          elementTitle: "Pemrograman Web & Mobile",
          targetJp: 450,
          verifiedJp: 450,
          autonomyScore: 95.2,
          score: 98.1,
        },
        {
          elementId: "el-2",
          elementCode: "RPL-CP-02",
          elementTitle: "Basis Data & Cloud",
          targetJp: 342,
          verifiedJp: 342,
          autonomyScore: 92.0,
          score: 96.8,
        },
      ],
      attitudeScore: 95,
      isAttitudeIncluded: true,
      finalGrade: 97.0,
      highestAchievement:
        "Menunjukkan penguasaan sangat baik dalam Implementasi REST API & Microservices secara mandiri di PT Inovasi Digital Nusantara, serta kompeten dalam Pemrograman Web & Mobile.",
      needsImprovement:
        "Mampu mempertahankan konsistensi capaian pembelajaran praktik kerja lapangan dengan baik di seluruh elemen kompetensi.",
    },
    {
      placementId: "p-2",
      student: {
        id: "s-2",
        fullName: "Dewi Sekar Sari",
        identityNumber: "0012345679",
        department: { id: "dept-1", name: "Rekayasa Perangkat Lunak" },
      },
      dudiPartner: {
        id: "d-1",
        name: "PT Inovasi Digital Nusantara",
        city: "Surabaya",
      },
      teacher: {
        id: "t-1",
        fullName: "Dra. Siti Rahayu, M.Pd",
      },
      totalVerifiedJp: 620,
      pendingLogsCount: 4,
      elements: [
        {
          elementId: "el-1",
          elementCode: "RPL-CP-01",
          elementTitle: "Pemrograman Web & Mobile",
          targetJp: 450,
          verifiedJp: 380,
          autonomyScore: 88.0,
          score: 85.9,
        },
        {
          elementId: "el-2",
          elementCode: "RPL-CP-02",
          elementTitle: "Basis Data & Cloud",
          targetJp: 342,
          verifiedJp: 240,
          autonomyScore: 78.5,
          score: 73.5,
        },
      ],
      attitudeScore: null,
      isAttitudeIncluded: false,
      finalGrade: 79.7,
      highestAchievement:
        "Menunjukkan penguasaan sangat baik dalam Slicing UI Responsif secara mandiri di PT Inovasi Digital Nusantara, serta kompeten dalam Pemrograman Web & Mobile.",
      needsImprovement:
        "Perlu peningkatan jam praktik dan bimbingan lebih lanjut dalam penguasaan elemen Basis Data & Cloud.",
    },
  ],
};

export default function EraporPage() {
  const [data, setData] = useState<EraporSummaryResponse>(MOCK_ERAPOR_DATA);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Modal Detail / Override A1
  const [detailStudent, setDetailStudent] = useState<EraporStudentRecord | null>(null);
  const [overrideGrade, setOverrideGrade] = useState<number>(0);
  const [overrideNote, setOverrideNote] = useState<string>("");
  const [overrideHighest, setOverrideHighest] = useState<string>("");
  const [overrideNeeds, setOverrideNeeds] = useState<string>("");

  const schoolId = "00000000-0000-0000-0000-000000000002"; // ID Demo Sandbox

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchEraporData(
        schoolId,
        selectedDeptId !== "ALL" ? { departmentId: selectedDeptId } : undefined
      );
      setData(res);
    } catch (err: any) {
      console.warn("API Error, using fallback mock data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDeptId]);

  // Daftar jurusan unik
  const departmentsList = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of data.records) {
      if (r.student.department) {
        map.set(r.student.department.id, r.student.department.name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data.records]);

  // Filter siswa
  const filteredRecords = useMemo(() => {
    return data.records.filter((r) => {
      if (selectedDeptId !== "ALL" && r.student.department?.id !== selectedDeptId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.student.fullName.toLowerCase().includes(q) ||
          r.student.identityNumber.toLowerCase().includes(q) ||
          r.dudiPartner.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data.records, selectedDeptId, searchQuery]);

  // Download CSV e-Rapor resmi
  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    setErrorMsg(null);
    try {
      const blob = await downloadEraporCsv(
        schoolId,
        selectedDeptId !== "ALL" ? { departmentId: selectedDeptId } : undefined
      );

      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `erapor-smk-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccessMsg("Berkas CSV e-Rapor SMK berhasil diunduh.");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengunduh berkas e-Rapor.");
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Buka Modal Detail & Override
  const handleOpenDetailModal = (record: EraporStudentRecord) => {
    setDetailStudent(record);
    setOverrideGrade(record.finalGrade);
    setOverrideNote("");
    setOverrideHighest(record.highestAchievement);
    setOverrideNeeds(record.needsImprovement);
  };

  // Simpan penyesuaian nilai manual A1 di sisi tampilan
  const handleSaveOverride = () => {
    if (!detailStudent) return;
    if (overrideGrade < 0 || overrideGrade > 100) {
      setErrorMsg("Nilai akhir harus antara 0 dan 100.");
      return;
    }

    setData((prev) => ({
      ...prev,
      records: prev.records.map((r) =>
        r.placementId === detailStudent.placementId
          ? {
              ...r,
              finalGrade: overrideGrade,
              highestAchievement: overrideHighest,
              needsImprovement: overrideNeeds,
            }
          : r
      ),
    }));

    setSuccessMsg(`Penyesuaian nilai untuk ${detailStudent.student.fullName} berhasil diterapkan.`);
    setDetailStudent(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Breadcrumb & Actions */}
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
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-700" /> FR-011 e-Rapor SMK
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  Kurikulum Merdeka Fase F
                </span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Rekap Nilai & Ekspor e-Rapor SMK
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Otomatisasi kalkulasi nilai akademik (60% jam capaian + 40% tingkat kemandirian) dan penyusunan kalimat deskripsi capaian kompetensi format CSV resmi.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadCsv}
              disabled={downloadingCsv || filteredRecords.length === 0}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 disabled:opacity-50 transition flex items-center gap-2 min-h-[48px]"
            >
              {downloadingCsv ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              )}
              Unduh CSV e-Rapor ({filteredRecords.length} Siswa)
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

        {/* Feedback Banners */}
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

        {/* Warning Banner Siswa dengan Log Pending (BR-009 / Validasi FR-011) */}
        {data.warningMessage && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Peringatan Verifikasi Logbook:</strong> {data.warningMessage}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari siswa, NISN, atau DUDI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs text-slate-500 font-semibold">Jurusan:</label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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

        {/* Tabel Data Rekap Nilai e-Rapor */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-2">
                  <Skeleton width="30%" height="24px" />
                  <Skeleton width="20%" height="24px" />
                  <Skeleton width="15%" height="24px" />
                  <Skeleton width="10%" height="24px" />
                </div>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-base">Tidak ada data siswa ditemukan</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Pastikan siswa telah memiliki penempatan aktif dan logbook yang telah diverifikasi mentor industri.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Siswa & NISN</th>
                    <th className="px-4 py-3.5">Tempat PKL (DUDI)</th>
                    <th className="px-4 py-3.5 text-center">Jam Terverifikasi</th>
                    <th className="px-4 py-3.5 text-center">Sikap Mentor (20%)</th>
                    <th className="px-4 py-3.5 text-center">Nilai Akhir PKL</th>
                    <th className="px-5 py-3.5">Deskripsi Capaian e-Rapor</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((r) => {
                    const gradeColor =
                      r.finalGrade >= 85
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : r.finalGrade >= 75
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : "text-amber-700 bg-amber-50 border-amber-200";

                    return (
                      <tr key={r.placementId} className="hover:bg-slate-50/60 transition">
                        {/* Siswa */}
                        <td className="px-5 py-4">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-900 block text-xs sm:text-sm">
                              {r.student.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              NISN {r.student.identityNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {r.student.department?.name}
                            </span>
                          </div>
                        </td>

                        {/* DUDI */}
                        <td className="px-4 py-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 block text-xs">
                              {r.dudiPartner.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {r.dudiPartner.city}
                            </span>
                          </div>
                        </td>

                        {/* Total Jam */}
                        <td className="px-4 py-4 text-center">
                          <span className="font-extrabold text-slate-800 font-mono text-xs block">
                            {r.totalVerifiedJp} JP
                          </span>
                          {r.pendingLogsCount > 0 && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                              {r.pendingLogsCount} pending
                            </span>
                          )}
                        </td>

                        {/* Sikap Mentor */}
                        <td className="px-4 py-4 text-center font-mono">
                          {r.isAttitudeIncluded ? (
                            <span className="font-bold text-slate-800">{r.attitudeScore}</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-sans block">
                              100% Teknis
                            </span>
                          )}
                        </td>

                        {/* Nilai Akhir */}
                        <td className="px-4 py-4 text-center">
                          <div
                            className={`inline-block px-3 py-1.5 rounded-2xl border font-black text-sm font-mono ${gradeColor}`}
                          >
                            {r.finalGrade}
                          </div>
                        </td>

                        {/* Deskripsi Capaian */}
                        <td className="px-5 py-4 max-w-md">
                          <div className="space-y-1.5 text-[11px] leading-relaxed">
                            <div>
                              <strong className="text-emerald-700 block font-bold text-[10px] uppercase tracking-wide">
                                Capaian Tertinggi:
                              </strong>
                              <span className="text-slate-700 line-clamp-2">
                                {r.highestAchievement}
                              </span>
                            </div>
                            <div>
                              <strong className="text-slate-500 block font-bold text-[10px] uppercase tracking-wide">
                                Perlu Bimbingan:
                              </strong>
                              <span className="text-slate-600 line-clamp-1">
                                {r.needsImprovement}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Aksi Override A1 */}
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleOpenDetailModal(r)}
                            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition"
                            title="Rincian Nilai & Penyesuaian Guru"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Detail & Penyesuaian Guru (A1 Override) */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Rincian Capaian & Penyesuaian Nilai Guru
                </h3>
                <p className="text-xs text-slate-500">
                  {detailStudent.student.fullName} (NISN {detailStudent.student.identityNumber})
                </p>
              </div>
              <button
                onClick={() => setDetailStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rincian per Elemen CP */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                Capaian Elemen Kompetensi Fase F:
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                {detailStudent.elements.map((el) => (
                  <div key={el.elementId} className="p-3 flex items-center justify-between gap-3 bg-slate-50/50">
                    <div>
                      <span className="font-bold text-slate-900 block">{el.elementTitle}</span>
                      <span className="text-[10px] text-slate-400">
                        {el.verifiedJp} / {el.targetJp} JP · Kemandirian: {el.autonomyScore}
                      </span>
                    </div>
                    <span className="font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg text-xs">
                      {el.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Override Nilai Manual A1 */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">Nilai Akhir PKL (0 - 100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={overrideGrade}
                  onChange={(e) => setOverrideGrade(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1.5 bg-white rounded-xl border border-slate-300 font-mono font-bold text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Catatan Berita Acara Penyesuaian Akademik *
                </label>
                <textarea
                  rows={2}
                  placeholder="Alasan penyesuaian nilai (misal: penugasan proyek khusus sekolah atau dispensasi izin resmi)..."
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Sunting Deskripsi Capaian Tertinggi
                </label>
                <textarea
                  rows={2}
                  value={overrideHighest}
                  onChange={(e) => setOverrideHighest(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Sunting Deskripsi Perlu Bimbingan
                </label>
                <textarea
                  rows={2}
                  value={overrideNeeds}
                  onChange={(e) => setOverrideNeeds(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailStudent(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 min-h-[44px]"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveOverride}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 min-h-[44px] flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Terapkan Penyesuaian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
