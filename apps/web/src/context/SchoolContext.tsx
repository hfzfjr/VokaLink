"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/use-auth";
import { fetchCurrentSchool } from "@/lib/api";

export interface SchoolDepartmentMeta {
  id: string;
  sectorCode: string;
  name: string;
  cpElementsCount: number;
  jobCardsCount: number;
  isLocked: boolean;
}

interface SchoolContextValue {
  departments: SchoolDepartmentMeta[];
  setDepartments: (depts: SchoolDepartmentMeta[]) => void;
  ensureDepartmentsLoaded: () => Promise<SchoolDepartmentMeta[]>;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [departments, setDepartmentsState] = useState<SchoolDepartmentMeta[]>([]);

  // Reset cache when token changes (e.g. logout/login)
  useEffect(() => {
    if (!token) {
      setDepartmentsState([]);
    }
  }, [token]);

  const setDepartments = useCallback((depts: SchoolDepartmentMeta[]) => {
    setDepartmentsState(depts);
  }, []);

  const ensureDepartmentsLoaded = useCallback(async (): Promise<SchoolDepartmentMeta[]> => {
    if (departments.length > 0) {
      return departments;
    }
    if (!token) return [];
    try {
      const schoolData = await fetchCurrentSchool(token, { light: true });
      if (schoolData?.departments) {
        setDepartmentsState(schoolData.departments);
        return schoolData.departments;
      }
    } catch (err) {
      console.error("Gagal memuat metadata jurusan sekolah:", err);
    }
    return [];
  }, [departments, token]);

  return (
    <SchoolContext.Provider
      value={{
        departments,
        setDepartments,
        ensureDepartmentsLoaded,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchoolContext() {
  const ctx = useContext(SchoolContext);
  if (!ctx) {
    throw new Error("useSchoolContext harus digunakan di dalam SchoolProvider");
  }
  return ctx;
}
