"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  BookOpen,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  WifiOff,
  ShieldCheck,
  Plus,
  X,
} from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";
import {
  fetchMasterDepartments,
  registerSchool,
  type MasterDepartmentItem,
} from "../../../lib/api";
import { sanitizeErrorMessage } from "@/lib/error-formatter";
import { SkeletonRect } from "@/components/ui/Skeleton";
import Navbar, { NavbarButton } from "@/components/layout/Navbar";

type Step = 1 | 2 | 3 | 4 | 5; // 1: Info, 2: Jurusan, 3: Periode, 4: Admin, 5: Sukses

export default function RegisterSchoolPage() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isOffline, setIsOffline] = useState(false);

  // Master departments list from API/seed
  const [departmentsList, setDepartmentsList] = useState<MasterDepartmentItem[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [customDepartments, setCustomDepartments] = useState<
    Array<{ sectorCode: string; name: string; description?: string }>
  >([]);
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [addDeptError, setAddDeptError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    npsn: "",
    name: "",
    province: "Jawa Timur",
    city: "Surabaya",
    selectedDepartmentSectorCodes: ["RPL", "AKL"],
    academicPeriodName: "PKL Semester Genap 2025/2026",
    startDate: "2026-01-05",
    endDate: "2026-06-26",
    targetTotalJp: TOTAL_TARGET_JP,
    adminFullName: "",
    adminEmail: "",
    adminPassword: "",
    adminPasswordConfirm: "",
  });

  // Success response state
  const [successResult, setSuccessResult] = useState<{
    schoolName: string;
    npsn: string;
    adminEmail: string;
    departmentsCount: number;
    targetJp: number;
  } | null>(null);

  // Monitor network connectivity (Offline state)
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

  // Fetch departments list
  useEffect(() => {
    let mounted = true;
    async function loadDepts() {
      try {
        setLoadingDepts(true);
        const data = await fetchMasterDepartments();
        if (mounted) {
          setDepartmentsList(data);
          // Auto select first 2 if empty
          const first = data[0];
          const second = data[1];
          if (formData.selectedDepartmentSectorCodes.length === 0 && first && second) {
            setFormData((prev) => ({
              ...prev,
              selectedDepartmentSectorCodes: [first.sectorCode, second.sectorCode],
            }));
          }
        }
      } catch (err) {
        console.warn("Gagal memuat daftar master jurusan via API, memakai fallback lokal:", err);
      } finally {
        if (mounted) setLoadingDepts(false);
      }
    }
    loadDepts();
    return () => {
      mounted = false;
    };
  }, [formData.selectedDepartmentSectorCodes.length]);

  const toggleDepartment = (code: string) => {
    const current = [...formData.selectedDepartmentSectorCodes];
    const index = current.indexOf(code);
    if (index > -1) {
      if (current.length === 1) {
        setErrorMsg("Pilih minimal 1 jurusan aktif untuk kurikulum sekolah.");
        return;
      }
      current.splice(index, 1);
    } else {
      current.push(code);
    }
    setErrorMsg(null);
    setFormData({ ...formData, selectedDepartmentSectorCodes: current });
  };

  const handleAddCustomDepartment = () => {
    setAddDeptError(null);
    const code = newDeptCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const name = newDeptName.trim();
    const desc =
      newDeptDesc.trim() ||
      `Konsentrasi keahlian bidang ${name} sesuai standar kurikulum SMK 792 JP.`;

    if (code.length < 2 || code.length > 16) {
      setAddDeptError("Kode singkatan jurusan wajib 2–16 karakter (contoh: TKJ,MPLB,TITL).");
      return;
    }
    if (name.length < 3) {
      setAddDeptError("Nama lengkap jurusan minimal 3 karakter.");
      return;
    }
    if (departmentsList.some((d) => d.sectorCode.toUpperCase() === code)) {
      setAddDeptError(`Jurusan dengan kode "${code}" sudah ada pada daftar.`);
      return;
    }

    const newItem: MasterDepartmentItem = {
      sectorCode: code,
      name,
      description: desc,
      totalJp: TOTAL_TARGET_JP,
      cpElementsCount: 4,
      jobCardsCount: 8,
    };

    setDepartmentsList((prev) => [...prev, newItem]);
    setCustomDepartments((prev) => [...prev, { sectorCode: code, name, description: desc }]);
    setFormData((prev) => ({
      ...prev,
      selectedDepartmentSectorCodes: prev.selectedDepartmentSectorCodes.includes(code)
        ? prev.selectedDepartmentSectorCodes
        : [...prev.selectedDepartmentSectorCodes, code],
    }));

    setNewDeptCode("");
    setNewDeptName("");
    setNewDeptDesc("");
    setIsAddDeptOpen(false);
    setErrorMsg(null);
  };

  // Validasi per langkah sebelum melangkah maju
  const validateStep = (currentStep: Step): boolean => {
    setErrorMsg(null);
    setFieldErrors({});

    if (currentStep === 1) {
      if (!formData.npsn.trim() || formData.npsn.length !== 8) {
        setErrorMsg("NPSN wajib berupa 8 digit angka resmi Kemendikbud.");
        setFieldErrors({ npsn: ["Harus 8 digit angka."] });
        return false;
      }
      if (!formData.name.trim()) {
        setErrorMsg("Nama sekolah wajib diisi.");
        return false;
      }
      if (!formData.province.trim() || !formData.city.trim()) {
        setErrorMsg("Provinsi dan Kabupaten/Kota wajib diisi.");
        return false;
      }
    }

    if (currentStep === 2) {
      if (formData.selectedDepartmentSectorCodes.length === 0) {
        setErrorMsg("Pilih minimal 1 konsentrasi keahlian / jurusan.");
        return false;
      }
    }

    if (currentStep === 3) {
      if (!formData.academicPeriodName.trim()) {
        setErrorMsg("Nama periode gelombang PKL wajib diisi.");
        return false;
      }
      if (!formData.startDate || !formData.endDate) {
        setErrorMsg("Rentang tanggal mulai dan selesai wajib ditentukan.");
        return false;
      }
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        setErrorMsg("Tanggal mulai harus lebih awal dari tanggal selesai.");
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
    }
  };

  // Submit pendaftaran sekolah baru
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    if (!formData.adminFullName.trim()) {
      setErrorMsg("Nama lengkap penanggung jawab Pokja PKL wajib diisi.");
      return;
    }
    if (!formData.adminEmail.trim() || !formData.adminEmail.includes("@")) {
      setErrorMsg("Email resmi administrator wajib diisi dengan format valid.");
      return;
    }
    if (formData.adminPassword.length < 8) {
      setErrorMsg("Kata sandi administrator minimal 8 karakter.");
      return;
    }
    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        npsn: formData.npsn,
        name: formData.name,
        province: formData.province,
        city: formData.city,
        selectedDepartmentSectorCodes: formData.selectedDepartmentSectorCodes,
        customDepartments,
        academicPeriodName: formData.academicPeriodName,
        startDate: formData.startDate,
        endDate: formData.endDate,
        targetTotalJp: formData.targetTotalJp,
        adminFullName: formData.adminFullName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        isDemoSandbox: false,
      };

      const result = await registerSchool(payload);
      const data = result.data || result;

      setSuccessResult({
        schoolName: data.school?.name || formData.name,
        npsn: data.school?.npsn || formData.npsn,
        adminEmail: data.admin?.email || formData.adminEmail,
        departmentsCount:
          data.departmentsCount ??
          data.departments?.length ??
          formData.selectedDepartmentSectorCodes.length,
        targetJp:
          data.academicPeriod?.targetTotalJp ??
          data.activePeriod?.targetTotalJp ??
          formData.targetTotalJp,
      });

      setStep(5);
    } catch (err: unknown) {
      setErrorMsg(sanitizeErrorMessage(err, "Pendaftaran sekolah gagal. Silakan coba kembali."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col justify-between font-sans selection:bg-sky-500 selection:text-white">
      {/* Offline Connectivity Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2.5 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs">
          <WifiOff className="w-4 h-4" />
          <span>Mode Offline Aktif — Koneksi terputus. Formulir pendaftaran memerlukan koneksi internet.</span>
        </div>
      )}

      {/* TOP NAVBAR */}
      <Navbar
        variant="sticky"
        rightSlot={
          <NavbarButton href="/login" label="Sudah Terdaftar? Masuk" />
        }
      />

      {/* MAIN WORKSPACE CONTAINER */}
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Step Progress Header (Steps 1 to 4) */}
        {step <= 4 && (
          <div className="mb-8">
            {/* Stepper Navigation Indicator */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { s: 1, label: "Info Sekolah", icon: Building2 },
                { s: 2, label: "Jurusan", icon: BookOpen },
                { s: 3, label: "Periode PKL", icon: Calendar },
                { s: 4, label: "Admin Pokja", icon: UserCheck },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = step === item.s;
                const isPassed = step > item.s;
                return (
                  <div
                    key={item.s}
                    className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
                      isActive
                        ? "bg-sky-50 border-sky-500 text-sky-700 shadow-xs font-bold"
                        : isPassed
                        ? "bg-slate-100 border-slate-200 text-slate-700 font-medium"
                        : "bg-white border-slate-200 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] font-bold">Langkah {item.s}</span>
                    </div>
                    <span className="text-xs font-semibold truncate max-w-[80px] sm:max-w-none">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-900">Perhatian</p>
              <p className="text-rose-700 text-xs sm:text-sm mt-0.5 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Info Sekolah */}
        {step === 1 && (
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100 inline-block mb-2">
                Langkah 1 dari 4
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Identitas Sekolah Baru
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Masukkan identitas resmi SMK berdasarkan Nomor Pokok Sekolah Nasional (NPSN).
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NPSN (Nomor Pokok Sekolah Nasional) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={8}
                  placeholder="Contoh: 20501234 (8 digit angka)"
                  value={formData.npsn}
                  onChange={(e) =>
                    setFormData({ ...formData, npsn: e.target.value.replace(/\D/g, "") })
                  }
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 transition placeholder:text-slate-400 bg-slate-50/50 focus:bg-white ${
                    fieldErrors.npsn ? "border-rose-400 bg-rose-50/50" : "border-slate-200"
                  }`}
                />
                {fieldErrors.npsn && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{fieldErrors.npsn[0]}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Setiap kode NPSN menjamin isolasi data akademik unik (Multi-Tenant SaaS).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap Sekolah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SMK Negeri 1 Surabaya"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 transition placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Provinsi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 transition placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kabupaten / Kota <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 transition placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-500/20 transition active:scale-[0.98] cursor-pointer"
              >
                <span>Lanjut ke Pemilihan Jurusan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Pemilihan Jurusan */}
        {step === 2 && (
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100 inline-block mb-2">
                  Langkah 2 dari 4
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Pilih Konsentrasi Keahlian / Jurusan Aktif
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  Pilih jurusan yang aktif di sekolah Anda. Kurikulum standar 792 JP dan katalog Kartu Pekerjaan (Job Cards) akan langsung diaktifkan secara otomatis oleh sistem tanpa perlu konfigurasi manual.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddDeptOpen((prev) => !prev);
                  setAddDeptError(null);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition shrink-0 cursor-pointer self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Jurusan</span>
              </button>
            </div>

            {/* Form Inline Tambah Jurusan Kustom */}
            {isAddDeptOpen && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-sky-200/80 space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Tambah Konsentrasi Keahlian / Jurusan Baru
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Jurusan yang ditambahkan akan otomatis dibuatkan struktur elemen CP (792 JP) &amp; Job Cards awal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddDeptOpen(false);
                      setAddDeptError(null);
                    }}
                    className="w-7 h-7 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {addDeptError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{addDeptError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode Singkatan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="Contoh: TKJ / MPLB"
                      value={newDeptCode}
                      onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap Konsentrasi Keahlian <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      placeholder="Contoh: Teknik Komputer dan Jaringan"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi Singkat Kompetensi (Opsional)
                  </label>
                  <input
                    type="text"
                    maxLength={250}
                    placeholder="Contoh: Konsentrasi keahlian bidang jaringan komputer, administrasi server, dan infrastruktur IT."
                    value={newDeptDesc}
                    onChange={(e) => setNewDeptDesc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddDeptOpen(false);
                      setAddDeptError(null);
                    }}
                    className="px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomDepartment}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Simpan &amp; Pilih Jurusan</span>
                  </button>
                </div>
              </div>
            )}

            {loadingDepts ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((n) => (
                  <SkeletonRect key={n} className="h-16 rounded-2xl" />
                ))}
              </div>
            ) : departmentsList.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Daftar jurusan belum dimuat</p>
                <p className="text-xs text-slate-500 mt-1">
                  Pastikan database seed kurikulum telah diterapkan.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {departmentsList.map((dept) => {
                  const isSelected = formData.selectedDepartmentSectorCodes.includes(
                    dept.sectorCode
                  );
                  return (
                    <div
                      key={dept.sectorCode}
                      onClick={() => toggleDepartment(dept.sectorCode)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-sky-500 bg-sky-50/50 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {dept.sectorCode}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">{dept.name}</h4>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? "bg-sky-500 border-sky-500 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {dept.description}
                      </p>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                        <span>{dept.cpElementsCount} Elemen CP</span>
                        <span>{dept.jobCardsCount} Job Cards</span>
                        <span className="font-bold text-sky-600">{dept.totalJp} JP</span>
                      </div>
                    </div>
                  );
                })}

                {/* Card Tombol Tambah Jurusan Lainnya */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAddDeptOpen(true);
                    setAddDeptError(null);
                  }}
                  className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 transition-all flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-sky-700 min-h-[128px] cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-sky-100 text-slate-600 group-hover:text-sky-600 flex items-center justify-center transition">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs sm:text-sm font-bold block text-slate-700 group-hover:text-sky-700">
                      + Tambah Jurusan Lainnya
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Belum ada di daftar? Tambahkan jurusan sekolah Anda
                    </span>
                  </div>
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-500/20 transition active:scale-[0.98] cursor-pointer"
              >
                <span>Lanjut ke Periode PKL</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Pengaturan Periode PKL */}
        {step === 3 && (
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100 inline-block mb-2">
                Langkah 3 dari 4
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pengaturan Periode PKL
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Tentukan target jam pelajaran dan rentang kalender pelaksanaan PKL gelombang aktif.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Periode Gelombang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PKL Semester Genap 2025/2026"
                  value={formData.academicPeriodName}
                  onChange={(e) =>
                    setFormData({ ...formData, academicPeriodName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 transition placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
                />
              </div>

              {/* Target JP Slider */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Target Total Jam Pelajaran (JP)
                  </label>
                  <span className="px-3 py-1 rounded-full bg-sky-500 text-white font-extrabold text-sm shadow-xs">
                    {formData.targetTotalJp} JP
                  </span>
                </div>
                <input
                  type="range"
                  min={300}
                  max={1200}
                  step={36}
                  value={formData.targetTotalJp}
                  onChange={(e) =>
                    setFormData({ ...formData, targetTotalJp: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>300 JP</span>
                  <span className="text-sky-600 font-bold">
                    Standar Regulasi: 792 JP (Permendikbudristek No. 12/2024)
                  </span>
                  <span>1.200 JP</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tanggal Mulai Pelaksanaan
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 transition placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tanggal Selesai Pelaksanaan
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 transition placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-500/20 transition active:scale-[0.98] cursor-pointer"
              >
                <span>Lanjut ke Akun Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Akun Admin Pokja PKL */}
        {step === 4 && (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6"
          >
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100 inline-block mb-2">
                Langkah 4 dari 4
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Akun Admin Pokja PKL
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Akun ini bertindak sebagai penanggung jawab utama (Role: SCHOOL_ADMIN) untuk mengelola
                guru, penempatan DUDI, dan kurikulum.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap Penanggung Jawab / Operator <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Drs. H. Ahmad Fauzi (Waka Hubin)"
                  value={formData.adminFullName}
                  onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 transition placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Resmi Sekolah / Pokja PKL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Contoh: pokja.pkl@smkn1surabaya.sch.id"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 transition placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 transition placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Ketik ulang kata sandi"
                    value={formData.adminPasswordConfirm}
                    onChange={(e) =>
                      setFormData({ ...formData, adminPasswordConfirm: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 transition placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50 text-sky-800 text-xs flex items-center gap-2.5 border border-sky-100">
                <ShieldCheck className="w-4 h-4 shrink-0 text-sky-600" />
                <span>
                  Kredensial Anda dienkripsi aman via Supabase Auth dengan otorisasi berbasis peran (RBAC).
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-500/20 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mendaftarkan Sekolah...</span>
                  </>
                ) : (
                  <>
                    <span>Selesaikan & Inisialisasi Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: Sukses & Ringkasan Inisialisasi */}
        {step === 5 && successResult && (
          <div className="p-8 sm:p-10 bg-white rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                Pendaftaran & Inisialisasi Berhasil
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
                Selamat Datang di VokaLink!
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                Workspace sekolah Anda telah terisolasi aman dengan kurikulum multi-sektor aktif.
              </p>
            </div>

            {/* Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left max-w-lg mx-auto space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Instansi Sekolah:</span>
                <span className="font-bold text-slate-900">{successResult.schoolName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">NPSN:</span>
                <span className="font-mono font-bold text-slate-800">{successResult.npsn}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Jurusan Terdaftar:</span>
                <span className="font-bold text-sky-600">
                  {successResult.departmentsCount} Konsentrasi Keahlian
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Target Durasi:</span>
                <span className="font-bold text-slate-900">{successResult.targetJp} JP (Fase F)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Akun Admin:</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {successResult.adminEmail}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <Link
                href="/school/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold shadow-md shadow-sky-500/20 transition active:scale-[0.98]"
              >
                <span>Buka Dasbor Pokja PKL</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition active:scale-[0.98]"
              >
                <span>Halaman Masuk</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        <p>&copy; 2026 VokaLink &bull; Ekosistem PKL SMK Terintegrasi &bull; UINIC 8.0</p>
      </footer>
    </div>
  );
}
