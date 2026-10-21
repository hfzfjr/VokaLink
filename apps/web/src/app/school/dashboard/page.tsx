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
  ArrowRight,
  ChevronRight,
  FileSpreadsheet,
  Navigation,
  Compass,
} from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";
import Navbar, { NavbarButton } from "@/components/layout/Navbar";
import StatCard from "@/components/common/StatCard";
import DemoBadge from "@/components/common/DemoBadge";

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
  departments: Array<{
    id: string;
    sectorCode: string;
    name: string;
    cpElementsCount: number;
    jobCardsCount: number;
    isLocked: boolean;
  }>;
}

export default function SchoolDashboardPage() {
  const [data, setData] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial mock or API data
    const timer = setTimeout(() => {
      setData({
        school: {
          id: "demo-school-id",
          npsn: "99000001",
          name: "SMK Demo VokaLink (Sandbox)",
          province: "Jawa Timur",
          city: "Surabaya",
          isDemoSandbox: true,
        },
        activePeriod: {
          name: "PKL Semester Genap 2025/2026",
          targetTotalJp: TOTAL_TARGET_JP,
          startDate: "06 Jan 2026",
          endDate: "27 Jun 2026",
        },
        stats: {
          totalStudents: 5,
          totalTeachers: 1,
          totalDepartments: 6,
          totalPlacements: 5,
          totalDudis: 6,
        },
        departments: [
          {
            id: "d-1",
            sectorCode: "RPL",
            name: "Rekayasa Perangkat Lunak",
            cpElementsCount: 4,
            jobCardsCount: 15,
            isLocked: true,
          },
          {
            id: "d-2",
            sectorCode: "AKL",
            name: "Akuntansi dan Keuangan Lembaga",
            cpElementsCount: 5,
            jobCardsCount: 18,
            isLocked: true,
          },
          {
            id: "d-3",
            sectorCode: "DKV",
            name: "Desain Komunikasi Visual",
            cpElementsCount: 4,
            jobCardsCount: 14,
            isLocked: false,
          },
          {
            id: "d-4",
            sectorCode: "KULINER",
            name: "Kuliner",
            cpElementsCount: 4,
            jobCardsCount: 14,
            isLocked: false,
          },
          {
            id: "d-5",
            sectorCode: "FARMASI",
            name: "Farmasi Klinis dan Komunitas",
            cpElementsCount: 4,
            jobCardsCount: 14,
            isLocked: false,
          },
          {
            id: "d-6",
            sectorCode: "OTOMOTIF",
            name: "Teknik Kendaraan Ringan Otomotif",
            cpElementsCount: 4,
            jobCardsCount: 14,
            isLocked: false,
          },
        ],
      });
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        variant="sticky"
        subtitle="Panel Pengelola SMK (Pokja PKL)"
        rightSlot={
          <NavbarButton href="/login" label="Ganti Peran (Judge Switcher)" />
        }
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          </div>
        ) : data ? (
          <>
            {/* School Profile Hero Banner */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      {data.school.name}
                    </h1>
                    {data.school.isDemoSandbox && <DemoBadge />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    NPSN: <span className="font-mono font-semibold text-slate-700">{data.school.npsn}</span> ·{" "}
                    {data.school.city}, {data.school.province} · Isolasi Multi-Tenant Aktif
                  </p>
                </div>
              </div>

              {/* Active Period Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 shrink-0">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">
                      {data.activePeriod.name}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Target: <span className="font-bold text-blue-700">{data.activePeriod.targetTotalJp} JP</span> · {data.activePeriod.startDate} – {data.activePeriod.endDate}
                  </p>
                </div>
              </div>
            </div>

            {/* KPI Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Siswa Aktif PKL" value={data.stats.totalStudents} icon={Users} color="blue" />
              <StatCard label="Guru Pembimbing" value={data.stats.totalTeachers} icon={Briefcase} color="purple" />
              <StatCard label="Mitra DUDI" value={data.stats.totalDudis} icon={Building2} color="emerald" />
              <StatCard label="Penempatan Aktif" value={data.stats.totalPlacements} icon={Award} color="amber" />
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/school/curriculum"
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition">
                    Kurikulum & Job Cards (FR-002)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Atur matriks Elemen CP, slider JP proporsional, dan katalog Job Cards.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600">
                  Buka Kurikulum <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                href="/school/dudi-directory"
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition">
                    Direktori Mitra DUDI (FR-003)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Direktori terfederasi lintas sekolah & DUDI Quality Index Score.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600">
                  Buka Direktori <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                href="/school/placements"
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition">
                    Smart Placement (FR-004)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Skor Haversine (70% CP + 30% Jarak), kuota mitra, dan rekomendasi rotasi.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-600">
                  Buka Penempatan <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                href="/school/erapor-export"
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition">
                    Ekspor e-Rapor SMK (FR-011)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Rekapitulasi otomatis bobot kemandirian & unduh CSV/XLSX e-Rapor.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-600">
                  Buka e-Rapor <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </div>

            {/* Department Curriculum Status Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Konsentrasi Keahlian / Jurusan Terdaftar
                  </h2>
                  <p className="text-xs text-slate-500">
                    6 jurusan aktif dengan total alokasi 792 JP per jurusan sesuai Kurikulum Merdeka.
                  </p>
                </div>
                <Link
                  href="/school/curriculum"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Kelola Matriks Kurikulum <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-extrabold text-[11px]">
                          {dept.sectorCode}
                        </span>
                        {dept.isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Terkunci (792 JP)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                            Draf
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{dept.name}</h4>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                      <span>{dept.cpElementsCount} Elemen CP</span>
                      <span>{dept.jobCardsCount} Job Cards</span>
                      <span className="font-bold text-slate-900">792 JP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>© 2026 VokaLink · Ekosistem PKL SMK Terkoneksi</p>
      </footer>
    </div>
  );
}
