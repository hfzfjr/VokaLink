"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  Search,
  MapPin,
  Users,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Plus,
  RefreshCw,
  QrCode,
  Share2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Compass,
  Briefcase,
  Check,
  Copy,
  ExternalLink,
  Award,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { QrCodeView } from "@/components/ui/QrCodeView";
import {
  fetchDudiPartners,
  createDudiPartner,
  createDudiMentor,
  resetMentorDevice,
  fetchDudiQualityIndex,
  type DudiPartnerItem,
  type DudiQualityAuditResponse,
  type DudiQualityMetricItem,
} from "@/lib/api";

// Fallback seed jika offline / backend belum menyala
const MOCK_PARTNERS: DudiPartnerItem[] = [
  {
    id: "dudi-1",
    name: "PT Inovasi Digital Nusantara",
    sectorCategory: "Teknologi Informasi & Software",
    address: "Jl. Pemuda No. 45, Embong Kaliasin",
    city: "Surabaya",
    latitude: -7.2625,
    longitude: 112.7483,
    maxQuota: 6,
    qualityIndexScore: 94.2,
    mentorsCount: 2,
    capabilitiesCount: 12,
    placementsCount: 4,
    mentors: [
      {
        id: "m-1",
        fullName: "Hendra Wijaya, S.Kom",
        jobTitle: "Head of Software Engineering",
        whatsappNumber: "081234567890",
        isDeviceBound: true,
      },
      {
        id: "m-2",
        fullName: "Rina Kusuma",
        jobTitle: "UI/UX Design Lead",
        whatsappNumber: "081987654321",
        isDeviceBound: false,
      },
    ],
  },
  {
    id: "dudi-2",
    name: "Kantor Akuntan Publik Drs. Bambang & Rekan",
    sectorCategory: "Akuntansi & Keuangan",
    address: "Jl. Raya Darmo No. 88",
    city: "Surabaya",
    latitude: -7.2891,
    longitude: 112.7384,
    maxQuota: 4,
    qualityIndexScore: 89.0,
    mentorsCount: 1,
    capabilitiesCount: 10,
    placementsCount: 2,
    mentors: [
      {
        id: "m-3",
        fullName: "Siti Rahmawati, SE, Ak, CA",
        jobTitle: "Senior Audit Supervisor",
        whatsappNumber: "081345678912",
        isDeviceBound: true,
      },
    ],
  },
  {
    id: "dudi-3",
    name: "Bengkel Resmi Astra Otoservice",
    sectorCategory: "Otomotif & Manufaktur",
    address: "Jl. Basuki Rahmat No. 12",
    city: "Surabaya",
    latitude: -7.2711,
    longitude: 112.7412,
    maxQuota: 5,
    qualityIndexScore: 91.4,
    mentorsCount: 1,
    capabilitiesCount: 9,
    placementsCount: 3,
    mentors: [
      {
        id: "m-4",
        fullName: "Agus Prasetyo",
        jobTitle: "Kepala Bengkel & Instruktur",
        whatsappNumber: "082156789012",
        isDeviceBound: true,
      },
    ],
  },
];

