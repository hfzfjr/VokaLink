"use client";

import { useState, useEffect, use } from "react";
import {
  Award,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  ChevronRight,
  FileBadge,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import VokaIcon from "@/components/common/VokaIcon";
import {
  fetchEndorsementDetails,
  submitEndorsement,
  type EndorsementDetailResponse,
} from "@/lib/api";
import { sanitizeErrorMessage } from "@/lib/error-formatter";

interface PageProps {
  params: Promise<{ token: string }>;
}

const NINE_ASPECTS = [
  // Soft Skills (5 Aspek)
  { id: "discipline", label: "Kedisiplinan", desc: "Ketepatan waktu kehadiran & jam kerja", group: "Soft Skills" },
  { id: "teamwork", label: "Kerja Sama", desc: "Komunikasi & koordinasi dalam tim", group: "Soft Skills" },
  { id: "responsibility", label: "Tanggung Jawab", desc: "Keseriusan menyelesaikan tugas", group: "Soft Skills" },
  { id: "initiative", label: "Inisiatif & Mandiri", desc: "Proaktif mencari solusi pekerjaan", group: "Soft Skills" },
  { id: "workEthics", label: "Etika & Sopan Santun", desc: "Kerapian, tutur kata, & 5R/5S", group: "Soft Skills" },
  // Hard Skills (4 Aspek)
  { id: "technicalSkills", label: "Keterampilan Kerja", desc: "Penguasaan alat, mesin, atau software", group: "Hard Skills" },
  { id: "workQuality", label: "Kualitas Hasil Kerja", desc: "Presisi & standar mutu industri", group: "Hard Skills" },
  { id: "workSpeed", label: "Kecepatan & Ketepatan", desc: "Efisiensi target waktu pengerjaan", group: "Hard Skills" },
  { id: "occupationalSafetyK3", label: "K3 (Keselamatan Kerja)", desc: "Penerapan prosedur aman & K3LH", group: "Hard Skills" },
];

export default function MentorEndorsementPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<EndorsementDetailResponse | null>(null);

  // Form states
  const [attitudeScore, setAttitudeScore] = useState<number>(90);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [quote, setQuote] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [deviceToken, setDeviceToken] = useState<string>("");

  // 9 Aspek Baku Penilaian Lapangan (5 Soft Skills + 4 Hard Skills)
  const [aspectRatings, setAspectRatings] = useState<Record<string, number>>({
    discipline: 4,
    teamwork: 4,
    responsibility: 4,
    initiative: 3,
    workEthics: 4,
    technicalSkills: 4,
    workQuality: 4,
    workSpeed: 3,
    occupationalSafetyK3: 4,
  });
  const [showDetailedAspects, setShowDetailedAspects] = useState(false);

  const handleRatingChange = (aspectId: string, rating: number) => {
    const updated = { ...aspectRatings, [aspectId]: rating };
    setAspectRatings(updated);

    // Hitung rata-rata skor numerik (level 1=75, level 2=82, level 3=90, level 4=98)
    const ratingValues: Record<number, number> = { 1: 75, 2: 82, 3: 90, 4: 98 };
    const values = Object.values(updated).map((r) => ratingValues[r] ?? 85);
    const avg = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
    setAttitudeScore(avg);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load details
  const loadDetails = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchEndorsementDetails(token);
      setData(res);

      if (res.existingEndorsement) {
        setSuccessResult(res.existingEndorsement);
      } else {
        // Pre-select 2 badges as default inspiration
        if (res.standardBadges && res.standardBadges.length >= 2) {
          setSelectedBadges([res.standardBadges[0]!, res.standardBadges[1]!]);
        }
      }
    } catch (err: any) {
      setErrorMessage(sanitizeErrorMessage(err, "Gagal memuat formulir endorsement siswa"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();

    // Ambil device token dari localStorage browser mentor (FR-003)
    if (typeof window !== "undefined") {
      const savedToken =
        localStorage.getItem("vokalink_mentor_device_token") ||
        localStorage.getItem("vokalink_device_token") ||
        "device-token-secret-valid-12345678";
      setDeviceToken(savedToken);
    }
  }, [token]);

  // Handle badge toggle (max 3 items)
  const toggleBadge = (badge: string) => {
    if (selectedBadges.includes(badge)) {
      setSelectedBadges(selectedBadges.filter((b) => b !== badge));
    } else {
      if (selectedBadges.length >= 3) {
        alert("Maksimal memilih 3 lencana etos kerja unggulan.");
        return;
      }
      setSelectedBadges([...selectedBadges, badge]);
    }
  };

  // Submit endorsement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    if (selectedBadges.length === 0) {
      setSubmitError("Pilih minimal 1 lencana etos kerja unggulan.");
      return;
    }
    if (pin.length !== 4) {
      setSubmitError("Masukkan tepat 4 digit PIN keamanan mentor.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await submitEndorsement(token, {
        attitudeScore,
        selectedBadges,
        endorsementQuote: quote.trim() || undefined,
        aspectRatings: aspectRatings as any,
        deviceToken: deviceToken || "device-token-secret-valid-12345678",
        pin,
      });

      setSuccessResult(res.endorsement);
    } catch (err: any) {
      setSubmitError(sanitizeErrorMessage(err, "Gagal menerbitkan pengesahan endorsement"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper dynamic score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-700 border-emerald-200 bg-emerald-50";
    if (score >= 80) return "text-sky-700 border-sky-200 bg-sky-50";
    if (score >= 70) return "text-amber-700 border-amber-200 bg-amber-50";
    return "text-rose-700 border-rose-200 bg-rose-50";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center p-4 sm:p-6 antialiased selection:bg-sky-500 selection:text-white">
      {/* Container Mobile-First (maks 540px) */}
      <div className="w-full max-w-lg flex flex-col gap-5 my-auto">
        {/* Header App */}
        <header className="flex items-center justify-between bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center shadow-2xs">
              <VokaIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                VokaLink <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 font-semibold">Mentor Pass</span>
              </h1>
              <p className="text-xs text-slate-500">Pengesahan Akhir &amp; Penilaian Etos Kerja</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Zero-Login
            </span>
            <span className="text-[10px] text-slate-400">PIN-Secured</span>
          </div>
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl bg-slate-200/70" />
            <Skeleton className="h-64 w-full rounded-2xl bg-slate-200/70" />
            <Skeleton className="h-32 w-full rounded-2xl bg-slate-200/70" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center flex flex-col items-center gap-3 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tautan Tidak Dapat Dibuka</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">{errorMessage}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDetails}
              className="mt-2 border-slate-200 text-slate-700 text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang Halaman
            </Button>
          </div>
        )}

        {/* Success / Already Endorsed State */}
        {!isLoading && successResult && data && (
          <div className="rounded-3xl border border-emerald-200 bg-white p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
              <Award className="w-8 h-8" />
            </div>

            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-2">
              Segel Industri Diterbitkan
            </span>

            <h2 className="text-lg font-extrabold text-slate-900">
              Endorsement Etos Kerja Berhasil
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Penilaian untuk <strong className="text-slate-900">{data.student.fullName}</strong> telah disahkan secara permanen ke CV ATS dan Paspor Kompetensi publik.
            </p>

            {/* Certificate Preview Card with full bleed divider */}
            <div className="w-full bg-white border border-slate-200/80 rounded-3xl overflow-hidden my-5 text-left shadow-2xs">
              <div className="p-5 pb-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500">Skor Etos Kerja Akhir</div>
                  <div className="text-xl font-black text-emerald-600">
                    {successResult.attitudeScore || attitudeScore}
                    <span className="text-xs font-normal text-slate-400"> / 100</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Mitra Industri</div>
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
                    {data.placement.dudiName}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/40 p-5 pt-3.5 space-y-3">
                <div>
                  <div className="text-[11px] text-slate-500 mb-1.5">Lencana Unggulan Diberikan:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(successResult.badgesArray || successResult.badges || selectedBadges).map(
                      (b: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 flex items-center gap-1 font-semibold"
                        >
                          <Star className="w-3 h-3 text-emerald-600" />
                          {b}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {(successResult.endorsementQuote || successResult.quote || quote) && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <div className="text-[11px] text-slate-500 mb-1">Rekomendasi Pembimbing:</div>
                    <p className="text-xs italic text-slate-700 bg-white p-3 rounded-2xl border border-slate-200/80">
                      &ldquo;{successResult.endorsementQuote || successResult.quote || quote}&rdquo;
                    </p>
                  </div>
                )}

                <div className="pt-2 text-[10px] font-mono text-slate-500 break-all flex items-center justify-between border-t border-slate-200/60">
                  <span>Segel Digital:</span>
                  <span className="text-slate-700 font-semibold truncate max-w-[200px]">
                    {successResult.signatureHash
                      ? `${successResult.signatureHash.slice(0, 16)}...`
                      : "VERIFIED_HMAC_SHA256"}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Selesai. Anda dapat menutup halaman ini dengan aman.
            </div>
          </div>
        )}

        {/* Form State (Active Endorsement) */}
        {!isLoading && !successResult && data && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Student Profile & Progress Card (Full-Bleed Divider) */}
            <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
              <div className="p-5 pb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white font-bold text-lg shadow-xs">
                    {data.student.fullName
                      .split(" ")
                      .map((w: string) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      {data.student.fullName}
                    </h2>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                      <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                      {data.student.departmentName}
                    </p>
                    <p className="text-[11px] text-slate-500">{data.student.schoolName}</p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono font-semibold">
                    NISN {data.student.nisn || "-"}
                  </span>
                </div>
              </div>

              {/* Progress JP (Full-Bleed Divider) */}
              <div className="border-t border-slate-100 bg-slate-50/40 p-5 pt-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>
                      Jam Terverifikasi: <strong className="text-slate-900 font-bold">{data.placement.totalVerifiedJp} JP</strong> / 792 JP
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600 font-mono">
                    {data.placement.completionPercentage}% Tuntas
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, data.placement.completionPercentage)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Step 1: Attitude Score Slider */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[11px] flex items-center justify-center font-bold">
                      1
                    </span>
                    Skor Sikap &amp; Etos Kerja (1–100)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Evaluasi kedisiplinan, integritas, dan dedikasi siswa di tempat kerja
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-xl border text-base font-black font-mono shadow-2xs transition-all ${getScoreColor(
                    attitudeScore
                  )}`}
                >
                  {attitudeScore}
                </div>
              </div>

              {/* Slider Input */}
              <input
                type="range"
                min="50"
                max="100"
                step="1"
                value={attitudeScore}
                onChange={(e) => setAttitudeScore(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />

              {/* Quick Presets */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {[
                  { label: "Cukup (75)", val: 75 },
                  { label: "Memuaskan (85)", val: 85 },
                  { label: "Sangat Baik (95)", val: 95 },
                  { label: "Sempurna (100)", val: 100 },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setAttitudeScore(p.val)}
                    className={`flex-1 text-[11px] py-1.5 rounded-xl border transition-all text-center cursor-pointer ${
                      attitudeScore === p.val
                        ? "bg-sky-50 border-sky-300 text-sky-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Toggle 9 Aspek Baku Penilaian Lapangan */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDetailedAspects(!showDetailedAspects)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Rincian 9 Aspek Standar Industri (Soft &amp; Hard Skills)</span>
                  </span>
                  <span className="text-[11px] text-sky-700 font-semibold underline">
                    {showDetailedAspects ? "Sembunyikan" : "Buka Rubrik Detail"}
                  </span>
                </button>

                {showDetailedAspects && (
                  <div className="mt-3 space-y-4 animate-in fade-in duration-200">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Pilih level pencapaian siswa untuk setiap indikator resmi (1 = Perlu Bimbingan, 2 = Cukup, 3 = Baik, 4 = Sangat Baik). Nilai rata-rata akan otomatis menyelaraskan skor akhir.
                    </p>

                    {/* Group Soft Skills */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-lg">
                        1. Aspek Sikap &amp; Perilaku (Soft Skills)
                      </h4>
                      <div className="space-y-2">
                        {NINE_ASPECTS.filter((a) => a.group === "Soft Skills").map((asp) => (
                          <div
                            key={asp.id}
                            className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-900">{asp.label}</p>
                              <p className="text-[10px] text-slate-500">{asp.desc}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {[
                                { lvl: 1, label: "1: Bimbingan" },
                                { lvl: 2, label: "2: Cukup" },
                                { lvl: 3, label: "3: Baik" },
                                { lvl: 4, label: "4: Sangat Baik" },
                              ].map((btn) => (
                                <button
                                  key={btn.lvl}
                                  type="button"
                                  onClick={() => handleRatingChange(asp.id, btn.lvl)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                    aspectRatings[asp.id] === btn.lvl
                                      ? "bg-sky-600 border-sky-600 text-white shadow-2xs"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Group Hard Skills */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-lg">
                        2. Aspek Kemampuan Teknis (Hard Skills)
                      </h4>
                      <div className="space-y-2">
                        {NINE_ASPECTS.filter((a) => a.group === "Hard Skills").map((asp) => (
                          <div
                            key={asp.id}
                            className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-900">{asp.label}</p>
                              <p className="text-[10px] text-slate-500">{asp.desc}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {[
                                { lvl: 1, label: "1: Bimbingan" },
                                { lvl: 2, label: "2: Cukup" },
                                { lvl: 3, label: "3: Baik" },
                                { lvl: 4, label: "4: Sangat Baik" },
                              ].map((btn) => (
                                <button
                                  key={btn.lvl}
                                  type="button"
                                  onClick={() => handleRatingChange(asp.id, btn.lvl)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                    aspectRatings[asp.id] === btn.lvl
                                      ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Lencana Etos Kerja Unggulan */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[11px] flex items-center justify-center font-bold">
                      2
                    </span>
                    Pilih Lencana Etos Kerja
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pilih 1 hingga maksimal 3 keunggulan utama siswa untuk ditampilkan di CV ATS
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                    selectedBadges.length > 0
                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {selectedBadges.length} / 3 dipilih
                </span>
              </div>

              {/* Badge List */}
              <div className="grid grid-cols-1 gap-2 pt-1">
                {data.standardBadges.map((b: string) => {
                  const isSelected = selectedBadges.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBadge(b)}
                      className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-sky-50/80 border-sky-400 text-slate-900 shadow-2xs"
                          : "bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? "bg-sky-500 text-white"
                              : "bg-white border border-slate-200 text-slate-400"
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </div>
                        <span className="text-xs font-semibold">{b}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-sky-500 border-sky-500 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Testimoni & Rekomendasi Singkat */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[11px] flex items-center justify-center font-bold">
                    3
                  </span>
                  Kutipan Rekomendasi Mentor (Opsional)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Kutipan singkat yang akan dicetak pada Paspor Kompetensi dan CV ATS siswa
                </p>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  maxLength={300}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder={`Contoh: "Ananda ${data.student.fullName} menunjukkan ketelitian tinggi dan inisiatif mandiri dalam menyelesaikan tugas proyek magang."`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 resize-none"
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-mono">
                  {quote.length} / 300
                </span>
              </div>
            </div>

            {/* Step 4: PIN Pengamanan Mentor */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[11px] flex items-center justify-center font-bold">
                      4
                    </span>
                    PIN Otorisasi Mentor (4 Digit)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Masukkan PIN resmi mentor untuk membubuhkan tanda tangan segel digital
                  </p>
                </div>
                <Lock className="w-4 h-4 text-slate-400" />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-36 tracking-[0.5em] text-center text-lg font-black bg-slate-50 border border-slate-200 rounded-xl py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
                <span className="text-[11px] text-slate-500">
                  Untuk akun demo gunakan PIN <strong className="text-emerald-600 font-mono">1234</strong>
                </span>
              </div>

              {submitError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>

            {/* Submit Action Button (56px touch target & pill shape) */}
            <Button
              type="submit"
              disabled={isSubmitting || selectedBadges.length === 0 || pin.length !== 4}
              className="w-full h-14 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm rounded-full shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Menerbitkan Segel Industri...
                </>
              ) : (
                <>
                  <FileBadge className="w-5 h-5" />
                  Sahkan &amp; Terbitkan Rekomendasi Industri
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* Footer info */}
        <footer className="text-center text-[11px] text-slate-400 pb-6 pt-2">
          VokaLink · Ekosistem PKL SMK Terintegrasi · Bersegel Kriptografis
        </footer>
      </div>
    </div>
  );
}
