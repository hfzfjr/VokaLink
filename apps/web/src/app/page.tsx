"use client";

import { useState } from "react";
import Link from "next/link";
import VokaIcon from "@/components/common/VokaIcon";
import LandingNavbar from "@/components/layout/LandingNavbar";
import LandingFooter from "@/components/layout/LandingFooter";
import {
  Clock,
  ArrowRight,
  Check,
  Star,
  ChevronDown,
  X,
  Menu,
  Play,
  FileText,
  UserCheck,
  Building2,
  GraduationCap,
  QrCode,
  ExternalLink,
  Award,
  CheckCircle2,
} from "lucide-react";

interface MajorDetail {
  badge: string;
  title: string;
  partner: string;
  hours: string;
  competency: string;
  exam: string;
  sampleLog: string;
}

const MAJORS_DATA: Record<string, MajorDetail> = {
  rpl: {
    badge: "Rekayasa Perangkat Lunak (PPLG)",
    title: "Pengembangan Web & Aplikasi Mobile",
    partner: "PT Telkom Indonesia / Software House Mitra",
    hours: "792 JP",
    competency: "RESTful API, State Management & Unit Test",
    exam: "Demo Proyek & Portofolio Git Bersegel Kriptografis",
    sampleLog:
      "\"Melakukan implementasi endpoint validasi skema Zod, perbaikan bug relasi database PostgreSQL, serta integrasi pengujian unit sebelum diajukan ke mentor industri untuk stempel cepat.\"",
  },
  tkj: {
    badge: "Teknik Jaringan Komputer & Telekomunikasi (TJKT)",
    title: "Infrastruktur Jaringan & Cloud Server",
    partner: "Internet Service Provider (ISP) & Data Center",
    hours: "792 JP",
    competency: "Fiber Optic, VLAN & Routing MikroTik Terkelola",
    exam: "Uji Konfigurasi Topologi & Troubleshooting Jaringan",
    sampleLog:
      "\"Penyambungan core fiber optic (splicing) pada ODP distribusi, konfigurasi limit bandwidth user hotspot, serta monitoring utilitas switch core dengan penandaan geotagging lokasi presensi.\"",
  },
  dkv: {
    badge: "Desain Komunikasi Visual (DKV)",
    title: "Digital Branding, UI/UX & Design Tokens",
    partner: "Creative Agency & Studio Desain Digital",
    hours: "792 JP",
    competency: "Design System, Figma Prototyping & Visual Identity",
    exam: "Pameran Karya Portofolio Digital Terverifikasi",
    sampleLog:
      "\"Menyusun 5 variasi banner promosi media sosial sesuai identitas brand mitra, membuat komponen tombol dan input dalam design tokens, serta melampirkan bukti foto terkompresi WebP 48 KB.\"",
  },
  tkr: {
    badge: "Teknik Kendaraan Ringan (TKR Otomotif)",
    title: "Diagnosis Engine Scanner & Servis Berkala",
    partner: "Bengkel Resmi Astra / Auto2000 Terakreditasi",
    hours: "792 JP",
    competency: "Sistem Injeksi EFI, Engine Scanner OBD-II & K3LH",
    exam: "Uji Kinerja Servis Berkala 20.000 KM Standar IDUKA",
    sampleLog:
      "\"Melakukan pembacaan data trouble code sensor EFI menggunakan scanner OBD-II, pembersihan throttle body terkalibrasi, dan pengisian kartu pekerjaan langsung dari tablet bengkel saat offline.\"",
  },
  akl: {
    badge: "Akuntansi & Keuangan Lembaga (AKL)",
    title: "Rekonsiliasi Kas, Faktur Pajak & Jurnal Umum",
    partner: "Kantor Akuntan Publik (KAP) & Bank BUMN",
    hours: "792 JP",
    competency: "Rekonsiliasi Fiskal, Kas Kecil & e-Faktur Pajak",
    exam: "Laporan Tutup Buku Akhir Periode Sesuai SAK",
    sampleLog:
      "\"Pemeriksaan fisik bukti voucher transaksi terhadap mutasi bank giro, pembukuan jurnal pembelian kredit, dan verifikasi harian oleh instruktur keuangan via stempel QR sekali pakai.\"",
  },
  kuliner: {
    badge: "Kuliner & Tata Boga",
    title: "Mise en Place, Pastry Bakery & Standar HACCP",
    partner: "Hotel Bintang 4/5 & Restoran Industri Boga",
    hours: "792 JP",
    competency: "Higienitas HACCP, Penimbangan Resep & Food Plating",
    exam: "Live Cooking & Uji Cita Rasa Asesor IDUKA",
    sampleLog:
      "\"Persiapan bahan baku mise en place untuk 120 porsi banquet, pengawasan suhu pemanggangan pastry bakery terukur, dan pencatatan jam praktik mandiri sesuai standar sanitasi dapur hotel.\"",
  },
};

