"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Eye,
  EyeOff,
  User,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

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
      // Simulate login redirection based on identifier pattern or default
      if (identifier.includes("admin") || identifier.includes("smk")) {
        router.push("/school/dashboard");
      } else if (identifier.includes("guru") || identifier.includes("budi")) {
        router.push("/teacher/heatmap");
      } else if (identifier.includes("siswa") || identifier.includes("andi") || /^\d+$/.test(identifier)) {
        router.push("/student/home");
      } else {
        router.push("/school/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk ke sistem.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (rolePath: string) => {
    router.push(rolePath);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-xs">
              V
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-base">
              VokaLink
            </span>
          </Link>
          <Link
            href="/auth/register-school"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-300 transition"
          >
            Daftarkan Sekolah Baru
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Login Form */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Masuk ke VokaLink
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Gunakan akun Admin Sekolah, Guru Pembimbing, atau NISN Siswa.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Resmi atau NISN Siswa
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="admin.smk@vokalink.id / 0078901234"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Kata Sandi / Kode Akses Siswa
                </label>
                <a
                  href="#reset"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Untuk siswa, minta reset kode akses melalui Guru Pembimbing Anda.");
                  }}
                  className="text-[11px] text-blue-600 hover:underline"
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Memverifikasi..." : "Masuk ke Sistem"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Belum mendaftarkan sekolah Anda?{" "}
            <Link
              href="/auth/register-school"
              className="text-blue-600 font-bold hover:underline"
            >
              Daftar Multi-Tenant (2 Menit)
            </Link>
          </div>
        </div>

        {/* Right Column: Judge Quick Switcher (1-Click Role Switcher) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                Judge Demo Switcher (Simulasi Peran Juri)
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Uji seluruh alur sistem secara langsung tanpa perlu login manual. Pilih peran yang ingin
              Anda simulasikan:
            </p>

            <div className="space-y-2.5">
              {/* Option 1: School Admin */}
              <button
                type="button"
                onClick={() => handleQuickDemo("/school/dashboard")}
                className="w-full p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-purple-300 transition">
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
                className="w-full p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition flex items-center justify-between text-left group"
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
                className="w-full p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-blue-300 transition">
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
                className="w-full p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition flex items-center justify-between text-left group"
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
                onClick={() => handleQuickDemo("/verify/demo-paspor-pkl")}
                className="w-full p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-rose-300 transition">
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

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>© 2026 VokaLink · Kompetisi Web Development UINIC 8.0</p>
      </footer>
    </div>
  );
}
