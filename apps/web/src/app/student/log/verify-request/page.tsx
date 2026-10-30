"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  CalendarCheck,
  ArrowLeft,
} from "lucide-react";
import { generateVerificationLink, fetchStudentLogContext } from "@/lib/api";
import { QrCodeView } from "@/components/ui/QrCodeView";
import { db } from "@/lib/pwa/db";

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.393A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.05c-1.637 0-3.167-.442-4.485-1.214l-.322-.19-2.964.83.844-2.89-.21-.334C4.053 14.908 3.6 13.498 3.6 12c0-4.632 3.768-8.4 8.4-8.4 4.633 0 8.4 3.768 8.4 8.4 0 4.633-3.767 8.05-8.4 8.05z" />
    </svg>
  );
}

export default function VerifyRequestPage() {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [studentName, setStudentName] = useState("Andi Pratama");
  const [mentorName, setMentorName] = useState("Rahmat Hidayat Siregar, S.T");
  const [dudiName, setDudiName] = useState("PT Telkom Indonesia Witel Sumut");
  const [mentorPhone, setMentorPhone] = useState("6281260001001");
  const [qrSize, setQrSize] = useState(175);

  useEffect(() => {
    const updateSize = () => {
      if (typeof window !== "undefined") {
        if (window.innerHeight < 700 || window.innerWidth < 640) {
          setQrSize(150);
        } else {
          setQrSize(175);
        }
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const [activeLinkData, setActiveLinkData] = useState<{
    token: string;
    verificationUrl: string;
    fullUrl: string;
    networkUrl?: string;
    hostIp?: string;
    waShareUrl?: string | null;
    expiresAt: string;
    pendingCount?: number;
  } | null>(null);
  const [emptyStatus, setEmptyStatus] = useState<"ALL_VERIFIED" | "NO_PENDING_LOGS" | null>(null);

  const loadVerificationData = useCallback(async () => {
    try {
      setIsLoading(true);
      setEmptyStatus(null);

      const cached = await db.refData.get("student_log_context");
      let placement = (cached?.data as any)?.activePlacement;
      let student = (cached?.data as any)?.student;

      if ((!placement || !student) && typeof navigator !== "undefined" && navigator.onLine) {
        const fresh = await fetchStudentLogContext();
        if (fresh) {
          placement = fresh.activePlacement;
          student = fresh.student;
          await db.refData.put({
            key: "student_log_context",
            data: fresh,
            cachedAt: Date.now(),
          });
        }
      }

      const placementId =
        placement?.id || "af9cde1d-0509-45b4-adb3-1936cd296b97";

      if (student?.fullName) setStudentName(student.fullName);
      if (placement?.mentorName) setMentorName(placement.mentorName);
      if (placement?.dudiName) setDudiName(placement.dudiName);
      if (placement?.mentorPhone) setMentorPhone(placement.mentorPhone);

      // Selalu bundel seluruh jurnal yang pending dari PostgreSQL (Auto-Detect)
      try {
        const res = await generateVerificationLink({
          placementId,
          mode: "WA_BATCH",
        });
        setActiveLinkData(res);
      } catch (genErr: any) {
        if (genErr?.code === "ALL_LOGS_VERIFIED") {
          setEmptyStatus("ALL_VERIFIED");
          setActiveLinkData(null);
        } else if (genErr?.code === "NO_PENDING_LOGS") {
          setEmptyStatus("NO_PENDING_LOGS");
          setActiveLinkData(null);
        } else {
          console.warn("Gagal membangkitkan tautan verifikasi mentor:", genErr);
        }
      }
    } catch (err) {
      console.warn("Konteks verifikasi mentor:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVerificationData();
  }, [loadVerificationData]);

  const [appOrigin, setAppOrigin] = useState<string>("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppOrigin(window.location.origin);
    }
  }, []);

  const vercelAppUrl = (appOrigin || process.env["NEXT_PUBLIC_APP_URL"] || "https://vokalink.vercel.app").replace(/\/$/, "");

  // Relative path ke halaman verifikasi mentor: /v/[token]
  const verificationPath =
    activeLinkData?.verificationUrl ||
    (activeLinkData?.token ? `/v/${activeLinkData.token}` : "/v/mock-demo-token-123");

  // URL verifikasi publik untuk dipindai kamera mentor
  const activeUrl = `${vercelAppUrl}${verificationPath}`;

  const pendingDays = activeLinkData?.pendingCount ?? 2;
  const totalHours = pendingDays * 8;

  // Draf pesan santun otomatis saat tombol WhatsApp ditekan
  const politeMessage = `Selamat sore Bapak/Ibu ${mentorName}, mohon izin mengganggu waktunya sebentar. Saya ${studentName} (siswa PKL di ${dudiName}). Mengingat kesibukan Bapak/Ibu, izin mengirimkan tautan rekap jurnal ${
    pendingDays > 1 ? `borongan (${pendingDays} hari kerja)` : "hari ini"
  } untuk diverifikasi melalui 1 kali input PIN: ${activeUrl}\n\nTerima kasih banyak atas bimbingan dan arahannya, Pak/Bu 🙏`;

  const waDeepLink = `https://wa.me/${mentorPhone.replace(/^0/, "62")}?text=${encodeURIComponent(
    politeMessage
  )}`;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(activeUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="max-w-lg sm:max-w-xl mx-auto font-sans animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-card text-center space-y-2.5 sm:space-y-3">
        {/* ─── 1. HEADER & IDENTITAS MENTOR (SATU BARIS TERPADU) ─── */}
        <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 text-left">
          <div className="hidden md:flex items-center gap-2.5 min-w-0">
            <Link
              href="/student/log/history"
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-95 shrink-0"
              title="Kembali ke Riwayat"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight truncate">
                Minta Validasi Mentor
              </h1>
              <p className="text-[10.5px] sm:text-xs text-slate-400 font-normal truncate">
                Pindai QR langsung atau kirim via WA
              </p>
            </div>
          </div>

          {/* Chip Profil Mentor Ringkas (Full width di mobile, rapi & informatif) */}
          <div className="flex items-center justify-between md:justify-start gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200/70 w-full md:w-auto">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {mentorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-900 leading-none truncate block">
                    {mentorName}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Mentor Aktif" />
                </div>
                <span className="text-[10px] text-slate-400 font-normal truncate block mt-0.5">
                  {dudiName}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
              Mentor Industri
            </span>
          </div>
        </div>

        {emptyStatus === "ALL_VERIFIED" ? (
          <div className="bg-emerald-50/70 p-6 sm:p-7 rounded-3xl border border-emerald-200/80 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
              <CheckCircle2 className="w-8 h-8 stroke-[2.3]" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-emerald-950">
                Seluruh Jurnal Telah Terverifikasi Sah!
              </h4>
              <p className="text-xs text-emerald-800/80 mt-1.5 max-w-sm leading-relaxed">
                Semua logbook praktik industri Anda telah disetujui resmi oleh pembimbing DUDI dengan segel digital HMAC. Tidak ada antrean verifikasi saat ini.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs pt-2">
              <Link
                href="/student/log/history"
                className="flex-1 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center transition shadow-xs"
              >
                Buka Riwayat Jurnal
              </Link>
              <Link
                href="/student/home"
                className="h-10 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center transition"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : emptyStatus === "NO_PENDING_LOGS" ? (
          <div className="bg-slate-50/80 p-6 sm:p-7 rounded-3xl border border-slate-200/80 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 shadow-2xs">
              <CalendarCheck className="w-8 h-8 stroke-[2.3]" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                Belum Ada Jurnal Menunggu Pengesahan
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 max-w-sm leading-relaxed">
                Anda belum memiliki logbook kegiatan yang menunggu untuk diajukan pengesahan kepada mentor industri.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs pt-2">
              <Link
                href="/student/log/new"
                className="flex-1 h-10 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center transition shadow-xs"
              >
                Tulis Jurnal Baru
              </Link>
              <Link
                href="/student/home"
                className="h-10 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center transition"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ─── 2. INFO REKAP BORONGAN ─── */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200/70 text-xs sm:text-[13px] font-bold mx-auto">
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{`${pendingDays} Hari Kerja (${totalHours} Jam) Menunggu Pengesahan`}</span>
            </div>

            {/* ─── 3. KODE QR DENGAN QUIET ZONE BERSIH & PRESISI (LEBIH BESAR) ─── */}
            <div className="flex flex-col items-center justify-center pt-1">
              <div className="p-2.5 sm:p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs inline-block">
                {isLoading ? (
                  <div
                    className="flex flex-col items-center justify-center gap-2 text-slate-400"
                    style={{ width: qrSize, height: qrSize }}
                  >
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                    <span className="text-[11px] font-medium">Membangkitkan segel QR...</span>
                  </div>
                ) : (
                  <QrCodeView
                    value={activeUrl}
                    size={qrSize}
                    className="mx-auto"
                  />
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-1.5">
                Arahkan kamera smartphone mentor ke kode QR di atas
              </p>
            </div>

            {/* ─── 4. TOMBOL AKSI UTAMA DALAM SATU BARIS ─── */}
            <div className="flex items-center gap-2 max-w-md mx-auto w-full pt-1">
              <a
                href={waDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[44px] h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs shadow-emerald-600/20 transition cursor-pointer whitespace-nowrap"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
                <span>Kirim ke WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="min-h-[44px] h-11 px-3.5 sm:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition border border-slate-200/80 cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin Tautan</span>
                  </>
                )}
              </button>
            </div>

            {/* ─── 5. FOOTNOTE KEAMANAN & DEMO JURI ─── */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] sm:text-[11px] text-slate-500">
              <div className="flex items-center gap-1 min-w-0 truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  <strong className="text-slate-700 font-semibold">Keamanan 2-Faktor:</strong> Tautan 1x pakai · PIN 4-digit
                </span>
              </div>

              <a
                href={activeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-sky-600 hover:text-sky-700 hover:underline shrink-0 transition ml-2"
                title="Buka tampilan mentor di tab baru"
              >
                <span>Buka Halaman</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
