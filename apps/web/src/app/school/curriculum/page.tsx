"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import {
  fetchCurrentSchool,
  fetchCurriculum,
  updateCpElements,
  lockCurriculum,
  addJobCard,
  deleteJobCard,
  type CurriculumData,
} from "@/lib/api";
import { CurriculumHeader } from "@/components/school/curriculum/CurriculumHeader";
import { CpMatrixTable } from "@/components/school/curriculum/CpMatrixTable";
import { JobCardCatalog } from "@/components/school/curriculum/JobCardCatalog";
import { AddJobCardModal } from "@/components/school/curriculum/AddJobCardModal";
import { LockCurriculumModal } from "@/components/school/curriculum/LockCurriculumModal";
import { AlertCircle, WifiOff, CheckCircle2 } from "lucide-react";

interface SchoolDepartmentSummary {
  id: string;
  sectorCode: string;
  name: string;
}

export default function SchoolCurriculumPage() {
  const { token, user } = useAuth();
  const [departments, setDepartments] = useState<SchoolDepartmentSummary[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const schoolId = user?.school?.id;

  // Active curriculum data
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [editedJpMap, setEditedJpMap] = useState<Record<string, number>>({});

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [savingJp, setSavingJp] = useState<boolean>(false);
  const [locking, setLocking] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalElementId, setAddModalElementId] = useState<string | null>(null);
  const [addModalIsNonComp, setAddModalIsNonComp] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

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

  // 1. Initial load: departments list from DB
  useEffect(() => {
    let isMounted = true;
    async function initSchool() {
      if (!token) return;
      try {
        const schoolData = await fetchCurrentSchool(token);
        if (schoolData && schoolData.departments?.length > 0 && isMounted) {
          setDepartments(schoolData.departments);
          if (!selectedDeptId) {
            setSelectedDeptId(schoolData.departments[0].id);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || "Gagal memuat profil jurusan sekolah.");
        }
      }
    }
    initSchool();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // 2. Load curriculum when selectedDeptId or schoolId changes
  const loadCurriculum = async () => {
    if (!token || !selectedDeptId || !schoolId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchCurriculum(schoolId, selectedDeptId, token);
      setCurriculum(data);
      // Reset JP map
      const initialMap: Record<string, number> = {};
      data.elements.forEach((el) => {
        initialMap[el.id] = el.targetJp;
      });
      setEditedJpMap(initialMap);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memuat kurikulum jurusan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurriculum();
  }, [selectedDeptId, schoolId, token]);

  // Handle JP input change
  const handleJpChange = (elementId: string, val: number) => {
    setEditedJpMap((prev) => ({
      ...prev,
      [elementId]: val,
    }));
  };

  // Save modified JP weights
  const handleSaveJp = async () => {
    if (!token || !curriculum || !schoolId) return;
    setSavingJp(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const payload = curriculum.elements.map((el) => ({
        id: el.id,
        targetJp: editedJpMap[el.id] ?? el.targetJp,
      }));
      await updateCpElements(schoolId, selectedDeptId, payload, token);
      setSuccessMsg("Alokasi target JP berhasil disimpan ke database!");
      await loadCurriculum();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan bobot JP.");
    } finally {
      setSavingJp(false);
    }
  };

  // Lock curriculum
  const handleConfirmLock = async () => {
    if (!token || !schoolId || !selectedDeptId) return;
    setLocking(true);
    setErrorMsg(null);
    try {
      await lockCurriculum(schoolId, selectedDeptId, token);
      setIsLockModalOpen(false);
      setSuccessMsg("Kurikulum berhasil dikunci permanen (792 JP)!");
      await loadCurriculum();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengunci kurikulum.");
    } finally {
      setLocking(false);
    }
  };

  // Add Job Card
  const handleAddJobCard = async (payload: {
    cpElementId?: string | null;
    title: string;
    skkniUnitCode?: string | null;
    toolsAndSoftware?: string[];
    actionVerbTemplate?: string;
    isNonCompetency?: boolean;
  }) => {
    if (!token || !schoolId || !selectedDeptId) return;
    await addJobCard(schoolId, selectedDeptId, payload, token);
    setSuccessMsg("Kartu pekerjaan baru berhasil ditambahkan!");
    await loadCurriculum();
  };

  // Delete Job Card
  const handleDeleteJobCard = async (jcId: string) => {
    if (!token || !schoolId || !selectedDeptId) return;
    if (!confirm("Apakah Anda yakin ingin menghapus kartu pekerjaan ini?")) return;
    try {
      await deleteJobCard(schoolId, selectedDeptId, jcId, token);
      setSuccessMsg("Kartu pekerjaan berhasil dihapus.");
      await loadCurriculum();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menghapus kartu pekerjaan.");
    }
  };

  const currentTotal = curriculum?.elements.reduce(
    (sum, el) => sum + (editedJpMap[el.id] ?? el.targetJp),
    0
  ) ?? 0;

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

      {/* Header Controller */}
      <CurriculumHeader
        departments={departments}
        selectedDeptId={selectedDeptId}
        onSelectDepartment={setSelectedDeptId}
        isLocked={curriculum?.department.isLocked ?? false}
        currentTotalJp={currentTotal}
        onOpenLockModal={() => setIsLockModalOpen(true)}
        locking={locking}
      />

      {loading ? (
        <div className="space-y-4">
          <div className="h-44 rounded-3xl bg-slate-200 animate-pulse" />
          <div className="h-64 rounded-3xl bg-slate-200 animate-pulse" />
        </div>
      ) : curriculum ? (
        <div className="space-y-6">
          {/* Matriks Elemen CP Table */}
          <CpMatrixTable
            elements={curriculum.elements}
            editedJpMap={editedJpMap}
            onJpChange={handleJpChange}
            onSaveJp={handleSaveJp}
            saving={savingJp}
            isLocked={curriculum.department.isLocked}
          />

          {/* Katalog Job Cards */}
          <JobCardCatalog
            elements={curriculum.elements}
            nonCompetencyCards={curriculum.nonCompetencyCards}
            onOpenAddModal={(elementId, isNonComp) => {
              setAddModalElementId(elementId);
              setAddModalIsNonComp(isNonComp);
              setIsAddModalOpen(true);
            }}
            onDeleteJobCard={handleDeleteJobCard}
            isLocked={curriculum.department.isLocked}
          />
        </div>
      ) : null}

      {/* Modals */}
      <AddJobCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        elements={curriculum?.elements ?? []}
        defaultElementId={addModalElementId}
        defaultIsNonCompetency={addModalIsNonComp}
        onSubmit={handleAddJobCard}
      />

      <LockCurriculumModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        departmentName={curriculum?.department.name || "Jurusan"}
        onConfirmLock={handleConfirmLock}
        locking={locking}
      />
    </div>
  );
}
