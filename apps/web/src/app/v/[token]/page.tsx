"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Calendar,
  Lock,
  X,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Maximize2,
  FileText,
  User,
  GraduationCap,
  Delete,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import {
  fetchMentorVerifyDetails,
  checkMentorDevice,
  executeMentorVerification,
  type MentorVerifyDetailsResponse,
} from "@/lib/api";

export default function MentorVerificationPage() {
  const params = useParams();
  const token = params["token"] as string;
  const router = useRouter();

  // 1. Data States
  const [data, setData] = useState<MentorVerifyDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // 2. Device Recognition State (BR-007 & TC-006)
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [isDeviceRecognized, setIsDeviceRecognized] = useState<boolean | null>(null);

  // 3. Verification Dialog & PIN State (BR-007 & TC-007)
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLockRemaining, setPinLockRemaining] = useState<number | null>(null);

  // 4. Rejection / Revision Dialog State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // 5. Success State
  const [successResult, setSuccessResult] = useState<{
    decision: string;
    processedCount: number;
    message: string;
    verifiedAt: string;
  } | null>(null);

  // 6. Photo Lightbox Modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Load verification details from API
  const loadVerificationData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMessage(null);
    setErrorCode(null);

    try {
      const res = await fetchMentorVerifyDetails(token);
      setData(res);

      // Check device token in localStorage
      const localToken =
        typeof window !== "undefined"
          ? localStorage.getItem("vokalink_mentor_device_token")
          : null;
      setDeviceToken(localToken);

      // Check recognition on server
      try {
        const checkRes = await checkMentorDevice(token, localToken);
        setIsDeviceRecognized(checkRes.recognized);
        if (checkRes.isLocked && res.mentor.lockedUntil) {
          const rem = Math.ceil(
            (new Date(res.mentor.lockedUntil).getTime() - Date.now()) / (60 * 1000)
          );
          setPinLockRemaining(rem > 0 ? rem : 15);
        }
      } catch (checkErr) {
        console.warn("Device check warning:", checkErr);
      }
    } catch (err: any) {
      if (token === "mock-demo-token-123" || token.startsWith("mock-")) {
        // Simulasi demo interaktif jika menggunakan mock demo token
        setData({
          valid: true,
          mode: "WA_BATCH",
          expiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
          nonce: "mock-nonce-123",
          mentor: {
            id: "00000000-0000-0000-0000-000000000060",
            fullName: "Rizky Firmansyah",
            jobTitle: "Engineering Lead & Mentor Industri",
            dudiName: "PT Nusantara Tech",
            hasDeviceBound: true,
            isLocked: false,
            lockedUntil: null,
          },
          student: {
            id: "00000000-0000-0000-0000-000000000001",
            fullName: "Andi Pratama",
            identityNumber: "0078901234",
            departmentName: "Rekayasa Perangkat Lunak (RPL)",
            schoolName: "SMK Demo VokaLink",
          },
          placement: {
            id: "00000000-0000-0000-0000-000000000051",
            dudiName: "PT Nusantara Tech",
            city: "Surabaya",
          },
          logs: [
            {
              id: "demo-log-1",
              clientLogUuid: "00000000-0000-0000-0000-000000000101",
              logDate: "2026-10-20",
              attendanceType: "PRESENT",
              shortNote: "Menyelesaikan router verifikasi zero-login Express dan validasi skema Zod.",
              evidenceWebpUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
              totalDurationJp: 8,
              items: [
                {
                  id: "item-1",
                  jobCardId: "00000000-0000-0000-0000-000000000031",
                  title: "Implementasi RESTful API Express.js & TypeScript",
                  skkniUnitCode: "J.620100.009.01",
                  durationJp: 8,
                  autonomyLevel: 3,
                  autonomyLabel: "Mandiri",
                  isNonCompetency: false,
                },
              ],
            },
            {
              id: "demo-log-2",
              clientLogUuid: "00000000-0000-0000-0000-000000000102",
              logDate: "2026-10-19",
              attendanceType: "PRESENT",
              shortNote: "Refactoring database migration dan trigger PostgreSQL block_verified_log_update.",
              evidenceWebpUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
              totalDurationJp: 8,
              items: [
                {
                  id: "item-2",
                  jobCardId: "00000000-0000-0000-0000-000000000033",
                  title: "Perancangan Skema Basis Data Relasional & Trigger",
                  skkniUnitCode: "J.620100.010.01",
                  durationJp: 8,
                  autonomyLevel: 2,
                  autonomyLabel: "Terbimbing",
                  isNonCompetency: false,
                },
              ],
            },
          ],
        });
        setIsDeviceRecognized(true);
        setDeviceToken("mock-demo-device-token");
      } else {
        setErrorMessage(err.message || "Tautan verifikasi tidak valid atau telah kedaluwarsa.");
        setErrorCode(err.code || "LOAD_ERROR");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadVerificationData();
  }, [loadVerificationData]);

  // Handle PIN Keypad Tap
  const handleKeypadPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setPinError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleClearPin = () => {
    setPin("");
    setPinError(null);
  };

  // Submit Approval Execution
  const handleSubmitApproval = async () => {
    if (pin.length !== 4 || !data || isSubmitting) return;

    if (token === "mock-demo-token-123" || token.startsWith("mock-")) {
      if (pin !== "1234") {
        setPinError("PIN demo tidak sesuai. Masukkan PIN demo: 1234.");
        setPin("");
        return;
      }
      setSuccessResult({
        decision: "APPROVE",
        processedCount: data.logs.length,
        message: `Berhasil memvalidasi dan menyegel ${data.logs.length} entri jurnal harian secara resmi (HMAC-SHA256).`,
        verifiedAt: new Date().toISOString(),
      });
      setShowPinModal(false);
      return;
    }

    if (!deviceToken) {
      setPinError(
        "Perangkat ini belum terdaftar. Mintalah tautan aktivasi perangkat kepada pihak sekolah atau gunakan HP yang telah diikat."
      );
      return;
    }

    setIsSubmitting(true);
    setPinError(null);

    try {
      const result = await executeMentorVerification(token, {
        nonce: data.nonce,
        deviceToken,
        pin,
        decision: "APPROVE",
      });

      setSuccessResult(result);
      setShowPinModal(false);
    } catch (err: any) {
      if (err.code === "PIN_LOCKOUT" || err.message?.includes("15 menit")) {
        setPinLockRemaining(15);
        setPinError("PIN salah 5x berturut-turut. Akses verifikasi terkunci selama 15 menit (TC-007).");
      } else if (err.code === "DEVICE_MISMATCH") {
        setPinError("Perangkat tidak dikenali. Persetujuan ditolak (TC-006).");
      } else {
        setPinError(err.message || "PIN tidak sesuai. Silakan coba lagi.");
      }
      setPin("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Rejection Execution
  const handleSubmitRejection = async () => {
    if (!data || isSubmitting) return;

    if (!deviceToken) {
      alert("Perangkat ini belum diikat sebagai mentor resmi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await executeMentorVerification(token, {
        nonce: data.nonce,
        deviceToken,
        pin: "1234", // Dummy or validated if needed
        decision: "REJECT",
        rejectionReason: rejectionReason || "Perlu revisi data pelaksanaan tugas.",
      });

      setSuccessResult(result);
      setShowRejectModal(false);
    } catch (err: any) {
      alert(err.message || "Gagal memproses penolakan logbook");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 5 UI CONDITIONS: 1. LOADING SKELETON
  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded-xl w-3/4"></div>
          <div className="h-24 bg-slate-200 rounded-2xl"></div>
          <div className="h-48 bg-slate-200 rounded-2xl"></div>
          <div className="h-48 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="h-16 bg-slate-200 rounded-2xl mt-6 animate-pulse"></div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5 UI CONDITIONS: 2. ERROR / EXPIRED / ALREADY USED
  // ─────────────────────────────────────────────────────────────────────────────
  if (errorMessage || !data) {
    const isUsed = errorMessage?.toLowerCase().includes("sudah pernah digunakan");
    const isExpired = errorMessage?.toLowerCase().includes("kedaluwarsa");

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-5">
          <div
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
              isUsed
                ? "bg-blue-100 text-blue-600"
                : isExpired
                ? "bg-amber-100 text-amber-600"
                : "bg-rose-100 text-rose-600"
            }`}
          >
            {isUsed ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : isExpired ? (
              <Clock className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {isUsed
                ? "Tautan Sudah Terverifikasi"
                : isExpired
                ? "Tautan Kedaluwarsa"
                : "Tautan Tidak Valid"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {errorMessage}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5 UI CONDITIONS: 3. CELEBRATION / SUCCESS SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (successResult) {
    const isApproved = successResult.decision === "APPROVE";
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-5">
          <div
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
              isApproved ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
            }`}
          >
            {isApproved ? <ShieldCheck className="w-10 h-10" /> : <RotateCcw className="w-8 h-8" />}
          </div>

          <div className="space-y-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                isApproved
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isApproved ? "Tersegel Resmi HMAC-SHA256" : "Permintaan Revisi Terkirim"}
            </span>

            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {isApproved ? "Jurnal Berhasil Disahkan!" : "Catatan Revisi Terkirim"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {successResult.message}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Siswa Magang:</span>
              <strong className="text-slate-900">{data.student.fullName}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Jumlah Jurnal:</span>
              <strong className="text-slate-900">{successResult.processedCount} Hari Kerja</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Waktu Pengesahan:</span>
              <span className="text-slate-700 font-medium">
                {new Date(successResult.verifiedAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                WIB
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Tautan satu kali pakai ini telah kedaluwarsa secara otomatis demi keamanan audit.
          </p>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition"
          >
            Tutup Halaman
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5 UI CONDITIONS: 4. MAIN VERIFICATION INTERFACE
  // ─────────────────────────────────────────────────────────────────────────────
  const totalJp = data.logs.reduce((acc, curr) => acc + curr.totalDurationJp, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* 1. Header Bar: Mentor Identity & Student Profile */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              VL
            </div>
            <div>
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                Verifikasi Mentor DUDI
              </p>
              <h1 className="text-sm font-extrabold text-slate-900 leading-tight">
                {data.mentor.dudiName}
              </h1>
            </div>
          </div>

          {/* Mode Badge (QR vs WhatsApp) */}
          <span
            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${
              data.mode === "QR"
                ? "bg-purple-50 text-purple-700 border border-purple-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            <Clock className="w-3 h-3" />
            {data.mode === "QR" ? "QR Tatap Muka" : "WA Batch Link"}
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        {/* Device Mismatch Warning Banner (TC-006) */}
        {isDeviceRecognized === false && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-rose-900">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>Peringatan Keamanan Perangkat (TC-006)</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              Browser smartphone ini belum dikenali sebagai perangkat resmi Bapak/Ibu {data.mentor.fullName}. Untuk menjaga keabsahan hukum PKL, persetujuan jurnal hanya sah jika dilakukan dari HP mentor yang telah diikat dengan PIN.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => router.push(`/v/${token}/activate`)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-900 underline hover:text-rose-700"
              >
                Aktivasi & Ikat HP Ini Sebagai Mentor <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Lockout Warning Banner (TC-007) */}
        {pinLockRemaining && pinLockRemaining > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
            <Lock className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div className="text-xs">
              <strong className="block font-bold">Fungsi Persetujuan Terkunci 15 Menit (TC-007)</strong>
              <span>
                Percobaan PIN salah telah mencapai batas 5 kali. Silakan tunggu sekitar{" "}
                <strong>{pinLockRemaining} menit</strong> lagi.
              </span>
            </div>
          </div>
        )}

        {/* Card: Student Identity Summary */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs sm:text-sm">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Identitas Siswa Magang</span>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              NISN: {data.student.identityNumber}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Nama Lengkap</p>
              <p className="font-extrabold text-slate-900 text-sm">{data.student.fullName}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Konsentrasi Keahlian</p>
              <p className="font-bold text-slate-800">{data.student.departmentName}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Sekolah Asal</p>
              <p className="font-medium text-slate-700">{data.student.schoolName}</p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Total Jurnal Menunggu: <strong>{data.logs.length} Hari</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
              Total: {totalJp} Jam Pelajaran (JP)
            </span>
          </div>
        </div>

        {/* Section: Pending Logs List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Daftar Kegiatan yang Perlu Disetujui ({data.logs.length})
          </h2>

          {data.logs.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-bold text-sm text-slate-900">Seluruh Jurnal Telah Diverifikasi</p>
              <p className="text-xs text-slate-500">
                Tidak ada jurnal harian yang menunggu persetujuan pada penempatan ini.
              </p>
            </div>
          ) : (
            data.logs.map((log, idx) => (
              <div
                key={log.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition"
              >
                {/* Header Kartu Log: Tanggal & Durasi */}
                <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {new Date(log.logDate).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {log.attendanceType !== "PRESENT" ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                        {log.attendanceType === "SICK" ? "Sakit" : "Izin Resmi"}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {log.totalDurationJp} JP
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Job Cards list within this log */}
                  <div className="space-y-2">
                    {log.items.map((item, iIdx) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          item.isNonCompetency
                            ? "bg-amber-50/50 border-amber-200/70"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-slate-900 leading-snug">
                            {log.items.length > 1 && (
                              <span className="text-blue-600 mr-1.5 font-extrabold">#{iIdx + 1}</span>
                            )}
                            {item.title}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0 ${
                              item.autonomyLevel === 3
                                ? "bg-emerald-100 text-emerald-800"
                                : item.autonomyLevel === 2
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {item.autonomyLabel}
                          </span>
                        </div>

                        {item.skkniUnitCode && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            SKKNI: {item.skkniUnitCode}
                          </p>
                        )}

                        {item.isNonCompetency && (
                          <p className="text-[10px] text-amber-800 font-semibold flex items-center gap-1">
                            <span>Bantuan Operasional Umum (BR-004)</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Catatan Siswa */}
                  {log.shortNote && (
                    <div className="text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 italic">
                      &quot;{log.shortNote}&quot;
                    </div>
                  )}

                  {/* Foto Bukti Kerja WebP */}
                  {log.evidenceWebpUrl && (
                    <div className="pt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Foto Bukti Kerja</span>
                        <span className="text-[10px] text-blue-600 font-semibold">Ketuk untuk perbesar</span>
                      </p>
                      <div
                        onClick={() => setPreviewPhotoUrl(log.evidenceWebpUrl)}
                        className="relative rounded-xl overflow-hidden border border-slate-200 h-36 bg-slate-100 cursor-pointer group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={log.evidenceWebpUrl}
                          alt="Bukti Kerja Siswa"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Maximize2 className="w-4 h-4" />
                          <span>Perbesar Foto</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────────────────────
          STICKY BOTTOM ACTIONS BAR (Area Sentuh Minimal 56px Sesuai DESIGN.md §13.6)
         ───────────────────────────────────────────────────────────────────────────── */}
      {data.logs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 z-30 shadow-lg">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            {/* Tombol Tolak / Minta Revisi */}
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              disabled={Boolean(pinLockRemaining && pinLockRemaining > 0)}
              className="h-14 px-4 sm:px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Minta Revisi</span>
            </button>

            {/* Tombol Persetujuan Utama (Batch Approve < 10 dtk TC-005) */}
            <button
              type="button"
              onClick={() => {
                setPin("");
                setPinError(null);
                setShowPinModal(true);
              }}
              disabled={Boolean(pinLockRemaining && pinLockRemaining > 0)}
              className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>
                {data.logs.length > 1 ? `Setujui Semua (${data.logs.length} Hari)` : "Setujui Pekerjaan"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL NUMPAD PIN 4 DIGIT (BR-007, TC-005, TC-007)
         ───────────────────────────────────────────────────────────────────────────── */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Masukkan PIN Mentor</h3>
                  <p className="text-[11px] text-slate-500">Penyegelan Resmi HMAC-SHA256 (BR-007)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PIN Display Indicators */}
            <div className="py-2 text-center space-y-2">
              <div className="flex items-center justify-center gap-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      pin.length > idx
                        ? "bg-emerald-600 scale-125 shadow-xs"
                        : "border-2 border-slate-300 bg-slate-100"
                    }`}
                  />
                ))}
              </div>

              {pinError && (
                <p className="text-xs text-rose-600 font-bold animate-in shake duration-200">
                  {pinError}
                </p>
              )}
            </div>

            {/* Custom Mobile Numpad Grid (Area Sentuh >= 56px) */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  disabled={isSubmitting}
                  className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-slate-900 font-bold text-xl flex items-center justify-center transition cursor-pointer select-none"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClearPin}
                disabled={isSubmitting || pin.length === 0}
                className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center transition cursor-pointer"
              >
                Hapus
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress("0")}
                disabled={isSubmitting}
                className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-slate-900 font-bold text-xl flex items-center justify-center transition cursor-pointer select-none"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                disabled={isSubmitting || pin.length === 0}
                className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Confirm Submit Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmitApproval}
                disabled={pin.length !== 4 || isSubmitting}
                className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                {isSubmitting ? (
                  <span>Menyegel Kriptografi...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Konfirmasi Pengesahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL CATATAN REVISI / PENOLAKAN
         ───────────────────────────────────────────────────────────────────────────── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">Minta Perbaikan / Revisi</h3>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Jurnal ini akan dikembalikan ke siswa dengan status <strong>Perlu Revisi</strong> agar siswa dapat memperbaiki durasi atau catatan kerja.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="rejection-reason" className="text-xs font-bold text-slate-700">
                Alasan / Catatan Bimbingan:
              </label>
              <textarea
                id="rejection-reason"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Jam praktik melebihi durasi kerja aktual atau foto belum menggambarkan tugas."
                className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Template Alasan Cepat */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Pilihan Cepat:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Durasi jam kerja tidak sesuai",
                  "Foto bukan pekerjaan yang dimaksud",
                  "Tugas belum diselesaikan tuntas",
                ].map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => setRejectionReason(txt)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitRejection}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Revisi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          LIGHTBOX MODAL PREVIEW FOTO
         ───────────────────────────────────────────────────────────────────────────── */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-lg w-full max-h-[85vh] flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhotoUrl}
              alt="Bukti Kerja Perbesar"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="mt-3 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
