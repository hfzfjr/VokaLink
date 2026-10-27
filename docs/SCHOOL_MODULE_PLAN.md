# SCHOOL_MODULE_PLAN — Rencana Komprehensif Perbaikan Modul Sekolah (`/school`)

> Dokumen perencanaan arsitektur, pemisahan komponen, integrasi database murni, dan standarisasi UI/UX modul Sekolah (`apps/web/src/app/school`) agar selaras 100% dengan standar modul Siswa (`/student`) dan Guru (`/teacher`).
> Dibuat berdasarkan analisis kritis kondisi saat ini (*As-Is*) menuju target ideal (*To-Be*) sesuai PRD, DESIGN Bab 13, dan AGENTS.md.

---

## 1. Ringkasan Eksekutif & Tujuan Utama

### 1.1 Latar Belakang
Modul Siswa (`/student`) dan Guru (`/teacher`) telah bertransformasi mengadopsi standar desain modern VokaLink:
- **Apple HIG Design Aesthetic:** Kanvas lembut (`bg-slate-50/80`), kartu putih bertepi halus (`bg-white border-slate-200/70 shadow-2xs rounded-2xl/3xl`), warna aksen *Electric Sky Blue* (`sky-500/600`).
- **Layout Adaptif Bersih:** Slim Desktop Sidebar Dock (`88px` – `92px`), Mobile Top Header terpisah, Mobile Bottom Navigation Dock terintegrasi safe-area, serta Right Widget Panel (`StudentWidgetPanel` / `TeacherWidgetPanel`) untuk ringkasan eksekutif di desktop.
- **Pemisahan Komponen Modular:** Kode tidak lagi menumpuk dalam satu file `page.tsx`, melainkan terbagi rapi di `components/student/*` dan `components/teacher/*`.

Sebaliknya, modul Sekolah (`/school`) saat ini:
1. **Masih memakai `AppShell` warisan lama:** Memiliki bar atas kaku dengan teks hardcode *"SMK Negeri 1 Bandung"*, sidebar lebar konvensional yang tidak konsisten dengan dock slim siswa/guru, serta tanpa mobile bottom nav khusus.
2. **File Monolitik Raksasa:** Kode menumpuk ribuan baris di dalam satu file (contoh: `dudi-directory` 1262 baris, `curriculum` 963 baris, `placements` 869 baris, `erapor` 614 baris, `dashboard` 442 baris). Semua modal, tabel, dan formulir dicampuradukkan dalam satu file.
3. **Data Mock Lokal & Fallback Hardcode:** Ditemukan mock data lokal (seperti `SAMPLE_JOB_CARDS` hardcode pada registrasi DUDI) dan fallback hardcoded UUID sekolah (`00000000-0000-0000-0000-000000000002`) alih-alih mengambil murni dari sesi user aktif (`user.school.id`) dan database PostgreSQL Supabase.
4. **Clutter Navigasi & Informasi:** Dasbor memuat 4 kartu navigasi redundan yang fungsinya menduplikasi menu sidebar, membuang ruang layar berharga yang seharusnya bisa dimanfaatkan untuk widget metrik dan status operasional.

### 1.2 Target Hasil (Deliverables)
1. **Penyelarasan Layout & UI Shell:** Mengganti `AppShell` di `apps/web/src/app/school/layout.tsx` dengan sistem modern: `SchoolSidebar.tsx` (slim dock), `SchoolHeader.tsx` (mobile top bar), `SchoolBottomNav.tsx` (mobile bottom bar), dan layout 2-kolom desktop dengan `SchoolWidgetPanel.tsx`.
2. **Pemisahan Komponen Modular:** Membentuk direktori `apps/web/src/components/school/` dengan sub-folder terstruktur per domain (dashboard, curriculum, dudi, placements, erapor) dan memecah file raksasa menjadi komponen-komponen mandiri berukuran < 250 baris.
3. **100% Data Database Riil (Eliminasi Mock):** 
   - Menghapus seluruh array mock lokal (`SAMPLE_JOB_CARDS`).
   - Mengambil seluruh data (katalog job cards, mitra DUDI, siswa penempatan, status kurikulum, nilai e-Rapor) dari database PostgreSQL via API Express.
   - Menghilangkan fallback hardcoded UUID; menggunakan `user.school.id` dinamis dari JWT Supabase auth.
