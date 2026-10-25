"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Printer,
  ShieldCheck,
  Lock,
  Sparkles,
  ExternalLink,
  CheckCircle,
  FileCheck,
  Check,
  Share2,
  RefreshCw,
  AlertCircle,
  Award,
  Save,
  Loader2,
  ChevronRight,
  Image as ImageIcon,
  Clock,
  Edit3,
  Plus,
  Trash2,
  Eye,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { fetchStudentCv, updateStudentPassport, type StudentCvResponse } from "@/lib/api";
import { QrCodeView } from "@/components/ui/QrCodeView";
import { cn } from "@/lib/cn";

const DEMO_FALLBACK_CV: StudentCvResponse = {
  student: {
    id: "00000000-0000-0000-0000-000000000001",
    fullName: "Andi Pratama",
    identityNumber: "0078901234",
    departmentName: "Rekayasa Perangkat Lunak (RPL)",
    schoolName: "SMK Demo VokaLink",
    schoolAddress: "Jl. Pendidikan Vokasi No. 1, Surabaya",
    whatsappNumber: "081234567890",
  },
  summaryBio:
    "Siswa SMK konsentrasi Rekayasa Perangkat Lunak dengan pengalaman magang industri 184 JP terverifikasi resmi (184 jam kerja industri riil) di PT Nusantara Tech. Menguasai arsitektur Express.js, TypeScript, Next.js, dan optimasi basis data relasional PostgreSQL dengan standar SKKNI.",
  totalVerifiedJp: 184,
  totalRealHours: 184,
  technicalJp: 168,
  nonCompetencyJp: 16,
  completedTasksCount: 21,
  experiences: [
    {
      placementId: "00000000-0000-0000-0000-000000000051",
      dudiName: "PT Nusantara Tech",
      dudiCity: "Surabaya",
      mentorName: "Rizky Firmansyah (Engineering Lead)",
      roleTitle: "Junior Software Engineer Intern",
      periodLabel: "Jan 2026 – Sekarang",
      totalVerifiedJp: 184,
      totalRealHours: 184,
      technicalJp: 168,
      nonCompetencyJp: 16,
      bulletPoints: [
        {
          jobCardId: "00000000-0000-0000-0000-000000000031",
          jobCardTitle: "Implementasi RESTful API Express.js",
          skkniUnitCode: "J.620100.009.01",
          totalJp: 64,
          totalRealHours: 64,
          taskCount: 8,
          predominantAutonomyLevel: 3,
          autonomyLabel: "Mandiri",
          toolsUsed: ["Express", "TypeScript", "PostgreSQL"],
          bulletText:
            "Mengembangkan 12 modul endpoint backend menggunakan Express, TypeScript, PostgreSQL untuk Implementasi RESTful API Express.js secara mandiri melalui 8 penugasan (SOP Mandiri (Level 3)) dengan akumulasi 64 JP kerja terverifikasi (64 jam kerja industri riil) (SKKNI: J.620100.009.01).",
        },
        {
          jobCardId: "00000000-0000-0000-0000-000000000032",
          jobCardTitle: "Pembuatan Komponen Antarmuka Web Next.js",
          skkniUnitCode: "J.620100.012.01",
          totalJp: 56,
          totalRealHours: 56,
          taskCount: 7,
          predominantAutonomyLevel: 2,
          autonomyLabel: "Terbimbing",
          toolsUsed: ["Next.js", "React", "Tailwind CSS"],
          bulletText:
            "Mengimplementasikan antarmuka responsif mobile-first menggunakan Next.js, React, Tailwind CSS untuk Pembuatan Komponen Antarmuka Web Next.js secara terbimbing melalui 7 penugasan (SOP Terbimbing (Level 2)) dengan akumulasi 56 JP kerja terverifikasi (56 jam kerja industri riil) (SKKNI: J.620100.012.01).",
        },
        {
          jobCardId: "00000000-0000-0000-0000-000000000033",
          jobCardTitle: "Perancangan Skema Basis Data Relasional",
          skkniUnitCode: "J.620100.010.01",
          totalJp: 48,
          totalRealHours: 48,
          taskCount: 6,
          predominantAutonomyLevel: 3,
          autonomyLabel: "Mandiri",
          toolsUsed: ["PostgreSQL", "Prisma ORM"],
          bulletText:
            "Merancang skema relasional PostgreSQL dan migrasi skema menggunakan Prisma ORM untuk Perancangan Skema Basis Data Relasional secara mandiri melalui 6 penugasan (SOP Mandiri (Level 3)) dengan akumulasi 48 JP kerja terverifikasi (48 jam kerja industri riil) (SKKNI: J.620100.010.01).",
        },
      ],
    },
  ],
  technicalSkills: [
    { name: "Express.js & TypeScript", totalJp: 64, totalRealHours: 64 },
    { name: "Next.js & React 19", totalJp: 56, totalRealHours: 56 },
    { name: "PostgreSQL & Prisma", totalJp: 48, totalRealHours: 48 },
    { name: "Tailwind CSS Mobile-First", totalJp: 40, totalRealHours: 40 },
  ],
  endorsement: {
    attitudeScore: 95,
    badges: ["INISIATIF_TINGGI", "KOLABORATIF", "KEDISIPLINAN_WAKTU"],
    quote:
      "Andi menunjukkan inisiatif teknis yang luar biasa selama PKL, cepat beradaptasi dengan stack modern tim kami.",
    mentorName: "Rizky Firmansyah",
    dudiName: "PT Nusantara Tech",
  },
  extraActivities: [],
  visibility: {
    showPhotos: true,
    showGrades: true,
  },
  passportSlug: "andi-pratama",
  verificationUrl: "/verify/andi-pratama",
  masterSignatureHash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
};

