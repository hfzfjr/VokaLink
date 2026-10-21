import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Lock,
  Building2,
  GraduationCap,
  Users,
} from "lucide-react";
import VokaLogo from "@/components/common/VokaLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { StatusPill } from "@/components/ui/StatusPill";

export default function Home() {
  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between">
      {/* 1. Navigasi Atas */}
      <header className="border-b border-line bg-paper sticky top-0 z-40">
        <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VokaLogo size="md" />
            <span className="hidden sm:inline-block text-xs font-medium text-ink-500 border-l border-line pl-3">
              Platform PKL SMK Multi-Tenant
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Masuk
              </Button>
            </Link>
            <Link href="/register-school">
              <Button variant="primary" size="sm">
                Daftarkan sekolah
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. Hero Section */}
        <section className="py-12 sm:py-16 lg:py-24 border-b border-line">
          <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Kolom Teks Hero */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-100 text-ink-700 text-xs font-semibold">
                  <span>Permendikbudristek No. 12/2024</span>
                  <span className="text-ink-300">•</span>
                  <span>Kurikulum Merdeka</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink-900 leading-[1.05]">
                  Satu rantai logbook, <br className="hidden sm:inline" />
                  bukti sah ke industri.
                </h1>

                <p className="text-base sm:text-lg text-ink-500 max-w-xl leading-relaxed">
                  Pencatatan kartu tugas bebas-ketik, validasi mentor tanpa login
                  dalam 10 detik, dan paspor kompetensi ber-QR anti-pemalsuan.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link href="/register-school">
                    <Button variant="primary" size="lg">
                      Daftarkan sekolah <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg">
                      Coba demo
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Kolom Visual Hero: Contoh Produk Nyata (Bukan Mockup Gambar Hiasan) */}
              <div className="lg:col-span-5">
                <Card className="border-line bg-white shadow-none space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-ink-100 flex items-center justify-center text-ink-900 font-bold text-xs">
                        AP
                      </div>
                      <div>
                        <div className="text-xs font-bold text-ink-900">
                          Andi Pratama
                        </div>
                        <div className="text-xs text-ink-500">
                          SMK Demo • RPL
                        </div>
                      </div>
                    </div>
                    <StatusPill statusKey="VERIFIED" />
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
                      Kartu Tugas Hari Ini
                    </div>
                    <div className="p-3 rounded-lg bg-ink-50 border border-line text-xs font-semibold text-ink-900 flex items-center justify-between">
                      <span>Implementasi REST API & Validasi Input</span>
                      <span className="text-ink-500 font-mono">8 JP</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-ink-50 border border-line space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-500">Segel Digital Kriptografi</span>
                      <span className="text-ok-700 font-semibold inline-flex items-center gap-1">
                        <ShieldCheck className="size-3.5" /> Sah
                      </span>
                    </div>
                    <div className="font-mono text-xs text-ink-500 truncate">
                      HMAC-SHA256 • a8f3...7c2e
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs text-ink-500">
                    <span>Mentor: Rizky F. (PT Nusantara Tech)</span>
                    <span className="text-ink-900 font-semibold">Tervalidasi &lt; 10 dtk</span>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Strip Bukti (3 Angka Metrik Utama) */}
        <section className="py-10 border-b border-line bg-white">
          <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Stat
                value="792 JP"
                label="Target kurikulum terukur"
                helper="Struktur jam praktik presisi untuk 6 konsentrasi keahlian SMK."
              />
              <Stat
                value="< 10 Detik"
                label="Validasi penyelia industri"
                helper="Verifikasi instan via WhatsApp/QR tanpa repot membuat akun baru."
              />
              <Stat
                value="100%"
                label="Tangguh tanpa sinyal"
                helper="PWA offline-first menyimpan catatan aman di HP dan sinkron otomatis."
              />
            </div>
          </div>
        </section>

        {/* 4. Alur 3 Langkah Kerja */}
        <section className="py-12 sm:py-16 border-b border-line">
          <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-xl">
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-ink-900">
                Alur kerja sederhana dan tuntas
              </h2>
              <p className="text-sm text-ink-500 mt-2">
                Menghubungkan siswa di tempat magang, pembimbing industri, dan guru di sekolah.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="space-y-3">
                <div className="size-8 rounded-lg bg-ink-900 text-white font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h3 className="text-base font-semibold text-ink-900">
                  Catat kartu tugas
                </h3>
                <p className="text-sm text-ink-500 leading-relaxed">
                  Siswa memilih kartu pekerjaan sesuai kurikulum, mengatur durasi jam, dan menyematkan foto bukti terkompresi.
                </p>
              </Card>

              <Card className="space-y-3">
                <div className="size-8 rounded-lg bg-ink-900 text-white font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <h3 className="text-base font-semibold text-ink-900">
                  Verifikasi zero-login
                </h3>
                <p className="text-sm text-ink-500 leading-relaxed">
                  Penyelia industri menyetujui log langsung di HP lewat PIN 4 digit dan tautan aman tanpa registrasi akun yang rumit.
                </p>
              </Card>

              <Card className="space-y-3">
                <div className="size-8 rounded-lg bg-ink-900 text-white font-bold flex items-center justify-center text-sm">
                  3
                </div>
                <h3 className="text-base font-semibold text-ink-900">
                  Paspor kompetensi
                </h3>
                <p className="text-sm text-ink-500 leading-relaxed">
                  Akumulasi log terverifikasi otomatis menjadi nilai e-Rapor resmi, CV standar ATS, dan paspor ber-QR anti-pemalsuan.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* 5. Untuk Siapa (Baris Berselang-seling, Bukan Kartu Monoton) */}
        <section className="py-12 sm:py-16 border-b border-line bg-white">
          <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8 space-y-10">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-ink-900">
                Dirancang untuk seluruh ekosistem PKL
              </h2>
              <p className="text-sm text-ink-500 mt-2">
                Solusi praktis yang menjawab kendala nyata di lapangan.
              </p>
            </div>

            <div className="divide-y divide-line border-y border-line">
              <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-3 flex items-center gap-2.5 font-bold text-ink-900">
                  <Smartphone className="size-5 text-ink-700" />
                  <span>Siswa SMK</span>
                </div>
                <div className="md:col-span-9 text-sm text-ink-500 leading-relaxed">
                  Tidak perlu mengarang narasi jurnal harian. Cukup ketuk kartu tugas, foto kerja diperkecil otomatis di bawah 150 KB, dan tetap bisa mencatat saat sinyal hilang.
                </div>
              </div>

              <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-3 flex items-center gap-2.5 font-bold text-ink-900">
                  <Building2 className="size-5 text-ink-700" />
                  <span>Mentor Industri</span>
                </div>
                <div className="md:col-span-9 text-sm text-ink-500 leading-relaxed">
                  Bebas dari beban mengingat password akun baru. Validasi presensi dan bukti pekerjaan siswa selesai dalam sekali klik ber-PIN aman lewat browser ponsel Anda.
                </div>
              </div>

              <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-3 flex items-center gap-2.5 font-bold text-ink-900">
                  <GraduationCap className="size-5 text-ink-700" />
                  <span>Guru Pembimbing</span>
                </div>
                <div className="md:col-span-9 text-sm text-ink-500 leading-relaxed">
                  Pantau ketercapaian kompetensi seluruh kelas lewat visualisasi heatmap. Deteksi otomatis siswa yang mengalami tugas di luar kejuruan sejak minggu awal.
                </div>
              </div>

              <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-3 flex items-center gap-2.5 font-bold text-ink-900">
                  <Users className="size-5 text-ink-700" />
                  <span>Perekrut & HRD</span>
                </div>
                <div className="md:col-span-9 text-sm text-ink-500 leading-relaxed">
                  Pindai kode QR pada CV lulusan untuk memverifikasi keaslian total jam praktik dan daftar keterampilan langsung dari tanda tangan digital industri mitra.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Kepercayaan: Integritas & Segel Kriptografi */}
        <section className="py-12 sm:py-16 border-b border-line">
          <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
            <Card className="bg-ink-900 text-white border-ink-900 p-6 sm:p-8 lg:p-10 space-y-6">
              <div className="flex items-center gap-2 text-safety-400 text-xs font-semibold uppercase tracking-wider">
                <Lock className="size-4" /> Keamanan & Akuntabilitas
              </div>

              <div className="max-w-2xl space-y-3">
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Verifikasi dua faktor dan segel digital anti-pemalsuan
                </h3>
                <p className="text-sm text-ink-300 leading-relaxed">
                  Log yang telah disahkan industri dikunci permanen melalui trigger basis data PostgreSQL dan disegel dengan HMAC-SHA256. Setiap modifikasi manual di luar sistem akan langsung membatalkan status keabsahan dokumen.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-ink-700">
                <div className="flex items-center gap-2 text-xs text-ink-100">
                  <CheckCircle2 className="size-4 text-safety-400 shrink-0" />
                  <span>Ikatan perangkat peramban</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-100">
                  <CheckCircle2 className="size-4 text-safety-400 shrink-0" />
                  <span>PIN scrypt ber-pepper</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-100">
                  <CheckCircle2 className="size-4 text-safety-400 shrink-0" />
                  <span>Audit log terisolasi tenant</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* 7. CTA Penutup */}
        <section className="py-16 sm:py-20 text-center">
          <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-900 tracking-tight">
              Siap memodernisasi pelaksanaan PKL sekolah Anda?
            </h2>
            <p className="text-base text-ink-500 max-w-lg mx-auto">
              Mulai dalam hitungan menit dengan data kurikulum terisi otomatis untuk seluruh konsentrasi keahlian.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register-school">
                <Button variant="primary" size="lg">
                  Daftarkan sekolah sekarang <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Masuk ke portal
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Ringkas (Tautan Demo Pindah ke Sini Sesuai 13.10) */}
      <footer className="border-t border-line bg-white py-8 text-xs text-ink-500">
        <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VokaLogo size="sm" showText={false} />
            <span>© 2026 VokaLink. Platform PKL SMK Kurikulum Merdeka.</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="font-medium text-ink-700 hover:text-safety-700 underline underline-offset-4"
            >
              Simulasi Demo Peran (Judge Demo)
            </Link>
            <span>•</span>
            <Link
              href="/verify/andi-pratama-rpl-2026"
              className="hover:text-ink-900"
            >
              Contoh Paspor Ber-QR
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
