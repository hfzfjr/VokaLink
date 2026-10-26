"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Briefcase,
  Layers,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  FileSpreadsheet,
  Navigation,
  Compass,
  Clock,
  Sparkles,
} from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";
import { Stat } from "@/components/ui/Stat";
import { DataTable, type Column } from "@/components/ui/DataTable";
import DemoBadge from "@/components/common/DemoBadge";
import { useAuth } from "@/lib/use-auth";
import { fetchCurrentSchool } from "@/lib/api";

interface Department {
  id: string;
  sectorCode: string;
  name: string;
  cpElementsCount: number;
  jobCardsCount: number;
  isLocked: boolean;
}

interface PriorityStudent {
  id: string;
  name: string;
  department: string;
  dudiName: string;
  jpProgress: number;
  pendingLogs: number;
  statusText: string;
  severity: "warning" | "info" | "success";
}

interface SchoolData {
  school: {
    id: string;
    npsn: string;
    name: string;
    province: string;
    city: string;
    isDemoSandbox: boolean;
  };
  activePeriod: {
    name: string;
    targetTotalJp: number;
    startDate: string;
    endDate: string;
  };
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalDepartments: number;
    totalPlacements: number;
    totalDudis: number;
  };
  priorityStudents: PriorityStudent[];
  departments: Department[];
}

export default function SchoolDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSchoolData() {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchCurrentSchool(token);
        if (isMounted) {
          setData(result);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Gagal memuat data dasbor sekolah");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSchoolData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const departmentColumns: Column<Department>[] = [
    {
      key: "name",
      header: "Konsentrasi Keahlian",
      render: (dept) => (
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-600 font-extrabold text-[11px] border border-sky-100 shrink-0">
            {dept.sectorCode}
          </span>
          <span className="font-bold text-slate-900 text-sm">{dept.name}</span>
        </div>
      ),
    },
    {
      key: "cpElementsCount",
      header: "Elemen CP",
      render: (dept) => (
        <span className="text-xs font-semibold text-slate-700">{dept.cpElementsCount} Elemen</span>
      ),
    },
    {
      key: "jobCardsCount",
      header: "Job Cards",
      render: (dept) => (
        <span className="text-xs font-semibold text-slate-700">{dept.jobCardsCount} Kartu</span>
      ),
    },
    {
      key: "targetJp",
      header: "Target Alokasi",
      render: () => (
        <span className="font-bold text-slate-900 text-xs">792 JP</span>
      ),
    },
    {
      key: "isLocked",
      header: "Status",
      render: (dept) =>
        dept.isLocked ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Terkunci
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
            Draf
          </span>
        ),
    },
    {
      key: "id",
      header: "Aksi",
      render: () => (
        <Link
          href="/school/curriculum"
          className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 transition"
        >
          Kelola <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-4">
          <div className="h-28 rounded-3xl bg-slate-200 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-3xl bg-slate-200 animate-pulse" />
            ))}
          </div>
          <div className="h-48 rounded-3xl bg-slate-200 animate-pulse" />
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 space-y-3">
          <p className="text-sm font-bold text-rose-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Muat Ulang Halaman
          </button>
        </div>
      ) : data ? (
        <>
          {/* School Profile Hero Banner */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-2xl shadow-xs shrink-0 border border-sky-100">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {data.school.name}
                  </h1>
                  {data.school.isDemoSandbox && <DemoBadge />}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  NPSN: <span className="font-mono font-semibold text-slate-700">{data.school.npsn}</span> ·{" "}
                  {data.school.city}, {data.school.province} · Isolasi Multi-Tenant Aktif
                </p>
              </div>
            </div>

            {/* Active Period Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3 shrink-0">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    {data.activePeriod?.name || "Periode Aktif 2026/2027"}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Target: <span className="font-bold text-sky-600">{data.activePeriod?.targetTotalJp ?? 792} JP</span> · {data.activePeriod?.startDate ? new Date(data.activePeriod.startDate).toLocaleDateString("id-ID") : "2026"} – {data.activePeriod?.endDate ? new Date(data.activePeriod.endDate).toLocaleDateString("id-ID") : "2026"}
                </p>
              </div>
            </div>
          </div>

          {/* KPI Metric Grid — Maksimal 4 Stat ringkas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
                <Users className="w-6 h-6" />
              </div>
              <Stat value={data.stats.totalStudents} label="Siswa Aktif PKL" />
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <Briefcase className="w-6 h-6" />
              </div>
              <Stat value={data.stats.totalTeachers} label="Guru Pembimbing" />
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Building2 className="w-6 h-6" />
              </div>
              <Stat value={data.stats.totalDudis} label="Mitra DUDI Aktif" />
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <Award className="w-6 h-6" />
              </div>
              <Stat value={data.stats.totalPlacements} label="Penempatan Aktif" />
            </div>
          </div>

          {/* Quick Action Navigation Grid (Clean titles, no FR codes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/school/curriculum"
              className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-sky-400 hover:shadow-md transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-sky-100">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition">
                  Kurikulum & Job Cards
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Atur matriks Elemen CP, alokasi JP proporsional, dan katalog Job Cards praktis.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-sky-600">
                Buka Kurikulum <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/school/dudi-directory"
              className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-sky-400 hover:shadow-md transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-emerald-100">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition">
                  Direktori Mitra DUDI
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Direktori terfederasi lintas sekolah & audit DUDI Quality Index Score.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600">
                Buka Direktori <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/school/placements"
              className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-sky-400 hover:shadow-md transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-indigo-100">
                  <Navigation className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition">
                  Smart Placement
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Pencocokan multi-kriteria (70% CP + 30% Jarak), kuota mitra, dan rekomendasi rotasi.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600">
                Buka Penempatan <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/school/erapor"
              className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-sky-400 hover:shadow-md transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-amber-100">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition">
                  Rekap e-Rapor SMK
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Rekapitulasi otomatis bobot kemandirian & unduh CSV resmi e-Rapor Kemendikbudristek.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-600">
                Buka e-Rapor <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>

          {/* 1 Daftar Prioritas Siswa */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-500" />
                  Prioritas Monitoring Siswa
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Siswa yang membutuhkan perhatian guru pembimbing atau tindak lanjut verifikasi mentor.
                </p>
              </div>
              <Link
                href="/school/erapor"
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
              >
                Lihat Semua Siswa <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.priorityStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between gap-3 hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{student.name}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-600 font-extrabold text-[10px] border border-sky-100">
                          {student.department}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{student.dudiName}</p>
                    </div>
                    {student.severity === "warning" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 shrink-0">
                        <AlertCircle className="w-3 h-3" /> Perlu Review
                      </span>
                    ) : student.severity === "info" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-200 shrink-0">
                        <Sparkles className="w-3 h-3" /> Info
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> On-Track
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-600 text-[11px] font-medium">{student.statusText}</span>
                    <span className="font-bold text-slate-900 shrink-0 tabular-nums">
                      {student.jpProgress} / {TOTAL_TARGET_JP} JP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabel Jurusan (DataTable) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Konsentrasi Keahlian / Jurusan Terdaftar
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  6 jurusan aktif dengan total alokasi 792 JP per jurusan sesuai Kurikulum Merdeka.
                </p>
              </div>
              <Link
                href="/school/curriculum"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-sky-500 text-white text-xs font-bold hover:bg-sky-600 transition shadow-sm shadow-sky-500/20"
              >
                Kelola Matriks Kurikulum <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <DataTable
              columns={departmentColumns}
              data={data.departments}
              getRowKey={(dept) => dept.id}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