const FAQ_ITEMS = [
  {
    q: "Apakah sistem ini dapat disinkronkan dengan data Dapodik dan e-Rapor sekolah?",
    a: "Ya, VokaLink dirancang khusus sesuai regulasi Kurikulum Merdeka Fase F (Permendikbudristek No. 12/2024). Data siswa, kelas, dan DUDI dapat diimpor massal via spreadsheet Excel, dan nilai akhir praktik 792 JP langsung diekspor ke format resmi e-Rapor SMK Dapodikdasmen.",
  },
  {
    q: "Bagaimana jika di tempat magang siswa tidak ada koneksi internet?",
    a: "VokaLink bekerja secara 100% Offline-First menggunakan IndexedDB (Dexie). Siswa tetap dapat memilih kartu tugas harian dan mengambil foto bukti kerja. Foto dikompresi otomatis ke WebP di bawah 60 KB, dan seluruh data akan tersinkronisasi otomatis begitu perangkat kembali terhubung ke jaringan internet.",
  },
  {
    q: "Apakah mentor industri (DUDI) wajib membuat akun baru dan mengingat password?",
    a: "Sama sekali tidak. VokaLink menerapkan mekanisme Zero-Login Verification. Mentor cukup membuka tautan aman sekali pakai yang dikirim via WhatsApp atau memindai QR Code siswa, lalu memasukkan PIN 4 digit. Seluruh proses stempel verifikasi selesai dalam waktu kurang dari 10 detik.",
  },
  {
    q: "Apakah pihak sekolah harus membayar biaya langganan server atau lisensi software?",
    a: "Biaya infrastruktur adalah Rp0 (Zero-Cost Architecture) yang dibangun untuk kompetisi UINIC 8.0 Web Development 2026. Seluruh layanan berjalan di atas free-tier teroptimasi: Next.js di Vercel, Supabase PostgreSQL & Auth, serta Express API di Cloudflare Tunnel.",
  },
  {
    q: "Bagaimana cara mendeteksi jika siswa diberi tugas kasar di luar jurusannya?",
    a: "Guru pembimbing memiliki akses ke fitur Live Heatmap & Competency Drift. Sistem akan menganalisis kartu tugas harian yang distempel mentor dan otomatis memberikan peringatan dini jika alokasi jam siswa melenceng dari Capaian Pembelajaran (CP) SKKNI jurusannya.",
  },
];

const DEFAULT_MAJOR: MajorDetail = {
  badge: "Rekayasa Perangkat Lunak (PPLG)",
  title: "Pengembangan Web & Aplikasi Mobile",
  partner: "PT Telkom Indonesia / Software House Mitra",
  hours: "792 JP",
  competency: "RESTful API, State Management & Unit Test",
  exam: "Demo Proyek & Portofolio Git Bersegel Kriptografis",
  sampleLog:
    "\"Melakukan implementasi endpoint validasi skema Zod, perbaikan bug relasi database PostgreSQL, serta integrasi pengujian unit sebelum diajukan ke mentor industri untuk stempel cepat.\"",
};

