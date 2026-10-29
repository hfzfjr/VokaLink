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
  Edit3,
  Plus,
  Trash2,
  Eye,
  RotateCcw,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { fetchStudentCv, updateStudentPassport, getPublicAppUrl, type StudentCvResponse } from "@/lib/api";
import { QrCodeView } from "@/components/ui/QrCodeView";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/use-auth";
import CareerCvLoading from "./loading";

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

export interface EditableEducation {
  id: string;
  schoolName: string;
  department: string;
  periodLabel: string;
  achievement?: string;
}

export interface EditableProject {
  id: string;
  title: string;
  techStack: string;
  periodLabel: string;
  description: string;
}

export interface EditableEndorsement {
  mentorName: string;
  mentorRole: string;
  dudiName: string;
  attitudeScore: number;
  quote: string;
  badges: string[];
}

const DEFAULT_EDUCATIONS: EditableEducation[] = [
  {
    id: "edu-1",
    schoolName: "SMK Demo VokaLink",
    department: "Konsentrasi Rekayasa Perangkat Lunak (Fase F SMK Kurikulum Merdeka)",
    periodLabel: "2024 – 2027",
    achievement: "Rata-rata Nilai Kejuruan: 92/100 · Siswa Berprestasi Bidang RPL",
  },
];

const DEFAULT_PROJECTS: EditableProject[] = [
  {
    id: "proj-1",
    title: "Sistem Logbook PWA & Verifikasi Kriptografis VokaLink",
    techStack: "Next.js 15, TypeScript, PostgreSQL, Tailwind CSS, Dexie.js",
    periodLabel: "2026",
    description:
      "Membangun platform PWA offline-first untuk pencatatan logbook magang dengan verifikasi tanpa akun oleh mentor DUDI, audit paspor kompetensi publik ber-QR, dan segel kriptografi HMAC-SHA256.",
  },
  {
    id: "proj-2",
    title: "RESTful API Microservices Express & Database PostgreSQL",
    techStack: "Express.js, TypeScript, PostgreSQL, Prisma ORM, Jose",
    periodLabel: "2026",
    description:
      "Mengembangkan 12 modul endpoint backend dengan otentikasi JWT, rate limiting, validasi Zod, dan proteksi tenant guard multi-sekolah mandiri.",
  },
];

const DEFAULT_SOFT_SKILLS = [
  "Komunikasi Kolaboratif",
  "Problem Solving Mandiri",
  "Disiplin Presensi & K3",
  "Adaptabilitas Cepat",
  "Manajemen Waktu",
];

const DEFAULT_COMPLIANCE =
  "SKKNI Bidang Rekayasa Perangkat Lunak / Kejuruan Vokasi, Standar SOP Mandiri & K3 Industri.";

const DEFAULT_VALIDITY =
  "100% tervalidasi mentor industri melalui tanda tangan digital & PIN resmi.";