export default function DudiDirectoryPage() {
  const [partners, setPartners] = useState<DudiPartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("Semua");
  const [token] = useState("mock-token");

  // FR-010: Quality Index & Tab State
  const [activeTab, setActiveTab] = useState<"DIRECTORY" | "QUALITY_INDEX">("DIRECTORY");
  const [qualityAuditData, setQualityAuditData] = useState<DudiQualityAuditResponse | null>(null);
  const [isQualityLoading, setIsQualityLoading] = useState(false);
  const [qualitySectorFilter, setQualitySectorFilter] = useState("Semua");

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal Onboarding DUDI Baru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [dudiName, setDudiName] = useState("");
  const [sectorCategory, setSectorCategory] = useState("Teknologi Informasi & Software");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Surabaya");
  const [lat, setLat] = useState("-7.2575");
  const [lng, setLng] = useState("112.7521");
  const [maxQuota, setMaxQuota] = useState(5);
  const [selectedJobCards, setSelectedJobCards] = useState<string[]>([]);
  const [mentorName, setMentorName] = useState("");
  const [mentorJobTitle, setMentorJobTitle] = useState("");
  const [mentorWa, setMentorWa] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal QR Aktivasi Mentor
  const [qrModalData, setQrModalData] = useState<{
    mentorName: string;
    dudiName: string;
    token: string;
    url: string;
    waLink: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Daftar Job Cards template yang dapat dicentang saat registrasi DUDI
  const SAMPLE_JOB_CARDS = [
    { id: "00000000-0000-0000-0000-000000000071", title: "Implementasi REST API & Backend Service", sector: "RPL" },
    { id: "00000000-0000-0000-0000-000000000072", title: "Slicing UI Responsif & Integrasi Frontend", sector: "RPL" },
    { id: "00000000-0000-0000-0000-000000000073", title: "Rekonsiliasi Bank & Penjurnalan Transaksi Keuangan", sector: "AKL" },
    { id: "00000000-0000-0000-0000-000000000074", title: "Penyusunan SPT Masa & Bukti Potong Pajak", sector: "AKL" },
    { id: "00000000-0000-0000-0000-000000000075", title: "Desain Aset Visual Promosi & Branding Digital", sector: "DKV" },
    { id: "00000000-0000-0000-0000-000000000076", title: "Pembuatan Prototipe Desain UI/UX Mobile App", sector: "DKV" },
    { id: "00000000-0000-0000-0000-000000000077", title: "Pemeriksaan Sistem Injeksi & Kelistrikan Mobil", sector: "OTOMOTIF" },
    { id: "00000000-0000-0000-0000-000000000078", title: "Pengolahan Hidangan Kontinental & Baking", sector: "KULINER" },
    { id: "00000000-0000-0000-0000-000000000079", title: "Peracikan Sediaan Obat & Pelayanan Resep Farmasi", sector: "FARMASI" },
  ];

  // Muat data direktori DUDI
  const loadPartners = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchDudiPartners(
        {
          search: search || undefined,
          city: selectedCity === "Semua" ? undefined : selectedCity,
        },
        token
      );
      if (data && data.length > 0) {
        setPartners(data);
      } else {
        setPartners(MOCK_PARTNERS);
      }
    } catch (err: any) {
      console.warn("API fallback to mock DUDI:", err);
      setPartners(MOCK_PARTNERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, [selectedCity]);

  // FR-010: Muat Audit Mutu Kemitraan DUDI
  const loadQualityAudit = async () => {
    setIsQualityLoading(true);
    try {
      const res = await fetchDudiQualityIndex({
        sectorCategory: qualitySectorFilter === "Semua" ? undefined : qualitySectorFilter,
      });
      setQualityAuditData(res);
    } catch (err: any) {
      console.warn("Quality index fallback:", err);
    } finally {
      setIsQualityLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "QUALITY_INDEX") {
      loadQualityAudit();
    }
  }, [activeTab, qualitySectorFilter]);

  // Handle filter submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPartners();
  };

  // Toggle Job Card selection
  const toggleJobCard = (id: string) => {
    setSelectedJobCards((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Geolokasi Otomatis (Browser GPS)
  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(6));
          setLng(pos.coords.longitude.toFixed(6));
          setSuccessMsg("Titik koordinat berhasil diambil dari GPS perangkat!");
        },
        (_err) => {
          setErrorMsg("Izin GPS ditolak atau tidak tersedia. Silakan masukkan koordinat secara manual.");
        }
      );
    } else {
      setErrorMsg("Peramban Anda tidak mendukung sensor geolokasi.");
    }
  };

  // Submit Pendaftaran DUDI + Mentor
  const handleCreateDudiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedJobCards.length === 0) {
      setErrorMsg("Pilih minimal 1 pekerjaan teknis yang tersedia di lokasi mitra ini.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      // 1. Buat partner DUDI
      const partnerRes = await createDudiPartner(
        {
          name: dudiName,
          sectorCategory,
          address,
          city,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          maxQuota: Number(maxQuota),
          supportedJobCardIds: selectedJobCards,
        },
        token
      );

      const newDudiId = partnerRes.data.id;

      // 2. Buat mentor jika diisi
      if (mentorName.trim() && mentorWa.trim()) {
        const mentorRes = await createDudiMentor(
          newDudiId,
          {
            fullName: mentorName,
            jobTitle: mentorJobTitle || "Mentor Lapangan",
            whatsappNumber: mentorWa,
          },
          token
        );

        // Tampilkan modal QR Code aktivasi mentor
        setQrModalData({
          mentorName,
          dudiName,
          token: mentorRes.data.activation.token,
          url: mentorRes.data.activation.fullUrl,
          waLink: mentorRes.data.activation.whatsappLink,
        });
      }

      setSuccessMsg("Mitra DUDI dan kapasitas kompetensi berhasil didaftarkan!");
      setIsAddModalOpen(false);
      resetForm();
      await loadPartners();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mendaftarkan mitra DUDI.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form onboarding
  const resetForm = () => {
    setDudiName("");
    setAddress("");
    setLat("-7.2575");
    setLng("112.7521");
    setMaxQuota(5);
    setSelectedJobCards([]);
    setMentorName("");
    setMentorJobTitle("");
    setMentorWa("");
  };

  // Reset perangkat mentor (A2: Pergantian HP)
  const handleResetMentorDevice = async (mentorId: string, mentorName: string, dudiTitle: string) => {
    const confirmReset = window.confirm(
      `Reset ikatan perangkat untuk ${mentorName}? Perangkat lama tidak akan bisa memverifikasi lagi dan tautan aktivasi baru akan diterbitkan.`
    );
    if (!confirmReset) return;

    try {
      const res = await resetMentorDevice(mentorId, token);
      setQrModalData({
        mentorName,
        dudiName: dudiTitle,
        token: res.data.activationToken,
        url: res.data.fullUrl,
        waLink: `https://wa.me/?text=${encodeURIComponent(
          `Halo ${mentorName}, berikut tautan baru aktivasi perangkat verifikator VokaLink Anda:\n${res.data.fullUrl}`
        )}`,
      });
      setSuccessMsg(`Perangkat ${mentorName} berhasil di-reset. Tautan aktivasi baru siap dikirim.`);
      await loadPartners();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mereset perangkat mentor.");
    }
  };

  const handleCopyLink = () => {
    if (qrModalData?.url) {
      navigator.clipboard.writeText(qrModalData.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleExportCsv = () => {
    if (!qualityAuditData || qualityAuditData.partners.length === 0) return;
    const headers = [
      "ID Mitra",
      "Nama Mitra DUDI",
      "Sektor",
      "Kota",
      "Jumlah Siswa",
      "Total JP",
      "JP Kompetensi",
      "Rasio Relevansi (%)",
      "Rata-rata Validasi (Hari)",
      "Skor Kecepatan",
      "Cakupan CP Didukung",
      "CP Tercapai",
      "Skor Cakupan",
      "Skor Mutu Akhir",
      "Kategori",
      "Rekomendasi",
    ];
    const rows = qualityAuditData.partners.map((p: DudiQualityMetricItem) => [
      p.dudiId,
      `"${p.dudiName.replace(/"/g, '""')}"`,
      `"${p.sectorCategory}"`,
      `"${p.city}"`,
      p.studentCount,
      p.totalJp,
      p.competencyJp,
      p.relevanceRatio,
      p.avgValidationDays,
      p.speedScore,
      p.supportedCpCount,
      p.achievedCpCount,
      p.coverageScore,
      p.overallQualityScore,
      `"${p.category}"`,
      `"${p.recommendation}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r: (string | number)[]) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Audit_Mutu_DUDI_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter list DUDI secara lokal bila pencarian teks aktif
  const filteredPartners = partners.filter((p) => {
    const matchSearch =
      search.trim() === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sectorCategory.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase());
    const matchCity = selectedCity === "Semua" || p.city === selectedCity;
    return matchSearch && matchCity;
  });

  return (
    <div className="space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/school/dashboard"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Kembali"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Direktori Mitra DUDI Terfederasi
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  FR-003 · BR-011
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pendaftaran tempat usaha, pemetaan kapasitas kompetensi, dan aktivasi perangkat mentor Zero-Login.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadPartners}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-xs transition inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Segarkan
            </button>

            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-1 inline" />
              Onboarding Mitra Baru
            </Button>
          </div>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">Perhatian</span>
              {errorMsg}
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">Berhasil</span>
              {successMsg}
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs (FR-003 vs FR-010) */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab("DIRECTORY")}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === "DIRECTORY"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Direktori &amp; Onboarding
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredPartners.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("QUALITY_INDEX")}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === "QUALITY_INDEX"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Audit Mutu Kemitraan DUDI
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              FR-010 · Indeks Kualitas
            </span>
          </button>
        </div>

        {activeTab === "DIRECTORY" ? (
          <>
            {/* Search & City Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama usaha, sektor industri, atau jalan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </form>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="Semua">Semua Kota</option>
                  <option value="Surabaya">Surabaya</option>
                  <option value="Sidoarjo">Sidoarjo</option>
                  <option value="Gresik">Gresik</option>
                  <option value="Malang">Malang</option>
                </select>
              </div>
            </div>

            {/* Directory Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
                    <Skeleton width="70%" height="22px" />
                    <Skeleton width="40%" height="14px" />
                    <Skeleton width="100%" height="48px" />
                  </div>
                ))}
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tidak ada mitra DUDI yang cocok</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Coba sesuaikan kata kunci pencarian atau daftarkan tempat usaha baru.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    resetForm();
                    setIsAddModalOpen(true);
                  }}
                  className="text-xs font-bold"
                >
                  Onboarding Mitra Baru
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Category & Quality Score Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {partner.sectorCategory}
                        </span>
                        {partner.qualityIndexScore && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono">
                            Skor: {partner.qualityIndexScore}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-1">
                        {partner.name}
                      </h3>

                      <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed">
                          {partner.address}, {partner.city}
                        </span>
                      </div>

                      {/* Capabilities & Quota Pill Summary */}
                      <div className="mt-3 grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Kapasitas</span>
                          <span className="text-xs font-extrabold text-blue-700">
                            {partner.capabilitiesCount} JC
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Kuota PKL</span>
                          <span className="text-xs font-extrabold text-slate-800">
                            {partner.maxQuota} Siswa
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Penempatan</span>
                          <span className="text-xs font-extrabold text-emerald-700">
                            {partner.placementsCount} Aktif
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mentor Section */}
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          Mentor Industri ({partner.mentors.length}):
                        </span>
                      </div>

                      {partner.mentors.length === 0 ? (
                        <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-100">
                          Belum ada mentor terdaftar di lokasi ini.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {partner.mentors.map((m) => (
                            <div
                              key={m.id}
                              className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-slate-900 block truncate text-[11px]">
                                  {m.fullName}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {m.jobTitle}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {m.isDeviceBound ? (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full"
                                    title="Perangkat HP mentor telah terikat resmi"
                                  >
                                    <ShieldCheck className="w-3 h-3" />
                                    Terikat
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full"
                                    title="Belum melakukan aktivasi HP"
                                  >
                                    <ShieldAlert className="w-3 h-3" />
                                    Menunggu
                                  </span>
                                )}

                                {/* Reset token device jika HP berganti (A2) */}
                                <button
                                  onClick={() => handleResetMentorDevice(m.id, m.fullName, partner.name)}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition"
                                  title="Reset Ikatan Perangkat (Pergantian HP)"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* FR-010: Quality Audit Tab Content */
          <div className="space-y-6">
            {/* Filter and Action Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Filter Sektor:</span>
                <select
                  value={qualitySectorFilter}
                  onChange={(e) => setQualitySectorFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none w-full sm:w-64"
                >
                  <option value="Semua">Semua Sektor Industri</option>
                  <option value="Teknologi Informasi & Software">Teknologi Informasi & Software</option>
                  <option value="Akuntansi & Keuangan">Akuntansi & Keuangan</option>
                  <option value="Desain Komunikasi Visual & Kreatif">Desain Komunikasi Visual & Kreatif</option>
                  <option value="Otomotif & Manufaktur">Otomotif & Manufaktur</option>
                  <option value="Kuliner & Perhotelan">Kuliner & Perhotelan</option>
                  <option value="Kesehatan & Farmasi">Kesehatan & Farmasi</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={loadQualityAudit}
                  disabled={isQualityLoading}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-xs transition inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isQualityLoading ? "animate-spin" : ""}`} />
                  Segarkan
                </button>
                <Button
                  variant="secondary"
                  onClick={handleExportCsv}
                  disabled={!qualityAuditData || qualityAuditData.partners.length === 0}
                  className="text-xs font-bold"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 inline text-emerald-600" />
                  Ekspor Audit CSV
                </Button>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Mitra Ternilai</span>
                  <Building2 className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {qualityAuditData?.summary.totalDudi ?? 0}
                </div>
                <p className="text-[11px] text-slate-500">
                  Rata-rata: <span className="font-bold text-slate-700">{qualityAuditData?.summary.avgQualityScore ?? 0}</span> / 100
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Mitra Unggulan</span>
                  <Award className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-900">
                  {qualityAuditData?.summary.excellentCount ?? 0}
                </div>
                <p className="text-[11px] text-emerald-700 font-medium">
                  Skor ≥ 80 · Prioritas Kuota
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-amber-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Perlu Evaluasi</span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-900">
                  {qualityAuditData?.summary.evaluationCount ?? 0}
                </div>
                <p className="text-[11px] text-amber-700 font-medium">
                  Skor 50 - 79 · Rotasi Job Card
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-rose-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Zona Merah</span>
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-900">
                  {qualityAuditData?.summary.redZoneCount ?? 0}
                </div>
                <p className="text-[11px] text-rose-700 font-medium">
                  Skor &lt; 50 · Tinjau Ulang MoU
                </p>
              </div>
            </div>

            {/* Formula Explanation Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-900">
                <TrendingUp className="w-4 h-4 text-blue-700" />
                <span>Formula Indeks Kualitas Kemitraan DUDI (BR-010 · DESIGN.md §8.6)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Skor gabungan dihitung objektif berdasarkan data lapangan terverifikasi:
                <strong className="text-slate-800"> 50% Kesesuaian Kurikulum</strong> (rasio jam kompetensi vs non-kompetensi),
                <strong className="text-slate-800"> 30% Kecepatan Respon Mentor</strong> (latensi validasi log harian), dan
                <strong className="text-slate-800"> 20% Cakupan Elemen CP</strong> (persentase capaian pembelajaran SKKNI yang terrealisasi).
              </p>
            </div>

            {/* Audit Table / List */}
            {isQualityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
                    <Skeleton width="50%" height="20px" />
                    <Skeleton width="100%" height="40px" />
                  </div>
                ))}
              </div>
            ) : !qualityAuditData || qualityAuditData.partners.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-900 text-sm">Belum Ada Data Audit</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Belum ada catatan log harian terverifikasi pada mitra di sektor yang dipilih.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {qualityAuditData.partners.map((partner: DudiQualityMetricItem, index: number) => {
                  const isExcellent = partner.category === "Mitra Unggulan";
                  const isEvaluation = partner.category === "Mitra Perlu Evaluasi Penugasan";
                  const badgeStyle = isExcellent
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : isEvaluation
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-rose-100 text-rose-800 border-rose-300";

                  return (
                    <div
                      key={partner.dudiId}
                      className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-slate-900 text-sm">
                                {partner.dudiName}
                              </h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {partner.sectorCategory}
                              </span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {partner.city}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {partner.studentCount} siswa penempatan aktif · {partner.totalJp} total JP log dicatat
                            </p>
                          </div>
                        </div>

                        {/* Overall Score & Badge */}
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold">Skor Mutu</span>
                            <span className="text-lg font-black text-slate-900">
                              {partner.overallQualityScore}
                              <span className="text-xs font-normal text-slate-400"> /100</span>
                            </span>
                          </div>
                          <span
                            className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${badgeStyle}`}
                          >
                            {isExcellent && <Award className="w-3.5 h-3.5" />}
                            {isEvaluation && <AlertTriangle className="w-3.5 h-3.5" />}
                            {!isExcellent && !isEvaluation && <ShieldAlert className="w-3.5 h-3.5" />}
                            {partner.category}
                          </span>
                        </div>
                      </div>

                      {/* 3 Sub-metric breakdowns */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
                        {/* 1. Kurikulum Relevan (50%) */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-600">
                              Kesesuaian Job Card (50%)
                            </span>
                            <span className="font-extrabold text-slate-900 font-mono text-[11px]">
                              {partner.relevanceRatio}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                partner.relevanceRatio >= 80
                                  ? "bg-emerald-500"
                                  : partner.relevanceRatio >= 50
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${Math.min(100, partner.relevanceRatio)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {partner.competencyJp} JP kejuruan dari {partner.totalJp} total JP
                          </p>
                        </div>

                        {/* 2. Kecepatan Mentor (30%) */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-600">
                              Kecepatan Mentor (30%)
                            </span>
                            <span className="font-extrabold text-slate-900 font-mono text-[11px]">
                              {partner.speedScore} pts
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min(100, partner.speedScore)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Rata-rata respon validasi: {partner.avgValidationDays} hari
                          </p>
                        </div>

                        {/* 3. Cakupan Elemen CP (20%) */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-600">
                              Cakupan Elemen CP (20%)
                            </span>
                            <span className="font-extrabold text-slate-900 font-mono text-[11px]">
                              {partner.coverageScore} pts
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${Math.min(100, partner.coverageScore)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {partner.achievedCpCount} dari {partner.supportedCpCount} elemen CP terealisasi
                          </p>
                        </div>
                      </div>

                      {/* Rekomendasi Audit */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-slate-700">Rekomendasi Tindakan:</span>
                          <span
                            className={`font-semibold ${
                              isExcellent
                                ? "text-emerald-700"
                                : isEvaluation
                                ? "text-amber-700"
                                : "text-rose-700"
                            }`}
                          >
                            {partner.recommendation}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      {/* Modal Onboarding DUDI Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Onboarding Mitra DUDI & Pemetaan Kapasitas (FR-003)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Petakan ketersediaan pekerjaan di lokasi usaha dan aktifkan verifikasi mentor &lt; 60 detik.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDudiSubmit} className="space-y-4 text-xs">
              {/* Bagian 1: Data Tempat Usaha */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  1. Informasi Tempat Usaha
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Tempat Usaha / PT *</label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: PT Solusi Cipta Kreasi"
                      value={dudiName}
                      onChange={(e) => setDudiName(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kategori Sektor Industri *</label>
                    <select
                      value={sectorCategory}
                      onChange={(e) => setSectorCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Teknologi Informasi & Software">Teknologi Informasi & Software</option>
                      <option value="Akuntansi & Keuangan">Akuntansi & Keuangan</option>
                      <option value="Desain Komunikasi Visual & Kreatif">Desain Komunikasi Visual & Kreatif</option>
                      <option value="Otomotif & Manufaktur">Otomotif & Manufaktur</option>
                      <option value="Kuliner & Perhotelan">Kuliner & Perhotelan</option>
                      <option value="Kesehatan & Farmasi">Kesehatan & Farmasi</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Jl. Raya Manyar No. 15, Sukolilo"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kota / Kabupaten *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Titik Koordinat (Lat, Lng) *</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="Latitude"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        className="w-1/2 px-2 py-2 bg-white rounded-xl border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="Longitude"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        className="w-1/2 px-2 py-2 bg-white rounded-xl border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shrink-0 transition"
                        title="Ambil GPS Perangkat Saat Ini"
                      >
                        <Compass className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kapasitas Maksimal (Siswa)</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={maxQuota}
                      onChange={(e) => setMaxQuota(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Pemetaan Kapasitas Job Cards */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    2. Pemetaan Pekerjaan yang Tersedia di Lokasi Mitra (Centang min 1) *
                  </span>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    {selectedJobCards.length} Terpilih
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {SAMPLE_JOB_CARDS.map((jc) => {
                    const isChecked = selectedJobCards.includes(jc.id);
                    return (
                      <button
                        type="button"
                        key={jc.id}
                        onClick={() => toggleJobCard(jc.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                          isChecked
                            ? "bg-blue-50/80 border-blue-400 text-blue-900"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                            isChecked ? "bg-blue-600 text-white" : "border border-slate-300"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600 mr-1.5">
                            {jc.sector}
                          </span>
                          <span className="font-semibold text-[11px] leading-snug">{jc.title}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bagian 3: Identitas Mentor Industri */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  3. Identitas Mentor Industri Lapangan
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Mentor *</label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: Budi Santoso"
                      value={mentorName}
                      onChange={(e) => setMentorName(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Jabatan / Divisi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: Senior Developer / Supervisor"
                      value={mentorJobTitle}
                      onChange={(e) => setMentorJobTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp Aktif *</label>
                    <input
                      type="text"
                      required
                      placeholder="08123456789"
                      value={mentorWa}
                      onChange={(e) => setMentorWa(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || selectedJobCards.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {submitting ? "Mendaftarkan..." : "Simpan & Buat Tautan Mentor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal QR Code Aktivasi Mentor */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Aktivasi Perangkat Mentor Industri
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tunjukkan QR ini kepada <strong>{qrModalData.mentorName}</strong> ({qrModalData.dudiName}) untuk dipindai lewat kamera HP, atau kirimkan via WhatsApp.
              </p>
            </div>

            {/* QR Code Graphic Box (Real scannable SVG QR) */}
            <div className="p-4 bg-slate-900 rounded-2xl inline-block mx-auto text-white space-y-2">
              <div className="w-48 h-48 bg-white rounded-xl p-2 mx-auto flex items-center justify-center">
                <QrCodeView
                  value={qrModalData.url}
                  size={170}
                  errorCorrectionLevel="M"
                />
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-400 block">
                Zero-Login PIN Device Token
              </span>
            </div>

            <div className="space-y-2">
              {/* Copy URL */}
              <div className="flex items-center gap-1.5 p-2 bg-slate-100 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={qrModalData.url}
                  className="bg-transparent text-[11px] text-slate-600 font-mono flex-1 outline-none truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 shrink-0 flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedLink ? "Tersalin" : "Salin"}
                </button>
              </div>

              {/* Direct WhatsApp Share Button */}
              <a
                href={qrModalData.waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                Kirim Tautan via WhatsApp
              </a>

              {/* Simulasi Buka Halaman Aktivasi di Tab Baru */}
              <Link
                href={`/v/${qrModalData.token}/activate`}
                target="_blank"
                className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka Layar HP Mentor (Simulasi Pengujian)
              </Link>
            </div>

            <div className="pt-2">
              <Button variant="secondary" onClick={() => setQrModalData(null)} className="w-full">
                Selesai / Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
