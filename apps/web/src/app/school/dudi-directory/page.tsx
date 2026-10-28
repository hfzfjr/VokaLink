"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { useSchoolContext } from "@/context/SchoolContext";
import {
  fetchDudiPartnersPaginated,
  createDudiPartner,
  createDudiMentor,
  resetMentorDevice,
  fetchCurriculum,
  type DudiPartnerItem,
  type PaginationMeta,
} from "@/lib/api";
import { DudiToolbar } from "@/components/school/dudi/DudiToolbar";
import { DudiPartnerTable } from "@/components/school/dudi/DudiPartnerTable";
import { RegisterDudiModal, type AvailableJobCard } from "@/components/school/dudi/RegisterDudiModal";
import { MentorQrActivationModal } from "@/components/school/dudi/MentorQrActivationModal";
import { AddMentorModal } from "@/components/school/dudi/AddMentorModal";
import { ResetDeviceModal } from "@/components/school/dudi/ResetDeviceModal";
import { Pagination } from "@/components/common/Pagination";
import { AlertCircle, CheckCircle2, WifiOff } from "lucide-react";
import { sanitizeErrorMessage } from "@/lib/error-formatter";

const DUDI_PAGE_LIMIT = 8;

export default function DudiDirectoryPage() {
  const { token, user } = useAuth();
  const { ensureDepartmentsLoaded } = useSchoolContext();
  const schoolId = user?.school?.id;

  const [partners, setPartners] = useState<DudiPartnerItem[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: DUDI_PAGE_LIMIT,
    totalItems: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("Semua");

  // Real Database Job Cards (Lazy-loaded when RegisterDudiModal opens)
  const [availableJobCards, setAvailableJobCards] = useState<AvailableJobCard[]>([]);
  const [jobCardsLoaded, setJobCardsLoaded] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMentorDudi, setAddMentorDudi] = useState<{ id: string; name: string } | null>(null);
  const [resetMentor, setResetMentor] = useState<{ id: string; name: string } | null>(null);
  const [resetting, setResetting] = useState(false);

  // QR Modal state
  const [qrModalData, setQrModalData] = useState<{
    mentorName: string;
    dudiName: string;
    token: string;
    url: string;
    waLink: string;
  } | null>(null);

  // Feedback notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

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

  // Debounce search input (300ms) and reset page to 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 1. Lazy-load real job cards from database across departments ONLY when RegisterDudiModal is opened
  useEffect(() => {
    let isMounted = true;
    async function loadRealJobCards() {
      if (!isAddModalOpen || jobCardsLoaded || !token || !schoolId) return;
      try {
        const depts = await ensureDepartmentsLoaded();
        if (depts.length > 0 && isMounted) {
          const curResults = await Promise.all(
            depts.map((dept) =>
              fetchCurriculum(schoolId, dept.id, token)
                .then((curData) => ({ dept, curData }))
                .catch(() => null)
            )
          );
          const allCards: AvailableJobCard[] = [];
          curResults.forEach((item) => {
            if (!item) return;
            item.curData.elements.forEach((el) => {
              el.jobCards.forEach((jc) => {
                allCards.push({
                  id: jc.id,
                  title: jc.title,
                  sector: item.dept.sectorCode || "SMK",
                });
              });
            });
          });
          if (isMounted) {
            setAvailableJobCards(allCards);
            setJobCardsLoaded(true);
          }
        }
      } catch (err: any) {
        console.error("Gagal memuat job cards dari database:", err);
      }
    }
    loadRealJobCards();
    return () => {
      isMounted = false;
    };
  }, [isAddModalOpen, jobCardsLoaded, token, schoolId, ensureDepartmentsLoaded]);

  // 2. Load DUDI partners from API (with server-side pagination)
  const loadPartners = async (targetPage = page) => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchDudiPartnersPaginated(
        {
          search: debouncedSearch.trim() || undefined,
          city: selectedCity !== "Semua" ? selectedCity : undefined,
          page: targetPage,
          limit: DUDI_PAGE_LIMIT,
        },
        token
      );
      setPartners(res.data);
      setCitiesList(res.cities);
      setPagination(res.pagination);
    } catch (err: any) {
      setErrorMsg(sanitizeErrorMessage(err, "Gagal memuat direktori mitra DUDI."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners(page);
  }, [token, debouncedSearch, selectedCity, page]);

  // Handle register DUDI
  const handleRegisterDudi = async (payload: {
    name: string;
    sectorCategory: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    maxQuota: number;
    supportedJobCardIds: string[];
    mentor?: {
      fullName: string;
      jobTitle: string;
      whatsappNumber: string;
    };
  }) => {
    if (!token) return;
    const res = await createDudiPartner(payload, token);
    setSuccessMsg(`Mitra DUDI ${payload.name} berhasil didaftarkan ke database!`);

    // If initial mentor was registered, show QR modal immediately
    if (res.initialMentor?.activation) {
      setQrModalData({
        mentorName: res.initialMentor.fullName,
        dudiName: payload.name,
        token: res.initialMentor.activation.token,
        url: res.initialMentor.activation.url,
        waLink: res.initialMentor.activation.whatsappDirectLink,
      });
    }

    await loadPartners();
  };

  // Handle add mentor to DUDI
  const handleAddMentor = async (
    dudiId: string,
    payload: { fullName: string; jobTitle: string; whatsappNumber: string }
  ) => {
    if (!token) return;
    const res = await createDudiMentor(dudiId, payload, token);
    setSuccessMsg(`Mentor ${payload.fullName} berhasil didaftarkan!`);

    if (res.activation) {
      setQrModalData({
        mentorName: payload.fullName,
        dudiName: addMentorDudi?.name || "Mitra DUDI",
        token: res.activation.token,
        url: res.activation.url,
        waLink: res.activation.whatsappDirectLink,
      });
    }

    await loadPartners();
  };

  // Handle reset mentor device
  const handleConfirmReset = async () => {
    if (!token || !resetMentor) return;
    setResetting(true);
    setErrorMsg(null);
    try {
      await resetMentorDevice(resetMentor.id, token);
      setResetMentor(null);
      setSuccessMsg(`Ikatan perangkat untuk ${resetMentor.name} berhasil direset!`);
      await loadPartners();
    } catch (err: any) {
      setErrorMsg(sanitizeErrorMessage(err, "Gagal mereset perangkat mentor."));
    } finally {
      setResetting(false);
    }
  };

  // Trigger QR modal for existing mentor
  const handleTriggerQr = async (mentor: {
    mentorName: string;
    dudiName: string;
    whatsappNumber: string;
    mentorId: string;
  }) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const dummyToken = `demo_token_${mentor.mentorId.slice(0, 8)}`;
    const url = `${origin}/v/${dummyToken}/activate`;
    const message = encodeURIComponent(
      `Halo ${mentor.mentorName}, mohon aktivasi perangkat HP Anda sebagai pembimbing PKL di VokaLink melalui tautan: ${url}`
    );
    const waLink = `https://wa.me/${mentor.whatsappNumber.replace(/\D/g, "")}?text=${message}`;

    setQrModalData({
      mentorName: mentor.mentorName,
      dudiName: mentor.dudiName,
      token: dummyToken,
      url,
      waLink,
    });
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

      {/* Toolbar & Filter Controller */}
      <DudiToolbar
        search={search}
        onSearchChange={setSearch}
        selectedCity={selectedCity}
        onCityChange={(city) => {
          setSelectedCity(city);
          setPage(1);
        }}
        cities={citiesList}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        totalPartners={pagination.totalItems}
      />

      {/* Directory Content */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-3xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <DudiPartnerTable
            partners={partners}
            onOpenAddMentor={(id, name) => setAddMentorDudi({ id, name })}
            onOpenResetDevice={(id, name) => setResetMentor({ id, name })}
            onTriggerQr={handleTriggerQr}
          />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            limit={pagination.limit}
            onPageChange={setPage}
            itemLabel="mitra industri"
            loading={loading}
          />
        </div>
      )}

      {/* Modals */}
      <RegisterDudiModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        availableJobCards={availableJobCards}
        onSubmit={handleRegisterDudi}
      />

      <AddMentorModal
        isOpen={!!addMentorDudi}
        onClose={() => setAddMentorDudi(null)}
        dudiId={addMentorDudi?.id || null}
        dudiName={addMentorDudi?.name || ""}
        onSubmit={handleAddMentor}
      />

      <ResetDeviceModal
        isOpen={!!resetMentor}
        onClose={() => setResetMentor(null)}
        mentorName={resetMentor?.name || ""}
        onConfirmReset={handleConfirmReset}
        resetting={resetting}
      />

      <MentorQrActivationModal
        data={qrModalData}
        onClose={() => setQrModalData(null)}
      />
    </div>
  );
}
