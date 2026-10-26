"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  QrCode,
  Flame,
  Layers,
  ArrowRight,
  LogIn,
  KeyRound,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  User,
  Loader2,
} from "lucide-react";
import Navbar, { NavbarButton } from "@/components/layout/Navbar";
import { DemoBar } from "@/components/shell/DemoBar";
import { supabase } from "@/lib/supabase";

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

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unlinkedEmail, setUnlinkedEmail] = useState<string | null>(null);

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

  // Handler Masuk Manual (Email/NISN & Password)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setUnlinkedEmail(null);

    if (!identifier.trim()) {
      setErrorMsg("Email resmi atau NISN siswa wajib diisi.");
      return;
    }
    if (!password) {
      setErrorMsg("Kata sandi / kode akses wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3001/api/v1";

      // 1. Jika identifier berformat email, validasi melalui Supabase Auth
      if (identifier.includes("@")) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: identifier.trim(),
          password,
        });

        if (authError || !authData.session) {
          throw new Error("Email atau kata sandi tidak valid. Periksa kembali kredensial Anda.");
        }

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

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.detail || "Gagal memverifikasi akun ke server VokaLink.");
        }

        const json = await res.json();
        const role = json?.data?.role;
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

      // 2. Jika identifier adalah NISN atau Nomor Identitas Resmi, validasi ke server VokaLink
      const res = await fetch(`${apiUrl}/auth/login-identifier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.detail || json.title || "Kredensial tidak valid.");
      }

      const role = json?.data?.role;
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

  const handleQuickDemo = (rolePath: string) => {
    router.push(rolePath);
  };

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Login Form */}
      <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100 inline-block mb-2">
            Autentikasi Terpadu
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Masuk ke VokaLink
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Gunakan akun Google, Email Sekolah, atau NISN Siswa untuk mengakses sistem.
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
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulir Masuk Manual (Email/NISN & Password) */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Resmi atau NISN Siswa
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="admin.smk@vokalink.id / 0078901234"
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
            <LogIn className="w-4 h-4" />
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
      </div>

      {/* Right Column: Judge Quick Switcher (1-Click Role Switcher) */}
      <div className="lg:col-span-6 space-y-4">
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-full bg-sky-500/20 text-sky-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
              Judge Demo Switcher (Simulasi Peran Juri)
            </h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Uji seluruh alur sistem secara langsung tanpa perlu login manual. Pilih peran yang ingin Anda simulasikan:
          </p>

          <div className="space-y-2.5">
            {/* Option 1: School Admin */}
            <button
              type="button"
              onClick={() => handleQuickDemo("/school/dashboard")}
              className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-sky-300 transition">
                    1. Admin Pokja PKL (SMK Demo)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Dasbor Sekolah, Master Kurikulum & Job Cards, Smart Placement
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
            </button>

            {/* Option 2: Teacher */}
            <button
              type="button"
              onClick={() => handleQuickDemo("/teacher/heatmap")}
              className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-emerald-300 transition">
                    2. Guru Pembimbing (Budi Santoso)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Live Heatmap 2D, Deteksi Drift, Peringatan & Intervensi WA
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
            </button>

            {/* Option 3: Student */}
            <button
              type="button"
              onClick={() => handleQuickDemo("/student/home")}
              className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-sky-300 transition">
                    3. Siswa PKL PWA (Andi Pratama - RPL)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Zero-Typing Logger, Tombol Jujur, Kompresi Foto, CV ATS
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
            </button>

            {/* Option 4: Industry Mentor */}
            <button
              type="button"
              onClick={() => handleQuickDemo("/v/demo-token")}
              className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-300 transition">
                    4. Mentor Industri (PT Nusantara Tech)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Validasi Zero-Login (&lt;10 dtk), Pengikatan Token & PIN
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
            </button>

            {/* Option 5: HRD / Public Verifier */}
            <button
              type="button"
              onClick={() => handleQuickDemo("/verify/andi-pratama-rpl-2026")}
              className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-indigo-300 transition">
                    5. Verifikator Publik / HRD Rekruter
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Audit Paspor Kompetensi Publik Ber-QR & Segel Kriptografi
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col justify-between font-sans selection:bg-sky-500 selection:text-white">
      {/* 1. DEMO BAR (Top Judge Switcher) */}
      <DemoBar />

      {/* 2. TOP NAVBAR */}
      <Navbar
        rightSlot={
          <NavbarButton
            href="/register-school"
            label="Daftarkan Sekolah Baru"
            variant="outline"
          />
        }
      />

      {/* 3. MAIN WORKSPACE WITH SUSPENSE FOR SEARCH PARAMS */}
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>

      {/* 4. FOOTER */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        <p>&copy; 2026 VokaLink &bull; Ekosistem PKL SMK Terintegrasi &bull; UINIC 8.0</p>
      </footer>
    </div>
  );
}
