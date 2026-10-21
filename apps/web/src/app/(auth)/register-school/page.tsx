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
  Sparkles,
  RefreshCw,
  WifiOff,
  ShieldCheck,
} from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";
import {
  fetchMasterDepartments,
  registerSchool,
  fetchDemoSandboxData,
  type MasterDepartmentItem,
} from "../../../lib/api";
import Navbar, { NavbarButton } from "@/components/layout/Navbar";

type Step = 1 | 2 | 3 | 4 | 5; // 1: Info, 2: Jurusan, 3: Periode, 4: Admin, 5: Sukses

export default function RegisterSchoolPage() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isOffline, setIsOffline] = useState(false);

  // Master departments list from API/seed
  const [departmentsList, setDepartmentsList] = useState<MasterDepartmentItem[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

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
        console.error(err);
      } finally {
        if (mounted) setLoadingDepts(false);
      }
    }
    loadDepts();
    return () => {
      mounted = false;
    };
  }, []);

  // Department toggle handler
  const toggleDepartment = (sectorCode: string) => {
    setFormData((prev) => {
      const exists = prev.selectedDepartmentSectorCodes.includes(sectorCode);
      const updated = exists
        ? prev.selectedDepartmentSectorCodes.filter((c) => c !== sectorCode)
        : [...prev.selectedDepartmentSectorCodes, sectorCode];
      return { ...prev, selectedDepartmentSectorCodes: updated };
    });
  };

  // Validate step before proceeding
  const handleNextStep = () => {
    setErrorMsg(null);
    setFieldErrors({});

    if (step === 1) {
      if (!/^\d{8}$/.test(formData.npsn)) {
        setErrorMsg("NPSN wajib terdiri dari 8 digit angka.");
        setFieldErrors({ npsn: ["NPSN wajib terdiri dari 8 digit angka."] });
        return;
      }
      if (formData.name.trim().length < 3) {
        setErrorMsg("Nama sekolah wajib diisi minimal 3 karakter.");
        setFieldErrors({ name: ["Nama sekolah minimal 3 karakter."] });
        return;
      }
      if (!formData.city || !formData.province) {
        setErrorMsg("Provinsi dan Kabupaten/Kota wajib diisi.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (formData.selectedDepartmentSectorCodes.length === 0) {
        setErrorMsg("Pilih minimal 1 konsentrasi keahlian aktif untuk sekolah Anda.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!formData.academicPeriodName.trim()) {
        setErrorMsg("Nama periode gelombang PKL wajib diisi.");
        return;
      }
      if (formData.targetTotalJp < 300 || formData.targetTotalJp > 1200) {
        setErrorMsg("Target total JP harus di antara 300 hingga 1.200 JP.");
        return;
      }
      setStep(4);
    }
  };

  // Final Registration Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    if (formData.adminFullName.trim().length < 3) {
      setErrorMsg("Nama admin wajib diisi minimal 3 karakter.");
      return;
    }
    if (!formData.adminEmail.includes("@")) {
      setErrorMsg("Format email resmi admin tidak valid.");
      return;
    }
    if (formData.adminPassword.length < 8) {
      setErrorMsg("Kata sandi minimal 8 karakter.");
      return;
    }
    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerSchool({
        npsn: formData.npsn,
        name: formData.name,
        province: formData.province,
        city: formData.city,
        adminFullName: formData.adminFullName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        selectedDepartmentSectorCodes: formData.selectedDepartmentSectorCodes,
        academicPeriodName: formData.academicPeriodName,
        targetTotalJp: formData.targetTotalJp,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isDemoSandbox: false,
      });

      setSuccessResult({
        schoolName: res.data.school.name,
        npsn: res.data.school.npsn,
        adminEmail: res.data.admin.email,
        departmentsCount: res.data.departmentsCount,
        targetJp: res.data.academicPeriod.targetTotalJp,
      });
      setStep(5);
    } catch (err: any) {
      if (err && err.detail) {
        setErrorMsg(err.detail);
        if (err.errors) {
          setFieldErrors(err.errors);
        }
      } else {
        setErrorMsg("Gagal melakukan registrasi sekolah. Periksa koneksi Anda dan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Instant Demo Sandbox Loader for Judges
  const handleLoadDemoSandbox = async () => {
    setLoadingDemo(true);
    setErrorMsg(null);
    try {
      const demo = await fetchDemoSandboxData();
      setSuccessResult({
        schoolName: demo.school.name,
        npsn: demo.school.npsn,
        adminEmail: demo.demoAccounts.schoolAdmin.email,
        departmentsCount: demo.departments.length,
        targetJp: demo.period?.targetTotalJp ?? TOTAL_TARGET_JP,
      });
      setStep(5);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memuat data demo sandbox.");
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Offline Connectivity Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2.5 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm">
          <WifiOff className="w-4 h-4" />
          <span>Mode Offline Aktif — Koneksi terputus. Formulir pendaftaran memerlukan koneksi internet.</span>
        </div>
      )}

      <Navbar
        variant="sticky"
        rightSlot={
          <NavbarButton href="/login" label="Sudah Terdaftar? Masuk" />
        }
      />

      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        {/* Step Progress Header (Steps 1 to 4) */}
        {step <= 4 && (
          <div className="mb-8">
            {/* Quick Demo Switcher Hero Banner for Judges */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300">
                  <Sparkles className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="font-bold text-sm sm:text-base text-white">
                    Mode Penjurian UINIC 8.0 (1-Click Sandbox)
                  </h2>
                  <p className="text-xs text-blue-200">
                    Muat langsung simulasi sekolah demo: 6 jurusan, 5 siswa, 6 DUDI & penempatan aktif.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLoadDemoSandbox}
                disabled={loadingDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition shadow-sm whitespace-nowrap disabled:opacity-50"
              >
                {loadingDemo ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Memuat Sandbox...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Muat Data Demo Instan
                  </>
                )}
              </button>
            </div>

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
                    className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all ${
                      isActive
                        ? "bg-blue-50 border-blue-500 text-blue-700 shadow-xs"
                        : isPassed
                        ? "bg-slate-100 border-slate-200 text-slate-700"
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
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-900">Perhatian</p>
              <p className="text-rose-700 text-xs sm:text-sm mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Info Sekolah */}
        {step === 1 && (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Identitas Sekolah Baru</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Masukkan identitas resmi SMK berdasarkan Nomor Pokok Sekolah Nasional (NPSN).
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    fieldErrors.npsn ? "border-rose-400 bg-rose-50/50" : "border-slate-300"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Sekolah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SMK Negeri 1 Surabaya"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Provinsi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kabupaten / Kota <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition"
              >
                Lanjut ke Pemilihan Jurusan <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Pemilihan Jurusan */}
        {step === 2 && (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Pilih Konsentrasi Keahlian / Jurusan Aktif
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Pilih minimal 1 jurusan yang aktif di sekolah Anda. Sistem otomatis mengklon katalog
                Capaian Pembelajaran (CP) dan Job Cards bawaan.
              </p>
            </div>

            {loadingDepts ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : departmentsList.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
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
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/60 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {dept.sectorCode}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">{dept.name}</h4>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
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
                        <span>🎯 {dept.cpElementsCount} Elemen CP</span>
                        <span>📋 {dept.jobCardsCount} Job Cards</span>
                        <span className="font-semibold text-blue-700">{dept.totalJp} JP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition"
              >
                Lanjut ke Periode PKL <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Pengaturan Periode PKL */}
        {step === 3 && (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pengaturan Periode PKL</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Tentukan target jam pelajaran dan rentang kalender pelaksanaan PKL gelombang aktif.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Periode Gelombang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PKL Semester Genap 2025/2026"
                  value={formData.academicPeriodName}
                  onChange={(e) =>
                    setFormData({ ...formData, academicPeriodName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {/* Target JP Slider */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Target Total Jam Pelajaran (JP)
                  </label>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-extrabold text-sm shadow-xs">
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
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>300 JP</span>
                  <span className="text-blue-700 font-bold">
                    Standar Regulasi: 792 JP (Permendikbudristek No. 12/2024)
                  </span>
                  <span>1.200 JP</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Mulai Pelaksanaan
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Selesai Pelaksanaan
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition"
              >
                Lanjut ke Akun Admin <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Akun Admin Pokja PKL */}
        {step === 4 && (
          <form
            onSubmit={handleSubmit}
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">Akun Admin Pokja PKL</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Akun ini bertindak sebagai penanggung jawab utama (Role: SCHOOL_ADMIN) untuk mengelola
                guru, penempatan DUDI, dan kurikulum.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Penanggung Jawab / Operator <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Drs. H. Ahmad Fauzi (Waka Hubin)"
                  value={formData.adminFullName}
                  onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Resmi Sekolah / Pokja PKL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Contoh: pokja.pkl@smkn1surabaya.sch.id"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Ketik ulang kata sandi"
                    value={formData.adminPasswordConfirm}
                    onChange={(e) =>
                      setFormData({ ...formData, adminPasswordConfirm: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 text-blue-800 text-xs flex items-center gap-2 border border-blue-200">
                <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
                <span>
                  Kredensial Anda dienkripsi aman via Supabase Auth dengan otorisasi berbasis peran
                  (RBAC).
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Mendaftarkan Sekolah...
                  </>
                ) : (
                  <>
                    Selesaikan & Inisialisasi Workspace <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: Sukses & Ringkasan Inisialisasi */}
        {step === 5 && successResult && (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-md text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                Pendaftaran & Inisialisasi Berhasil
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                Selamat Datang di VokaLink!
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
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
                <span className="font-bold text-blue-700">
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
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition"
              >
                Buka Dasbor Pokja PKL <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold transition"
              >
                Halaman Masuk
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>© 2026 VokaLink · Kompetisi Web Development UINIC 8.0</p>
      </footer>
    </div>
  );
}