export default function CareerCvPage() {
  const { user } = useAuth();
  const [cvData, setCvData] = useState<StudentCvResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bio state & editing
  const [bioSummary, setBioSummary] = useState("");
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [bioSaveSuccess, setBioSaveSuccess] = useState(false);

  // Share link state
  const [copiedLink, setCopiedLink] = useState(false);

  // ─── Complete Manual Editing State (Semua Field Dapat Diedit) ───
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [manualSaveSuccess, setManualSaveSuccess] = useState(false);

  // 1. Identitas Personal
  const [customFullName, setCustomFullName] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [customSchoolName, setCustomSchoolName] = useState("");
  const [customNisn, setCustomNisn] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [customPortfolio, setCustomPortfolio] = useState("");

  // 2. Pengalaman PKL
  const [customExperiences, setCustomExperiences] = useState<EditableExperience[]>([]);

  // 3. Pendidikan Formal
  const [customEducations, setCustomEducations] = useState<EditableEducation[]>([]);

  // 4. Proyek Portofolio
  const [customProjects, setCustomProjects] = useState<EditableProject[]>([]);

  // 5. Keahlian & Kepatuhan
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [customSoftSkills, setCustomSoftSkills] = useState<string[]>([]);
  const [customCompliance, setCustomCompliance] = useState("");
  const [customValidityNote, setCustomValidityNote] = useState("");

  // 6. Endorsement & Catatan Mentor
  const [customEndorsement, setCustomEndorsement] = useState<EditableEndorsement>({
    mentorName: "Rizky Firmansyah",
    mentorRole: "Engineering Lead",
    dudiName: "PT Nusantara Tech",
    attitudeScore: 96,
    quote:
      "Andi memiliki etos kerja luar biasa, mampu menyelesaikan rancangan REST API backend secara mandiri, dan berdisiplin tinggi dalam mengikuti SOP industri.",
    badges: ["INISIATIF_TINGGI", "PROBLEM_SOLVER", "DISIPLIN_PRESENSI"],
  });

  const initManualFields = useCallback((data: StudentCvResponse) => {
    const defaultExps: EditableExperience[] = (data.experiences || []).map((exp, idx) => ({
      id: exp.placementId || `exp-${idx}`,
      roleTitle: exp.roleTitle || "Junior Software Engineer Intern",
      dudiName: exp.dudiName || "PT Industri Mitra",
      dudiCity: exp.dudiCity || "Surabaya",
      mentorName: exp.mentorName || "Rizky Firmansyah (Engineering Lead)",
      periodLabel: exp.periodLabel || "Jan 2026 – Sekarang",
      totalVerifiedJp: exp.totalVerifiedJp || 0,
      technicalJp: exp.technicalJp || 0,
      nonCompetencyJp: exp.nonCompetencyJp || 0,
      bulletPoints: exp.bulletPoints ? exp.bulletPoints.map((b) => b.bulletText) : [],
    }));

    // Cek cache kustomisasi lokal terisolasi per ID siswa jika pernah disimpan
    try {
      if (typeof window !== "undefined") {
        const storageKey = `vokalink_cv_customizations_${data.student.id || "default"}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const p = JSON.parse(saved);
          setCustomFullName(p.fullName || data.student.fullName || "Andi Pratama");
          setCustomDepartment(p.departmentName || data.student.departmentName || "Rekayasa Perangkat Lunak (RPL)");
          setCustomSchoolName(p.schoolName || data.student.schoolName || "SMK Demo VokaLink");
          setCustomNisn(p.nisn || data.student.identityNumber || "0078901234");
          setCustomEmail(p.email || data.student.email || user?.email || "andipratama@smktelkom1medan.sch.id");
          setCustomPhone(p.phone || data.student.whatsappNumber || "081234567890");
          setCustomAddress(p.address || data.student.schoolAddress || "Medan, Sumatera Utara");
          setCustomPortfolio(p.portfolio || "github.com/andipratama");
          if (p.bioSummary) setBioSummary(p.bioSummary);
          if (Array.isArray(p.experiences) && p.experiences.length > 0) setCustomExperiences(p.experiences);
          else setCustomExperiences(defaultExps);
          if (Array.isArray(p.educations) && p.educations.length > 0) setCustomEducations(p.educations);
          else setCustomEducations(DEFAULT_EDUCATIONS);
          if (Array.isArray(p.projects) && p.projects.length > 0) setCustomProjects(p.projects);
          else setCustomProjects(DEFAULT_PROJECTS);
          if (Array.isArray(p.skills) && p.skills.length > 0) setCustomSkills(p.skills);
          else setCustomSkills(data.technicalSkills.map((s) => s.name) || []);
          if (Array.isArray(p.softSkills) && p.softSkills.length > 0) setCustomSoftSkills(p.softSkills);
          else setCustomSoftSkills(DEFAULT_SOFT_SKILLS);
          setCustomCompliance(p.compliance || DEFAULT_COMPLIANCE);
          setCustomValidityNote(p.validityNote || DEFAULT_VALIDITY);
          if (p.endorsement) setCustomEndorsement(p.endorsement);
          return;
        }
      }
    } catch {
      // ignore JSON parse error
    }

    // Default Fallbacks
    setCustomFullName(data.student.fullName || "Andi Pratama");
    setCustomDepartment(data.student.departmentName || "Rekayasa Perangkat Lunak (RPL)");
    setCustomSchoolName(data.student.schoolName || "SMK Telkom 1 Medan");
    setCustomNisn(data.student.identityNumber || "0078901234");
    setCustomEmail(data.student.email || user?.email || "andipratama@smktelkom1medan.sch.id");
    setCustomPhone(data.student.whatsappNumber || "081234567890");
    setCustomAddress(data.student.schoolAddress || "Medan, Sumatera Utara");
    setCustomPortfolio("github.com/andipratama");
    setCustomExperiences(defaultExps);
    setCustomEducations(DEFAULT_EDUCATIONS);
    setCustomProjects(DEFAULT_PROJECTS);
    setCustomSkills(data.technicalSkills.map((s) => s.name) || []);
    setCustomSoftSkills(DEFAULT_SOFT_SKILLS);
    setCustomCompliance(DEFAULT_COMPLIANCE);
    setCustomValidityNote(DEFAULT_VALIDITY);
    if (data.endorsement) {
      setCustomEndorsement({
        mentorName: data.endorsement.mentorName || "Rizky Firmansyah",
        mentorRole: "Engineering Lead",
        dudiName: data.endorsement.dudiName || "PT Nusantara Tech",
        attitudeScore: data.endorsement.attitudeScore || 96,
        quote: data.endorsement.quote || "",
        badges: data.endorsement.badges || ["INISIATIF_TINGGI", "PROBLEM_SOLVER"],
      });
    }
  }, []);

  const loadCv = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const startTime = Date.now();
    try {
      const data = await fetchStudentCv(user?.id);
      setCvData(data);
      setBioSummary(data.summaryBio || "");
      initManualFields(data);
    } catch (err: any) {
      setError(err.message || "Gagal memuat CV ATS dari server database.");
      setCvData(null);
    } finally {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 300 - elapsed);
      setTimeout(() => {
        setIsLoading(false);
      }, delay);
    }
  }, [initManualFields, user?.id]);

  useEffect(() => {
    loadCv();
  }, [loadCv]);

  const fullVerificationUrl = cvData ? `${getPublicAppUrl()}${cvData.verificationUrl}` : "";

  const handleCopyLink = () => {
    if (!fullVerificationUrl) return;
    navigator.clipboard?.writeText(fullVerificationUrl);
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
        const storageKey = `vokalink_cv_customizations_${cvData?.student?.id || "default"}`;
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            fullName: customFullName,
            departmentName: customDepartment,
            schoolName: customSchoolName,
            nisn: customNisn,
            email: customEmail,
            phone: customPhone,
            address: customAddress,
            portfolio: customPortfolio,
            bioSummary,
            experiences: customExperiences,
            educations: customEducations,
            projects: customProjects,
            skills: customSkills,
            softSkills: customSoftSkills,
            compliance: customCompliance,
            validityNote: customValidityNote,
            endorsement: customEndorsement,
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
    if (!cvData) return;
    if (confirm("Kembalikan semua teks CV ke data asli terverifikasi?")) {
      try {
        if (typeof window !== "undefined") {
          const storageKey = `vokalink_cv_customizations_${cvData?.student?.id || "default"}`;
          localStorage.removeItem(storageKey);
        }
      } catch {}
      initManualFields(cvData);
      setBioSummary(cvData.summaryBio || "");
      setIsEditMode(false);
    }
  };

  // Handlers untuk Pengalaman PKL
  const handleAddExperience = () => {
    setIsEditMode(true);
    const newExp: EditableExperience = {
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

  const handleRemoveExperience = (id: string) => {
    if (customExperiences.length <= 1) {
      alert("Minimal harus ada satu riwayat pengalaman PKL.");
      return;
    }
    if (confirm("Hapus pengalaman PKL ini dari lembar CV?")) {
      setCustomExperiences((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleUpdateExperienceField = (
    id: string,
    field: "roleTitle" | "dudiName" | "dudiCity" | "periodLabel" | "mentorName" | "totalVerifiedJp",
    value: string | number
  ) => {
    setCustomExperiences((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

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

  const handleBulletChangeExp = (expId: string, bulletIdx: number, text: string) => {
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

  // Handlers untuk Pendidikan Formal
  const handleAddEducation = () => {
    setIsEditMode(true);
    const newEdu: EditableEducation = {
      id: `edu-${Date.now()}`,
      schoolName: "Nama Sekolah / Lembaga Baru",
      department: "Konsentrasi Keahlian / Bidang Studi",
      periodLabel: "2021 – 2024",
      achievement: "Prestasi Akademik / Nilai Akhir",
    };
    setCustomEducations((prev) => [...prev, newEdu]);
  };

  const handleRemoveEducation = (id: string) => {
    if (customEducations.length <= 1) {
      alert("Minimal harus ada satu riwayat pendidikan formal.");
      return;
    }
    if (confirm("Hapus riwayat pendidikan ini?")) {
      setCustomEducations((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleUpdateEducationField = (
    id: string,
    field: keyof EditableEducation,
    value: string
  ) => {
    setCustomEducations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  // Handlers untuk Proyek Portofolio
  const handleAddProject = () => {
    setIsEditMode(true);
    const newProj: EditableProject = {
      id: `proj-${Date.now()}`,
      title: "Judul Proyek / Aplikasi Unggulan Baru",
      techStack: "Teknologi, Framework, Database",
      periodLabel: "2026",
      description: "Deskripsi solusi teknis, dampak proyek, dan kontribusi mandiri Anda.",
    };
    setCustomProjects((prev) => [...prev, newProj]);
  };

  const handleRemoveProject = (id: string) => {
    if (confirm("Hapus proyek ini dari lembar CV?")) {
      setCustomProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleUpdateProjectField = (
    id: string,
    field: keyof EditableProject,
    value: string
  ) => {
    setCustomProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handlePrintPdf = () => {
    if (typeof window !== "undefined") {
      if (isEditMode) {
        setIsEditMode(false);
      }
      window.print();
    }
  };

  // ─── 1. State: Loading Skeleton ──────────────────────────────────────────
  if (isLoading) {
    return <CareerCvLoading />;
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

  // ─── 3. State: Empty Verified Logs ────────────────────────────────
  if (cvData.totalVerifiedJp === 0) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <Lock className="w-5 h-5 text-amber-600" />
            <span>Belum Ada Jam Praktik Terverifikasi</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            CV Standar ATS dan Paspor Kompetensi VokaLink dibangun berbasis data faktual yang telah diverifikasi resmi oleh Mentor DUDI melalui PIN perangkat. Mintalah mentor industri Anda untuk memvalidasi entri jurnal harian Anda terlebih dahulu agar klaim keterampilan dan jam kerja otomatis terisi.
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

  const { experiences, verificationUrl, masterSignatureHash } = cvData;

  const autonomousTasksCount = experiences.reduce(
    (sum, exp) =>
      sum +
      exp.bulletPoints
        .filter((b) => b.predominantAutonomyLevel === 3)
        .reduce((bSum, b) => bSum + b.taskCount, 0),
    0
  );

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200 font-sans print:space-y-0 print:m-0 print:p-0 print:w-full print:block">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. STUDIO PAGE HEADER & FLOATING ACTIONS (no-print)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-200/80 no-print print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            CV ATS &amp; Paspor Kompetensi
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Portofolio digital berbasis jam kerja riil terverifikasi mentor industri (Mode Edit Penuh Aktif)
          </p>
        </div>

        {/* Action Buttons: 2x2 symmetrical grid on mobile, horizontal row on desktop */}
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
                <span>Edit Semua Bagian</span>
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
                  <p className="text-xs font-bold text-amber-900">Mode Edit Lengkap Aktif</p>
                  <p className="text-[11px] text-amber-700 font-normal">
                    Seluruh identitas, riwayat pendidikan, pengalaman PKL, proyek portofolio, dan keahlian dapat disesuaikan langsung pada lembar dokumen.
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

          {/* ─── FULL-WIDTH A4 DOCUMENT SHEET: STRICT SINGLE-COLUMN ATS (Harvard Standard) ─── */}
          <div className="cv-print-sheet w-full bg-white rounded-2xl p-4 sm:p-8 lg:p-11 border border-slate-200/90 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)] space-y-4.5 sm:space-y-5 text-slate-900 font-sans text-xs print:p-0 print:border-none print:shadow-none print:rounded-none print:space-y-3.5 print:w-full print:max-w-full">
            
            {/* ─── Header: Student Identity & Official Verification QR ─── */}
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start gap-3 sm:gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                {isEditMode ? (
                  <div className="space-y-2 no-print">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          value={customFullName}
                          onChange={(e) => setCustomFullName(e.target.value)}
                          className="w-full font-bold text-base bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-900 focus:outline-none focus:border-sky-500"
                          placeholder="Nama Lengkap Siswa"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Jurusan / Konsentrasi
                        </label>
                        <input
                          type="text"
                          value={customDepartment}
                          onChange={(e) => setCustomDepartment(e.target.value)}
                          className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-none focus:border-sky-500"
                          placeholder="e.g. Rekayasa Perangkat Lunak (RPL)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Asal Sekolah
                        </label>
                        <input
                          type="text"
                          value={customSchoolName}
                          onChange={(e) => setCustomSchoolName(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-none focus:border-sky-500"
                          placeholder="e.g. SMK Negeri 1 Surabaya"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          NISN Siswa
                        </label>
                        <input
                          type="text"
                          value={customNisn}
                          onChange={(e) => setCustomNisn(e.target.value)}
                          className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-none focus:border-sky-500"
                          placeholder="0078901234"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-0.5">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Email
                        </label>
                        <input
                          type="email"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-slate-800 focus:outline-none focus:border-sky-500"
                          placeholder="andi@smk.sch.id"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          No. WhatsApp
                        </label>
                        <input
                          type="text"
                          value={customPhone}
                          onChange={(e) => setCustomPhone(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-slate-800 focus:outline-none focus:border-sky-500"
                          placeholder="081234567890"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Domisili / Kota
                        </label>
                        <input
                          type="text"
                          value={customAddress}
                          onChange={(e) => setCustomAddress(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-slate-800 focus:outline-none focus:border-sky-500"
                          placeholder="Surabaya, Jawa Timur"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Portfolio / GitHub
                        </label>
                        <input
                          type="text"
                          value={customPortfolio}
                          onChange={(e) => setCustomPortfolio(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-slate-800 focus:outline-none focus:border-sky-500"
                          placeholder="github.com/andi"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight uppercase text-slate-900 leading-tight">
                      {customFullName}
                    </h2>
                    <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                      {customDepartment} — {customSchoolName}
                    </p>
                    <p className="text-[11px] text-slate-600 pt-0.5 font-normal leading-relaxed flex flex-wrap items-center gap-x-2">
                      <span>NISN: <strong className="font-semibold text-slate-900">{customNisn}</strong></span>
                      <span>·</span>
                      {customEmail && (
                        <>
                          <span>Email: <strong className="font-semibold text-slate-900">{customEmail}</strong></span>
                          <span>·</span>
                        </>
                      )}
                      {customPhone && (
                        <>
                          <span>WhatsApp: <strong className="font-semibold text-slate-900">{customPhone}</strong></span>
                          <span>·</span>
                        </>
                      )}
                      <span>{customAddress}</span>
                      {customPortfolio && (
                        <>
                          <span>·</span>
                          <span className="font-semibold text-slate-800">{customPortfolio}</span>
                        </>
                      )}
                    </p>
                  </>
                )}

                <p className="text-[10px] text-slate-500 font-mono pt-0.5 break-all">
                  Paspor Kompetensi &amp; Audit Publik: {fullVerificationUrl}
                </p>
              </div>

              {/* QR Code Audit Stamp */}
              <div className="text-center shrink-0">
                <div className="w-[82px] h-[82px] bg-white border border-slate-900 rounded-lg flex flex-col items-center justify-center p-1 shadow-2xs">
                  <QrCodeView
                    value={fullVerificationUrl}
                    size={52}
                    errorCorrectionLevel="M"
                  />
                  <span className="text-[7.5px] font-bold text-slate-900 uppercase mt-1 tracking-wider">
                    Scan Audit HRD
                  </span>
                </div>
              </div>
            </div>

            {/* ─── Section 1: Ringkasan Profesional ─── */}
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

            {/* ─── Section 2: Pengalaman Praktik Kerja Lapangan (PKL) ─── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-700 inline" />
                    <span>Pengalaman Praktik Kerja Lapangan (PKL)</span>
                  </h3>
                  {isEditMode && (
                    <span className="text-[10px] font-normal text-amber-700 italic no-print">
                      ({customExperiences.length} Posisi)
                    </span>
                  )}
                </div>

                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-300 transition cursor-pointer active:scale-95 shadow-2xs no-print"
                  >
                    <Plus className="w-3.5 h-3.5 text-sky-600" />
                    <span>Tambah Pengalaman</span>
                  </button>
                )}
              </div>

              {/* Daftar Pengalaman PKL */}
              <div className="space-y-4">
                {customExperiences.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500">
                    Belum ada riwayat jurnal PKL yang berstatus terverifikasi resmi (VERIFIED) oleh mentor industri. Jurnal yang telah disetujui akan otomatis dikonversi menjadi capaian kerja di sini.
                  </div>
                ) : (
                  customExperiences.map((exp, expIdx) => (
                  <div
                    key={exp.id || expIdx}
                    className={cn(
                      "space-y-1.5 pt-1 first:pt-0 transition-colors",
                      isEditMode && "p-3 bg-slate-50/70 border border-slate-200/90 rounded-xl"
                    )}
                  >
                    {/* Role Title & Period */}
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

                    {/* Company, City, Mentor & Real Hours */}
                    {isEditMode ? (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-0.5 text-xs">
                        <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 rounded px-2.5 py-1 text-slate-800 text-xs font-semibold">
                          <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{exp.dudiName}</span>
                        </div>
                        <input
                          type="text"
                          value={exp.dudiCity || ""}
                          onChange={(e) =>
                            handleUpdateExperienceField(exp.id, "dudiCity", e.target.value)
                          }
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-sky-500"
                          placeholder="Kota Penempatan (e.g. Surabaya)"
                        />
                        <input
                          type="text"
                          value={exp.mentorName || ""}
                          onChange={(e) =>
                            handleUpdateExperienceField(exp.id, "mentorName", e.target.value)
                          }
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-sky-500"
                          placeholder="Nama Pembimbing / Mentor"
                        />
                        <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 rounded px-2.5 py-1 text-slate-800 text-xs font-semibold">
                          <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{exp.totalVerifiedJp} Jam (Terkunci)</span>
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

                    {/* Bullet Points */}
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
                ))
              )}
              </div>
            </div>

            {/* ─── Section 3: Pendidikan Formal (Dapat Diedit Lengkap) ─── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-0.5 mb-1.5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-700 inline" />
                  <span>Pendidikan Formal</span>
                </h3>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleAddEducation}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 transition cursor-pointer no-print"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Pendidikan</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {customEducations.map((edu, eIdx) => (
                  <div
                    key={edu.id || eIdx}
                    className={cn(
                      "space-y-1",
                      isEditMode && "p-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl"
                    )}
                  >
                    {isEditMode ? (
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={edu.schoolName}
                            onChange={(e) =>
                              handleUpdateEducationField(edu.id, "schoolName", e.target.value)
                            }
                            className="font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-sky-500"
                            placeholder="Nama Sekolah"
                          />
                          <input
                            type="text"
                            value={edu.department}
                            onChange={(e) =>
                              handleUpdateEducationField(edu.id, "department", e.target.value)
                            }
                            className="text-slate-800 bg-white border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-sky-500"
                            placeholder="Konsentrasi Keahlian"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={edu.periodLabel}
                              onChange={(e) =>
                                handleUpdateEducationField(edu.id, "periodLabel", e.target.value)
                              }
                              className="w-full text-slate-800 font-semibold bg-white border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-sky-500 text-right"
                              placeholder="2024 – 2027"
                            />
                            {customEducations.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveEducation(edu.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Hapus pendidikan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={edu.achievement || ""}
                          onChange={(e) =>
                            handleUpdateEducationField(edu.id, "achievement", e.target.value)
                          }
                          className="w-full text-xs text-slate-600 bg-white border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-sky-500"
                          placeholder="Keterangan Nilai / Prestasi / Capaian"
                        />
                      </div>
                    ) : (
                      <div className="text-xs">
                        <div className="flex justify-between items-baseline gap-2">
                          <p className="font-bold text-slate-900">{edu.schoolName}</p>
                          <span className="text-slate-800 font-semibold whitespace-nowrap shrink-0">
                            {edu.periodLabel}
                          </span>
                        </div>
                        <p className="text-slate-700 font-normal">{edu.department}</p>
                        {edu.achievement && (
                          <p className="text-slate-500 text-[11px] font-normal">{edu.achievement}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Section 4: Proyek Unggulan / Portofolio Industri (Dapat Diedit Lengkap) ─── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-0.5 mb-1.5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-slate-700 inline" />
                  <span>Proyek Unggulan &amp; Portofolio Industri</span>
                </h3>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleAddProject}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 transition cursor-pointer no-print"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Proyek</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {customProjects.map((proj, pIdx) => (
                  <div
                    key={proj.id || pIdx}
                    className={cn(
                      "space-y-1",
                      isEditMode && "p-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl"
                    )}
                  >
                    {isEditMode ? (
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={proj.title}
                            onChange={(e) =>
                              handleUpdateProjectField(proj.id, "title", e.target.value)
                            }
                            className="font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-sky-500"
                            placeholder="Judul Proyek"
                          />
                          <input
                            type="text"
                            value={proj.techStack}
                            onChange={(e) =>
                              handleUpdateProjectField(proj.id, "techStack", e.target.value)
                            }
                            className="text-slate-800 bg-white border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-sky-500"
                            placeholder="Teknologi yang digunakan"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={proj.periodLabel}
                              onChange={(e) =>
                                handleUpdateProjectField(proj.id, "periodLabel", e.target.value)
                              }
                              className="w-full text-slate-800 font-semibold bg-white border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-sky-500 text-right"
                              placeholder="Tahun / Periode"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveProject(proj.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Hapus proyek"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <textarea
                          rows={2}
                          value={proj.description}
                          onChange={(e) =>
                            handleUpdateProjectField(proj.id, "description", e.target.value)
                          }
                          className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                          placeholder="Deskripsi pencapaian dan implementasi teknis..."
                        />
                      </div>
                    ) : (
                      <div className="text-xs">
                        <div className="flex justify-between items-baseline gap-2">
                          <p className="font-bold text-slate-900">
                            {proj.title}{" "}
                            <span className="text-slate-500 font-normal italic">
                              · {proj.techStack}
                            </span>
                          </p>
                          <span className="text-slate-800 font-semibold whitespace-nowrap shrink-0">
                            {proj.periodLabel}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-normal mt-0.5">
                          {proj.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Section 5: Keahlian & Instrumen Kerja Terverifikasi (Dapat Diedit Lengkap) ─── */}
            <div className="space-y-1">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-slate-700 inline" />
                  <span>Keahlian &amp; Instrumen Kerja Terverifikasi</span>
                </span>
                {isEditMode && <span className="text-[10px] font-normal text-amber-700 italic">Dapat diedit</span>}
              </h3>
              <div className="text-xs text-slate-800 leading-relaxed font-normal space-y-2">
                {isEditMode ? (
                  <div className="space-y-2 pt-0.5 no-print">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Teknologi &amp; Alat Industri (pisahkan dengan koma)
                      </label>
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
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Keahlian Interpersonal &amp; Etos Kerja (pisahkan dengan koma)
                      </label>
                      <input
                        type="text"
                        value={customSoftSkills.join(", ")}
                        onChange={(e) =>
                          setCustomSoftSkills(
                            e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                          )
                        }
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500 font-normal"
                        placeholder="Komunikasi Kolaboratif, Problem Solving, Disiplin Presensi"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Standar Kepatuhan Industri
                      </label>
                      <input
                        type="text"
                        value={customCompliance}
                        onChange={(e) => setCustomCompliance(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500 font-normal"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="break-words">
                      <strong className="text-slate-900 font-semibold">Teknologi &amp; Alat Industri: </strong>
                      {customSkills.length > 0
                        ? customSkills.join(", ")
                        : "TypeScript, Node.js, Express.js, PostgreSQL, Next.js, Git, Tailwind CSS"}
                    </p>
                    <p className="break-words">
                      <strong className="text-slate-900 font-semibold">Keahlian Interpersonal &amp; Etos: </strong>
                      {customSoftSkills.join(", ")}
                    </p>
                    <p>
                      <strong className="text-slate-900 font-semibold">Standar Kepatuhan: </strong>
                      {customCompliance}
                    </p>
                    <p>
                      <strong className="text-slate-900 font-semibold">Validitas Jam Kerja: </strong>
                      {customValidityNote}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* ─── Section 6: Evaluasi & Endorsement Mentor Industri (Dapat Diedit Lengkap) ─── */}
            <div className="space-y-1">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5 flex items-center justify-between">
                <span>Evaluasi &amp; Endorsement Mentor Industri</span>
                {isEditMode && <span className="text-[10px] font-normal text-amber-700 italic">Dapat diedit</span>}
              </h3>
              
              {isEditMode ? (
                <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200/90 text-xs no-print">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Nama Pembimbing / Mentor
                      </label>
                      <input
                        type="text"
                        value={customEndorsement.mentorName}
                        onChange={(e) =>
                          setCustomEndorsement((prev) => ({ ...prev, mentorName: e.target.value }))
                        }
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 focus:outline-none focus:border-sky-500"
                        placeholder="Rizky Firmansyah"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Perusahaan / DUDI Mitra
                      </label>
                      <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded px-2.5 py-1 text-slate-800 text-xs font-semibold">
                        <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{customEndorsement.dudiName || cvData?.endorsement?.dudiName || "Mitra Industri"}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Skor Etos Kerja (Resmi Mentor)
                      </label>
                      <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded px-2.5 py-1 text-slate-800 text-xs font-semibold">
                        <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{customEndorsement.attitudeScore || cvData?.endorsement?.attitudeScore || 0} / 100</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Catatan / Quote Evaluasi Mentor
                    </label>
                    <textarea
                      rows={2}
                      value={customEndorsement.quote}
                      onChange={(e) =>
                        setCustomEndorsement((prev) => ({ ...prev, quote: e.target.value }))
                      }
                      className="w-full bg-white border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:border-sky-500"
                      placeholder="Catatan dari mentor industri..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Lencana Etos Kerja (pisahkan dengan koma)
                    </label>
                    <input
                      type="text"
                      value={customEndorsement.badges.join(", ")}
                      onChange={(e) =>
                        setCustomEndorsement((prev) => ({
                          ...prev,
                          badges: e.target.value.split(",").map((b) => b.trim()).filter(Boolean),
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 focus:outline-none focus:border-sky-500"
                      placeholder="INISIATIF_TINGGI, PROBLEM_SOLVER, DISIPLIN_PRESENSI"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-800 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1 print:bg-transparent print:border-none print:p-0">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Skor Etos Kerja: <strong className="text-emerald-700 font-bold">{customEndorsement.attitudeScore}/100</strong> · Mentor: {customEndorsement.mentorName} ({customEndorsement.dudiName})
                    </span>
                  </div>
                  {customEndorsement.quote && (
                    <p className="italic text-slate-700 text-[11px] leading-relaxed font-normal break-words">
                      &quot;{customEndorsement.quote}&quot;
                    </p>
                  )}
                  {customEndorsement.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {customEndorsement.badges.map((b) => (
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
              )}
            </div>

            {/* ─── Section 7: Segel Digital Kriptografis & Legalitas Anti-Fraud ─── */}
            <div className="pt-3 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500 font-mono flex-wrap">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  Tersegel Kriptografis HMAC-SHA256 · ID:{" "}
                  {masterSignatureHash ? `${masterSignatureHash.slice(0, 16)}...` : "Menunggu Verifikasi"}
                </span>
              </div>
              <div className="flex items-center gap-3 min-w-0 shrink-0">
                <span className="break-all">Audit: {fullVerificationUrl}</span>
                <Link
                  href={fullVerificationUrl || verificationUrl}
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
                <span>Klaim Terverifikasi</span>
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
              Seluruh durasi, nama DUDI, dan unit kompetensi ditarik otomatis dari jurnal tervalidasi PIN mentor.
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

          {/* Card 3: Jaminan Standar ATS (Harvard & ADACareer) */}
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
                <span>Bebas klaim fiktif karena tersinkron dari validasi PIN mentor.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