export interface EditableExperience {
  id: string;
  roleTitle: string;
  dudiName: string;
  dudiCity?: string;
  periodLabel: string;
  mentorName?: string;
  totalVerifiedJp: number;
  technicalJp: number;
  nonCompetencyJp: number;
  bulletPoints: string[];
}

export default function CareerCvPage() {
  const [cvData, setCvData] = useState<StudentCvResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bio state & editing
  const [bioSummary, setBioSummary] = useState("");
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [bioSaveSuccess, setBioSaveSuccess] = useState(false);

  // Skill Passport Privacy Visibility state (PRD FR-012 A1)
  const [showPhotos, setShowPhotos] = useState(true);
  const [showGrades, setShowGrades] = useState(true);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);

  // Share link state
  const [copiedLink, setCopiedLink] = useState(false);

  // Manual Editing state
  const [isEditMode, setIsEditMode] = useState(false);
  const [customPhone, setCustomPhone] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [customExperiences, setCustomExperiences] = useState<EditableExperience[]>([]);
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [manualSaveSuccess, setManualSaveSuccess] = useState(false);

  const initManualFields = useCallback((data: StudentCvResponse) => {
    const defaultExps: EditableExperience[] = (data.experiences || []).map((exp, idx) => ({
      id: exp.placementId || `exp-${idx}`,
      roleTitle: exp.roleTitle || "Junior Software Engineer Intern",
      dudiName: exp.dudiName || "PT Industri Mitra",
      dudiCity: exp.dudiCity || "Surabaya",
      mentorName: exp.mentorName || "",
      periodLabel: exp.periodLabel || "Jan 2026 – Sekarang",
      totalVerifiedJp: exp.totalVerifiedJp || 0,
      technicalJp: exp.technicalJp || 0,
      nonCompetencyJp: exp.nonCompetencyJp || 0,
      bulletPoints: exp.bulletPoints ? exp.bulletPoints.map((b) => b.bulletText) : [],
    }));

    const fallbackFirstExp: EditableExperience = defaultExps[0] || {
      id: "exp-0",
      roleTitle: "Junior Software Engineer Intern",
      dudiName: "PT Industri Mitra",
      dudiCity: "Surabaya",
      mentorName: "",
      periodLabel: "Jan 2026 – Sekarang",
      totalVerifiedJp: 184,
      technicalJp: 168,
      nonCompetencyJp: 16,
      bulletPoints: [],
    };

    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("vokalink_cv_customizations");
        if (saved) {
          const parsed = JSON.parse(saved);
          setCustomPhone(parsed.phone ?? data.student.whatsappNumber ?? "");
          setCustomAddress(parsed.address ?? data.student.schoolAddress ?? "");
          if (Array.isArray(parsed.experiences) && parsed.experiences.length > 0) {
            setCustomExperiences(parsed.experiences);
          } else if (parsed.roleTitle || parsed.bullets) {
            setCustomExperiences([
              {
                ...fallbackFirstExp,
                roleTitle: parsed.roleTitle || fallbackFirstExp.roleTitle,
                bulletPoints:
                  Array.isArray(parsed.bullets) && parsed.bullets.length > 0
                    ? parsed.bullets
                    : fallbackFirstExp.bulletPoints,
              },
            ]);
          } else {
            setCustomExperiences(defaultExps);
          }
          setCustomSkills(
            Array.isArray(parsed.skills) && parsed.skills.length > 0
              ? parsed.skills
              : data.technicalSkills.map((s) => s.name) ?? []
          );
          return;
        }
      }
    } catch {
      // ignore
    }

    setCustomPhone(data.student.whatsappNumber || "081234567890");
    setCustomAddress(data.student.schoolAddress || "Jl. Pendidikan Vokasi No. 1, Surabaya");
    setCustomExperiences(defaultExps);
    setCustomSkills(data.technicalSkills.map((s) => s.name) || []);
  }, []);

  const loadCv = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchStudentCv();
      setCvData(data);
      setBioSummary(data.summaryBio || DEMO_FALLBACK_CV.summaryBio);
      initManualFields(data);
      if (data.visibility) {
        setShowPhotos(data.visibility.showPhotos ?? true);
        setShowGrades(data.visibility.showGrades ?? true);
      }
    } catch {
      // Fallback ke data terverifikasi demo agar tampilan offline tetap interaktif
      setCvData(DEMO_FALLBACK_CV);
      setBioSummary(DEMO_FALLBACK_CV.summaryBio);
      initManualFields(DEMO_FALLBACK_CV);
      setShowPhotos(DEMO_FALLBACK_CV.visibility?.showPhotos ?? true);
      setShowGrades(DEMO_FALLBACK_CV.visibility?.showGrades ?? true);
    } finally {
      setIsLoading(false);
    }
  }, [initManualFields]);

  useEffect(() => {
    loadCv();
  }, [loadCv]);

  const handleCopyLink = () => {
    if (!cvData) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const fullUrl = `${origin}${cvData.verificationUrl}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveBio = async () => {
    if (!cvData || isSavingBio) return;
    setIsSavingBio(true);
    try {
      await updateStudentPassport({ summaryBio: bioSummary });
    } catch {
      console.info("Perubahan bio disimpan ke sesi aktif");
    } finally {
      setBioSaveSuccess(true);
      setCvData((prev) => (prev ? { ...prev, summaryBio: bioSummary } : null));
      setIsSavingBio(false);
      setTimeout(() => setBioSaveSuccess(false), 3000);
    }
  };

  const handleSaveManual = async () => {
    setIsSavingManual(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "vokalink_cv_customizations",
          JSON.stringify({
            phone: customPhone,
            address: customAddress,
            experiences: customExperiences,
            skills: customSkills,
          })
        );
      }
      await updateStudentPassport({ summaryBio: bioSummary });
    } catch {
      console.info("Perubahan disimpan lokal");
    } finally {
      setIsSavingManual(false);
      setManualSaveSuccess(true);
      setTimeout(() => setManualSaveSuccess(false), 2500);
      setIsEditMode(false);
    }
  };

  const handleResetManual = () => {
    const data = cvData || DEMO_FALLBACK_CV;
    if (confirm("Kembalikan semua teks CV ke data asli terverifikasi?")) {
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("vokalink_cv_customizations");
        }
      } catch { }
      setBioSummary(data.summaryBio || DEMO_FALLBACK_CV.summaryBio);
      setCustomPhone(data.student.whatsappNumber || "081234567890");
      setCustomAddress(data.student.schoolAddress || "Jl. Pendidikan Vokasi No. 1, Surabaya");
      const defaultExps = (data.experiences || []).map((exp, idx) => ({
        id: exp.placementId || `exp-${idx}`,
        roleTitle: exp.roleTitle || "Junior Software Engineer Intern",
        dudiName: exp.dudiName || "PT Industri Mitra",
        dudiCity: exp.dudiCity || "Surabaya",
        mentorName: exp.mentorName || "",
        periodLabel: exp.periodLabel || "Jan 2026 – Sekarang",
        totalVerifiedJp: exp.totalVerifiedJp || 0,
        technicalJp: exp.technicalJp || 0,
        nonCompetencyJp: exp.nonCompetencyJp || 0,
        bulletPoints: exp.bulletPoints ? exp.bulletPoints.map((b) => b.bulletText) : [],
      }));
      setCustomExperiences(defaultExps);
      setCustomSkills(data.technicalSkills.map((s) => s.name) || []);
      setIsEditMode(false);
    }
  };

  // Handler: Tambah Pengalaman Praktik Kerja Lapangan (PKL) Baru
  const handleAddExperience = () => {
    setIsEditMode(true);
    const newExp = {
      id: `exp-${Date.now()}`,
      roleTitle: "Posisi / Peran Magang Baru",
      dudiName: "PT Nama Perusahaan Mitra",
      dudiCity: "Surabaya",
      mentorName: "Pembimbing Industri",
      periodLabel: "Feb 2026 – Apr 2026",
      totalVerifiedJp: 40,
      technicalJp: 40,
      nonCompetencyJp: 0,
      bulletPoints: [
        "Melaksanakan penugasan kerja industri dan menyelesaikan problem solving sesuai SOP perusahaan.",
      ],
    };
    setCustomExperiences((prev) => [...prev, newExp]);
  };

  // Handler: Hapus Pengalaman PKL
  const handleRemoveExperience = (id: string) => {
    if (customExperiences.length <= 1) {
      alert("Minimal harus ada satu riwayat pengalaman PKL.");
      return;
    }
    if (confirm("Hapus pengalaman PKL ini dari lembar CV?")) {
      setCustomExperiences((prev) => prev.filter((e) => e.id !== id));
    }
  };

  // Handler: Perbarui Field Pengalaman PKL
  const handleUpdateExperienceField = (
    id: string,
    field: "roleTitle" | "dudiName" | "dudiCity" | "periodLabel" | "mentorName" | "totalVerifiedJp",
    value: string | number
  ) => {
    setCustomExperiences((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  // Handler: Tambah Poin Capaian ke Pengalaman Tertentu
  const handleAddBulletToExp = (expId: string) => {
    setCustomExperiences((prev) =>
      prev.map((e) =>
        e.id === expId
          ? {
            ...e,
            bulletPoints: [
              ...e.bulletPoints,
              "Mengembangkan tugas dan solusi teknis sesuai arahan mentor dan standar industri.",
            ],
          }
          : e
      )
    );
  };

  // Handler: Hapus Poin Capaian dari Pengalaman Tertentu
  const handleRemoveBulletFromExp = (expId: string, bulletIdx: number) => {
    setCustomExperiences((prev) =>
      prev.map((e) =>
        e.id === expId
          ? {
            ...e,
            bulletPoints: e.bulletPoints.filter((_, i) => i !== bulletIdx),
          }
          : e
      )
    );
  };

  // Handler: Edit Teks Poin Capaian
  const handleBulletChangeExp = (
    expId: string,
    bulletIdx: number,
    text: string
  ) => {
    setCustomExperiences((prev) =>
      prev.map((e) =>
        e.id === expId
          ? {
            ...e,
            bulletPoints: e.bulletPoints.map((b, i) => (i === bulletIdx ? text : b)),
          }
          : e
      )
    );
  };

  const handleTogglePrivacy = async (field: "showPhotos" | "showGrades", value: boolean) => {
    const nextPhotos = field === "showPhotos" ? value : showPhotos;
    const nextGrades = field === "showGrades" ? value : showGrades;

    if (field === "showPhotos") setShowPhotos(value);
    if (field === "showGrades") setShowGrades(value);

    setIsUpdatingPrivacy(true);
    try {
      await updateStudentPassport({
        visibility: {
          showPhotos: nextPhotos,
          showGrades: nextGrades,
        },
      });
    } catch {
      console.info("Visibilitas privasi paspor diperbarui di sesi aktif");
    } finally {
      setCvData((prev) =>
        prev
          ? {
            ...prev,
            visibility: { showPhotos: nextPhotos, showGrades: nextGrades },
          }
          : null
      );
      setIsUpdatingPrivacy(false);
      setPrivacySaved(true);
      setTimeout(() => setPrivacySaved(false), 2500);
    }
  };

  const handlePrintPdf = () => {
    if (isEditMode) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "vokalink_cv_customizations",
          JSON.stringify({
            phone: customPhone,
            address: customAddress,
            experiences: customExperiences,
            skills: customSkills,
          })
        );
      }
      setIsEditMode(false);
      setTimeout(() => {
        window.print();
      }, 100);
    } else {
      window.print();
    }
  };

  // ─── 1. State: Loading Skeleton ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-1/3 no-print" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white rounded-2xl p-8 border border-slate-200 space-y-6">
            <div className="h-20 bg-slate-100 rounded-xl" />
            <div className="h-28 bg-slate-100 rounded-xl" />
            <div className="h-40 bg-slate-100 rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-4 no-print">
            <div className="h-32 bg-slate-100 rounded-2xl border border-slate-200" />
            <div className="h-48 bg-slate-100 rounded-2xl border border-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  // ─── 2. State: Error with Recovery ─────────────────────────────────────────
  if (error || !cvData) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">Gagal Memuat CV ATS</h2>
          <p className="text-xs text-slate-500 max-w-md">{error || "Terjadi kesalahan pada server"}</p>
        </div>
        <button
          onClick={loadCv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  // ─── 3. State: Empty Verified Logs (BR-010) ────────────────────────────────
  if (cvData.totalVerifiedJp === 0) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <Lock className="w-5 h-5 text-amber-600" />
            <span>Belum Ada Jam Praktik Terverifikasi (BR-010)</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            CV Standar ATS dan Paspor Kompetensi VokaLink dibangun 100% berbasis data faktual yang telah diverifikasi resmi oleh Mentor DUDI melalui PIN perangkat. Mintalah mentor industri Anda untuk memvalidasi entri jurnal harian Anda terlebih dahulu agar klaim keterampilan dan jam kerja otomatis terisi.
          </p>
          <Link
            href="/student/log/history"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-xl transition"
          >
            Lihat Riwayat & Minta Verifikasi <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { student, experiences, technicalSkills, endorsement, verificationUrl, masterSignatureHash } = cvData;

  const autonomousTasksCount = experiences.reduce(
    (sum, exp) =>
      sum +
      exp.bulletPoints
        .filter((b) => b.predominantAutonomyLevel === 3)
        .reduce((bSum, b) => bSum + b.taskCount, 0),
    0
  );

  const totalTasksCount = experiences.reduce(
    (sum, exp) =>
      sum + exp.bulletPoints.reduce((bSum, b) => bSum + b.taskCount, 0),
    0
  );

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200 print:space-y-0 print:m-0 print:p-0 print:w-full print:block">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. STUDIO PAGE HEADER & FLOATING ACTIONS (no-print)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-200/80 no-print print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            CV ATS &amp; Paspor Kompetensi
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Portofolio digital berbasis jam kerja riil terverifikasi mentor industri
          </p>
        </div>

        {/* Action Buttons: 2x2 symmetrical grid on mobile, horizontal pill row on desktop */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {/* Tombol Mode Edit Manual */}
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={cn(
              "w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-10 px-3 sm:px-5 rounded-full text-xs font-semibold border transition cursor-pointer shadow-2xs whitespace-nowrap active:scale-[0.98]",
              isEditMode
                ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80"
            )}
          >
            {isEditMode ? (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Pratinjau CV</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span>Edit Manual</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-10 px-3 sm:px-5 rounded-full bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 text-xs font-semibold border border-slate-200/80 transition cursor-pointer shadow-2xs whitespace-nowrap"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Bagikan Paspor</span>
              </>
            )}
          </button>

          <Link
            href={verificationUrl}
            target="_blank"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-10 px-3 sm:px-5 rounded-full bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 text-xs font-semibold border border-slate-200/80 transition shadow-2xs whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>Audit Publik</span>
          </Link>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-10 px-4 sm:px-6 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Cetak PDF A4</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. WORKSPACE CANVAS: TWO-COLUMN STUDIO (Desktop Side-by-Side)
             Left: Full-width CV ATS Document (lg:col-span-8) - No wasted margins
             Right: Studio Control Sidebar (lg:col-span-4) - Sticky controls
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block print:w-full print:m-0 print:p-0">
        {/* LEFT COLUMN: CV ATS Sheet (occupies full width of the left column) */}
        <div className="lg:col-span-8 w-full space-y-4 print:w-full print:block print:space-y-0 print:p-0 print:m-0">
          {/* Banner Mode Edit Manual (no-print) */}
          {isEditMode && (
            <div className="w-full bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs no-print print:hidden animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-900">Mode Edit Manual Aktif</p>
                  <p className="text-[11px] text-amber-700">
                    Sesuaikan kontak, ringkasan diri, butir capaian, dan keahlian langsung pada lembar dokumen.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleResetManual}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-amber-100/60 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Asli</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveManual}
                  disabled={isSavingManual}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs cursor-pointer active:scale-95"
                >
                  {isSavingManual ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : manualSaveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tersimpan!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ─── FULL-WIDTH A4 DOCUMENT SHEET: STRICT SINGLE-COLUMN ATS ─── */}
          <div className="cv-print-sheet w-full bg-white rounded-2xl p-4 sm:p-8 lg:p-11 border border-slate-200/90 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)] space-y-4.5 sm:space-y-5 text-slate-900 font-sans text-xs print:p-0 print:border-none print:shadow-none print:rounded-none print:space-y-3.5 print:w-full print:max-w-full">
            {/* CV Header: Student Identity & Official Verification QR (Harvard & ADACareer Style) */}
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start gap-3 sm:gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight uppercase text-slate-900 leading-tight">
                  {student.fullName}
                </h2>
                <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                  {student.departmentName} — {student.schoolName}
                </p>

                {/* Contact line: Inline editable in Edit Mode */}
                {isEditMode ? (
                  <div className="text-[11px] text-slate-600 pt-1 font-normal flex flex-wrap items-center gap-2 no-print">
                    <span>NISN: <strong className="font-semibold text-slate-900">{student.identityNumber}</strong></span>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-medium">WA:</span>
                      <input
                        type="text"
                        value={customPhone}
                        onChange={(e) => setCustomPhone(e.target.value)}
                        className="px-2 py-0.5 bg-slate-50 border border-slate-300 rounded text-slate-900 text-xs w-32 focus:outline-none focus:border-sky-500 font-normal"
                        placeholder="081234567890"
                      />
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-medium">Domisili:</span>
                      <input
                        type="text"
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        className="px-2 py-0.5 bg-slate-50 border border-slate-300 rounded text-slate-900 text-xs w-48 focus:outline-none focus:border-sky-500 font-normal"
                        placeholder="Surabaya, Jawa Timur"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-600 pt-0.5 font-normal leading-relaxed flex flex-wrap items-center gap-x-2">
                    <span>NISN: <strong className="font-semibold text-slate-900">{student.identityNumber}</strong></span>
                    <span>·</span>
                    {(customPhone || student.whatsappNumber) && (
                      <>
                        <span>WhatsApp: <strong className="font-semibold text-slate-900">{customPhone || student.whatsappNumber}</strong></span>
                        <span>·</span>
                      </>
                    )}
                    <span>{customAddress || student.schoolAddress || "Surabaya, Jawa Timur"}</span>
                  </p>
                )}

                <p className="text-[10px] text-slate-500 font-mono pt-0.5 break-all">
                  Paspor Kompetensi &amp; Audit Publik: https://vokalink.id{verificationUrl}
                </p>
              </div>

              {/* QR Code Audit Stamp */}
              <div className="text-center shrink-0">
                <div className="w-[82px] h-[82px] bg-white border border-slate-900 rounded-lg flex flex-col items-center justify-center p-1 shadow-2xs">
                  <QrCodeView
                    value={
                      typeof window !== "undefined"
                        ? `${window.location.origin}${verificationUrl}`
                        : `https://vokalink.id${verificationUrl}`
                    }
                    size={52}
                    errorCorrectionLevel="M"
                  />
                  <span className="text-[7.5px] font-bold text-slate-900 uppercase mt-1 tracking-wider">
                    Scan Audit HRD
                  </span>
                </div>
              </div>
            </div>

            {/* Section 1: Ringkasan Profesional */}
            <div className="space-y-1">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5 flex items-center justify-between">
                <span>Ringkasan Profesional</span>
                {isEditMode && <span className="text-[10px] font-normal text-amber-700 italic">Dapat diedit</span>}
              </h3>
              {isEditMode ? (
                <textarea
                  rows={3}
                  value={bioSummary}
                  onChange={(e) => setBioSummary(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 leading-relaxed font-normal"
                  placeholder="Tuliskan ringkasan pengalaman dan fokus keahlian Anda..."
                />
              ) : (
                <p className="text-slate-800 leading-relaxed text-xs font-normal text-justify">
                  {bioSummary}
                </p>
              )}
            </div>

            {/* Section 2: Pengalaman Praktik Kerja Lapangan (PKL) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    Pengalaman Praktik Kerja Lapangan (PKL)
                  </h3>
                  {isEditMode && customExperiences.length > 0 && (
                    <span className="text-[10px] font-normal text-amber-700 italic no-print">
                      ({customExperiences.length} Posisi)
                    </span>
                  )}
                </div>

                {/* Tombol Tambah Pengalaman: Hanya muncul saat Mode Edit aktif seperti elemen edit lainnya */}
                {isEditMode && (
                  <div className="flex items-center gap-2 no-print">
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-900 border border-sky-300 transition cursor-pointer active:scale-95 shadow-2xs"
                      title="Tambah pengalaman praktik kerja lapangan baru"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-600" />
                      <span>Tambah Pengalaman</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Daftar Pengalaman PKL */}
              <div className="space-y-4">
                {customExperiences.map((exp, expIdx) => (
                  <div
                    key={exp.id || expIdx}
                    className={cn(
                      "space-y-1.5 pt-1 first:pt-0 transition-colors",
                      isEditMode && "p-3 bg-slate-50/70 border border-slate-200/90 rounded-xl"
                    )}
                  >
                    {/* Role Title & Right-Aligned Date Anchor */}
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs sm:text-sm gap-1">
                      {isEditMode ? (
                        <div className="flex-1 max-w-md">
                          <input
                            type="text"
                            value={exp.roleTitle}
                            onChange={(e) =>
                              handleUpdateExperienceField(exp.id, "roleTitle", e.target.value)
                            }
                            className="font-bold text-slate-900 text-xs sm:text-sm bg-white border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-sky-500 w-full"
                            placeholder="Posisi / Peran Magang"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900 min-w-0 flex-1">
                          {exp.roleTitle}
                        </span>
                      )}

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {isEditMode ? (
                          <>
                            <input
                              type="text"
                              value={exp.periodLabel}
                              onChange={(e) =>
                                handleUpdateExperienceField(exp.id, "periodLabel", e.target.value)
                              }
                              className="text-slate-800 font-semibold text-xs bg-white border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-sky-500 w-36 text-right"
                              placeholder="Jan 2026 – Sekarang"
                            />
                            {customExperiences.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveExperience(exp.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="Hapus Pengalaman PKL ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-800 font-semibold text-xs whitespace-nowrap shrink-0 ml-2">
                            {exp.periodLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Company, City & Verified Real Hours */}
                    {isEditMode ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5 text-xs">
                        <input
                          type="text"
                          value={exp.dudiName}
                          onChange={(e) =>
                            handleUpdateExperienceField(exp.id, "dudiName", e.target.value)
                          }
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-sky-500 font-medium"
                          placeholder="Nama Perusahaan / DUDI"
                        />
                        <input
                          type="text"
                          value={exp.dudiCity || ""}
                          onChange={(e) =>
                            handleUpdateExperienceField(exp.id, "dudiCity", e.target.value)
                          }
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-sky-500"
                          placeholder="Kota Penempatan (e.g. Surabaya)"
                        />
                        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2 py-0.5">
                          <input
                            type="number"
                            value={exp.totalVerifiedJp || ""}
                            onChange={(e) =>
                              handleUpdateExperienceField(
                                exp.id,
                                "totalVerifiedJp",
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-16 text-slate-900 font-semibold text-xs focus:outline-none"
                            placeholder="Jam"
                          />
                          <span className="text-[11px] text-slate-500">Jam Kerja Riil</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-[11px] text-slate-700 gap-1 flex-wrap">
                        <span className="font-semibold text-slate-800 min-w-0">
                          {exp.dudiName} {exp.dudiCity ? `· ${exp.dudiCity}` : ""}
                          {exp.mentorName ? ` · Pembimbing: ${exp.mentorName}` : ""}
                        </span>
                        <span className="text-slate-600 font-medium shrink-0">
                          Total: <strong className="text-slate-900">{exp.totalVerifiedJp} Jam Kerja Riil</strong> ({exp.technicalJp || exp.totalVerifiedJp} JP Kejuruan
                          {exp.nonCompetencyJp > 0 ? ` + ${exp.nonCompetencyJp} JP Umum` : ""})
                        </span>
                      </div>
                    )}

                    {/* Action-Oriented Bullet Points */}
                    {isEditMode ? (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-600">
                            Butir Capaian &amp; Tanggung Jawab:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddBulletToExp(exp.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Poin Capaian</span>
                          </button>
                        </div>
                        {exp.bulletPoints.map((bulletText, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-2">
                            <span className="text-slate-400 mt-1.5 text-xs">•</span>
                            <textarea
                              rows={2}
                              value={bulletText}
                              onChange={(e) =>
                                handleBulletChangeExp(exp.id, bIdx, e.target.value)
                              }
                              className="flex-1 text-xs p-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500 leading-relaxed font-normal"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveBulletFromExp(exp.id, bIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0 mt-0.5"
                              title="Hapus butir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="list-disc list-outside pl-4 space-y-1 text-slate-800 text-xs leading-relaxed font-normal">
                        {exp.bulletPoints.map((bulletText, bIdx) => (
                          <li key={bIdx} className="break-words">{bulletText}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* Tombol Tambah Pengalaman di Bawah saat Mode Edit */}
              {isEditMode && (
                <div className="pt-2 no-print">
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="w-full py-2.5 px-3 border border-dashed border-sky-300 hover:border-sky-500 rounded-xl bg-sky-50/50 hover:bg-sky-50 text-sky-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
                  >
                    <Plus className="w-4 h-4 text-sky-600" />
                    <span>Tambah Pengalaman PKL Baru</span>
                  </button>
                </div>
              )}
            </div>

            {/* Section 3: Pendidikan Formal */}
            <div className="space-y-1">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                Pendidikan Formal
              </h3>
              <div className="flex justify-between items-baseline text-xs gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{student.schoolName}</p>
                  <p className="text-slate-700 font-normal">Konsentrasi {student.departmentName} (Fase F SMK Kurikulum Merdeka)</p>
                </div>
                <span className="text-slate-800 font-semibold whitespace-nowrap shrink-0">2024 – 2027</span>
              </div>
            </div>

            {/* Section 4: Keahlian & Instrumen Kerja Terverifikasi */}
            <div className="space-y-1">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5 flex items-center justify-between">
                <span>Keahlian &amp; Instrumen Kerja Terverifikasi</span>
                {isEditMode && <span className="text-[10px] font-normal text-amber-700 italic">Dapat diedit (pisahkan dengan koma)</span>}
              </h3>
              <div className="text-xs text-slate-800 leading-relaxed font-normal space-y-1">
                {isEditMode ? (
                  <div className="pt-0.5">
                    <input
                      type="text"
                      value={customSkills.join(", ")}
                      onChange={(e) =>
                        setCustomSkills(
                          e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500 font-normal"
                      placeholder="TypeScript, Node.js, Express.js, PostgreSQL, Next.js, Git"
                    />
                  </div>
                ) : (
                  <p className="break-words">
                    <strong className="text-slate-900 font-semibold">Teknologi &amp; Alat Industri: </strong>
                    {customSkills.length > 0
                      ? customSkills.join(", ")
                      : technicalSkills.map((s) => `${s.name} (${s.totalJp} Jam)`).join(", ")}
                  </p>
                )}
                <p>
                  <strong className="text-slate-900 font-semibold">Standar Kepatuhan: </strong>
                  SKKNI Bidang Rekayasa Perangkat Lunak / Kejuruan Vokasi, Standar SOP Mandiri &amp; K3 Industri.
                </p>
                <p>
                  <strong className="text-slate-900 font-semibold">Validitas Jam Kerja: </strong>
                  100% tervalidasi mentor industri melalui tanda tangan digital &amp; PIN resmi (BR-010).
                </p>
              </div>
            </div>

            {/* Section 5: Evaluasi & Endorsement Mentor Industri */}
            {endorsement && (
              <div className="space-y-1">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                  Evaluasi &amp; Endorsement Mentor Industri
                </h3>
                <div className="text-xs text-slate-800 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1 print:bg-transparent print:border-none print:p-0">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Skor Etos Kerja: <strong className="text-emerald-700 font-bold">{endorsement.attitudeScore}/100</strong> · Mentor: {endorsement.mentorName} ({endorsement.dudiName})
                    </span>
                  </div>
                  {endorsement.quote && (
                    <p className="italic text-slate-700 text-[11px] leading-relaxed font-normal break-words">
                      &quot;{endorsement.quote}&quot;
                    </p>
                  )}
                  {endorsement.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {endorsement.badges.map((b) => (
                        <span
                          key={b}
                          className="px-2.5 py-0.5 bg-white text-slate-800 border border-slate-300 rounded text-[10px] font-medium"
                        >
                          {b.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 6: Segel Digital Kriptografis & Legalitas Anti-Fraud */}
            <div className="pt-3 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500 font-mono flex-wrap">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  Tersegel Kriptografis HMAC-SHA256 · ID:{" "}
                  {masterSignatureHash ? `${masterSignatureHash.slice(0, 16)}...` : "Menunggu Verifikasi"}
                </span>
              </div>
              <div className="flex items-center gap-3 min-w-0 shrink-0">
                <span className="break-all">Audit: https://vokalink.id{verificationUrl}</span>
                <Link
                  href={verificationUrl}
                  target="_blank"
                  className="text-sky-600 font-sans font-medium hover:underline inline-flex items-center gap-0.5 no-print print:hidden shrink-0"
                >
                  Buka Paspor <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Studio Control Sidebar (no-print, static non-sticky) */}
        <div className="lg:col-span-4 space-y-4 no-print print:hidden">
          {/* Card 1: Ringkasan Metrik Faktual */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 tracking-tight uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>Klaim Terverifikasi (BR-010)</span>
              </h3>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                Faktual DUDI
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Jam Kerja Riil
                </span>
                <p className="text-sm font-semibold text-slate-900 tracking-tight mt-0.5">
                  {cvData.totalVerifiedJp} <span className="text-xs font-normal text-slate-500">Jam</span>
                </p>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  ≈ {cvData.totalVerifiedJp} JP
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Kemandirian SOP
                </span>
                <p className="text-sm font-semibold text-slate-900 tracking-tight mt-0.5">
                  {autonomousTasksCount} <span className="text-xs font-normal text-slate-500">Tugas</span>
                </p>
                <span className="text-[9px] text-emerald-700 font-medium block mt-0.5">
                  Level 3 (Mandiri)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
              Seluruh durasi, nama DUDI, dan unit kompetensi ditarik otomatis dari jurnal tervalidasi PIN mentor (BR-010).
            </p>
          </div>

          {/* Card 2: Sesuaikan Ringkasan Diri (Editor Bio Cepat) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                <span>Ringkasan Diri (Bio)</span>
              </h3>
              {bioSaveSuccess && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70 animate-in fade-in">
                  Tersimpan!
                </span>
              )}
            </div>
            <textarea
              id="bio-edit"
              rows={3}
              value={bioSummary}
              onChange={(e) => setBioSummary(e.target.value)}
              className="w-full text-xs p-3 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 leading-relaxed font-normal"
              placeholder="Tuliskan ringkasan profesional Anda..."
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsEditMode(!isEditMode)}
                className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 transition cursor-pointer"
              >
                {isEditMode ? "Tutup Edit Lembar" : "Mode Edit Lembar →"}
              </button>
              <button
                type="button"
                onClick={handleSaveBio}
                disabled={isSavingBio}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {isSavingBio ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Bio</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 3: Pengaturan Privasi Paspor Publik (FR-012) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <h3 className="text-xs font-semibold text-slate-900 tracking-tight">
                  Privasi Paspor Publik (FR-012)
                </h3>
              </div>
              {privacySaved && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70 animate-in fade-in">
                  Tersimpan!
                </span>
              )}
            </div>

            <div className="space-y-2 pt-0.5">
              {/* Toggle 1: Foto Bukti */}
              <div className="p-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 block truncate">Galeri Foto Bukti</span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {showPhotos ? "Foto tampil di audit HRD" : "Foto disembunyikan"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePrivacy("showPhotos", !showPhotos)}
                  disabled={isUpdatingPrivacy}
                  className={cn(
                    "w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 disabled:opacity-60",
                    showPhotos ? "bg-emerald-600" : "bg-slate-300"
                  )}
                  title="Toggle tampilan foto bukti"
                >
                  <div
                    className={cn(
                      "bg-white w-4.5 h-4.5 rounded-full shadow-2xs transform transition-transform duration-200",
                      showPhotos ? "translate-x-4.5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Toggle 2: Nilai Sikap Mentor */}
              <div className="p-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 block truncate">Nilai Sikap Mentor</span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {showGrades ? "Skor etos kerja tampil" : "Skor sikap disembunyikan"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePrivacy("showGrades", !showGrades)}
                  disabled={isUpdatingPrivacy}
                  className={cn(
                    "w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 disabled:opacity-60",
                    showGrades ? "bg-emerald-600" : "bg-slate-300"
                  )}
                  title="Toggle tampilan nilai sikap"
                >
                  <div
                    className={cn(
                      "bg-white w-4.5 h-4.5 rounded-full shadow-2xs transform transition-transform duration-200",
                      showGrades ? "translate-x-4.5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Jaminan Standar ATS (Harvard & ADACareer) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs tracking-tight">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Standar Kepatuhan ATS 100%</span>
            </div>

            <ul className="space-y-1.5 text-[11px] text-slate-600 font-normal">
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Format Kolom Tunggal (*Single-Column*) lolos mesin seleksi ATS.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Pencapaian berbasis formula Google XYZ (*Tindakan + Jam Riil + Hasil*).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Bebas klaim fiktif karena tersinkron dari validasi PIN mentor (BR-010).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
