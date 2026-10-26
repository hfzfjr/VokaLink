"use client";

import Link from "next/link";
import VokaLogo from "@/components/common/VokaLogo";

export default function LandingFooter() {
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-surface border-t border-slate-100 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-100">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <VokaLogo size="md" href="/" onClick={scrollToTop} />
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Interconnected Multi-Sector Vocational Internship Competency, Zero-Login Verification & Verifiable Career Ecosystem. Platform PKL SMK Kurikulum Merdeka Fase F 792 JP.
            </p>
            <div className="text-[11px] text-slate-500">
              Dikembangkan untuk kompetisi <strong>UINIC 8.0 Web Development 2026</strong> (Subtema: Education).
            </div>
          </div>

          {/* Col 2: Fitur Utama */}
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Fitur Utama</p>
            <ul className="space-y-2 text-xs font-medium text-slate-500">
              <li><a href="#fitur" onClick={scrollTo("fitur")} className="hover:text-sky-600 transition cursor-pointer">Presensi GPS Geofencing</a></li>
              <li><a href="#fitur" onClick={scrollTo("fitur")} className="hover:text-sky-600 transition cursor-pointer">Logbook PWA Offline-First</a></li>
              <li><a href="#fitur" onClick={scrollTo("fitur")} className="hover:text-sky-600 transition cursor-pointer">Stempel Zero-Login Mentor</a></li>
              <li><a href="#fitur" onClick={scrollTo("fitur")} className="hover:text-sky-600 transition cursor-pointer">Live Heatmap & Drift Alert</a></li>
              <li><a href="#fitur" onClick={scrollTo("fitur")} className="hover:text-sky-600 transition cursor-pointer">Ekspor e-Rapor Dapodik</a></li>
            </ul>
          </div>

          {/* Col 3: Program Keahlian */}
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Program Keahlian</p>
            <ul className="space-y-2 text-xs font-medium text-slate-500">
              <li><a href="#simulasi" onClick={scrollTo("simulasi")} className="hover:text-sky-600 transition cursor-pointer">RPL / PPLG</a></li>
              <li><a href="#simulasi" onClick={scrollTo("simulasi")} className="hover:text-sky-600 transition cursor-pointer">TKJ / TJKT</a></li>
              <li><a href="#simulasi" onClick={scrollTo("simulasi")} className="hover:text-sky-600 transition cursor-pointer">DKV / Desain Grafis</a></li>
              <li><a href="#simulasi" onClick={scrollTo("simulasi")} className="hover:text-sky-600 transition cursor-pointer">TKR / Otomotif Mobil</a></li>
              <li><a href="#simulasi" onClick={scrollTo("simulasi")} className="hover:text-sky-600 transition cursor-pointer">Akuntansi & Keuangan</a></li>
            </ul>
          </div>

          {/* Col 4: Regulasi & Akses Portal */}
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Akses & Regulasi</p>
            <ul className="space-y-2 text-xs font-medium text-slate-500">
              <li><Link href="/login" className="hover:text-sky-600 transition font-bold text-sky-600">Simulasi Demo Juri</Link></li>
              <li><Link href="/register-school" className="hover:text-sky-600 transition">Daftarkan Sekolah Baru</Link></li>
              <li><Link href="/verify/andi-pratama-rpl-2026" className="hover:text-sky-600 transition">Uji Paspor Ber-QR &rarr;</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright & Legal */}
        <div className="pt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; 2026 VokaLink SMK. Hak Cipta Dilindungi Undang-Undang. Zero-Cost Architecture.</p>
          <a href="#" onClick={scrollToTop} className="hover:text-slate-600 transition cursor-pointer">
            Kembali ke Atas &uarr;
          </a>
        </div>
      </div>
    </footer>
  );
}

