"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  Info,
  Wrench,
  BookOpen,
  Briefcase,
  RefreshCw,
  WifiOff,
  X,
} from "lucide-react";
import Navbar, { NavbarButton } from "@/components/layout/Navbar";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import {
  fetchCurriculum,
  updateCpElements,
  lockCurriculum,
  addJobCard,
  deleteJobCard,
  fetchDemoSandboxData,
  type CurriculumData,
} from "@/lib/api";

// Fallback seed departments jika offline atau demo
const DEFAULT_DEPARTMENTS = [
  { id: "dept-rpl", sectorCode: "RPL", name: "Rekayasa Perangkat Lunak" },
  { id: "dept-akl", sectorCode: "AKL", name: "Akuntansi dan Keuangan Lembaga" },
  { id: "dept-dkv", sectorCode: "DKV", name: "Desain Komunikasi Visual" },
  { id: "dept-kuliner", sectorCode: "KULINER", name: "Kuliner" },
  { id: "dept-farmasi", sectorCode: "FARMASI", name: "Farmasi Klinis dan Komunitas" },
  { id: "dept-otomotif", sectorCode: "OTOMOTIF", name: "Teknik Kendaraan Ringan Otomotif" },
];

export default function SchoolCurriculumPage() {
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("dept-rpl");
  const [schoolId, setSchoolId] = useState<string>("00000000-0000-0000-0000-000000000002");
  const [token] = useState<string>("mock-token");

  // State data kurikulum aktif
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [editedJpMap, setEditedJpMap] = useState<Record<string, number>>({});

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [savingJp, setSavingJp] = useState<boolean>(false);
  const [locking, setLocking] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Modal tambah Job Card
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetElementIdForAdd, setTargetElementIdForAdd] = useState<string | null>(null);
  const [isNonCompetencyAdd, setIsNonCompetencyAdd] = useState(false);
  const [newJcTitle, setNewJcTitle] = useState("");
  const [newJcSkkni, setNewJcSkkni] = useState("");
  const [newJcTools, setNewJcTools] = useState("");
  const [newJcVerb, setNewJcVerb] = useState("");
  const [addingJc, setAddingJc] = useState(false);

  // Monitor status online/offline browser
  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Inisialisasi data sekolah & token dari session/demo
  useEffect(() => {
    async function initSchool() {
      try {
        const demo = await fetchDemoSandboxData();
        if (demo && demo.school && demo.departments?.length > 0) {
          setSchoolId(demo.school.id);
          setDepartments(demo.departments);
          setSelectedDeptId(demo.departments[0]?.id || "dept-rpl");
        }
      } catch {
        // Fallback default mock
      }
    }
    initSchool();
  }, []);

  // Muat matriks kurikulum untuk jurusan yang dipilih
  const loadCurriculum = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const data = await fetchCurriculum(schoolId, selectedDeptId, token);
      setCurriculum(data);
      const initialMap: Record<string, number> = {};
      data.elements.forEach((el) => {
        initialMap[el.id] = el.targetJp;
      });
      setEditedJpMap(initialMap);
    } catch (err: any) {
      console.warn("API call failed, fallback to mock data:", err);
      // Mock data jika API server lokal belum menyala
      mockFallbackCurriculum();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurriculum();
  }, [selectedDeptId, schoolId]);

  // Fallback mock jika offline atau dev mode
  function mockFallbackCurriculum() {
    const curDept = departments.find((d) => d.id === selectedDeptId) || departments[0]!;
    const mockData: CurriculumData = {
      department: {
        id: curDept.id,
        sectorCode: curDept.sectorCode,
        name: curDept.name,
        isLocked: false,
      },
      activePeriod: {
        name: "PKL Semester Genap 2025/2026",
        targetTotalJp: 792,
      },
      currentTotalJp: 792,
      jpDelta: 0,
      elements: [
        {
          id: "el-1",
          code: `${curDept.sectorCode}-CP-01`,
          title: "Analisis & Perencanaan Teknis Operasional",
          targetJp: 216,
          sortOrder: 1,
          jobCards: [
            {
              id: "jc-1",
              title: "Identifikasi Kebutuhan Proyek Kerja Industri",
              skkniUnitCode: "M.701001.001.01",
              toolsAndSoftware: ["Notion", "Google Docs"],
              actionVerbTemplate: "Mengidentifikasi",
              isNonCompetency: false,
            },
            {
              id: "jc-2",
              title: "Penyusunan Jadwal & Spesifikasi Teknis",
              skkniUnitCode: "M.701001.002.01",
              toolsAndSoftware: ["Trello", "Spreadsheet"],
              actionVerbTemplate: "Menyusun",
              isNonCompetency: false,
            },
          ],
        },
        {
          id: "el-2",
          code: `${curDept.sectorCode}-CP-02`,
          title: "Pelaksanaan Teknis & Standard Operating Procedure (SOP)",
          targetJp: 288,
          sortOrder: 2,
          jobCards: [
            {
              id: "jc-3",
              title: "Implementasi Solusi Teknis Lapangan",
              skkniUnitCode: "M.701001.003.01",
              toolsAndSoftware: ["Toolkit Standar", "Workstation"],
              actionVerbTemplate: "Melaksanakan",
              isNonCompetency: false,
            },
            {
              id: "jc-4",
              title: "Troubleshooting & Penanganan Masalah Sistem",
              skkniUnitCode: "M.701001.004.01",
              toolsAndSoftware: ["Diagnostic Tool"],
              actionVerbTemplate: "Mendiagnosis",
              isNonCompetency: false,
            },
          ],
        },
        {
          id: "el-3",
          code: `${curDept.sectorCode}-CP-03`,
          title: "Pengujian Kualitas, Verifikasi & Dokumentasi",
          targetJp: 288,
          sortOrder: 3,
          jobCards: [
            {
              id: "jc-5",
              title: "Quality Control & Validasi Hasil Kerja",
              skkniUnitCode: "M.701001.005.01",
              toolsAndSoftware: ["Checklist QC", "Laporan"],
              actionVerbTemplate: "Memverifikasi",
              isNonCompetency: false,
            },
            {
              id: "jc-6",
              title: "Dokumentasi Manual Operasional & Berita Acara",
              skkniUnitCode: "M.701001.006.01",
              toolsAndSoftware: ["PDF Writer", "Scanner"],
              actionVerbTemplate: "Mendokumentasikan",
              isNonCompetency: false,
            },
          ],
        },
      ],
      nonCompetencyCards: [
        {
          id: "jc-non-1",
          title: "Bantuan Operasional Umum & Logistik Kantor",
          skkniUnitCode: null,
          toolsAndSoftware: ["Alat Kantor", "Fasilitas Kerja"],
          actionVerbTemplate: "Membantu",
          isNonCompetency: true,
        },
      ],
    };
    setCurriculum(mockData);
    const initialMap: Record<string, number> = {};
    mockData.elements.forEach((el) => {
      initialMap[el.id] = el.targetJp;
    });
    setEditedJpMap(initialMap);
  }

  // Hitung total alokasi JP dari input slider saat ini
  const currentCalculatedJp = useMemo(() => {
    return Object.values(editedJpMap).reduce((sum, val) => sum + (val || 0), 0);
  }, [editedJpMap]);

  const targetTotalJp = curriculum?.activePeriod.targetTotalJp ?? 792;
  const jpDelta = targetTotalJp - currentCalculatedJp; // 0 = match, >0 = kurang, <0 = lebih
  const isJpMatching = currentCalculatedJp === targetTotalJp;

  // Cek apakah ada elemen yang punya < 2 Job Cards
  const minJobCardsCheck = useMemo(() => {
    if (!curriculum) return { valid: true, errorElement: null };
    for (const el of curriculum.elements) {
      if (el.jobCards.length < 2) {
        return { valid: false, errorElement: el.title };
      }
    }
    return { valid: true, errorElement: null };
  }, [curriculum]);

  // Cek apakah ada perubahan slider yang belum disimpan
  const hasJpChanges = useMemo(() => {
    if (!curriculum) return false;
    return curriculum.elements.some((el) => editedJpMap[el.id] !== el.targetJp);
  }, [curriculum, editedJpMap]);

  // Handler slider/input JP
  const handleJpChange = (elementId: string, val: number) => {
    if (curriculum?.department.isLocked) return;
    setEditedJpMap((prev) => ({
      ...prev,
      [elementId]: Math.max(1, Math.min(792, val)),
    }));
  };

  // Simpan perubahan JP
  const handleSaveJp = async () => {
    if (!curriculum) return;
    if (!isJpMatching) {
      setErrorMsg(
        `Total alokasi saat ini ${currentCalculatedJp} JP (${
          jpDelta > 0 ? `Kurang ${jpDelta}` : `Kelebihan ${Math.abs(jpDelta)}`
        } JP dari target ${targetTotalJp} JP). Sesuaikan slider sebelum menyimpan.`
      );
      return;
    }

    setSavingJp(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const payload = Object.entries(editedJpMap).map(([id, targetJp]) => ({
        id,
        targetJp,
      }));
      await updateCpElements(schoolId, selectedDeptId, payload, token);
      setSuccessMsg("Bobot JP Elemen CP berhasil disimpan!");
      // Update state lokal
      setCurriculum((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentTotalJp: currentCalculatedJp,
          jpDelta: 0,
          elements: prev.elements.map((el) => ({
            ...el,
            targetJp: editedJpMap[el.id] ?? el.targetJp,
          })),
        };
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan bobot JP.");
    } finally {
      setSavingJp(false);
    }
  };

  // Kunci Matriks Kurikulum
  const handleLockCurriculum = async () => {
    if (!curriculum) return;

    if (!isJpMatching) {
      setErrorMsg(
        `Total alokasi saat ini ${currentCalculatedJp} JP (${
          jpDelta > 0 ? `Kurang ${jpDelta}` : `Kelebihan ${Math.abs(jpDelta)}`
        } JP dari target ${targetTotalJp} JP). Perbaiki sebelum mengunci.`
      );
      return;
    }

    if (!minJobCardsCheck.valid) {
      setErrorMsg(
        `Elemen CP "${minJobCardsCheck.errorElement}" memiliki kurang dari 2 Job Cards. Setiap elemen wajib minimal 2 Job Cards sebelum dikunci.`
      );
      return;
    }

    const confirmLock = window.confirm(
      "Apakah Anda yakin ingin mengunci kurikulum ini? Setelah dikunci, struktur bobot JP dan Job Card tidak dapat diubah oleh guru atau siswa."
    );
    if (!confirmLock) return;

    setLocking(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await lockCurriculum(schoolId, selectedDeptId, token);
      setSuccessMsg("Matriks kurikulum berhasil dikunci dan siap digunakan!");
      setCurriculum((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          department: { ...prev.department, isLocked: true },
        };
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengunci kurikulum.");
    } finally {
      setLocking(false);
    }
  };

  // Tambah Job Card baru
  const handleAddJobCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJcTitle.trim()) return;

    if (newJcTitle.length > 60) {
      setErrorMsg("Gunakan bahasa praktis maksimal 60 karakter agar mudah dibaca di layar HP.");
      return;
    }

    setAddingJc(true);
    setErrorMsg(null);
    try {
      const tools = newJcTools
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await addJobCard(
        schoolId,
        selectedDeptId,
        {
          cpElementId: isNonCompetencyAdd ? null : targetElementIdForAdd,
          title: newJcTitle.trim(),
          skkniUnitCode: newJcSkkni.trim() || null,
          toolsAndSoftware: tools,
          actionVerbTemplate: newJcVerb.trim() || undefined,
          isNonCompetency: isNonCompetencyAdd,
        },
        token
      );

      setSuccessMsg("Job Card berhasil ditambahkan!");
      setIsAddModalOpen(false);
      setNewJcTitle("");
      setNewJcSkkni("");
      setNewJcTools("");
      setNewJcVerb("");

      // Muat ulang kurikulum
      await loadCurriculum();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menambahkan Job Card.");
    } finally {
      setAddingJc(false);
    }
  };

  // Hapus Job Card
  const handleDeleteJobCard = async (jcId: string, jcTitle: string) => {
    if (curriculum?.department.isLocked) return;
    const confirmDelete = window.confirm(`Hapus Job Card "${jcTitle}"?`);
    if (!confirmDelete) return;

    try {
      await deleteJobCard(schoolId, selectedDeptId, jcId, token);
      setSuccessMsg("Job Card berhasil dihapus.");
      await loadCurriculum();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menghapus Job Card.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        variant="sticky"
        subtitle="Pengaturan Kurikulum & Katalog Job Cards (FR-002)"
        rightSlot={
          <NavbarButton href="/school/dashboard" label="Kembali ke Dashboard" />
        }
      />

      {/* Connectivity Banner (FR-006 Offline Condition) */}
      {isOffline && (
        <div className="bg-amber-500 text-white text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 shadow-xs">
          <WifiOff className="w-4 h-4" />
          <span>Mode Offline aktif. Perubahan akan disimpan di cache lokal peramban.</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/school/dashboard"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Kembali"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Matriks Kurikulum & Job Cards
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  FR-002
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi bobot CP 792 JP dan penerjemahan ke kartu pekerjaan praktis per konsentrasi keahlian.
              </p>
            </div>
          </div>

          {/* Quick Refresh */}
          <button
            onClick={loadCurriculum}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Muat Ulang
          </button>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">Validasi Aturan Bisnis</span>
              {errorMsg}
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">Berhasil</span>
              {successMsg}
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-500 hover:text-emerald-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Multi-Sector Department Selector Pills */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {departments.map((dept) => {
              const isActive = selectedDeptId === dept.id;
              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDeptId(dept.id)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition flex items-center gap-2 shrink-0 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? "bg-blue-700 text-blue-100" : "bg-slate-200 text-slate-600"
                  }`}>
                    {dept.sectorCode}
                  </span>
                  <span>{dept.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State Skeleton */}
        {loading ? (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <Skeleton width="40%" height="28px" />
              <Skeleton width="70%" height="16px" />
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <Skeleton width="60%" height="20px" />
                  <Skeleton width="100%" height="14px" />
                  <Skeleton width="100%" height="40px" />
                </div>
              ))}
            </div>
          </div>
        ) : !curriculum ? (
          /* Empty / Error Recovery State */
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Data Kurikulum Tidak Ditemukan
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Jurusan ini belum memiliki data kurikulum terkloning. Anda dapat memuat ulang atau memilih jurusan lain.
              </p>
            </div>
            <Button variant="primary" onClick={loadCurriculum}>
              Coba Muat Ulang
            </Button>
          </div>
        ) : (
          /* Curriculum Matrix Content */
          <div className="space-y-6">
            {/* Department Summary & JP Allocation Bar Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700">
                      {curriculum.department.sectorCode}
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      {curriculum.department.name}
                    </h2>
                    {curriculum.department.isLocked ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Lock className="w-3.5 h-3.5" /> Terkunci (Published)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Unlock className="w-3.5 h-3.5" /> Draft (Dapat Diedit)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Periode: <span className="font-semibold text-slate-700">{curriculum.activePeriod.name}</span> · Target: <span className="font-bold text-blue-700">{targetTotalJp} Jam Pelajaran (JP)</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {!curriculum.department.isLocked && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={handleSaveJp}
                        disabled={savingJp || !hasJpChanges}
                        className="text-xs font-bold"
                      >
                        {savingJp ? "Menyimpan..." : "Simpan Bobot JP"}
                      </Button>

                      <Button
                        variant="primary"
                        onClick={handleLockCurriculum}
                        disabled={locking || !isJpMatching || !minJobCardsCheck.valid}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Lock className="w-4 h-4 mr-1.5 inline" />
                        {locking ? "Mengunci..." : "Simpan & Kunci Kurikulum"}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* JP Status Indicator Bar (TC-002 & BR-002) */}
              <div className={`p-4 rounded-2xl border transition ${
                isJpMatching
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {isJpMatching ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span className="font-bold text-xs sm:text-sm">
                      {isJpMatching
                        ? "Total Alokasi Tepat Sesuai Target (792 JP)"
                        : `Total alokasi saat ini ${currentCalculatedJp} JP (${
                            jpDelta > 0
                              ? `Kurang ${jpDelta}`
                              : `Kelebihan ${Math.abs(jpDelta)}`
                          } JP dari target ${targetTotalJp} JP)`}
                    </span>
                  </div>
                  <div className="text-xs font-bold">
                    <span>{currentCalculatedJp}</span> / <span className="text-slate-500">{targetTotalJp} JP</span>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isJpMatching
                        ? "bg-emerald-500"
                        : currentCalculatedJp < targetTotalJp
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (currentCalculatedJp / targetTotalJp) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Business Rule Warning Note */}
              {!minJobCardsCheck.valid && !curriculum.department.isLocked && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Syarat Kunci Kurikulum:</strong> Setiap Elemen CP wajib memiliki minimal 2 Job Cards aktif. Elemen <em>&quot;{minJobCardsCheck.errorElement}&quot;</em> belum memenuhi syarat.
                  </span>
                </div>
              )}
            </div>

            {/* List Elemen CP Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Elemen Capaian Pembelajaran (Fase F) & Job Cards
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {curriculum.elements.length} Elemen Terdaftar
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {curriculum.elements.map((el) => {
                  const currentJp = editedJpMap[el.id] ?? el.targetJp;
                  const hasMinJobCards = el.jobCards.length >= 2;

                  return (
                    <div
                      key={el.id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4 transition hover:border-slate-300"
                    >
                      {/* Element Header & Slider */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {el.code}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                              {el.title}
                            </h4>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                hasMinJobCards
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              <Briefcase className="w-3 h-3" />
                              {el.jobCards.length} Job Cards
                              {!hasMinJobCards && " (Wajib min 2)"}
                            </span>
                          </div>
                        </div>

                        {/* JP Slider & Number Input */}
                        <div className="w-full md:w-72 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 shrink-0">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                              <Sliders className="w-3.5 h-3.5 text-blue-600" />
                              Bobot Target JP
                            </span>
                            <div className="flex items-center gap-1 font-mono font-bold text-blue-700">
                              <input
                                type="number"
                                min={1}
                                max={792}
                                value={currentJp}
                                disabled={curriculum.department.isLocked}
                                onChange={(e) =>
                                  handleJpChange(el.id, parseInt(e.target.value) || 0)
                                }
                                className="w-16 px-1.5 py-0.5 text-right font-bold text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              />
                              <span>JP</span>
                            </div>
                          </div>

                          <input
                            type="range"
                            min={10}
                            max={500}
                            step={1}
                            value={currentJp}
                            disabled={curriculum.department.isLocked}
                            onChange={(e) =>
                              handleJpChange(el.id, parseInt(e.target.value))
                            }
                            className="w-full accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Job Cards Sub-catalog */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">
                            Katalog Kartu Pekerjaan Praktis:
                          </span>
                          {!curriculum.department.isLocked && (
                            <button
                              onClick={() => {
                                setTargetElementIdForAdd(el.id);
                                setIsNonCompetencyAdd(false);
                                setIsAddModalOpen(true);
                              }}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-blue-50 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Tambah Job Card
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {el.jobCards.map((jc) => (
                            <div
                              key={jc.id}
                              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2.5 hover:bg-white hover:border-blue-300 hover:shadow-xs transition group"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h5 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                                    {jc.title}
                                  </h5>
                                  {!curriculum.department.isLocked && (
                                    <button
                                      onClick={() => handleDeleteJobCard(jc.id, jc.title)}
                                      className="text-slate-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition"
                                      title="Hapus Job Card"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {jc.skkniUnitCode && (
                                  <div className="mt-1 text-[10px] font-mono text-slate-500">
                                    SKKNI: {jc.skkniUnitCode}
                                  </div>
                                )}
                              </div>

                              {/* Tools & Software Badges */}
                              {jc.toolsAndSoftware && jc.toolsAndSoftware.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60">
                                  <Wrench className="w-3 h-3 text-slate-400 shrink-0" />
                                  {jc.toolsAndSoftware.map((tool, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium"
                                    >
                                      {tool}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Non-Competency System Category Card (BR-002 & BR-004) */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base">
                      Bantuan Operasional Umum (Non-Jurusan)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kategori wajib bawaan sistem di luar kuota 792 JP untuk menampung pelaporan tugas operasional (BR-002/BR-004).
                    </p>
                  </div>
                </div>

                {!curriculum.department.isLocked && (
                  <button
                    onClick={() => {
                      setTargetElementIdForAdd(null);
                      setIsNonCompetencyAdd(true);
                      setIsAddModalOpen(true);
                    }}
                    className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Tugas Operasional
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {curriculum.nonCompetencyCards.map((jc) => (
                  <div
                    key={jc.id}
                    className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-bold text-slate-100 text-xs leading-snug">
                          {jc.title}
                        </h5>
                        {!curriculum.department.isLocked && (
                          <button
                            onClick={() => handleDeleteJobCard(jc.id, jc.title)}
                            className="text-slate-400 hover:text-rose-400 p-1 transition"
                            title="Hapus Job Card"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-amber-300 font-medium block mt-1">
                        Diakui sebagai jam kerja valid, tidak masuk ke klaim keterampilan teknis.
                      </span>
                    </div>

                    {jc.toolsAndSoftware && jc.toolsAndSoftware.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-700">
                        {jc.toolsAndSoftware.map((tool, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Tambah Job Card */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {isNonCompetencyAdd
                    ? "Tambah Tugas Operasional Umum"
                    : "Tambah Job Card Praktis"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gunakan bahasa praktis yang mudah dipahami siswa dan mentor DUDI.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddJobCardSubmit} className="space-y-4">
              {/* Judul Job Card */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <label htmlFor="jc-title">Nama Pekerjaan Praktis *</label>
                  <span
                    className={`text-[11px] font-mono ${
                      newJcTitle.length > 60 ? "text-rose-600 font-bold" : "text-slate-400"
                    }`}
                  >
                    {newJcTitle.length} / 60
                  </span>
                </div>
                <input
                  id="jc-title"
                  type="text"
                  maxLength={60}
                  required
                  placeholder="Misal: Slicing UI Responsif Tailwind CSS"
                  value={newJcTitle}
                  onChange={(e) => setNewJcTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Maksimal 60 karakter agar ringkas dan nyaman dibaca di layar HP siswa/mentor.
                </p>
              </div>

              {/* SKKNI Unit Code (Opsional) */}
              {!isNonCompetencyAdd && (
                <div>
                  <label htmlFor="jc-skkni" className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Unit SKKNI (Opsional)
                  </label>
                  <input
                    id="jc-skkni"
                    type="text"
                    placeholder="Misal: J.620100.004.01"
                    value={newJcSkkni}
                    onChange={(e) => setNewJcSkkni(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Alat / Software Kerja */}
              <div>
                <label htmlFor="jc-tools" className="block text-xs font-bold text-slate-700 mb-1">
                  Alat / Perangkat Lunak Terkait (Pisahkan dengan koma)
                </label>
                <input
                  id="jc-tools"
                  type="text"
                  placeholder="Misal: VS Code, Git, Tailwind CSS, Chrome DevTools"
                  value={newJcTools}
                  onChange={(e) => setNewJcTools(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Kata Kerja Operasional */}
              <div>
                <label htmlFor="jc-verb" className="block text-xs font-bold text-slate-700 mb-1">
                  Template Kata Kerja Operasional (Opsional)
                </label>
                <input
                  id="jc-verb"
                  type="text"
                  placeholder="Misal: Mengembangkan, Mengonfigurasi, Menganalisis"
                  value={newJcVerb}
                  onChange={(e) => setNewJcVerb(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={addingJc || !newJcTitle.trim()}
                >
                  {addingJc ? "Menyimpan..." : "Tambahkan Job Card"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
