# 🚀 VokaLink SMK

> **Interconnected Multi-Sector Vocational Internship (PKL) Competency, Zero-Login Verification & Verifiable Career Ecosystem**  
> Solusi digital multi-tenant *offline-first PWA* terintegrasi untuk standardisasi pelaksanaan, pemantauan, dan sertifikasi Praktik Kerja Lapangan (PKL) SMK Kurikulum Merdeka Fase F (792 Jam Pelajaran).

---

[![UINIC 8.0](https://img.shields.io/badge/Competition-UINIC%208.0%20Web%20Dev%202026-0284c7.svg?style=flat-square)](https://uinic.id)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.5%20(App%20Router)-black.svg?style=flat-square&logo=next.js)](https://nextjs.org)
[![Express 5](https://img.shields.io/badge/Express-5%20TypeScript-gray.svg?style=flat-square&logo=express)](https://expressjs.com)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-5.8%20Strict-3178c6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![PWA Serwist](https://img.shields.io/badge/PWA-Serwist%20%2B%20Dexie%20Offline--First-f59e0b.svg?style=flat-square)](https://serwist.pages.dev)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e.svg?style=flat-square&logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 📖 Daftar Isi

1. [Latar Belakang & Masalah](#-latar-belakang--masalah)
2. [Solusi 4 Dimensi Pemangku Kepentingan](#-solusi-4-dimensi-pemangku-kepentingan)
3. [Fitur Unggulan & Inovasi Kunci](#-fitur-unggulan--inovasi-kunci)
4. [Simulasi & Demo Juri (1-Click Switcher)](#-simulasi--demo-juri-1-click-switcher)
5. [Arsitektur Sistem & Infrastruktur](#-arsitektur-sistem--infrastruktur)
6. [Struktur Monorepo](#-struktur-monorepo)
7. [Panduan Instalasi & Menjalankan Lokal](#-panduan-instalasi--menjalankan-lokal)
8. [Pengujian, Audit & Lighthouse Score](#-pengujian-audit--lighthouse-score)
9. [Dokumentasi Teknis](#-dokumentasi-teknis)
10. [Lisensi & Hak Cipta](#-lisensi--hak-cipta)

---

## 🔍 Latar Belakang & Masalah

Praktik Kerja Lapangan (PKL) merupakan mata pelajaran intrakurikuler wajib bagi siswa SMK kelas XII (Fase F) dengan beban standar **792 Jam Pelajaran (JP)** sesuai **Permendikbudristek No. 12/2024**. Namun, di lapangan ditemukan 3 kesenjangan kritis:

1. **Asimetri Kompetensi & Kesenjangan Job Desk (*Competency Drift*)**:
   - Banyak siswa vokasi hanya ditugaskan untuk pekerjaan non-kompetensi (misal: fotokopi, menyeduh kopi, entri nota manual) tanpa disadari oleh sekolah.
   - Guru pembimbing baru mengetahui penyimpangan ini di akhir semester saat penulisan laporan selesai.
2. **Friksi Administrasi Industri (Beban Login Mentor)**:
   - Pembimbing lapangan di Dunia Usaha & Dunia Industri (DUDI) enggan membuat akun baru, menghafal kata sandi, atau mengunduh aplikasi tambahan, sehingga buku jurnal fisik kerap ditandatangani sekaligus secara serampangan di minggu terakhir.
3. **Ketidakpercayaan Industri pada Jurnal Fisik & Ijazah**:
   - Buku jurnal kertas mudah dipalsukan dan tidak memuat bukti autentik geotagging atau hash bukti foto kerja. Sertifikat PKL konvensional sulit diverifikasi oleh perekrut kerja (HRD).

---

## 🎯 Solusi 4 Dimensi Pemangku Kepentingan

VokaLink menghadirkan ekosistem digital terpadu yang menghubungkan seluruh pemangku kepentingan tanpa kertas (*paperless*) dan tanpa friksi:

```
                    ┌────────────────────────┐
                    │   Admin Pokja PKL SMK  │
                    │ (Kurikulum & Matching) │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  Siswa PKL   │◄──────►│ Mentor DUDI  │◄──────►│ Guru Pembimb.│
│ (Zero-Type   │  Sync  │ (Zero-Login  │ Drift  │ (2D Heatmap &│
│  Job Cards)  │        │  Verification│ Alert  │  Intervensi) │
└───────┬──────┘        └───────┬──────┘        └──────────────┘
        │                       │
        └───────────────────────┴───────────────────────┐
                                                        ▼
                                              ┌──────────────────┐
                                              │ Rekrutmen & HRD  │
                                              │ (Paspor Ber-QR & │
                                              │  CV ATS Standar) │
                                              └──────────────────┘
```

1. **Siswa PKL**: Mencatat aktivitas harian lewat katalog **Kartu Pekerjaan (Job Cards)** bebas-ketik, dilengkapi kompresi foto WebP Canvas otomatis (< 60 KB) dan bekerja **100% offline** via IndexedDB.
2. **Mentor DUDI**: Menyetujui pekerjaan siswa dalam waktu **< 10 detik tanpa registrasi/login akun**, cukup memindai QR sekali pakai atau membuka tautan WhatsApp yang terikat secara kriptografis (*Device Token + PIN 4-digit*).
3. **Guru Pembimbing**: Memantau perkembangan jam dan ketercapaian elemen Capaian Pembelajaran secara *real-time* via **Live Heatmap 2D**, serta menerima peringatan dini otomatis ketika terjadi deviasi kompetensi (*Drift Alert*).
4. **Sekolah & HRD**: Menghasilkan **Rekap Nilai e-Rapor Otomatis** format Dapodik, **CV Standar ATS** berbasis formula Google XYZ, dan **Paspor Kompetensi Publik Ber-QR** berstempel segel HMAC-SHA256 anti-manipulasi.

---

## ✨ Fitur Unggulan & Inovasi Kunci

| ID Fitur | Modul & Nama Fitur | Deskripsi Singkat & Manfaat |
|---|---|---|
| **FR-001** | Multi-Tenant Onboarding & Sandbox | Pendaftaran mandiri sekolah baru, registrasi jurusan, dan isolasi data multi-tenant ketat lewat *Prisma Tenant Guard Extension*. |
| **FR-002** | Master Kurikulum & 89 Job Cards | Matriks Capaian Pembelajaran 6 jurusan (PPLG, TJKT, DKV, TKR, AKL, Kuliner) tepat 792 JP dan penguncian alokasi (*Curriculum Lock*). |
| **FR-003** | Assisted DUDI Onboarding & Device Binding | Direktori mitra terfederasi lintas sekolah, aktivasi perangkat mentor tanpa akun via tautan kriptografis bertenggat 72 jam. |
| **FR-004** | Smart Placement Scorer | Rekomendasi penempatan siswa otomatis menggunakan algoritma spasial murni *Haversine Distance* berbobot 70:30 (relevansi vs jarak). |
| **FR-005** | Zero-Typing Logger & Tombol Jujur | Pengisian kartu logbook tanpa ketik manual, slider durasi (maks 12 JP/hari), dan pemisahan jujur aktivitas non-kompetensi (BR-004). |
| **FR-006** | PWA Offline-First & Two-Phase Sync | Penyimpanan instan di Dexie.js lokal, kompresi foto WebP Canvas < 60 KB, dan *idempotent batch synchronization* saat koneksi pulih. |
| **FR-007** | Zero-Login Verification | Persetujuan logbook mentor < 10 detik via QR/WhatsApp, diamankan *Device Token + Salted Scrypt PIN + Server Pepper* dan segel HMAC-SHA256. |
| **FR-008** | Live Heatmap & Drift Anomaly Detection | Matriks live 2D capaian siswa dan deteksi 3 pola deviasi (*Non-Competency Overload*, *Skill Monotony*, *Approval Dormancy*). |
| **FR-009** | Intervensi WhatsApp Cerdas & Rotasi Mitra | Generator draf pesan WhatsApp personal berbasis data drift, log intervensi guru, dan fasilitas rotasi mitra tanpa mereset jam terbang siswa. |
| **FR-010** | Soft Skills Endorsement & Audit Kemitraan | Validasi 5 lencana etos kerja & auto-quote A1 dari mentor, serta indeks komposit mutu kemitraan DUDI sekolah (50% relevansi, 30% respon, 20% CP). |
| **FR-011** | Generator Nilai e-Rapor Otomatis | Konversi jam terverifikasi ke formula e-Rapor Kurikulum Merdeka (60% aspek teknis + 40% aspek sikap) dan ekspor CSV format Dapodik. |
| **FR-012** | CV ATS Google XYZ & Paspor Publik Ber-QR | Pembuatan CV format A4 print-ready hanya dari data `VERIFIED`, QR Code verifikasi publik, dan verifikasi integritas stempel kriptografi. |

---

## 🎮 Simulasi & Demo Juri (1-Click Switcher)

Sistem VokaLink telah dilengkapi dengan **Judge Demo Switcher (Simulasi Peran Juri)** yang memungkinkan penguji mengevaluasi seluruh alur tanpa perlu mendaftarkan akun baru atau membuat data uji manual.

Kunjungi halaman masuk di **`http://localhost:3000/login`** dan pilih salah satu peran instan:

1. 🏛️ **Admin Pokja PKL (SMK Demo)**  
   *Rute:* `/school/dashboard`  
   *Fitur:* Monitoring penempatan, direktori kurikulum 792 JP, indeks mutu kemitraan DUDI, ekspor e-Rapor.
2. 👨‍🏫 **Guru Pembimbing (Budi Santoso)**  
   *Rute:* `/teacher/heatmap`  
   *Fitur:* Matriks live heatmap 35 siswa binaan, visualisasi drift alert (merah/kuning), generator pesan intervensi WhatsApp.
3. 👨‍🎓 **Siswa PKL (Andi Pratama — RPL)**  
   *Rute:* `/student/home`  
   *Fitur:* Progres jam pelajaran, pengisian kartu tugas instan `/student/log/new`, simulasi offline PWA, unduh CV ATS `/student/career-cv`.
4. 🏢 **Mentor DUDI Zero-Login (PT Sentra Solusi)**  
   *Rute:* `/v/demo-token-123/activate` atau `/v/demo-token-123/endorse`  
   *Fitur:* Simulasi aktivasi perangkat, stempel persetujuan harian tanpa login, pengisian skor sikap & lencana etos kerja.
5. 🌐 **Verifikasi Paspor Publik (Perekrut / HRD)**  
   *Rute:* `/verify/andi-pratama-rpl-2026`  
   *Fitur:* Halaman publik paspor kompetensi ber-QR, bukti segel kriptografis HMAC-SHA256, verifikasi status autentikasi.

---

## 🏛️ Arsitektur Sistem & Infrastruktur

VokaLink dirancang menggunakan arsitektur modern yang tangguh, modular, dan efisien:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ARSITEKTUR & INFRASTRUKTUR VOKALINK                  │
├────────────────────────────────┬───────────────────────────────────────┤
│ Komponen Lapisan               │ Teknologi & Peran                     │
├────────────────────────────────┼───────────────────────────────────────┤
│ Frontend Hosting               │ Vercel (Next.js Edge Network & CI/CD) │
│ Backend API                    │ Express 5 (TypeScript) + Cloudflare   │
│ Database & Storage             │ Supabase PostgreSQL (Supavisor)       │
│ PWA & Local Persistence        │ Serwist Service Worker + Dexie.js     │
│ Kompresi Gambar Klien          │ HTML5 Canvas API (WebP < 60 KB)       │
│ Peta & Geolocation             │ OpenStreetMap (OSM) Tile + Leaflet.js │
│ Keamanan & Tanda Tangan        │ Web Crypto API (SubtleCrypto HMAC)    │
└────────────────────────────────┴───────────────────────────────────────┘
```

- **Tenant Isolation**: Setiap transaksi database melewati Prisma Client Extension yang secara otomatis menyuntikkan filter `schoolId`, mencegah kebocoran data antar sekolah.
- **Data Immutability**: Seluruh logbook berstatus `VERIFIED` dikunci secara permanen melalui Database Trigger PostgreSQL dan pemeriksaan ganda di lapisan Express API.
- **Kriptografi Standar Server**: Segel integritas dihitung deterministik menggunakan HMAC-SHA256 Canonical JSON dengan rahasia lingkungan server, menjamin data tidak dapat dimodifikasi di tengah jalan.

---

## 📂 Struktur Monorepo

VokaLink dibangun menggunakan arsitektur **pnpm workspaces**:

```
vokalink/
├── apps/
│   ├── web/                    # Next.js 15 App Router (Frontend PWA)
│   │   ├── src/app/            # Rute: /, /login, /student, /school, /teacher, /v, /verify
│   │   ├── src/components/     # Komponen UI standar, AppShell, BottomNav, DemoBar
│   │   ├── src/lib/pwa/        # Dexie.js schema, IndexedDB logger, WebP compressor
│   │   └── tailwind.config.ts  # Token tema Electric Sky Blue (#0EA5E9) & kanvas #F8FAFD
│   └── api/                    # Express 5 REST API (Backend)
│       ├── prisma/             # Schema relasional Prisma, migrasi SQL, seeder v1 & v2
│       └── src/                # Middleware autentikasi, router modul FR-001 s.d. FR-012
├── packages/
│   ├── shared/                 # Skema validasi Zod bersama, konstanta aturan bisnis, tipe
│   └── core/                   # Algoritma murni: Haversine distance, drift detector, HMAC seal
└── docs/                       # Dokumentasi lengkap: PRD, DESIGN, SPRINT, PROGRESS, BUGS
```

---

## 🛠️ Panduan Instalasi & Menjalankan Lokal

### Prasyarat Sistem
- **Node.js**: versi `v20.x` atau lebih baru
- **pnpm**: versi `v9.x` atau lebih baru (`npm install -g pnpm`)
- **Git**

### 1. Clone Repositori
```bash
git clone https://github.com/hfzfjr/VokaLink.git
cd VokaLink
```

### 2. Instalasi Dependensi
```bash
pnpm install
```

### 3. Konfigurasi Environment Variables
Salin berkas contoh lingkungan untuk masing-masing aplikasi:

**Backend API (`apps/api/.env`):**
```env
PORT=4000
NODE_ENV=development
APP_ORIGINS=http://localhost:3000,http://localhost:3001
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="ey..."
SERVER_CRYPTO_SECRET="kunci-rahasia-hmac-minimal-32-karakter-acak"
PIN_PEPPER="kunci-rahasia-pepper-scrypt-minimal-32-karakter"
```

**Frontend Web (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Sinkronisasi Skema Database & Data Awal (Seeder)
```bash
# Validasi skema Prisma
pnpm --filter api prisma:validate

# Terapkan migrasi skema
pnpm --filter api prisma migrate deploy

# Isi data demo lengkap (Sekolah, Guru, Siswa, DUDI, Riwayat Log, & Paspor Publik)
pnpm --filter api seed:v2
```

### 5. Jalankan Server Pengembangan (Dev Server)
Jalankan frontend dan backend secara simultan:
```bash
pnpm dev
```
- **Web App**: Buka [http://localhost:3000](http://localhost:3000)
- **API Server**: Berjalan di [http://localhost:4000](http://localhost:4000) (Health check: `/healthz`)

---

## 📊 Pengujian, Audit & Lighthouse Score

Sistem VokaLink telah melalui pengujian menyeluruh meliputi unit test, integration test, audit aksesibilitas, dan evaluasi performa PWA:

### 1. Eksekusi Unit & Integration Tests
```bash
# Typecheck strict seluruh workspace
pnpm typecheck

# Linter ESLint tanpa warning
pnpm lint

# Jalankan seluruh test suite Vitest
pnpm test
```
*Hasil:* **14 Test Suites, 116 Tests Lulus 100%**.

### 2. Hasil Audit Lighthouse (Mode Emulasi Mobile)
Audit otomatis dijalankan menggunakan Google Chrome Lighthouse pada rute-rute inti:

| Halaman yang Diuji | Aksesibilitas (A11y) | Best Practices | SEO | Agentic Browsing |
|---|:---:|:---:|:---:|:---:|
| **Landing Page (`/`)** | **96 / 100** | **100 / 100** | **100 / 100** | **100 / 100** |
| **Portal Siswa (`/student/home`)** | **94 / 100** | **96 / 100** | **100 / 100** | **100 / 100** |
| **Portal Sekolah (`/school/dashboard`)** | **94 / 100** | **100 / 100** | **100 / 100** | **97 / 100** |

*Catatan Kepatuhan WCAG AA:*
- Seluruh elemen teks memenuhi rasio kontras warna standar minimal 4.5:1.
- Setiap halaman menyertakan landmark semantik `<main id="main-content">` dan urutan heading berjenjang rapi.
- Layar sentuh mobile dioptimalkan dengan target sentuh minimal 48 px (tombol verifikasi mentor 56 px).

---

## 📚 Dokumentasi Teknis

Untuk rincian spesifikasi arsitektur dan aturan bisnis yang lebih mendalam, silakan merujuk pada direktori [`docs/`](docs/):

- 📄 [`docs/PRD.md`](docs/PRD.md) — Dokumen spesifikasi kebutuhan produk lengkap (FR-001 s.d. FR-012, BR-001 s.d. BR-012, kriteria penerimaan).
- 🏗️ [`docs/DESIGN.md`](docs/DESIGN.md) — Cetak biru arsitektur sistem, skema database, ADR, dan Design System Bab 13.
- 📋 [`docs/SPRINT.md`](docs/SPRINT.md) — Rencana kerja sprint dan batasan pengerjaan tim.
- 📈 [`docs/PROGRESS.md`](docs/PROGRESS.md) — Status ketercapaian harian dan matriks pengujian QA.
- 🐛 [`docs/BUGS.md`](docs/BUGS.md) — Log temuan bug dan riwayat resolusi teknis.
- 🎨 [`docs/UI-REFACTOR.md`](docs/UI-REFACTOR.md) — Rincian tahapan refactor visual dan standarisasi antarmuka.

---

## ⚖️ Lisensi & Hak Cipta

Dikembangkan oleh **Tim Pengembang VokaLink** untuk kompetisi **UINIC 8.0 Web Development 2026** (Subtema: *Education*).

Kode sumber didistribusikan di bawah lisensi terbuka [MIT License](LICENSE).  
Hak cipta dilindungi undang-undang. Seluruh aset gambar dan data dummy dikembangkan khusus untuk keperluan demonstrasi sistem.
