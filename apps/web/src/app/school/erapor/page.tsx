"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/use-auth";
import {
  fetchEraporData,
  downloadEraporCsv,
  fetchCurrentSchool,
  type EraporStudentRecord,
  type EraporSummaryResponse,
} from "@/lib/api";
import { EraporSummaryBanner } from "@/components/school/erapor/EraporSummaryBanner";
import { EraporFilterToolbar } from "@/components/school/erapor/EraporFilterToolbar";
import { EraporDataTable } from "@/components/school/erapor/EraporDataTable";
import { GradeOverrideModal } from "@/components/school/erapor/GradeOverrideModal";
import { AlertCircle, CheckCircle2, WifiOff } from "lucide-react";

const EMPTY_ERAPOR_DATA: EraporSummaryResponse = {
  school: { id: "", name: "" },
  totalStudents: 0,
  studentsWithPendingLogsCount: 0,
  warningMessage: null,
  records: [],
};

export default function EraporPage() {
  const { token, user } = useAuth();
  const schoolId = user?.school?.id;

  const [data, setData] = useState<EraporSummaryResponse>(EMPTY_ERAPOR_DATA);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Modal Detail
  const [detailStudent, setDetailStudent] = useState<EraporStudentRecord | null>(null);

  // Offline detection
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

  // 1. Load departments for filter dropdown
  useEffect(() => {
    let isMounted = true;
    async function loadDepts() {
      if (!token) return;
      try {
        const schoolData = await fetchCurrentSchool(token);
        if (schoolData && schoolData.departments && isMounted) {
          setDepartments(
            schoolData.departments.map((d: any) => ({ id: d.id, name: `[${d.sectorCode}] ${d.name}` }))
          );
        }
      } catch (err: any) {
        console.error("Gagal memuat daftar jurusan:", err);
      }
    }
    loadDepts();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // 2. Load e-Rapor records from database via API
  const loadData = async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchEraporData(
        schoolId,
        selectedDeptId !== "ALL" ? { departmentId: selectedDeptId } : undefined,
        token
      );
      setData(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memuat rekapitulasi e-Rapor dari database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDeptId, schoolId, token]);

  // Handle CSV Download
  const handleDownloadCsv = async () => {
    if (!token || !schoolId) return;
    setDownloadingCsv(true);
    setErrorMsg(null);
    try {
      await downloadEraporCsv(
        schoolId,
        selectedDeptId !== "ALL" ? { departmentId: selectedDeptId } : undefined,
        token
      );
      setSuccessMsg("Berkas CSV resmi e-Rapor Dapodik berhasil diunduh!");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengunduh berkas CSV e-Rapor.");
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Filter records by search query
  const filteredRecords = useMemo(() => {
    return data.records.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.student.fullName.toLowerCase().includes(q) ||
        r.student.identityNumber.toLowerCase().includes(q) ||
        r.dudiPartner.name.toLowerCase().includes(q)
      );
    });
  }, [data.records, searchQuery]);

  // Average final grade
  const averageGrade = useMemo(() => {
    if (data.records.length === 0) return 0;
    const sum = data.records.reduce((acc, r) => acc + r.finalGrade, 0);
    return sum / data.records.length;
  }, [data.records]);

  return (
    <div className="space-y-6">
      {/* Offline Alert */}
      {isOffline && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2.5 text-xs font-semibold">
          <WifiOff className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Koneksi internet terputus. Mode baca lokal aktif.</span>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs font-semibold shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs font-semibold shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Summary Banner */}
      <EraporSummaryBanner
        totalStudents={data.totalStudents}
        studentsWithPendingLogsCount={data.studentsWithPendingLogsCount}
        averageGrade={averageGrade}
      />

      {/* Filter and Download Toolbar */}
      <EraporFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDeptId={selectedDeptId}
        onDeptChange={setSelectedDeptId}
        departments={departments}
        onDownloadCsv={handleDownloadCsv}
        downloadingCsv={downloadingCsv}
      />

      {/* Records Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <EraporDataTable
          records={filteredRecords}
          onOpenDetail={(r) => setDetailStudent(r)}
        />
      )}

      {/* Modal Detail & Tinjauan Nilai */}
      <GradeOverrideModal
        isOpen={!!detailStudent}
        onClose={() => setDetailStudent(null)}
        record={detailStudent}
      />
    </div>
  );
}
