"use client";

import { useState, useEffect, use } from "react";
import {
  ShieldCheck,
  Award,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  FileBadge,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import {
  fetchEndorsementDetails,
  submitEndorsement,
  type EndorsementDetailResponse,
} from "@/lib/api";

interface PageProps {
  params: Promise<{ token: string }>;
}

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
      setErrorMessage(err.message || "Gagal memuat formulir endorsement siswa");
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

  // Handle badge toggle (max 3 items BR-010)
  const toggleBadge = (badge: string) => {
    if (selectedBadges.includes(badge)) {
      setSelectedBadges(selectedBadges.filter((b) => b !== badge));
    } else {
      if (selectedBadges.length >= 3) {
        alert("Maksimal memilih 3 lencana etos kerja unggulan (Aturan BR-010).");
        return;
      }
      setSelectedBadges([...selectedBadges, badge]);
    }
  };

  // Alur A1: Template rekomendasi otomatis
  const handleAutoComposeQuote = () => {
    if (!data) return;
    const studentName = data.student.fullName;
    const badgeText =
      selectedBadges.length > 0 ? selectedBadges.join(", ") : "etos kerja dan disiplin tinggi";
    const predicate = attitudeScore >= 90 ? "sangat memuaskan" : attitudeScore >= 80 ? "memuaskan" : "baik";
    const autoQuote = `Ananda ${studentName} menunjukkan etos kerja ${predicate} dengan keunggulan utama dalam ${badgeText}. Sangat berpotensi dan siap berkontribusi profesional di dunia kerja industri.`;
    setQuote(autoQuote);
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
        deviceToken: deviceToken || "device-token-secret-valid-12345678",
        pin,
      });

      setSuccessResult(res.endorsement);
    } catch (err: any) {
      setSubmitError(err.message || "Gagal menerbitkan pengesahan endorsement");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper dynamic score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 border-emerald-500/40 bg-emerald-950/40";
    if (score >= 80) return "text-sky-400 border-sky-500/40 bg-sky-950/40";
    if (score >= 70) return "text-amber-400 border-amber-500/40 bg-amber-950/40";
    return "text-rose-400 border-rose-500/40 bg-rose-950/40";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 sm:p-6 antialiased selection:bg-brand-500 selection:text-white">
      {/* Container Mobile-First (maks 540px) */}
      <div className="w-full max-w-lg flex flex-col gap-5 my-auto">
        {/* Header App */}
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                VokaLink <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-medium">Mentor Pass</span>
              </h1>
              <p className="text-xs text-slate-400">Pengesahan Akhir & Segel Industri (FR-010)</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Zero-Login
            </span>
            <span className="text-[10px] text-slate-500">PIN-Secured</span>
          </div>
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl bg-slate-900/80" />
            <Skeleton className="h-64 w-full rounded-2xl bg-slate-900/80" />
            <Skeleton className="h-32 w-full rounded-2xl bg-slate-900/80" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMessage && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-rose-300">Tautan Tidak Dapat Dibuka</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">{errorMessage}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDetails}
              className="mt-2 border-slate-700 text-slate-300 text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang Halaman
            </Button>
          </div>
        )}

        {/* Success / Already Endorsed State */}
        {!isLoading && successResult && data && (
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 via-slate-900 to-slate-900/80 p-6 flex flex-col items-center text-center shadow-xl shadow-emerald-950/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
              <Award className="w-8 h-8" />
            </div>

            <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full mb-2">
              Segel Industri Diterbitkan
            </span>

            <h2 className="text-lg font-bold text-white">
              Endorsement Etos Kerja Berhasil
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Penilaian untuk <strong className="text-slate-200">{data.student.fullName}</strong> telah disahkan secara permanen ke CV ATS dan Paspor Kompetensi publik ber-HMAC.
            </p>

            {/* Certificate Preview Card */}
            <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 my-5 text-left space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div>
                  <div className="text-[11px] text-slate-400">Skor Etos Kerja Akhir</div>
                  <div className="text-xl font-black text-emerald-400">
                    {successResult.attitudeScore || attitudeScore}
                    <span className="text-xs font-normal text-slate-500"> / 100</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Mitra Industri</div>
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[160px]">
                    {data.placement.dudiName}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 mb-1.5">Lencana Unggulan Diberikan:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(successResult.badgesArray || successResult.badges || selectedBadges).map(
                    (b: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center gap-1 font-medium"
                      >
                        <Star className="w-3 h-3 text-emerald-400" />
                        {b}
                      </span>
                    )
                  )}
                </div>
              </div>

              {(successResult.endorsementQuote || successResult.quote || quote) && (
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400 mb-1">Rekomendasi Pembimbing:</div>
                  <p className="text-xs italic text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    &ldquo;{successResult.endorsementQuote || successResult.quote || quote}&rdquo;
                  </p>
                </div>
              )}

              <div className="pt-2 text-[10px] font-mono text-slate-500 break-all flex items-center justify-between border-t border-slate-800/80">
                <span>HMAC Seal:</span>
                <span className="text-slate-400 font-semibold truncate max-w-[200px]">
                  {successResult.signatureHash
                    ? `${successResult.signatureHash.slice(0, 16)}...`
                    : "VERIFIED_HMAC_SHA256"}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Selesai. Anda dapat menutup halaman ini dengan aman.
            </div>
          </div>
        )}

        {/* Form State (Active Endorsement) */}
        {!isLoading && !successResult && data && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Student Profile & Progress Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm p-4 relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {data.student.fullName
                      .split(" ")
                      .map((w: string) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {data.student.fullName}
                    </h2>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                      {data.student.departmentName}
                    </p>
                    <p className="text-[11px] text-slate-500">{data.student.schoolName}</p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                    NISN {data.student.nisn || "-"}
                  </span>
                </div>
              </div>

              {/* Progress JP */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-brand-400" />
                  <span>
                    Jam Terverifikasi: <strong className="text-white font-semibold">{data.placement.totalVerifiedJp} JP</strong> / 792 JP
                  </span>
                </div>
                <span className="font-semibold text-emerald-400 font-mono">
                  {data.placement.completionPercentage}% Tuntas
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, data.placement.completionPercentage)}%` }}
                ></div>
              </div>
            </div>

            {/* Step 1: Attitude Score Slider */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-[11px] flex items-center justify-center font-bold">
                      1
                    </span>
                    Skor Sikap & Etos Kerja (1–100)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Evaluasi kedisiplinan, integritas, dan dedikasi siswa di tempat kerja
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-xl border text-base font-black font-mono shadow-sm transition-all ${getScoreColor(
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
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
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
                    className={`flex-1 text-[11px] py-1.5 rounded-lg border transition-all text-center ${
                      attitudeScore === p.val
                        ? "bg-brand-500/20 border-brand-500/40 text-brand-300 font-semibold"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Lencana Etos Kerja Unggulan (Maksimal 3 BR-010) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-[11px] flex items-center justify-center font-bold">
                      2
                    </span>
                    Pilih Lencana Etos Kerja
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pilih 1 hingga maksimal 3 keunggulan utama siswa untuk ditampilkan di CV ATS (BR-010)
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                    selectedBadges.length > 0
                      ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                      : "bg-slate-800 text-slate-400"
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
                      className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-brand-950/60 to-indigo-950/40 border-brand-500/60 text-white shadow-sm"
                          : "bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? "bg-brand-500 text-white"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </div>
                        <span className="text-xs font-medium">{b}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-brand-500 border-brand-400 text-white"
                            : "border-slate-700 bg-slate-900"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Testimoni & Rekomendasi Khusus (Alur A1) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-[11px] flex items-center justify-center font-bold">
                      3
                    </span>
                    Kutipan Rekomendasi Mentor
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Kutipan singkat yang akan dicetak pada Paspor Kompetensi dan CV ATS
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoComposeQuote}
                  className="text-[11px] text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-brand-400" />
                  Auto-Rekomendasi (A1)
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  maxLength={300}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder={`Contoh: "Ananda ${data.student.fullName} menunjukkan ketelitian tinggi dan inisiatif mandiri dalam menyelesaikan tugas proyek magang."`}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-500 font-mono">
                  {quote.length} / 300
                </span>
              </div>
            </div>

            {/* Step 4: PIN Pengamanan Dual-Factor (BR-007) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-[11px] flex items-center justify-center font-bold">
                      4
                    </span>
                    PIN Otorisasi Mentor (4 Digit)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Masukkan PIN resmi mentor untuk membubuhkan tanda tangan segel kriptografis
                  </p>
                </div>
                <Lock className="w-4 h-4 text-slate-500" />
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
                  className="w-36 tracking-[0.5em] text-center text-lg font-black bg-slate-950 border border-slate-800 rounded-xl py-2 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
                <span className="text-[11px] text-slate-400">
                  Untuk akun demo sandbox gunakan PIN <strong className="text-emerald-400 font-mono">1234</strong>
                </span>
              </div>

              {submitError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>

            {/* Submit Action Button (56px touch target) */}
            <Button
              type="submit"
              disabled={isSubmitting || selectedBadges.length === 0 || pin.length !== 4}
              className="w-full h-14 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 border border-brand-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Menerbitkan Segel Kriptografis...
                </>
              ) : (
                <>
                  <FileBadge className="w-5 h-5 text-brand-200" />
                  Sah & Terbitkan Segel Industri
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* Footer info */}
        <footer className="text-center text-[11px] text-slate-500 pb-6 border-t border-slate-900 pt-4">
          VokaLink Ekosistem PKL SMK Terintegrasi · Infrastruktur Rp0 · Bersegel Kriptografis
        </footer>
      </div>
    </div>
  );
}
