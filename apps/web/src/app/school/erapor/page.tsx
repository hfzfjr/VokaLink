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
import Skeleton from "@/components/ui/Skeleton";
import { Disclosure } from "@/components/ui/Disclosure";
import {
  fetchEraporData,
  downloadEraporCsv,
  type EraporStudentRecord,
  type EraporSummaryResponse,
} from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

const EMPTY_ERAPOR_DATA: EraporSummaryResponse = {
  school: { id: "", name: "" },
  totalStudents: 0,
  studentsWithPendingLogsCount: 0,
  warningMessage: null,
  records: [],
};

export default function EraporPage() {
  const { user } = useAuth();
  const schoolId = user?.school?.id || "00000000-0000-0000-0000-000000000002";

  const [data, setData] = useState<EraporSummaryResponse>(EMPTY_ERAPOR_DATA);
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
      setErrorMsg(err.message || "Gagal memuat rekapitulasi e-Rapor dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDeptId, schoolId]);

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
    <div className="space-y-6">
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
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-sky-500" /> Rekap e-Rapor
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  Kurikulum Merdeka Fase F
                </span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Rekap Nilai &amp; Ekspor e-Rapor SMK
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Otomatisasi kalkulasi nilai akademik dan penyusunan kalimat deskripsi capaian kompetensi format CSV resmi.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadCsv}
              disabled={downloadingCsv || filteredRecords.length === 0}
              className="px-5 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 disabled:opacity-50 transition flex items-center gap-2 min-h-[44px]"
            >
              {downloadingCsv ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-sky-100" />
              )}
              Unduh CSV e-Rapor ({filteredRecords.length} Siswa)
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-3 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Formula Explanation Disclosure */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
          <Disclosure
            trigger={
              <span className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                <GraduationCap className="w-4 h-4 text-sky-500" />
                Standar Penilaian Asesmen e-Rapor 4 Elemen Mapel PKL (Permendikbudristek No. 12/2024 &amp; BSKAP)
              </span>
            }
            className="border-t-0"
          >
            <div className="text-xs text-slate-600 leading-relaxed pt-2 space-y-2">
              <p>
                Sesuai pedoman baku mata pelajaran PKL Kurikulum Merdeka, penilaian e-Rapor SMK tidak mengocok kuota jam semata, melainkan mengukur ketercapaian Tujuan Pembelajaran (TP) berbasis rubrik penguasaan SOP industri pada <strong>4 Elemen Baku Mapel PKL</strong>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block font-sans">1. Soft Skills (20%)</span>
                  <span className="text-slate-500 font-sans text-[10.5px]">Disiplin Kehadiran + Work Ethic Mentor</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block font-sans">2. Penerapan Hard Skills (40%)</span>
                  <span className="text-slate-500 font-sans text-[10.5px]">Kemandirian SOP Tugas Kejuruan</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block font-sans">3. Pengembangan Skills (25%)</span>
                  <span className="text-slate-500 font-sans text-[10.5px]">Tools Industri &amp; Problem Solving</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block font-sans">4. Kewirausahaan (15%)</span>
                  <span className="text-slate-500 font-sans text-[10.5px]">Proses Bisnis DUDI &amp; Inisiatif Mandiri</span>
                </div>
              </div>
            </div>
          </Disclosure>
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

            {/* Rincian 4 Elemen Resmi Mapel PKL */}
            {detailStudent.officialElements && detailStudent.officialElements.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Rubrik 4 Elemen Resmi Mapel PKL (BSKAP Kurikulum Merdeka):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {detailStudent.officialElements.map((el) => (
                    <div
                      key={el.code}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 leading-tight">{el.title}</span>
                        <span className="font-mono font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded-lg text-xs shrink-0">
                          {el.score}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 leading-snug">{el.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                        <span>Bobot: {Math.round(el.weight * 100)}%</span>
                        <span className="font-semibold text-emerald-700">{el.predicate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
