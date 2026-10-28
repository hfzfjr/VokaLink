"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { useSchoolContext } from "@/context/SchoolContext";
import {
  fetchPlacementCandidates,
  fetchPlacementsPaginated,
  createPlacement,
  type PlacementCandidateData,
  type PlacementCandidateStudent,
  type PlacementRecordItem,
  type PaginationMeta,
} from "@/lib/api";
import { PlacementStatsHeader } from "@/components/school/placements/PlacementStatsHeader";
import { PlacementFilterBar } from "@/components/school/placements/PlacementFilterBar";
import { PlacementCandidatesTable } from "@/components/school/placements/PlacementCandidatesTable";
import { ActivePlacementsTable } from "@/components/school/placements/ActivePlacementsTable";
import { SingleAssignModal } from "@/components/school/placements/SingleAssignModal";
import { Pagination } from "@/components/common/Pagination";
import { AlertCircle, CheckCircle2, WifiOff } from "lucide-react";
import { sanitizeErrorMessage } from "@/lib/error-formatter";

const PLACEMENT_PAGE_LIMIT = 10;

const EMPTY_PLACEMENT_DATA: PlacementCandidateData = {
  period: null,
  schoolCoordinates: { latitude: 3.5952, longitude: 98.6722 },
  teachers: [],
  dudis: [],
  students: [],
  totalUnplacedCount: 0,
  pagination: {
    page: 1,
    limit: PLACEMENT_PAGE_LIMIT,
    totalItems: 0,
    totalPages: 1,
  },
};

export default function SmartPlacementPage() {
  const { token, user } = useAuth();
  const { departments, ensureDepartmentsLoaded } = useSchoolContext();
  const schoolId = user?.school?.id;

  const [activeTab, setActiveTab] = useState<"RECOMMENDATIONS" | "ACTIVE_LIST">("RECOMMENDATIONS");
  const [data, setData] = useState<PlacementCandidateData>(EMPTY_PLACEMENT_DATA);
  const [activePlacements, setActivePlacements] = useState<PlacementRecordItem[]>([]);
  const [totalActiveCount, setTotalActiveCount] = useState(0);
  const [activePagination, setActivePagination] = useState<PaginationMeta>({
    page: 1,
    limit: PLACEMENT_PAGE_LIMIT,
    totalItems: 0,
    totalPages: 1,
  });

  const [candidatePage, setCandidatePage] = useState(1);
  const [activePage, setActivePage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals state
  const [assignStudent, setAssignStudent] = useState<PlacementCandidateStudent | null>(null);

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

  // Debounce search query (300ms) and reset pages to 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCandidatePage(1);
      setActivePage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 1. Ensure departments are loaded from shared SchoolContext
  useEffect(() => {
    ensureDepartmentsLoaded();
  }, [ensureDepartmentsLoaded]);

  // 2. Load candidates and active placements from API with server-side pagination
  const loadData = async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const deptFilter = selectedDeptId !== "ALL" ? selectedDeptId : undefined;
      const searchFilter = debouncedSearch.trim() || undefined;

      const [candidates, activeRes] = await Promise.all([
        fetchPlacementCandidates(
          schoolId,
          {
            departmentId: deptFilter,
            search: searchFilter,
            page: candidatePage,
            limit: PLACEMENT_PAGE_LIMIT,
          },
          token
        ),
        fetchPlacementsPaginated(
          schoolId,
          {
            departmentId: deptFilter,
            search: searchFilter,
            page: activePage,
            limit: PLACEMENT_PAGE_LIMIT,
          },
          token
        ),
      ]);

      setData(candidates);
      setActivePlacements(activeRes.data);
      setTotalActiveCount(activeRes.totalActiveCount);
      setActivePagination(activeRes.pagination);
    } catch (err: any) {
      setErrorMsg(sanitizeErrorMessage(err, "Gagal memuat data penempatan dari database."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDeptId, debouncedSearch, candidatePage, activePage, schoolId, token]);

  // Handle single assignment
  const handleSingleAssign = async (payload: {
    studentId: string;
    dudiId: string;
    teacherId: string;
    overrideReason?: string;
  }) => {
    if (!token || !schoolId) return;
    await createPlacement(schoolId, payload, token);
    setSuccessMsg("Penempatan siswa berhasil disimpan ke database!");
    await loadData();
  };

  const totalRemainingQuota = data.dudis.reduce((sum, d) => sum + d.remainingQuota, 0);
  const candidatePagination = data.pagination ?? {
    page: candidatePage,
    limit: PLACEMENT_PAGE_LIMIT,
    totalItems: data.students.length,
    totalPages: 1,
  };
  const totalUnplacedCount =
    typeof data.totalUnplacedCount === "number"
      ? data.totalUnplacedCount
      : candidatePagination.totalItems;

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

      {/* Top Header & Stats Summary */}
      <PlacementStatsHeader
        totalStudents={totalUnplacedCount + totalActiveCount}
        unassignedCount={totalUnplacedCount}
        totalActivePlacements={totalActiveCount}
        remainingQuotaTotal={totalRemainingQuota}
      />

      {/* Filter and Tab Navigation */}
      <PlacementFilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDeptId={selectedDeptId}
        onDeptChange={(deptId) => {
          setSelectedDeptId(deptId);
          setCandidatePage(1);
          setActivePage(1);
        }}
        departments={departments}
        unplacedCount={candidatePagination.totalItems}
        activeCount={activePagination.totalItems}
      />

      {/* Tab Contents */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : activeTab === "RECOMMENDATIONS" ? (
        <div className="space-y-4">
          <PlacementCandidatesTable
            students={data.students}
            searchQuery={searchQuery}
            hasFilter={Boolean(searchQuery.trim() || selectedDeptId !== "ALL")}
            onOpenAssignModal={(s) => setAssignStudent(s)}
            onResetFilter={() => {
              setSearchQuery("");
              setDebouncedSearch("");
              setSelectedDeptId("ALL");
              setCandidatePage(1);
            }}
          />
          <Pagination
            page={candidatePagination.page}
            totalPages={candidatePagination.totalPages}
            totalItems={candidatePagination.totalItems}
            limit={candidatePagination.limit}
            onPageChange={setCandidatePage}
            itemLabel="kandidat siswa"
            loading={loading}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <ActivePlacementsTable
            placements={activePlacements}
            searchQuery={searchQuery}
            hasFilter={Boolean(searchQuery.trim() || selectedDeptId !== "ALL")}
            onResetFilter={() => {
              setSearchQuery("");
              setDebouncedSearch("");
              setSelectedDeptId("ALL");
              setActivePage(1);
            }}
          />
          <Pagination
            page={activePagination.page}
            totalPages={activePagination.totalPages}
            totalItems={activePagination.totalItems}
            limit={activePagination.limit}
            onPageChange={setActivePage}
            itemLabel="penempatan aktif"
            loading={loading}
          />
        </div>
      )}

      {/* Modals */}
      <SingleAssignModal
        isOpen={!!assignStudent}
        onClose={() => setAssignStudent(null)}
        student={assignStudent}
        dudis={data.dudis}
        teachers={data.teachers}
        onSubmit={handleSingleAssign}
      />
    </div>
  );
}
