"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import VokaIcon from "@/components/common/VokaIcon";
import {
  fetchActivationDetails,
  activateMentorDevice,
} from "@/lib/api";
import { sanitizeErrorMessage } from "@/lib/error-formatter";

export default function MentorActivationPage() {
  const params = useParams();
  const token = params["token"] as string;

  // Data aktivasi
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form PIN
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"REVIEW" | "PIN_SETUP" | "SUCCESS">("REVIEW");
  const [submitting, setSubmitting] = useState(false);

  // Muat detail aktivasi token
  const loadDetails = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const details = await fetchActivationDetails(token);
      setData(details);
    } catch (err: any) {
      setData(null);
      setErrorMsg(
        sanitizeErrorMessage(
          err,
          "Tautan aktivasi tidak valid, sudah pernah digunakan, atau telah kedaluwarsa."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [token]);

  // Handler numpad PIN
  const handleNumpadClick = (digit: string) => {
    if (step === "PIN_SETUP") {
      if (pin.length < 4) {
        setPin((prev) => prev + digit);
      } else if (confirmPin.length < 4) {
        setConfirmPin((prev) => prev + digit);
      }
    }
  };

  const handleNumpadBackspace = () => {
    if (confirmPin.length > 0) {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else if (pin.length > 0) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  // Submit aktivasi
  const handleActivateDevice = async () => {
    if (pin.length !== 4) {
      setErrorMsg("Masukkan 4 digit PIN.");
      return;
    }
    if (confirmPin && pin !== confirmPin) {
      setErrorMsg("Konfirmasi PIN tidak cocok. Silakan coba lagi.");
      setConfirmPin("");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      // 1. Bangkitkan 32 byte secure random device token di browser mentor
      const randomBytes = new Uint8Array(32);
      window.crypto.getRandomValues(randomBytes);
      const deviceTokenHex = Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // 2. Simpan device token ke localStorage & IndexedDB secara persisten
      localStorage.setItem("vokalink_mentor_device_token", deviceTokenHex);
      if (data?.mentor?.id) {
        localStorage.setItem(`vokalink_mentor_device_token_${data.mentor.id}`, deviceTokenHex);
      }
      if ("storage" in navigator && "persist" in navigator.storage) {
        await navigator.storage.persist();
      }

      // 3. Kirimkan ke server API
      await activateMentorDevice(token, {
        deviceToken: deviceTokenHex,
        pin,
      });

      setStep("SUCCESS");
    } catch (err: any) {
      setErrorMsg(sanitizeErrorMessage(err, "Gagal mengaktifkan perangkat verifikator."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-900 flex flex-col justify-between font-sans max-w-md mx-auto shadow-xl border-x border-slate-200/80 relative">
      {/* Top Header / Branding */}
      <header className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center p-2 shadow-2xs">
            <VokaIcon className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 block leading-tight">VokaLink Industri</span>
            <span className="text-[10px] text-sky-600 font-bold block">
              Portal Mentor Zero-Login
            </span>
          </div>
        </div>

        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
          Aktivasi HP
        </span>
      </header>

      {/* Main Body */}
      <main className="p-5 flex-1 flex flex-col justify-center space-y-5">
        {loading ? (
          <div className="space-y-4 py-8">
            <Skeleton width="60%" height="28px" className="bg-slate-200" />
            <Skeleton width="100%" height="60px" className="bg-slate-200" />
            <Skeleton width="100%" height="180px" className="bg-slate-200" />
          </div>
        ) : errorMsg && !data ? (
          /* Error State */
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tautan Tidak Valid</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                {errorMsg}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={loadDetails}
              className="text-xs font-bold bg-white text-slate-700 border-slate-200 rounded-full"
            >
              Coba Lagi
            </Button>
          </div>
        ) : step === "REVIEW" ? (
          /* Step 1: Review Tempat Usaha & Daftar Pekerjaan */
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider block mb-1">
                Langkah 1 dari 2
              </span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Selamat Datang, {data?.mentor.fullName}!
              </h1>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Anda didaftarkan sebagai Mentor Pembimbing di <strong>{data?.dudi.name}</strong> ({data?.dudi.city}).
              </p>
            </div>

            {/* Zero-Login Value Proposition Banner */}
            <div className="p-4 rounded-3xl bg-sky-50 border border-sky-200/80 text-sky-900 text-xs flex items-start gap-3 shadow-2xs">
              <Sparkles className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-slate-900 block mb-0.5">Tanpa Email &amp; Password</span>
                HP Anda akan diikat menjadi kunci verifikator resmi. Cukup buat <strong>PIN 4-digit</strong> untuk menyetujui logbook siswa di kemudian hari.
              </div>
            </div>

            {/* Supported Job Cards Checklist (Full-bleed divider) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="p-4 pb-3 flex items-center justify-between text-xs border-b border-slate-100">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-sky-600" />
                  Pekerjaan yang Dipetakan Sekolah:
                </span>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                  {data?.supportedJobCards.length} Tugas
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {data?.supportedJobCards.map((jc: any) => (
                  <div
                    key={jc.id}
                    className="p-3.5 px-4 flex items-start gap-2.5 hover:bg-slate-50/60 transition"
                  >
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-slate-900 block leading-snug">
                        {jc.title}
                      </span>
                      {jc.tools && jc.tools.length > 0 && (
                        <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                          Alat: {jc.tools.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary Action Button (Touch target min 56px: h-14, rounded-full, bg-sky-500) */}
            <button
              onClick={() => setStep("PIN_SETUP")}
              className="w-full h-14 rounded-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-black text-sm flex items-center justify-center gap-2 transition shadow-md shadow-sky-500/20 active:scale-[0.99] cursor-pointer"
            >
              Lanjut: Buat PIN 4-Digit
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : step === "PIN_SETUP" ? (
          /* Step 2: Buat PIN 4-Digit dengan Numpad Ramah Sentuhan */
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider block">
                Langkah 2 dari 2
              </span>
              <h2 className="text-xl font-black text-slate-900">
                {pin.length < 4 ? "Buat PIN 4-Digit Anda" : "Ulangi PIN untuk Konfirmasi"}
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                PIN ini akan Anda masukkan setiap kali menyetujui logbook harian siswa.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
                {errorMsg}
              </div>
            )}

            {/* PIN Display Indicators */}
            <div className="flex items-center justify-center gap-4 py-3">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pin.length < 4 ? index < pin.length : index < confirmPin.length;
                return (
                  <div
                    key={index}
                    className={`w-12 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all ${
                      isFilled
                        ? "bg-sky-500 text-white border-2 border-sky-400 scale-105 shadow-md shadow-sky-500/30"
                        : "bg-white border-2 border-slate-200 text-slate-400 shadow-2xs"
                    }`}
                  >
                    {isFilled ? "●" : ""}
                  </div>
                );
              })}
            </div>

            {/* Interactive Touch-Friendly Numpad (Min 56px per key: h-14) */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto w-full pt-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumpadClick(num)}
                  className="h-14 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-extrabold text-xl flex items-center justify-center transition border border-slate-200/80 active:scale-95 shadow-2xs cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setPin("");
                  setConfirmPin("");
                }}
                className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center transition border border-slate-200/60 cursor-pointer"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => handleNumpadClick("0")}
                className="h-14 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-extrabold text-xl flex items-center justify-center transition border border-slate-200/80 active:scale-95 shadow-2xs cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleNumpadBackspace}
                className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center transition border border-slate-200/60 cursor-pointer"
              >
                ⌫
              </button>
            </div>

            {/* Action trigger when 4 digits are completed (h-14 pill rounded-full) */}
            {pin.length === 4 && confirmPin.length === 4 && (
              <button
                onClick={handleActivateDevice}
                disabled={submitting}
                className="w-full h-14 rounded-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-black text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-sky-500/25 animate-in fade-in active:scale-[0.99] cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Mengikat Kriptografi...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" /> Aktifkan Perangkat Sekarang
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          /* Step 3: Success State */
          <div className="text-center py-8 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest block">
                Verifikator Resmi Aktif
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                HP Anda Berhasil Diikat!
              </h2>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed pt-1">
                Kunci kriptografi <strong>Device-Bound PIN</strong> telah disimpan di peramban HP ini. Anda siap memverifikasi logbook siswa dengan scan QR atau tautan WhatsApp.
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs text-left text-xs space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="text-slate-500">Mentor:</span>
                <span className="font-bold text-slate-900">{data?.mentor.fullName}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="text-slate-500">Tempat Usaha:</span>
                <span className="font-bold text-slate-900">{data?.dudi.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status Kunci:</span>
                <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">DEVICE_BOUND (PIN Aktif)</span>
              </div>
            </div>

            <div className="p-3 text-[11px] text-slate-500 bg-slate-50 border border-slate-200/70 rounded-2xl">
              <em>Tips: Simpan halaman ini sebagai bookmark jika ingin melihat status verifikator Anda sewaktu-waktu.</em>
            </div>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="p-4 text-center border-t border-slate-200/80 bg-white text-[11px] text-slate-500">
        VokaLink Zero-Login Verification Protocol &middot; Biaya Infrastruktur Rp0
      </footer>
    </div>
  );
}
