"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { fetchCurrentSchool } from "@/lib/api";
import { useSchoolContext } from "@/context/SchoolContext";
import { SchoolHeroBanner } from "@/components/school/dashboard/SchoolHeroBanner";
import { SchoolKpiGrid } from "@/components/school/dashboard/SchoolKpiGrid";
import { DepartmentReadinessCard, type DepartmentItem } from "@/components/school/dashboard/DepartmentReadinessCard";
import { PriorityMonitoringCard, type PriorityStudentItem } from "@/components/school/dashboard/PriorityMonitoringCard";
import { SchoolWidgetPanel } from "@/components/school/SchoolWidgetPanel";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";

interface SchoolDashboardData {
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
  priorityStudents: PriorityStudentItem[];
  departments: DepartmentItem[];
}

export default function SchoolDashboardPage() {
  const { token, user } = useAuth();
  const { setDepartments } = useSchoolContext();
  const [data, setData] = useState<SchoolDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

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

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCurrentSchool(token);
      setData(result);
      if (result?.departments) {
        setDepartments(result.departments);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat data dasbor sekolah dari database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const lockedDeptCount = data?.departments.filter((d) => d.isLocked).length ?? 0;

  const fallbackSchool = data?.school ?? {
    id: user?.school?.id || "",
    npsn: user?.school?.npsn || "10210850",
    name: user?.school?.name || "SMK Telkom 1 Medan",
    province: user?.school?.province || "Sumatera Utara",
    city: user?.school?.city || "Medan",
    isDemoSandbox: false,
  };

  return (
    <div className="space-y-6">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2.5 text-xs font-semibold">
          <WifiOff className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Koneksi internet terputus. Menampilkan data tersimpan.</span>
        </div>
      )}

      {error ? (
        /* Error State with Retry Button */
        <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-rose-700">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Muat Ulang</span>
          </button>
        </div>
      ) : (
        /* Main 2-Column Responsive Layout — Hero Banner always visible immediately, data cards show skeleton while loading */
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 w-full space-y-5">
            {/* 1. School Profile Hero Banner (Immediate Static Shell) */}
            <SchoolHeroBanner
              school={fallbackSchool}
              activePeriod={data?.activePeriod}
            />

            {loading || !data ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 rounded-3xl bg-slate-200 animate-pulse" />
                  ))}
                </div>
                <div className="h-64 rounded-3xl bg-slate-200 animate-pulse" />
                <div className="h-48 rounded-3xl bg-slate-200 animate-pulse" />
              </>
            ) : (
              <>
                {/* 2. 4 Metric Overview KPI Grid */}
                <SchoolKpiGrid stats={data.stats} />

                {/* 3. Department Curriculum Readiness Status */}
                <DepartmentReadinessCard departments={data.departments} />

                {/* 4. Priority Student Monitoring */}
                <PriorityMonitoringCard students={data.priorityStudents} />
              </>
            )}
          </div>

          {/* Desktop Right Summary Widget Panel */}
          {loading || !data ? (
            <div className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px] shrink-0 space-y-4">
              <div className="h-36 rounded-3xl bg-slate-200 animate-pulse" />
              <div className="h-44 rounded-3xl bg-slate-200 animate-pulse" />
            </div>
          ) : (
            <SchoolWidgetPanel
              schoolName={data.school.name}
              npsn={data.school.npsn}
              adminName={user?.fullName || "Pokja PKL"}
              activePeriodName={data.activePeriod?.name}
              totalStudents={data.stats.totalStudents}
              totalPlacements={data.stats.totalPlacements}
              totalDudis={data.stats.totalDudis}
              departmentsCount={data.departments.length}
              lockedDepartmentsCount={lockedDeptCount}
            />
          )}
        </div>
      )}
    </div>
  );
}