export default function Home() {
  const [activeDimension, setActiveDimension] = useState<"siswa" | "guru" | "dudi">("siswa");
  const [activeMajor, setActiveMajor] = useState<string>("rpl");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSchoolName, setDemoSchoolName] = useState("");
  const [demoPicName, setDemoPicName] = useState("");
  const [demoPhone, setDemoPhone] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoModalOpen(false);
    showToast(`Pengajuan demo untuk ${demoSchoolName || "SMK Anda"} berhasil dikirim! Akun simulasi siap dicoba.`);
    setDemoSchoolName("");
    setDemoPicName("");
    setDemoPhone("");
  };

  const currentMajor: MajorDetail = MAJORS_DATA[activeMajor] ?? DEFAULT_MAJOR;

  return (
    <div className="min-h-screen bg-canvas text-content-primary font-sans selection:bg-sky-500 selection:text-white">
      {/* 1. STICKY NAVBAR */}
      <LandingNavbar onScheduleDemo={() => setDemoModalOpen(true)} />

      {/* MAIN CONTENT LANDMARK */}
      <main id="main-content">
        {/* 2. HERO SECTION (Airy, Confident & Modern SaaS) */}
        <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden bg-grid-pattern">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Monitoring PKL SMK{" "}
                <span className="text-sky-500">Lebih Terukur</span>{" "}
                & Bebas Dokumen Kertas
              </h1>
              <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
                Satu ekosistem digital yang menghubungkan <strong className="text-slate-800">Siswa Vokasi</strong>,{" "}
                <strong className="text-slate-800">Guru Pembimbing</strong>, dan{" "}
                <strong className="text-slate-800">Mentor DUDI</strong> secara transparan, akurat, dan terintegrasi langsung
                dengan standar asesmen industri tanpa beban biaya server (Rp0).
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-sky-500/25 hover:scale-105 transition duration-150 flex items-center gap-2"
                >
                  <span>Buka Live Dashboard PKL</span>
                  <ArrowRight className="size-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setDemoModalOpen(true)}
                  className="px-8 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm sm:text-base border border-slate-200/80 shadow-xs hover:shadow transition flex items-center gap-2"
                >
                  <Play className="size-4 text-sky-500 fill-sky-500" />
                  <span>Simulasi Peran Juri & Guru</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-6 flex items-center justify-center gap-2">
                <Check className="size-3.5 text-emerald-600" />
                <span>Tanpa instalasi server rumit &bull; Integrasi data via Excel / Dapodik &bull; PWA Offline-First</span>
              </p>
            </div>
          </div>
        </section>

        {/* 4. QUICK METRICS COUNTER BANNER */}
        <section className="py-10 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-3">
                <p className="text-3xl sm:text-4xl font-extrabold text-sky-600 tracking-tight">792 JP</p>
                <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">Standar Intrakurikuler</p>
                <p className="text-[11px] text-slate-500">Kurikulum Merdeka Fase F</p>
              </div>

              <div className="p-3">
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">&lt; 10 dtk</p>
                <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">Stempel Cepat Zero-Login</p>
                <p className="text-[11px] text-slate-500">Tanpa Registrasi Akun Mentor</p>
              </div>

              <div className="p-3">
                <p className="text-3xl sm:text-4xl font-extrabold text-indigo-600 tracking-tight">100%</p>
                <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">PWA Offline-First</p>
                <p className="text-[11px] text-slate-500">IndexedDB & WebP &lt; 60 KB</p>
              </div>

              <div className="p-3">
                <p className="text-3xl sm:text-4xl font-extrabold text-amber-600 tracking-tight">Rp0</p>
                <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">Biaya Server Sekolah</p>
                <p className="text-[11px] text-slate-500">Zero-Cost Architecture UINIC 8.0</p>
              </div>
            </div>
          </div>
        </section>

      {/* 5. FITUR 3 DIMENSI: TAB SWITCHER (Siswa, Guru, DUDI) */}
      <section id="fitur" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-3">
            Solusi Komprehensif
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Satu Aplikasi untuk 3 Dimensi Pemangku Kepentingan
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-3">
            Kolaborasi mulus tanpa miskomunikasi antara pihak sekolah, peserta didik di tempat magang, dan instruktur industri.
          </p>

          {/* Dimension Tab Buttons */}
          <div className="inline-flex items-center bg-slate-100/70 p-1.5 rounded-full border border-slate-200/60 mt-8 gap-1">
            <button
              type="button"
              onClick={() => setActiveDimension("siswa")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activeDimension === "siswa"
                  ? "bg-white text-sky-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="size-4" />
              <span>Untuk Siswa PKL</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDimension("guru")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activeDimension === "guru"
                  ? "bg-white text-sky-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="size-4" />
              <span>Untuk Guru Pembimbing</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDimension("dudi")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activeDimension === "dudi"
                  ? "bg-white text-sky-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="size-4" />
              <span>Untuk Mentor DUDI</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENT CONTAINER */}
        <div className="bg-white rounded-[32px] p-6 sm:p-10 lg:p-12 border border-slate-100 shadow-[0_12px_40px_-10px_rgba(30,41,59,0.05)]">
          {/* 1. Content Siswa */}
          {activeDimension === "siswa" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Kemudahan Siswa Magang
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-3">
                  Catat Jurnal & Hadir Tanpa Antrean Kertas
                </h3>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                  Siswa dapat mengisi kegiatan harian dalam 30 detik lewat HP, melampirkan foto bukti pekerjaan terkompresi otomatis, dan melakukan presensi geofence sesuai titik radius kantor mitra.
                </p>

                <div className="mt-6 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      <Check className="size-4" />
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-slate-800">
                        Presensi Geofence Anti-Kecurangan:
                      </strong>
                      <p className="text-xs text-slate-500">
                        Verifikasi koordinat lokasi & toleransi radius DUDI dengan enkripsi anti-spoofing.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      <Check className="size-4" />
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-slate-800">
                        Timeline & Akumulasi 792 JP Otomatis:
                      </strong>
                      <p className="text-xs text-slate-500">
                        Memantau pemenuhan batas minimal 792 JP intrakurikuler sesuai panduan Kurikulum Merdeka Fase F.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      <Check className="size-4" />
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-slate-800">
                        Pemberitahuan Langsung Saat Ada Revisi:
                      </strong>
                      <p className="text-xs text-slate-500">
                        Notifikasi instan jika guru atau mentor memberikan feedback pada lembar laporan jurnal.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Preview Card */}
              <div className="bg-slate-50/70 rounded-3xl p-6 border border-slate-100 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <span className="text-xs font-bold text-slate-700">Tampilan Mobile Logbook Siswa</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Status: Disetujui Mentor
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-xs space-y-2">
                  <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                    Frontend Engineering
                  </span>
                  <h4 className="text-sm font-bold text-slate-800">Membuat Komponen UI Design Tokens</h4>
                  <p className="text-xs text-slate-500">
                    Menyelesaikan pembuatan tombol, modal, dan palet warna design system berbasis Tailwind CSS.
                  </p>
                  <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> 8 Jam Pelajaran (JP)
                    </span>
                    <span>2 Lampiran Foto (WebP &lt; 60 KB)</span>
                  </div>
                </div>
                <div className="bg-sky-500 text-white p-4 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <p className="text-xs font-medium text-sky-100">Total Akumulasi Jam PKL</p>
                    <p className="text-xl font-extrabold">480 / 792 JP</p>
                  </div>
                  <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">60.6% Target</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Content Guru */}
          {activeDimension === "guru" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                  Kendali Penuh Guru Pembimbing
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-3">
                  Monitoring 50+ Siswa di Berbagai Perusahaan Secara Real-Time
                </h3>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                  Tidak perlu lagi mengunjungi puluhan perusahaan hanya untuk memeriksa buku jurnal fisik. Pantau aktivitas seluruh siswa dari layar laptop Anda kapan saja.
                </p>

                <div className="mt-6 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      <Check className="size-4" />
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-slate-800">
                        Live Heatmap & Deteksi Dini Deviasi:
                      </strong>
                      <p className="text-xs text-slate-500">
                        Deteksi dini jika siswa diberi pekerjaan kasar yang melenceng dari kurikulum kejuruan.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      <Check className="size-4" />
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-slate-800">
                        Validasi Jurnal 1-Klik & Catatan Supervisi:
                      </strong>
                      <p className="text-xs text-slate-500">
                        Berikan catatan bimbingan atau minta perbaikan laporan langsung dari portal web.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      <Check className="size-4" />
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-slate-800">
                        Export Nilai Akhir ke e-Rapor Otomatis:
                      </strong>
                      <p className="text-xs text-slate-500">
                        Konversi akumulasi jam dan stempel industri ke format Excel resmi Dapodik Kemendikbudristek.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 rounded-3xl p-6 border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <span className="text-xs font-bold text-slate-700">Daftar Siswa Bimbingan (Kelas XII PPLG 1)</span>
                  <span className="text-[10px] font-bold text-sky-600">32 Siswa Terhubung</span>
                </div>
                {/* Item 1 */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200/50 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 font-bold flex items-center justify-center text-xs">
                      GR
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Gilang Ramadhan</p>
                      <p className="text-[10px] text-slate-400">PT Telkom Indonesia &bull; 480 JP Tercapai</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast("Jurnal Gilang Ramadhan berhasil disetujui Guru!")}
                    className="text-[11px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold hover:bg-emerald-100 transition"
                  >
                    Setujui
                  </button>
                </div>
                {/* Item 2 */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200/50 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                      AF
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Ahmad Fauzi</p>
                      <p className="text-[10px] text-rose-500">Peringatan: Deviasi Tugas di Bengkel</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast("Membuka detail review deviasi kompetensi Ahmad Fauzi")}
                    className="text-[11px] bg-rose-50 text-rose-700 px-3 py-1 rounded-full font-bold hover:bg-rose-100 transition"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Content DUDI */}
          {activeDimension === "dudi" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                  Efisiensi Instruktur DUDI
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-3">
                  Evaluasi & Asesmen Siswa Tanpa Membebani Jam Kerja Mentor
                </h3>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                  Pembimbing industri cukup membuka link web cepat via WhatsApp atau scan QR tanpa akun yang rumit untuk memberikan tugas, mengesahkan kehadiran, dan menilai kompetensi.
                </p>

                <div className="mt-6 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      <Check className="size-4" />
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-slate-800">
                        Stempel Cepat Zero-Login (&lt; 10 Detik):
                      </strong>
                      <p className="text-xs text-slate-500">
                        Cukup masukkan PIN 4 digit ber-salt scrypt dengan ikatan token perangkat peramban.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      <Check className="size-4" />
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-slate-800">
                        Penerbitan Paspor Digital Tersegel Kriptografis:
                      </strong>
                      <p className="text-xs text-slate-500">
                        Dilengkapi segel HMAC-SHA256 ber-canonical JSON anti-manipulasi yang diakui rekruter.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      <Check className="size-4" />
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-slate-800">
                        Talent Scouting Langsung dari Tempat Magang:
                      </strong>
                      <p className="text-xs text-slate-500">
                        Perusahaan dapat menandai siswa berprestasi untuk diproyeksikan sebagai karyawan baru.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 rounded-3xl p-6 border border-slate-100 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <span className="text-xs font-bold text-slate-700">Formulir Asesmen Akhir Mentor</span>
                  <span className="text-[10px] font-bold text-purple-600">IDUKA Certified</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Kedisiplinan & Etos Kerja</span>
                      <span className="text-sky-600 font-extrabold">96 / 100</span>
                    </div>
                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: "96%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Penguasaan Keterampilan Teknis (SKKNI)</span>
                      <span className="text-emerald-600 font-extrabold">94 / 100</span>
                    </div>
                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: "94%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Inisiatif & Problem Solving</span>
                      <span className="text-amber-600 font-extrabold">90 / 100</span>
                    </div>
                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: "90%" }} />
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 text-purple-900 p-3.5 rounded-2xl text-xs font-medium border border-purple-100">
                  <span className="font-bold text-purple-700 block mb-0.5">Catatan Mentor DUDI:</span>
                  &quot;Siswa menguasai pembuatan REST API secara mandiri dan siap direkrut pada program magang lanjutan perusahaan.&quot;
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. ALUR KERJA PKL 4 TAHAP */}
      <section id="alur" className="py-20 bg-slate-50/50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-3">
              Tahapan Terstruktur
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Alur Pelaksanaan PKL dari Awal Hingga Paspor Digital
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-3">
              Sesuai dengan petunjuk teknis panduan PKL Kemendikbudristek untuk Sekolah Menengah Kejuruan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 relative group">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center text-lg font-extrabold mb-5 group-hover:bg-sky-500 group-hover:text-white transition duration-200">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Pemetaan & Penempatan</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pokja PKL memetakan kuota DUDI mitra dengan Smart Placement Scorer dan mengunci kurikulum kejuruan.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] font-semibold text-sky-600">
                <span>Smart Placement Scorer</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 relative group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-extrabold mb-5 group-hover:bg-emerald-400 group-hover:text-white transition duration-200">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Pembekalan & Geofence</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Aktivasi koordinat kantor mitra, modul K3LH, dan sinkronisasi katalog 150+ kartu pekerjaan SKKNI siap pakai.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] font-semibold text-emerald-600">
                <span>Aktivasi GPS Radius</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 relative group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-extrabold mb-5 group-hover:bg-amber-400 group-hover:text-white transition duration-200">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Pelaksanaan & Logbook</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Siswa catat tugas bebas-ketik di HP saat offline, kompresi foto WebP 60 KB, dan stempel cepat mentor via WhatsApp.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] font-semibold text-amber-600">
                <span>Stempel WhatsApp &lt; 10 Dtk</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 relative group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-extrabold mb-5 group-hover:bg-indigo-400 group-hover:text-white transition duration-200">
                04
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">e-Rapor & Paspor Ber-QR</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Guru mengunduh rekap nilai format e-Rapor Dapodik, dan siswa memperoleh portofolio CV ATS berstempel kriptografis.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] font-semibold text-indigo-600">
                <span>Paspor Kriptografi Ber-QR</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INTERACTIVE JURUSAN SIMULATOR */}
      <section id="simulasi" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-3">
            Simulasi Interaktif
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Disesuaikan untuk Seluruh Bidang Keahlian SMK
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-3">
            Pilih program keahlian di bawah ini untuk melihat contoh kompetensi, kartu tugas logbook, dan mitra industri yang relevan.
          </p>

          {/* Jurusan Pill Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {[
              { id: "rpl", label: "RPL / PPLG" },
              { id: "tkj", label: "TKJ / TJKT" },
              { id: "dkv", label: "DKV / Desain" },
              { id: "tkr", label: "TKR / Otomotif" },
              { id: "akl", label: "Akuntansi (AKL)" },
              { id: "kuliner", label: "Kuliner / Boga" },
            ].map((major) => (
              <button
                key={major.id}
                type="button"
                onClick={() => setActiveMajor(major.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                  activeMajor === major.id
                    ? "bg-sky-500 text-white shadow-md shadow-sky-400/20"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                {major.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Simulation Display Card */}
        <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-slate-100 shadow-[0_12px_40px_-10px_rgba(30,41,59,0.06)] max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-600 border border-sky-100">
                {currentMajor.badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-2">
                {currentMajor.title}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Contoh Mitra Industri</p>
              <p className="text-sm font-bold text-slate-800">{currentMajor.partner}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Target Jam Minimum</p>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">{currentMajor.hours}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <Clock className="size-3" /> Kurikulum Merdeka Fase F
              </p>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Capaian Pembelajaran (CP)</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{currentMajor.competency}</p>
              <p className="text-[11px] text-sky-600 font-semibold mt-1 flex items-center gap-1">
                <Award className="size-3" /> Standar SKKNI Terpetakan
              </p>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Bentuk Pengujian Akhir</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{currentMajor.exam}</p>
              <p className="text-[11px] text-indigo-500 font-semibold mt-1 flex items-center gap-1">
                <QrCode className="size-3" /> Terverifikasi Industri
              </p>
            </div>
          </div>

          {/* Sample Logbook Entry Preview */}
          <div className="bg-sky-50/60 p-5 rounded-2xl border border-sky-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                <FileText className="size-4 text-sky-600" />
                <span>Contoh Template Jurnal Harian yang Diisi Siswa:</span>
              </span>
              <span className="text-[10px] font-bold bg-white text-sky-700 px-2.5 py-1 rounded-full border border-sky-200">
                Logbook Harian
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {currentMajor.sampleLog}
            </p>
          </div>
        </div>
      </section>

      {/* 8. TESTIMONI DUDI & KEPALA SEKOLAH */}
      <section id="testimoni" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">
              Kisah Sukses
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Dipercaya oleh Kepala Sekolah & Instruktur Industri
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-3">
              Mendengar pengalaman nyata transformasi efisiensi program PKL dari berbagai daerah di Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-slate-50/70 p-7 rounded-[28px] border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 text-xs mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  &quot;Sebelumnya guru kami kerepotan merekap 250 lembar buku jurnal siswa setiap semester. Dengan VokaLink, monitoring kehadiran dan ekspor e-Rapor selesai dalam beberapa klik saja.&quot;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-6 mt-6 border-t border-slate-200/60">
                <div className="w-10 h-10 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-xs">
                  DM
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Drs. H. Mulyadi, M.Pd.</p>
                  <p className="text-[10px] text-slate-400">Kepala SMKN 1 Unggulan Vokasi</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-50/70 p-7 rounded-[28px] border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 text-xs mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  &quot;Sebagai mentor industri, saya sangat terbantu karena stempel verifikasinya via WhatsApp link tanpa perlu registrasi akun baru. Sangat menghemat jam kerja mentor di kantor.&quot;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-6 mt-6 border-t border-slate-200/60">
                <div className="w-10 h-10 rounded-full bg-emerald-400 text-white font-bold flex items-center justify-center text-xs">
                  RG
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Raditya Gunawan, S.Kom</p>
                  <p className="text-[10px] text-slate-400">Engineering Lead &bull; PT Digital Solusindo</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-50/70 p-7 rounded-[28px] border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 text-xs mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  &quot;Sistemnya sangat modern dan mudah dipakai saat offline di bengkel. Pas selesai PKL, Paspor Kompetensi ber-QR dan CV ATS otomatis langsung saya cantumkan di portfolio lamaran kerja.&quot;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-6 mt-6 border-t border-slate-200/60">
                <div className="w-10 h-10 rounded-full bg-indigo-400 text-white font-bold flex items-center justify-center text-xs">
                  SN
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Siti Nurhaliza</p>
                  <p className="text-[10px] text-slate-400">Alumni Siswa PKL (Kini Junior Web Developer)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION */}
      <section id="faq" className="py-20 lg:py-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-3">
            Tanya Jawab
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Informasi seputar integrasi sekolah, kesiapan offline, dan keamanan data.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full text-left p-5 flex items-center justify-between font-bold text-slate-800 text-sm hover:text-sky-600 transition"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`size-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180 text-sky-500" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. CTA BANNER SECTION (Pastel Clean, Welcoming, Zero Dark) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-sky-50/90 border border-sky-100 rounded-[36px] p-8 sm:p-14 text-slate-800 relative overflow-hidden shadow-soft">
          <div className="relative z-10 max-w-3xl">
            <p className="text-xs font-bold text-sky-700 uppercase tracking-widest mb-3">
              Konsultasi & Simulasi Gratis untuk SMK
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-slate-900">
              Siap Mewujudkan Manajemen PKL yang Modern & Profesional?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
              Tingkatkan akreditasi sekolah vokasi Anda dan permudah koordinasi dengan ratusan mitra industri dalam satu dashboard terintegrasi tanpa biaya server (Rp0).
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setDemoModalOpen(true)}
                className="px-7 py-3.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-sm shadow-md shadow-sky-500/25 hover:scale-105 transition duration-150"
              >
                Jadwalkan Presentasi untuk Sekolah
              </button>
              <Link
                href="/login"
                className="px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200/80 shadow-xs transition"
              >
                Eksplorasi Dashboard Langsung
              </Link>
            </div>
          </div>
        </div>
      </section>

      </main>

      {/* 11. FOOTER 5-KOLOM */}
      <LandingFooter />

      {/* 12. MODAL JADWALKAN DEMO SEKOLAH */}
      {demoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Jadwalkan Demo & Konsultasi</h3>
                <p className="text-xs text-slate-500">Dapatkan akses akun percobaan gratis untuk SMK Anda</p>
              </div>
              <button
                type="button"
                onClick={() => setDemoModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 text-sm flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleDemoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama SMK / Institusi</label>
                <input
                  type="text"
                  required
                  value={demoSchoolName}
                  onChange={(e) => setDemoSchoolName(e.target.value)}
                  placeholder="Contoh: SMKN 1 Bandung / SMKN 2 Surabaya"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Perwakilan</label>
                  <input
                    type="text"
                    required
                    value={demoPicName}
                    onChange={(e) => setDemoPicName(e.target.value)}
                    placeholder="Nama Guru / Pokja PKL"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={demoPhone}
                    onChange={(e) => setDemoPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Perkiraan Jumlah Siswa PKL per Tahun
                </label>
                <select className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-400">
                  <option>Kurang dari 100 Siswa</option>
                  <option>100 - 300 Siswa</option>
                  <option>300 - 700 Siswa</option>
                  <option>Lebih dari 700 Siswa (SMK PK)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDemoModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/25 transition"
                >
                  Kirim Pengajuan Demo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 13. FLOATING NOTIFICATION TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50 animate-bounce">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
