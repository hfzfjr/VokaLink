"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/use-auth";
import { useSchoolContext } from "@/context/SchoolContext";
import {
  fetchEraporData,
  downloadEraporCsv,
  type EraporStudentRecord,
  type EraporSummaryResponse,
} from "@/lib/api";
import { EraporSummaryBanner } from "@/components/school/erapor/EraporSummaryBanner";
import { EraporFilterToolbar } from "@/components/school/erapor/EraporFilterToolbar";
import { EraporDataTable } from "@/components/school/erapor/EraporDataTable";
import { GradeOverrideModal } from "@/components/school/erapor/GradeOverrideModal";
import { Pagination } from "@/components/common/Pagination";
import { SkeletonRect } from "@/components/ui/Skeleton";
import { AlertCircle, CheckCircle2, WifiOff, RefreshCw } from "lucide-react";
import { sanitizeErrorMessage } from "@/lib/error-formatter";

const ERAPOR_PAGE_LIMIT = 10;

const EMPTY_ERAPOR_DATA: EraporSummaryResponse = {
  school: { id: "", name: "" },
  totalStudents: 0,
  studentsWithPendingLogsCount: 0,
  warningMessage: null,
  records: [],
  pagination: {
    page: 1,
    limit: ERAPOR_PAGE_LIMIT,
    totalItems: 0,
    totalPages: 1,
  },
};

export default function EraporPage() {
  const { token, user } = useAuth();
  const { departments: rawDepts, ensureDepartmentsLoaded } = useSchoolContext();
  const schoolId = user?.school?.id;

  const [data, setData] = useState<EraporSummaryResponse>(EMPTY_ERAPOR_DATA);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  // Debounce search query (300ms) and reset page to 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 1. Ensure departments are loaded from shared SchoolContext
  useEffect(() => {
    ensureDepartmentsLoaded();
  }, [ensureDepartmentsLoaded]);

  const departments = useMemo(
    () => rawDepts.map((d) => ({ id: d.id, name: `[${d.sectorCode}] ${d.name}` })),
    [rawDepts]
  );

  // 2. Load e-Rapor records from database via API with server-side pagination
  const loadData = async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchEraporData(
        schoolId,
        {
          departmentId: selectedDeptId !== "ALL" ? selectedDeptId : undefined,
          search: debouncedSearch.trim() || undefined,
          page,
          limit: ERAPOR_PAGE_LIMIT,
        },
        token
      );
      setData(res);
    } catch (err: any) {
      setErrorMsg(sanitizeErrorMessage(err, "Gagal memuat rekapitulasi e-Rapor dari database."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDeptId, debouncedSearch, page, schoolId, token]);

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
      setErrorMsg(sanitizeErrorMessage(err, "Gagal mengunduh berkas CSV e-Rapor."));
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Average final grade
  const averageGrade = useMemo(() => {
    if (data.records.length === 0) return 0;
    const sum = data.records.reduce((acc, r) => acc + r.finalGrade, 0);
    return sum / data.records.length;
  }, [data.records]);

  const pagination = data.pagination ?? {
    page,
    limit: ERAPOR_PAGE_LIMIT,
    totalItems: data.records.length,
    totalPages: 1,
  };

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
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Coba Lagi</span>
            </button>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="px-2.5 py-1.5 rounded-full text-rose-700 hover:bg-rose-100/60 text-[11px] font-bold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
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
        onDeptChange={(deptId) => {
          setSelectedDeptId(deptId);
          setPage(1);
        }}
        departments={departments}
        onDownloadCsv={handleDownloadCsv}
        downloadingCsv={downloadingCsv}
      />

      {/* Records Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonRect key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <EraporDataTable
            records={data.records}
            onOpenDetail={(r) => setDetailStudent(r)}
          />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            limit={pagination.limit}
            onPageChange={setPage}
            itemLabel="siswa PKL"
            loading={loading}
          />
        </div>
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
