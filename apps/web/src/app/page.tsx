import Link from "next/link";
import {
  ShieldCheck,
  QrCode,
  Flame,
  Layers,
  ArrowRight,
} from "lucide-react";
import { TOTAL_TARGET_JP } from "@vokalink/shared";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="w-full flex items-center justify-between py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            V
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
              VokaLink
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Ekosistem PKL SMK Terkoneksi
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          UINIC 8.0 Demo Sandbox
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center my-10 space-y-4">
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