4. **Clean Information Architecture:** Menghilangkan redundansi elemen, merapikan tabel dengan visual hierarchy yang jelas, serta mengutamakan informasi penting yang dibutuhkan Kepala Sekolah dan Pokja PKL.
5. **Responsif Sempurna:** Tampilan mobile-first (360px) yang nyaman dioperasikan satu tangan (touch target ≥ 48px) hingga widescreen desktop (≥ 1280px).

---

## 2. Analisis Kritis Per Halaman: Kondisi Saat Ini (As-Is) vs Solusi Target (To-Be)

| Halaman | Kondisi Saat Ini (*As-Is*) | Masalah Kritis | Solusi Target (*To-Be*) |
|---|---|---|---|
| **Layout Global** (`layout.tsx`) | Membungkus anak halaman dengan `AppShell` lama. | • Top bar kaku memakan ruang vertikal.<br>• Sidebar lebar konvensional berbeda dari `student` & `teacher`.<br>• Tidak ada Mobile Bottom Nav. | • Ganti dengan `SchoolSidebar` (slim icon dock 88-92px sticky).<br>• `SchoolHeader` (mobile only).<br>• `SchoolBottomNav` (mobile only).<br>• Konten utama dengan container `max-w-7xl mx-auto`. |
| **Dasbor Utama** (`/school/dashboard`) | 442 baris. Memuat hero banner, 4 KPI cards, 4 kartu navigasi cepat berulang, daftar siswa prioritas, dan tabel jurusan. | • 4 kartu navigasi redundan dengan sidebar.<br>• Tanggal periode aktif fallback string `"2026"`.<br>• Tidak ada panel ringkasan kanan (widget). | • Layout 2-kolom: Konten Utama + `SchoolWidgetPanel` kanan.<br>• Hapus 4 kartu navigasi redundan.<br>• Tambahkan visual status kurikulum 6 jurusan (Draf vs Terkunci).<br>• Dynamic period dari database. |
| **Kurikulum & CP** (`/school/curriculum`) | 963 baris dalam 1 file. Logika slider JP, modal tambah Job Card, dan validasi 792 JP bercampur. | • Fallback UUID sekolah `"0000...0002"`.<br>• Kode raksasa sulit di-maintain.<br>• Modal form inline di `page.tsx`. | • Pecah ke 5 komponen modular di `components/school/curriculum/`.<br>• Gunakan `user.school.id` dinamis.<br>• Indikator visual selisih JP interaktif (hijau pas 792 JP, merah jika kurang/lebih).<br>• Validasi penguncian kurikulum yang aman. |
| **Direktori Mitra DUDI** (`/school/dudi-directory`) | 1262 baris dalam 1 file. Memuat direktori DUDI, tab Quality Index, modal onboarding mitra, dan modal QR aktivasi mentor. | • **MENGGUNAKAN DATA MOCK:** `SAMPLE_JOB_CARDS` di-hardcode 10 item.<br>• Logika modal QR dan form DUDI menumpuk.<br>• Tampilan tabel padat dan berdesakan di mobile. | • Ambil data Job Cards riil dari database via API.<br>• Pecah ke 5 komponen modular di `components/school/dudi/`.<br>• Tab bersih: Direktori Kemitraan vs Audit DUDI Quality Index.<br>• Modal QR aktivasi mentor responsif dengan direct link WhatsApp. |
| **Smart Placement** (`/school/placements`) | 869 baris dalam 1 file. Memuat algoritma pencocokan greedy, modal assign siswa, modal titik koordinat, dan daftar penempatan. | • Fallback UUID sekolah `"0000...0002"`.<br>• Request API `fetchPlacementCandidates` tidak mengirim auth token.<br>• Modal formulir inline raksasa. | • Pecah ke 6 komponen modular di `components/school/placements/`.<br>• Pastikan token Bearer dikirim ke semua request API.<br>• Visualisasi skor 70% CP + 30% Jarak dengan visual pill ringkas.<br>• Modal koordinat siswa dengan kalkulasi Haversine transparan. |
| **Rekap e-Rapor** (`/school/erapor`) | 614 baris dalam 1 file. Tabel rekapitulasi nilai, modal detail/override nilai otonomi, dan ekspor CSV. | • Fallback UUID sekolah `"0000...0002"`.<br>• Modal override nilai inline di file utama.<br>• Kurang visualisasi status verifikasi log siswa. | • Pecah ke 4 komponen modular di `components/school/erapor/`.<br>• Integrasi token dinamis.<br>• Banner peringatan log siswa yang masih gantung (pending logs).<br>• Tombol ekspor CSV resmi Kemendikbudristek yang responsif. |

