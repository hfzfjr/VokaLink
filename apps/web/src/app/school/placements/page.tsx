"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/use-auth";
import {
  fetchPlacementCandidates,
  fetchPlacements,
  createPlacement,
  fetchCurrentSchool,
  type PlacementCandidateData,
  type PlacementCandidateStudent,
  type PlacementRecordItem,
} from "@/lib/api";
import { PlacementStatsHeader } from "@/components/school/placements/PlacementStatsHeader";
import { PlacementFilterBar } from "@/components/school/placements/PlacementFilterBar";
import { PlacementCandidatesTable } from "@/components/school/placements/PlacementCandidatesTable";
import { ActivePlacementsTable } from "@/components/school/placements/ActivePlacementsTable";
import { SingleAssignModal } from "@/components/school/placements/SingleAssignModal";
import { AlertCircle, CheckCircle2, WifiOff } from "lucide-react";

const EMPTY_PLACEMENT_DATA: PlacementCandidateData = {
  period: null,
  schoolCoordinates: { latitude: 3.5952, longitude: 98.6722 },
  teachers: [],
  dudis: [],
  students: [],
};

export default function SmartPlacementPage() {
  const { token, user } = useAuth();
  const schoolId = user?.school?.id;

  const [activeTab, setActiveTab] = useState<"RECOMMENDATIONS" | "ACTIVE_LIST">("RECOMMENDATIONS");
  const [data, setData] = useState<PlacementCandidateData>(EMPTY_PLACEMENT_DATA);
  const [activePlacements, setActivePlacements] = useState<PlacementRecordItem[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; sectorCode: string; name: string }>>([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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

  // 1. Initial load of departments for filter dropdown
  useEffect(() => {
    let isMounted = true;
    async function loadDepts() {
      if (!token) return;
      try {
        const schoolData = await fetchCurrentSchool(token);
        if (schoolData && schoolData.departments && isMounted) {
          setDepartments(schoolData.departments);
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

  // 2. Load candidates and active placements from API
  const loadData = async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const candidates = await fetchPlacementCandidates(
        schoolId,
        selectedDeptId !== "ALL" ? selectedDeptId : undefined,
        token
      );
      setData(candidates);

      const records = await fetchPlacements(
        schoolId,
        selectedDeptId !== "ALL" ? { departmentId: selectedDeptId } : undefined,
        token
      );
      setActivePlacements(records);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memuat data penempatan dari database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDeptId, schoolId, token]);

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

  // Filter candidates by search query
  const filteredStudents = useMemo(() => {
    return data.students.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.identityNumber.toLowerCase().includes(q) ||
        (s.department?.name && s.department.name.toLowerCase().includes(q))
      );
    });
  }, [data.students, searchQuery]);

  // Filter active placements by search query
  const filteredActivePlacements = useMemo(() => {
    return activePlacements.filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.student.fullName.toLowerCase().includes(q) ||
        p.student.identityNumber.toLowerCase().includes(q) ||
        p.dudiPartner.name.toLowerCase().includes(q)
      );
    });
  }, [activePlacements, searchQuery]);

  const totalRemainingQuota = data.dudis.reduce((sum, d) => sum + d.remainingQuota, 0);

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
        totalStudents={data.students.length + activePlacements.length}
        unassignedCount={data.students.length}
        totalActivePlacements={activePlacements.length}
        remainingQuotaTotal={totalRemainingQuota}
      />

      {/* Filter and Tab Navigation */}
      <PlacementFilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDeptId={selectedDeptId}
        onDeptChange={setSelectedDeptId}
        departments={departments}
        unplacedCount={data.students.length}
        activeCount={activePlacements.length}
      />

      {/* Tab Contents */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : activeTab === "RECOMMENDATIONS" ? (
        <PlacementCandidatesTable
          students={filteredStudents}
          searchQuery={searchQuery}
          hasFilter={Boolean(searchQuery.trim() || selectedDeptId !== "ALL")}
          onOpenAssignModal={(s) => setAssignStudent(s)}
          onResetFilter={() => {
            setSearchQuery("");
            setSelectedDeptId("ALL");
          }}
        />
      ) : (
        <ActivePlacementsTable
          placements={filteredActivePlacements}
          searchQuery={searchQuery}
          hasFilter={Boolean(searchQuery.trim() || selectedDeptId !== "ALL")}
          onResetFilter={() => {
            setSearchQuery("");
            setSelectedDeptId("ALL");
          }}
        />
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
