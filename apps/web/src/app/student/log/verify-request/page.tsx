"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Building2,
  CalendarCheck,
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
  const [mentorName, setMentorName] = useState("Rizky Firmansyah");
  const [dudiName, setDudiName] = useState("PT Nusantara Tech");
  const [dudiCity, setDudiCity] = useState("Surabaya");
  const [mentorPhone, setMentorPhone] = useState("081388881001");

  const [activeLinkData, setActiveLinkData] = useState<{
    token: string;
    verificationUrl: string;
    fullUrl: string;
    waShareUrl?: string | null;
    expiresAt: string;
    pendingCount?: number;
  } | null>(null);

  const loadVerificationData = useCallback(async () => {
    try {
      setIsLoading(true);
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
        placement?.id || "3ffec674-ad55-482a-a566-9dff84ab71be";

      if (student?.fullName) setStudentName(student.fullName);
      if (placement?.mentorName) setMentorName(placement.mentorName);
      if (placement?.dudiName) setDudiName(placement.dudiName);
      if (placement?.dudiCity) setDudiCity(placement.dudiCity);
      if (placement?.mentorPhone) setMentorPhone(placement.mentorPhone);

      // Selalu bundel seluruh jurnal yang pending dari PostgreSQL (Auto-Detect)
      const res = await generateVerificationLink({
        placementId,
        mode: "WA_BATCH",
      });

      setActiveLinkData(res);
    } catch (err) {
      console.warn("Gagal membangkitkan tautan verifikasi mentor:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVerificationData();
  }, [loadVerificationData]);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const effectiveVerificationUrl = activeLinkData?.fullUrl
    ? activeLinkData.fullUrl
    : `${origin}${activeLinkData?.verificationUrl || "/v/mock-demo-token-123"}`;

  const pendingDays = activeLinkData?.pendingCount ?? 5;
  const totalHours = pendingDays * 8;

  // Draf pesan santun otomatis saat tombol WhatsApp ditekan
  const politeMessage = `Selamat sore Bapak/Ibu ${mentorName}, mohon izin mengganggu waktunya sebentar. Saya ${studentName} (siswa PKL RPL SMK VokaLink di ${dudiName}). Mengingat kesibukan Bapak/Ibu, izin mengirimkan tautan rekap jurnal ${
    pendingDays > 1 ? `borongan (${pendingDays} hari kerja)` : "hari ini"
  } untuk diverifikasi melalui 1 kali input PIN: ${effectiveVerificationUrl}\n\nTerima kasih banyak atas bimbingan dan arahannya, Pak/Bu 🙏`;

  const waDeepLink = activeLinkData?.waShareUrl
    ? activeLinkData.waShareUrl
    : `https://wa.me/${mentorPhone.replace(/^0/, "62")}?text=${encodeURIComponent(
        politeMessage
      )}`;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(effectiveVerificationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="max-w-lg mx-auto font-sans space-y-2.5 sm:space-y-3 animate-in fade-in duration-150">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HEADER RINGKAS & STATUS MENTOR
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Minta Validasi Mentor
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[10.5px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Mentor Aktif</span>
            </span>
          </div>
          <p className="text-[11.5px] text-slate-500 mt-0.5 font-normal">
            Pindai QR saat tatap muka atau kirimkan via WhatsApp
          </p>
        </div>

        {/* Ringkasan Status Mentor */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs shrink-0">
          <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
            {mentorName.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-left pr-0.5">
            <p className="text-[11.5px] font-bold text-slate-900 leading-tight">{mentorName}</p>
            <p className="text-[9.5px] text-slate-500 font-normal truncate max-w-[140px] flex items-center gap-0.5">
              <Building2 className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              <span>{dudiName} · {dudiCity}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. SATU KARTU TERPADU (Single Viewport Fit, No Scroll)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs text-center space-y-3">
        {/* Info Ringkasan Jam Kerja */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-[11.5px] font-bold">
          <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {pendingDays} Hari Kerja ({totalHours} Jam) Menunggu Pengesahan
          </span>
        </div>

        {/* Frame Kode QR Bersih */}
        <div className="inline-block p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          {isLoading ? (
            <div className="w-44 h-44 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
              <span className="text-[11px] font-medium">Membangkitkan segel QR...</span>
            </div>
          ) : (
            <div className="p-1 bg-white rounded-xl flex items-center justify-center">
              <QrCodeView
                value={effectiveVerificationUrl}
                size={175}
                className="mx-auto"
              />
            </div>
          )}

          {/* Status Segel Aman */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200/60 text-[10.5px] font-medium text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Segel Kriptografis HMAC-SHA256 Siap Dipindai</span>
          </div>
        </div>

        {/* ─── Tombol Aksi Nyata: WhatsApp & Salin Tautan ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto pt-0.5">
          <a
            href={waDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 h-11 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs shadow-emerald-500/20 transition cursor-pointer"
          >
            <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
            <span>Kirim ke WhatsApp Mentor</span>
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full sm:w-auto h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-200/80 cursor-pointer"
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
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. FOOTNOTE RINGKAS KEAMANAN & DEMO JURI
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="p-2.5 rounded-xl bg-slate-100/70 border border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5 min-w-0 truncate mr-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate text-slate-500">
            <strong className="text-slate-700 font-semibold">Keamanan 2-Faktor:</strong> Tautan 1x pakai · PIN 4-digit
          </span>
        </div>

        {/* Akses Cepat Simulasi Mentor untuk Presentasi Lomba / Demo Penguji */}
        <Link
          href={activeLinkData?.verificationUrl || "/v/mock-demo-token-123"}
          target="_blank"
          className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-emerald-700 hover:underline shrink-0 transition"
          title="Buka simulasi tampilan mentor di browser ini"
        >
          <span>Simulasi Mentor</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
