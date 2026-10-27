"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Flame,
  LogIn,
  KeyRound,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  User,
  Loader2,
  FileText,
} from "lucide-react";
import Navbar, { NavbarButton } from "@/components/layout/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, loginWithIdentifier, isAuthenticated, role: userRole } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unlinkedEmail, setUnlinkedEmail] = useState<string | null>(null);

  // Jika sudah login, redirect otomatis ke dashboard yang sesuai
  useEffect(() => {
    if (isAuthenticated && userRole) {
      if (userRole === "SCHOOL_ADMIN") {
        router.replace("/school/dashboard");
      } else if (userRole === "TEACHER") {
        router.replace("/teacher/heatmap");
      } else if (userRole === "STUDENT") {
        router.replace("/student/home");
      }
    }
  }, [isAuthenticated, userRole, router]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const emailParam = searchParams.get("email");

    if (errorParam === "unlinked") {
      setUnlinkedEmail(emailParam || "email Anda");
    } else if (errorParam === "auth_failed") {
      setErrorMsg("Otentikasi Google gagal atau dibatalkan. Silakan coba kembali.");
    }
  }, [searchParams]);

  // Handler Masuk dengan Google (OAuth)
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);
    setUnlinkedEmail(null);

    try {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "http://localhost:3000";
      const redirectTo = `${origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: unknown) {
      setGoogleLoading(false);
      const msg = err instanceof Error ? err.message : "Gagal menginisialisasi login Google.";
      setErrorMsg(msg);
    }
  };

  // Handler Masuk Manual (Email/NIP/NISN & Password)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setUnlinkedEmail(null);

    if (!identifier.trim()) {
      setErrorMsg("Email resmi, NIP, atau NISN siswa wajib diisi.");
      return;
    }
    if (!password) {
      setErrorMsg("Kata sandi / kode akses wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3001/api/v1";

      // 1. Jika identifier berformat email, coba validasi melalui Supabase Auth terlebih dahulu
      if (identifier.includes("@")) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: identifier.trim(),
          password,
        });

        if (!authError && authData?.session) {
          const res = await fetch(`${apiUrl}/auth/me`, {
            headers: {
              Authorization: `Bearer ${authData.session.access_token}`,
            },
          });

          if (res.status === 403) {
            await supabase.auth.signOut();
            setUnlinkedEmail(identifier.trim());
            return;
          }

          if (res.ok) {
            const json = await res.json();
            const profileData = json?.data;
            const role = profileData?.role;

            // Simpan sesi ke AuthContext & cookies
            setSession(authData.session.access_token, profileData);

            if (role === "SCHOOL_ADMIN") {
              router.push("/school/dashboard");
            } else if (role === "TEACHER") {
              router.push("/teacher/heatmap");
            } else if (role === "STUDENT") {
              router.push("/student/home");
            } else {
              router.push("/school/dashboard");
            }
            return;
          }
        }
        // Jika tidak ada di Supabase Auth, lanjutkan ke alur kredensial database (loginWithIdentifier)
      }

      // 2. Jika identifier adalah NISN atau NIP Resmi, validasi via loginWithIdentifier
      const result = await loginWithIdentifier(identifier.trim(), password);

      if (!result.success) {
        throw new Error(result.error || "Kredensial tidak valid.");
      }

      const role = result.role;

      if (role === "STUDENT") {
        router.push("/student/home");
      } else if (role === "TEACHER") {
        router.push("/teacher/heatmap");
      } else if (role === "SCHOOL_ADMIN") {
        router.push("/school/dashboard");
      } else {
        router.push("/student/home");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal masuk ke sistem.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex flex-col justify-center">
      <div className="max-w-md mx-auto lg:max-w-none w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        {/* SECTION KIRI: Banner Grafis Fitur VokaLink (Hanya tampil di Desktop lg:flex, disembunyikan di Mobile) */}
        <section className="hidden lg:flex lg:col-span-6 rounded-3xl bg-slate-900 text-white p-8 sm:p-10 lg:p-12 border border-slate-800 shadow-xl flex-col justify-between relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header & Tagline */}
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ekosistem PKL SMK Berbasis SKKNI</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Otomasi Logbook, Evaluasi Kompetensi & Paspor Digital.
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Satu ekosistem terpadu untuk menghubungkan siswa vokasi, guru pembimbing, dan mentor industri secara transparan dan tervalidasi.
            </p>
          </div>

          {/* Feature Highlights (High Contrast Modern Micro-Cards) */}
          <div className="relative z-10 my-6 space-y-3">
            {/* Feature 1 */}
            <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/20">
                <Flame className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-xs sm:text-sm text-white">Live Heatmap & Deteksi Drift</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Guru memantau pencapaian 792 JP dan mendeteksi anomali penugasan non-kompetensi secara instan.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 shrink-0 mt-0.5 border border-amber-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-xs sm:text-sm text-white">Verifikasi Mentor Tanpa Akun</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Mentor industri menyetujui jurnal siswa dalam &lt;10 detik lewat tautan QR/WhatsApp dan PIN HP.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 shrink-0 mt-0.5 border border-sky-500/20">
                <FileText className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-xs sm:text-sm text-white">Paspor Kompetensi & CV ATS</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Rekap kegiatan tervalidasi otomatis bertransformasi menjadi resume standar industri ber-QR resmi.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance Note */}
          <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Setiap sertifikat dan paspor kompetensi dilengkapi segel digital resmi sesuai standar kurikulum vokasi nasional.
            </p>
          </div>
        </section>

        {/* SECTION KANAN: Formulir Login Autentikasi Terpadu */}
        <section className="w-full lg:col-span-6 bg-white p-7 sm:p-9 lg:p-12 rounded-3xl border border-slate-200/90 shadow-xl flex flex-col justify-between space-y-6">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100 inline-block mb-2.5">
            Autentikasi Terpadu
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Masuk ke VokaLink
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            Gunakan Akun Google, Email Sekolah, atau NISN Siswa untuk mengakses sistem.
          </p>
        </div>

        {/* Peringatan Akun Google Belum Terhubung (Sesuai Spesifikasi) */}
        {unlinkedEmail && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="font-extrabold text-amber-900 text-xs sm:text-sm">
                  ⚠️ Akun Belum Terhubung dengan Sekolah
                </h2>
                <p className="text-amber-800 leading-relaxed">
                  Email Google Anda (<strong>{unlinkedEmail}</strong>) belum terdaftar di database sekolah manapun di VokaLink.
                </p>
                <p className="text-amber-700/90 text-[11px]">
                  Pastikan Admin Pokja PKL di sekolah Anda telah mengimpor atau mendaftarkan email tersebut. Jika Anda adalah perwakilan sekolah baru, silakan daftarkan sekolah terlebih dahulu.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200/60">
              <button
                type="button"
                onClick={() => setUnlinkedEmail(null)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
              >
                Tutup
              </button>
              <Link
                href="/register-school"
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition shadow-xs"
              >
                Daftarkan Sekolah
              </Link>
            </div>
          </div>
        )}

        {/* Notifikasi Error Standar */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Formulir Masuk Manual (Email/NISN & Password) */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Resmi, NIP Guru, atau NISN Siswa
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="admin.telkommedan@vokalink.id / 0078901234"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition font-medium placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Kata Sandi / Kode Akses Siswa
              </label>
              <a
                href="#reset"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Untuk siswa, minta reset kode akses melalui Guru Pembimbing Anda.");
                }}
                className="text-[11px] text-sky-600 font-semibold hover:underline"
              >
                Lupa akses?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition font-medium placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold shadow-md shadow-sky-500/20 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>{loading ? "Memverifikasi..." : "Masuk ke Sistem"}</span>
          </button>
        </form>

        {/* Pembatas / Divider */}
        <div className="relative flex items-center justify-center pt-1">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
            atau masuk dengan Google
          </span>
        </div>

        {/* Tombol Masuk dengan Google (di bawah tombol biru Masuk ke Sistem) */}
        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold shadow-xs transition hover:border-slate-300 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
            ) : (
              <GoogleIcon className="w-5 h-5 shrink-0" />
            )}
            <span>{googleLoading ? "Menghubungkan ke Google..." : "Masuk dengan Google"}</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Belum mendaftarkan sekolah Anda?{" "}
          <Link
            href="/register-school"
            className="text-sky-600 font-bold hover:underline"
          >
            Daftar Multi-Tenant (2 Menit)
          </Link>
        </div>
      </section>
    </div>
  </main>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col justify-between font-sans selection:bg-sky-500 selection:text-white">
      {/* 1. TOP NAVBAR */}
      <Navbar
        rightSlot={
          <NavbarButton
            href="/register-school"
            label="Daftarkan Sekolah Baru"
            variant="outline"
          />
        }
      />

      {/* 2. MAIN WORKSPACE WITH SUSPENSE FOR SEARCH PARAMS */}
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>

      {/* 3. FOOTER */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        <p>&copy; 2026 VokaLink &bull; Ekosistem PKL SMK Terintegrasi &bull; UINIC 8.0</p>
      </footer>
    </div>
  );
}