---

## 3. Rencana Arsitektur & Struktur Direktori Baru

Untuk memenuhi persyaratan pemisahan file komponen seperti pada `components/student` dan `components/teacher`, seluruh komponen sekolah akan disusun rapi di `apps/web/src/components/school/`:

```
apps/web/src/
├── app/
│   └── school/
│       ├── layout.tsx                     # Layout baru: Slim Sidebar + Mobile Header + Mobile BottomNav
│       ├── dashboard/
│       │   └── page.tsx                   # Halaman orkestrasi Dasbor (Clean & Ringkas, ~80 baris)
│       ├── curriculum/
│       │   └── page.tsx                   # Halaman orkestrasi Kurikulum (~90 baris)
│       ├── dudi-directory/
│       │   └── page.tsx                   # Halaman orkestrasi Direktori DUDI (~90 baris)
│       ├── placements/
│       │   └── page.tsx                   # Halaman orkestrasi Smart Placement (~90 baris)
│       └── erapor/
│           └── page.tsx                   # Halaman orkestrasi e-Rapor SMK (~80 baris)
│
└── components/
    └── school/
        ├── SchoolSidebar.tsx              # Slim icon dock desktop (88-92px, Apple HIG)
        ├── SchoolHeader.tsx               # Header atas mobile (Logo, nama sekolah, avatar, status)
        ├── SchoolBottomNav.tsx            # Bottom dock mobile (5 menu navigasi sentuh)
        ├── SchoolWidgetPanel.tsx          # Panel ringkas kanan desktop (Statistik, Profil Admin, Aksi Cepat)
        │
        ├── dashboard/                     # Sub-komponen Dasbor
        │   ├── SchoolHeroBanner.tsx       # Banner profil sekolah, NPSN, lokasi, multi-tenant badge
        │   ├── SchoolKpiGrid.tsx          # 4 kartu metrik utama (Siswa, Guru, DUDI, Penempatan)
        │   ├── DepartmentReadinessCard.tsx# Status kesiapan & penguncian 6 konsentrasi keahlian
        │   └── PriorityMonitoringCard.tsx # Siswa yang membutuhkan atensi khusus / drift
        │
        ├── curriculum/                    # Sub-komponen Kurikulum & Job Cards
        │   ├── CurriculumHeader.tsx       # Filter jurusan, status terkunci/draf, periode aktif
        │   ├── CpMatrixTable.tsx          # Tabel matriks elemen CP & kalkulasi JP real-time (target 792 JP)
        │   ├── JobCardCatalog.tsx         # Katalog Job Cards per elemen CP & non-kompetensi
        │   ├── AddJobCardModal.tsx        # Modal input Job Card baru (SKKNI, kata kerja, alat)
        │   └── LockCurriculumModal.tsx    # Modal konfirmasi kunci kurikulum permanen
        │
        ├── dudi/                          # Sub-komponen Direktori DUDI & Kualitas Mitra
        │   ├── DudiToolbar.tsx            # Pencarian, filter kota/sektor, tab Direktori vs Quality Index
        │   ├── DudiPartnerTable.tsx       # Daftar mitra DUDI, kuota, jumlah mentor, status bound device
        │   ├── DudiQualityIndexView.tsx   # Peringkat DUDI Quality Index Score & metrik kecepatan verifikasi
        │   ├── RegisterDudiModal.tsx      # Modal pendaftaran DUDI dengan checklist Job Cards riil dari DB
        │   ├── MentorQrActivationModal.tsx# Modal QR aktivasi mentor 72 jam & direct WhatsApp link
        │   └── ResetDeviceModal.tsx       # Modal konfirmasi reset ikatan perangkat mentor
        │
        ├── placements/                    # Sub-komponen Smart Placement
        │   ├── PlacementStatsSummary.tsx  # Ringkasan kuota terisi, belum ditempatkan, rerata skor
        │   ├── PlacementFilterBar.tsx     # Filter konsentrasi keahlian & status penempatan
        │   ├── PlacementCandidatesTable.tsx# Siswa belum ditempatkan, rekomendasi DUDI, skor CP + Jarak
        │   ├── ActivePlacementsTable.tsx  # Daftar siswa aktif ditempatkan & guru pembimbing
        │   ├── SingleAssignModal.tsx      # Modal plot penempatan tunggal & catatan justifikasi
        │   ├── StudentCoordinatesModal.tsx# Modal penyesuaian titik koordinat rumah siswa
        │   └── BatchGreedyModal.tsx       # Modal preview eksekusi algoritma Auto-Greedy Placement
        │
        └── erapor/                        # Sub-komponen Rekap e-Rapor
            ├── EraporSummaryBanner.tsx    # Status kelengkapan nilai, peringatan pending logs, filter jurusan
            ├── EraporDataTable.tsx        # Tabel nilai akhir, predikat capaian, dan deskripsi naratif
            ├── GradeOverrideModal.tsx     # Modal tinjauan detail & penyesuaian nilai otonomi
            └── CsvExportAction.tsx        # Tombol & generator unduh CSV resmi format Dapodik/e-Rapor
```

