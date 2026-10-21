import Link from "next/link";
import {
  ShieldCheck,
  QrCode,
  Flame,
  Layers,
  ArrowRight,
} from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";
import VokaLogo from "@/components/common/VokaLogo";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="w-full flex items-center justify-between py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <VokaLogo size="md" />
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            Ekosistem PKL SMK Terkoneksi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/register-school"
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
          >
            Daftar Sekolah
          </Link>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            Masuk
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center my-8 space-y-4">
        <div className="inline-block px-3 py-1 bg-amber-50 text-amber-800 rounded-md text-xs font-semibold border border-amber-200">
          Permendikbudristek No. 12/2024 · Target {TOTAL_TARGET_JP} JP Kurikulum Merdeka
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Satu Rantai Logbook, <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Bukti Sah ke Dunia Industri.
          </span>
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Platform multi-tenant offline-first: pencatatan job card bebas-ketik,
          verifikasi penyelia tanpa akun (&lt;10 dtk), deteksi penyimpangan
          kurikulum real-time, e-Rapor, dan Paspor Kompetensi ber-QR.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register-school"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition"
          >
            Daftarkan Sekolah Baru <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition"
          >
            Judge Demo Switcher (Simulasi Peran)
          </Link>
        </div>
      </section>

      {/* Role Switcher Demo Cards */}
      <section className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Portal Siswa (PWA)</h3>
              <p className="text-xs text-slate-500">Logger zero-typing, Tombol Jujur, offline-first</p>
            </div>
          </div>
          <Link
            href="/student/home"
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            Buka Dasbor Siswa <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Portal Guru Pembimbing</h3>
              <p className="text-xs text-slate-500">Live Heatmap kompetensi & intervensi drift</p>
            </div>
          </div>
          <Link
            href="/teacher/heatmap"
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            Buka Heatmap Guru <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Manajemen SMK (Pokja)</h3>
              <p className="text-xs text-slate-500">Master Kurikulum, Smart Placement, e-Rapor</p>
            </div>
          </div>
          <Link
            href="/school/dashboard"
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            Buka Panel Sekolah <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Verifikasi Publik / HRD</h3>
              <p className="text-xs text-slate-500">Audit keaslian segel HMAC paspor kompetensi</p>
            </div>
          </div>
          <Link
            href="/verify/demo-paspor-pkl"
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            Simulasi Verifikasi HRD <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full pt-8 pb-4 text-center text-xs text-slate-500 border-t border-slate-200 mt-6">
        <p>© 2026 VokaLink · Kompetisi Web Development UINIC 8.0</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Arsitektur Rp0: Next.js + Express + Supabase + Serwist PWA + Cloudflare Tunnel
        </p>
      </footer>
    </main>
  );
}