---

## 4. Desain Sistem & Konsistensi UI (Mengikuti Student & Teacher)

### 4.1 Layout Shell Structure
Modul Sekolah akan mengadopsi arsitektur visual persis seperti [`apps/web/src/app/student/layout.tsx`](file:///d:/CODING/PROJECT/vokalink/apps/web/src/app/student/layout.tsx) dan [`apps/web/src/app/teacher/layout.tsx`](file:///d:/CODING/PROJECT/vokalink/apps/web/src/app/teacher/layout.tsx):

```tsx
<AuthGuard allowedRoles={["SCHOOL_ADMIN"]}>
  <div className="min-h-screen bg-slate-50/80 text-slate-900 selection:bg-sky-500 selection:text-white flex flex-col font-sans print:bg-white">
    {/* 1. Skip-to-content Link untuk Aksesibilitas */}
    <a href="#main-content" className="sr-only focus:not-sr-only ...">Lewati ke konten utama</a>

    <div className="flex-1 flex flex-col md:flex-row print:block">
      {/* 2. Mobile Header (< 768px) */}
      <div className="md:hidden no-print">
        <SchoolHeader />
      </div>

      {/* 3. Desktop Left Slim Sidebar Dock (88px / 92px) */}
      <div className="hidden md:flex md:sticky md:top-0 md:h-dvh pl-3.5 lg:pl-4 py-4 shrink-0 w-[88px] lg:w-[92px] z-30 no-print">
        <SchoolSidebar />
      </div>

      {/* 4. Main Content Container */}
      <div className="flex-1 min-w-0 flex flex-col print:block">
        <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-5 lg:px-8 py-4 md:py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-10">
          {children}
        </main>
      </div>
    </div>

    {/* 5. Mobile Bottom Navigation (< 768px) */}
    <div className="md:hidden no-print">
      <SchoolBottomNav />
    </div>
  </div>
</AuthGuard>
```

### 4.2 Navigasi 4 Menu Inti Modul Sekolah (Setelah Scope Refinement)
> Catatan: Menu pengelolaan kurikulum (`/school/curriculum`) dihapus karena kurikulum 792 JP & 89 Job Cards bekerja 100% otomatis (*Pre-loaded System Default*) saat jurusan diaktifkan.
1. **Dasbor** (`/school/dashboard`) — Ikon: `LayoutDashboard`
2. **Mitra DUDI** (`/school/dudi-directory`) — Ikon: `Building2`
3. **Penempatan Siswa** (`/school/placements`) — Ikon: `Navigation`
4. **e-Rapor SMK** (`/school/erapor`) — Ikon: `FileSpreadsheet`

### 4.3 Desktop Right Widget Panel (`SchoolWidgetPanel.tsx`)
Pada layar desktop (≥ lg / xl), halaman dasbor sekolah akan memiliki panel samping kanan (lebar `320px` – `360px`) yang berisi:
1. **Identitas Pengelola & Sekolah:** Logo sekolah, nama sekolah, NPSN, status akun Pokja PKL.
2. **Ringkasan Kuota Kemitraan:** Rasio kuota DUDI terisi vs kapasitas total (misal: 85/120 kuota).
3. **Status Kesiapan Kurikulum:** Meteran persentase 6 konsentrasi keahlian yang sudah dikunci (Locked) menuju periode aktif.
4. **Tombol Aksi Cepat (Quick Actions):** 
   - Unduh Rekap e-Rapor (CSV).
   - Registrasi Mitra DUDI Baru.
   - Pindai / Jalankan Rekomendasi Smart Placement.

---

## 5. Audit Data & Rencana Integrasi Database Riil (Eliminasi Mock 100%)

Seluruh data wajib bersumber dari database PostgreSQL Supabase melalui Express API. Rincian integrasi endpoint adalah sebagai berikut:

### 5.1 Endpoint & Mapping Data Riil
| Fungsi Halaman | Endpoint Backend | Data yang Dikembalikan dari DB | Catatan Eliminasi Mock |
|---|---|---|---|
| **Profil Sekolah & Dasbor** | `GET /api/v1/schools/current` | Profil sekolah, NPSN, status demo, periode aktif, 4 KPI stats, daftar jurusan terdaftar, siswa prioritas. | Hilangkan fallback string tanggal `"2026"` dan fallback stat kosong. Gunakan data dinamis dari Prisma. |
| **Kurikulum per Jurusan** | `GET /api/v1/schools/:schoolId/departments/:deptId/curriculum` | Daftar Elemen CP lengkap, target JP per elemen, daftar Job Cards nyata per elemen, dan kartu non-kompetensi. | Hilangkan fallback UUID `"0000...0002"`. Ambil `schoolId` dari `user.school.id`. |
| **Simpan & Kunci Kurikulum** | `PUT /schools/:schoolId/departments/:deptId/curriculum`<br>`POST /schools/:schoolId/departments/:deptId/curriculum/lock` | Menyimpan perubahan target JP dan mengunci kurikulum di DB (BR-002). | Kirim auth Bearer token valid pada header request. |
| **Katalog Job Cards Riil untuk DUDI** | `GET /api/v1/schools/:schoolId/departments/:deptId/curriculum` | Job Cards riil yang terdaftar di database sekolah. | **HAPUS TOTAL `SAMPLE_JOB_CARDS` MOCK** pada `dudi-directory/page.tsx`. Muat daftar kartu pekerjaan dari database sekolah. |
| **Direktori Mitra DUDI & Mentor** | `GET /api/v1/dudi`<br>`GET /api/v1/dudi/:id`<br>`POST /api/v1/dudi`<br>`POST /api/v1/dudi/:dudiId/mentors` | Data mitra terfederasi di Supabase, mentor terdaftar, status ikatan perangkat (`isDeviceBound`), dan kuota riil. | Data real-time dari tabel `dudi_partners` dan `dudi_mentors`. |
| **Audit DUDI Quality Index** | `GET /api/v1/dudi/quality-index` | Skor kepatuhan dan audit performa mitra berdasarkan log verifikasi riil (FR-010). | Menggunakan data analitik agregat dari database. |
| **Kandidat Smart Placement** | `GET /api/v1/schools/:schoolId/placements/candidates` | Data siswa belum ditempatkan, koordinat rumah siswa, daftar mitra DUDI aktif dengan sisa kuota, dan guru pembimbing. | Wajib menyertakan Bearer token. Hilangkan fallback UUID. |
| **Eksekusi Penempatan** | `POST /api/v1/schools/:schoolId/placements`<br>`POST /api/v1/schools/:schoolId/placements/batch` | Menyimpan penempatan siswa ke tabel `placements` di DB. | Transaksi atomik Prisma. |
| **Data Rekapitulasi e-Rapor** | `GET /api/v1/schools/:schoolId/erapor` | Nilai akhir siswa, bobot kemandirian per elemen CP, predikat resmi, dan deteksi log yang belum diverifikasi. | Wajib menyertakan Bearer token. Data dihitung murni dari log berstatus `VERIFIED`. |

### 5.2 Standarisasi Penanganan 5 Kondisi UI
Setiap halaman sekolah wajib menangani 5 kondisi state secara konsisten:
1. **Loading State:** Menggunakan skeleton shimmer (`Skeleton.tsx`) yang mencerminkan bentuk visual kartu dan tabel, bukan sekadar spinner teks.
2. **Empty State:** Ilustrasi ramah dengan judul jelas dan tombol aksi utama (misal: "Belum Ada Mitra Terdaftar — Daftarkan Mitra Pertama").
3. **Offline State:** Deteksi otomatis koneksi terputus dengan banner non-intrusif di atas konten.
4. **Error State:** Tampilan pesan galat ramah pengguna dengan tombol *"Coba Muat Ulang"*.
5. **Unauthorized Guard:** Proteksi rute berbasis role `SCHOOL_ADMIN` via `AuthGuard`.

---

## 6. Strategi Clean UI & Eliminasi Clutter Informasi

Berdasarkan tinjauan kritis, beberapa elemen visual pada tampilan saat ini membuat antarmuka terasa penuh dan membingungkan pengguna:

### 6.1 Elemen yang Dieliminasi (Anti-Clutter)
1. **4 Kartu Navigasi Redundan di Dasbor:**
   - *Masalah:* Kartu "Buka Kurikulum", "Buka Direktori", "Buka Penempatan", dan "Buka e-Rapor" memakan lebih dari 300px tinggi layar, padahal menu yang sama sudah tersedia di Sidebar / Bottom Nav.
   - *Solusi:* Hapus kartu tersebut. Gantikan ruangnya dengan **Matriks Kesiapan Kurikulum 6 Jurusan** (persentase JP terkunci) dan **Tabel Prioritas Monitoring Siswa**.
2. **Teks Teknis Kode & ID Mentah:**
   - *Masalah:* Kemunculan teks teknis seperti UUID panjang, kode regulasi mentah, atau parameter rumus tanpa penjelasan.
   - *Solusi:* Tampilkan nama ramah pengguna (Human-readable). UUID disembunyikan; kode unik teknis dimasukkan ke dalam tooltip atau modal rincian teknis bila benar-benar diperlukan.
3. **Redundansi Keterangan Kolom Tabel:**
   - *Masalah:* Pengulangan kata "Elemen" dan "Kartu" di setiap sel tabel.
   - *Solusi:* Gunakan header tabel yang presisi dan sel berupa angka dengan formatting tabular bersih.
4. **Modal Konfirmasi yang Bertumpuk:**
   - *Masalah:* Tampilan modal yang terlalu ramai dengan form input yang tidak relevan.
   - *Solusi:* Desain modal terfokus (1 aksi per modal) dengan tombol konfirmasi jelas (*Primary Action Pill* dan *Cancel Ghost*).

---

## 7. Rencana Tahapan Eksekusi Bertahap (Sprint Execution Checklist)

Pekerjaan perbaikan akan dilaksanakan secara bertahap dan terukur:

### Tahap 1: Fondasi Layout & Navigasi Global
- [ ] Buat komponen navigasi baru:
  - `apps/web/src/components/school/SchoolSidebar.tsx` (Slim dock desktop 88-92px, badge peran, active state).
  - `apps/web/src/components/school/SchoolHeader.tsx` (Mobile top header, profil sekolah, avatar).
  - `apps/web/src/components/school/SchoolBottomNav.tsx` (Bottom dock 5 menu untuk mobile).
- [ ] Perbarui `apps/web/src/app/school/layout.tsx` menggantikan `AppShell` lama dengan struktur baru.
- [ ] Uji responsivitas navigasi pada layar 360px (mobile) dan ≥ 1024px (desktop).

### Tahap 2: Dasbor Sekolah & Right Widget Panel
- [ ] Buat `apps/web/src/components/school/SchoolWidgetPanel.tsx` (panel ringkas kanan desktop).
- [ ] Buat sub-komponen dasbor di `apps/web/src/components/school/dashboard/`:
  - `SchoolHeroBanner.tsx`
  - `SchoolKpiGrid.tsx`
  - `DepartmentReadinessCard.tsx`
  - `PriorityMonitoringCard.tsx`
- [ ] Refaktor `apps/web/src/app/school/dashboard/page.tsx` menjadi ringkas, clean, dan eliminasi 4 kartu redundan.

### Tahap 3: Modul Kurikulum & Job Cards
- [ ] Buat sub-komponen kurikulum di `apps/web/src/components/school/curriculum/`:
  - `CurriculumHeader.tsx`
  - `CpMatrixTable.tsx`
  - `JobCardCatalog.tsx`
  - `AddJobCardModal.tsx`
  - `LockCurriculumModal.tsx`
- [ ] Refaktor `apps/web/src/app/school/curriculum/page.tsx`:
  - Hilangkan fallback hardcode UUID.
  - Hubungkan state dengan `user.school.id` dinamis.
  - Integrasikan indikator visual selisih 792 JP yang interaktif.

### Tahap 4: Direktori DUDI & Kualitas Kemitraan (Eliminasi Mock)
- [ ] Buat sub-komponen DUDI di `apps/web/src/components/school/dudi/`:
  - `DudiToolbar.tsx`
  - `DudiPartnerTable.tsx`
  - `DudiQualityIndexView.tsx`
  - `RegisterDudiModal.tsx`
  - `MentorQrActivationModal.tsx`
  - `ResetDeviceModal.tsx`
- [ ] **Hapus `SAMPLE_JOB_CARDS` mock:** Ambil Job Cards riil dari database via API.
- [ ] Refaktor `apps/web/src/app/school/dudi-directory/page.tsx` menjadi modular dan clean.

### Tahap 5: Modul Smart Placement
- [ ] Buat sub-komponen placement di `apps/web/src/components/school/placements/`:
  - `PlacementStatsSummary.tsx`
  - `PlacementFilterBar.tsx`
  - `PlacementCandidatesTable.tsx`
  - `ActivePlacementsTable.tsx`
  - `SingleAssignModal.tsx`
  - `StudentCoordinatesModal.tsx`
  - `BatchGreedyModal.tsx`
- [ ] Refaktor `apps/web/src/app/school/placements/page.tsx`:
  - Kirim auth token pada request kandidat penempatan.
  - Hilangkan fallback hardcoded UUID.

### Tahap 6: Modul e-Rapor SMK
- [ ] Buat sub-komponen e-Rapor di `apps/web/src/components/school/erapor/`:
  - `EraporSummaryBanner.tsx`
  - `EraporDataTable.tsx`
  - `GradeOverrideModal.tsx`
  - `CsvExportAction.tsx`
- [ ] Refaktor `apps/web/src/app/school/erapor/page.tsx` menjadi clean, cepat, dan terintegrasi data database murni.

### Tahap 7: Quality Assurance, Testing, & Final Verification
- [ ] Jalankan linting dan typecheck: `pnpm lint && pnpm typecheck`.
- [ ] Jalankan unit test dan API integration test: `pnpm test`.
- [ ] Validasi tampilan di mobile (360px) dan desktop (1440px) memastikan 0 layout shift dan tidak ada tombol tumpang tindih.

---

## 8. Kriteria Penerimaan (Definition of Done)

Modul Sekolah dinyatakan selesai dan berhasil jika:
1. **Visual Konsisten:** Seluruh halaman `/school/*` memiliki gaya visual yang seirama dengan `/student` dan `/teacher` (slim sidebar dock desktop, mobile bottom nav, palet warna, tipografi, dan radius rounded-2xl/3xl).
2. **Struktur Komponen Rapi:** Seluruh sub-halaman dipecah ke dalam folder `apps/web/src/components/school/` tanpa ada file `page.tsx` yang membengkak di atas 200 baris.
3. **100% Bebas Data Mock:** Tidak ada lagi array mock statis seperti `SAMPLE_JOB_CARDS` atau fallback UUID hardcode. Seluruh data berasal dari Supabase PostgreSQL melalui Express API.
4. **Clean Information:** Dasbor bebas dari kartu navigasi redundan; antarmuka fokus pada metrik penting bagi Pokja PKL dan Kepala Sekolah.
5. **Responsif & Aksesibel:** Berfungsi mulus pada resolusi layar 360px hingga layar desktop besar, dengan area sentuh minimal 48px dan kontras warna WCAG AA.
6. **Lolos Pengujian:** `pnpm lint`, `pnpm typecheck`, dan `pnpm test` berhasil tanpa error.
