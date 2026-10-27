# BUGS — VokaLink

> Pencatat bug dan masalah dokumen. Pemilik bug memperbarui statusnya. Ringkasan jumlah bug terbuka ada di `PROGRESS.md`.

## 1. Tingkat Keparahan

| Level | Arti | Target penyelesaian |
|---|---|---|
| **P0 Critical** | Merusak inti demo atau keamanan (verifikasi bisa dilewati, data bocor antar tenant, log terverifikasi bisa diubah, data offline hilang) | Hentikan pekerjaan lain, selesaikan hari itu juga |
| **P1 High** | Fitur Must Have tidak bisa dipakai atau salah hitung (skor, drift, nilai) | Sebelum code freeze (28 Okt) |
| **P2 Medium** | Fitur jalan tapi ada cacat jelas, ada jalan pintas | Sebelum 29 Okt bila sempat |
| **P3 Low** | Kosmetik, teks, polesan | Opsional |

## 2. Status

`Open` → `In Progress` → `Fixed` (menunggu verifikasi) → `Verified` (ditutup) · atau `Won't Fix` / `Duplicate` (sertakan alasan)

## 3. Cara Mencatat

Salin template ini ke bagian 4, naikkan nomor BUG berikutnya:

```md
### BUG-XXX — Judul singkat
- **Level:** P0 | P1 | P2 | P3
- **Status:** Open
- **Fitur/Modul:** FR-00X / nama modul
- **Pelapor / Pemilik:** nama / nama
- **Ditemukan:** tanggal, di mana (lokal / staging / produksi / TC-0XX)
- **Langkah reproduksi:**
  1. ...
- **Hasil aktual:** ...
- **Hasil seharusnya (rujukan PRD/BR/TC):** ...
- **Catatan / dugaan penyebab:** ...
- **Perbaikan (commit/PR):** -
```

Aturan:
- Bug keamanan (P0) tidak boleh berisi token, PIN, atau secret asli di deskripsi.
- Perbaikan bug logika wajib disertai tes yang gagal sebelum perbaikan.
- Bug yang ditemukan agent harus dicatat di sini, bukan hanya dibereskan diam-diam.

## 4. Daftar Bug

| ID | Level | Status | Fitur | Judul | Pemilik |
|---|---|---|---|---|---|
| BUG-001 | P0 Critical | Fixed | Database / BR-007 | Trigger immutability block_verified_log_update memakai nama kolom salah mentor_id | Orang A |
| BUG-002 | P3 Low | Fixed | PWA / Manifest | Web App Manifest mereferensikan file PNG non-eksistensi menyebabkan 404 pada browser | Orang B |
| BUG-003 | P1 High | Fixed | Offline Sync (FR-006) | Ketidaksesuaian struktur payload sync.ts dengan skema backend syncLogsBatchSchema (Fase 1) | Orang B |
| BUG-004 | P1 High | Fixed | Offline Sync (FR-006/007) | Kegagalan penarikan status verifikasi mentor (Fase 3 Pull) akibat format data dan typo enum | Orang B |
| BUG-005 | P2 Medium | Fixed | Student Form (FR-005) | Form jurnal baru memakai ID dummy non-UUID (placement-demo-rpl & jc-1) yang ditolak backend | Orang B |
| BUG-006 | P3 Low | Fixed | Student Portal (FR-007) | Typo instruksi PIN pada modal QR minta verifikasi (6 digit bukannya 4 digit) | Orang B |
| BUG-007 | P3 Low | Fixed | API Error Handler / DESIGN §9.4 | Global error handler ZodError dan registrasi sekolah mengembalikan status 400 bukannya 422 | Orang C |
| BUG-008 | P2 Medium | Fixed | Teacher Heatmap (FR-008) | On-demand drift evaluate memicu duplikasi alert OPEN jika dijalankan berkali-kali dan GET /drift-alerts belum query DB | Orang C |
| BUG-009 | P1 High | Fixed | Offline Sync (FR-006) | Pembagian alokasi durasi JP multi-kartu pada sync.ts dapat menghasilkan nilai <= 0 JP | Orang B |
| BUG-010 | P1 High | Fixed | Drift Engine / Presensi (FR-005/008) | Log sakit/izin (A2) dihitung sebagai non-kompetensi sehingga memicu false-positive NON_COMPETENCY_OVERLOAD | Orang B |
| BUG-011 | P2 Medium | Fixed | Photo Pipeline (FR-006) | Ketiadaan adaptive compression loop di photo.ts berpotensi memicu error permanen HTTP 413 | Orang B |

### BUG-001 — Trigger block_verified_log_update memakai nama kolom salah mentor_id
- **Level:** P0 Critical
- **Status:** Fixed
- **Fitur/Modul:** Database Migration / Security Guards (BR-007, P3 Immutability)
- **Pelapor / Pemilik:** Orang B / Orang A
- **Ditemukan:** 21 Okt 2026 (Hari 1), audit kode statis file `20261020192102_security_guards/migration.sql`
- **Langkah reproduksi:**
  1. Jalankan kueri `UPDATE daily_logs SET short_note = 'tes' WHERE status = 'VERIFIED'`.
  2. Trigger PostgreSQL `trg_daily_logs_immutable` memanggil fungsi `block_verified_log_update()`.
  3. Pada baris 47, fungsi mengevaluasi `NEW.mentor_id IS DISTINCT FROM OLD.mentor_id`.
- **Hasil aktual:**
  PostgreSQL melempar error runtime: `record "new" has no field "mentor_id"` karena nama kolom aktual di tabel `daily_logs` adalah `verified_by_mentor_id` (sesuai `apps/api/prisma/schema.prisma` baris 340 dan migration `20261020173926_init_schema` baris 214).
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Trigger mengecek kolom `verified_by_mentor_id` dan melempar pesan exception `verified log is immutable` jika kolom tersebut atau data log diverifikasi lainnya diubah.
- **Catatan / dugaan penyebab:**
  Typo penamaan kolom saat menyusun migration SQL guards di Hari 0/1.
- **Perbaikan (commit/PR):** Migration `20261021184500_fix_bug001_trigger_mentor_id/migration.sql` deployed via `prisma migrate deploy`, merevisi function trigger menggunakan `NEW.verified_by_mentor_id IS DISTINCT FROM OLD.verified_by_mentor_id`. Transisi verifikasi log teruji sukses pada Seeder v2.

### BUG-002 — Web App Manifest mereferensikan file PNG non-eksistensi menyebabkan 404 pada browser
- **Level:** P3 Low
- **Status:** Fixed
- **Fitur/Modul:** PWA / Web App Manifest (FR-006)
- **Pelapor / Pemilik:** Orang B / Orang B
- **Ditemukan:** 21 Okt 2026 (Hari 2), pengujian audit Service Worker & peramban
- **Langkah reproduksi:**
  1. Jalankan `next dev` dan buka endpoint manifest `/manifest.webmanifest`.
  2. Peramban mencoba melakukan prefetch pada aset ikon PNG `icon-192x192.png` dan `icon-512x512.png`.
- **Hasil aktual:**
  Peramban mencatat log HTTP 404 Not Found karena file PNG statis belum dibuat pada folder `public/icons/`.
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Manifest PWA mendeklarasikan aset ikon yang valid dan mengembalikan status HTTP 200 OK tanpa error 404 pada konsol peramban.
- **Catatan / dugaan penyebab:**
  Spesifikasi ukuran file PNG dideklarasikan di `manifest.ts` sebelum berkas biner PNG dibuat.
- **Perbaikan (commit/PR):** Commit `569c840` dan `daac6f0`: Menyediakan aset vektor SVG resmi `/icons/icon.svg` dan memperbarui `manifest.ts` serta `public/manifest.json` mendeklarasikan ikon SVG dengan mode `any` dan `maskable` sesuai standar modern PWA W3C.

### BUG-003 — Ketidaksesuaian struktur payload sync.ts dengan skema backend syncLogsBatchSchema (Fase 1)
- **Level:** P1 High
- **Status:** Fixed
- **Fitur/Modul:** Offline Sync Engine (FR-006 & DESIGN.md §7.3)
- **Pelapor / Pemilik:** Orang B / Orang B
- **Ditemukan:** 22 Okt 2026, audit implementasi sinkronisasi logbook
- **Langkah reproduksi:**
  1. Catat entri logbook baru saat offline pada `/student/log/new`.
  2. Buka jaringan online atau tekan "Sinkronkan Sekarang" pada `ConnectivityBanner`.
  3. Klien memanggil fungsi `executeTwoPhaseSync` pada `apps/web/src/lib/pwa/sync.ts`.
- **Hasil aktual:**
  Endpoint `POST /api/v1/logs/sync` melempar HTTP 422 `VALIDATION_ERROR` karena payload klien mengirimkan properti rata (`durationJp`, `autonomyLevel`, `jobCardIds`, `nonCompetencyCategory`) tanpa membungkusnya ke dalam struktur `items: [...]` dan tanpa menyertakan `attendanceType: "PRESENT"`. Selain itu, baris 108 membaca `resJson.data?.results`, padahal API server Express mengembalikan objek `{ results, processedCount, ... }` tanpa pembungkus `.data`.
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Payload sinkronisasi Fase 1 membentuk objek `items` dan `attendanceType` sesuai skema `dailyLogCreateSchema` di `@vokalink/shared`, serta membaca `resJson.results` dengan benar agar log lokal berstatus `meta_synced` / `synced`.
- **Catatan / dugaan penyebab:**
  Perbedaan model antarmuka antara Dexie `OfflineLog` (yang dirancang flat untuk performa IndexedDB) dengan `dailyLogCreateSchema` di server.
- **Perbaikan (commit/PR):** Direvisi pada `apps/web/src/lib/pwa/sync.ts`: merekonstruksi array `items` sesuai Zod `dailyLogCreateSchema` (membagi durasi JP secara proporsional bila multi-item), menyertakan `attendanceType: "PRESENT"`, menyematkan `evidenceSha256` dan `evidenceSizeBytes` dari `db.photos`, serta membaca hasil respons Express `resJson.results || resJson.data?.results`. Lolos typecheck dan pengujian sinkronisasi.

### BUG-004 — Kegagalan penarikan status verifikasi mentor (Fase 3 Pull) akibat format data dan typo enum
- **Level:** P1 High
- **Status:** Fixed
- **Fitur/Modul:** Offline Sync Engine (FR-006 & FR-007)
- **Pelapor / Pemilik:** Orang B / Orang B
- **Ditemukan:** 22 Okt 2026, audit logika penarikan status verifikasi
- **Langkah reproduksi:**
  1. Siswa memiliki log lokal yang telah berstatus `synced`.
  2. Mentor industri memvalidasi log menjadi `VERIFIED` atau `REVISION_REQUIRED`.
  3. Klien menjalankan Fase 3 PULL pada `apps/web/src/lib/pwa/sync.ts`.
- **Hasil aktual:**
  1. Baris 277 membaca `pullJson.data`, padahal endpoint `GET /api/v1/logs/me` mengembalikan `{ count, logs }`, sehingga `serverLogs` selalu bernilai array kosong `[]`.
  2. Baris 293 membandingkan `sLog.status === "REVISION_REQUESTED"`, padahal nilai enum baku di Prisma dan `@vokalink/shared` adalah `REVISION_REQUIRED`.
  Status log pada IndexedDB siswa tidak pernah terbarui menjadi `verified` maupun `revision_required`.
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Klien membaca `pullJson.logs` dan mencocokkan status `VERIFIED` serta `REVISION_REQUIRED` untuk memperbarui status lokal IndexedDB secara reaktif.
- **Catatan / dugaan penyebab:**
  Asumsi pembungkus `.data` Axios-style yang tidak cocok dengan Express JSON handler dan typo penamaan enum status.
- **Perbaikan (commit/PR):** Direvisi pada `apps/web/src/lib/pwa/sync.ts`: membaca `pullJson.logs || pullJson.data`, mendukung evaluasi enum `sLog.status === "REVISION_REQUIRED" || sLog.status === "REVISION_REQUESTED"`, serta mengekstrak catatan revisi dari `sLog.rejectionReason || sLog.mentorNotes`.

### BUG-005 — Form jurnal baru memakai ID dummy non-UUID (placement-demo-rpl & jc-1) yang ditolak backend
- **Level:** P2 Medium
- **Status:** Fixed
- **Fitur/Modul:** Student Zero-Typing Logger (FR-005)
- **Pelapor / Pemilik:** Orang B / Orang B
- **Ditemukan:** 22 Okt 2026, audit integrasi database form siswa
- **Langkah reproduksi:**
  1. Siswa mengisi formulir jurnal pada `/student/log/new` dan menekan Simpan.
  2. Log tersimpan di IndexedDB dengan `placementId: "placement-demo-rpl"` dan `jobCardIds: ["jc-1"]`.
  3. Engine sinkronisasi mencoba mengirim batch log ke server `POST /api/v1/logs/sync`.
- **Hasil aktual:**
  Zod validator backend `dailyLogCreateSchema` menolak log dengan pesan `Invalid uuid` karena `"placement-demo-rpl"` dan `"jc-1"` bukan format UUID.
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Formulir jurnal menggunakan UUID penempatan nyata siswa dan UUID Job Card resmi dari database (atau disinkronkan ke `db.refData` saat online).
- **Catatan / dugaan penyebab:**
  Mock placeholder yang dipasang saat pembuatan prototipe antarmuka awal belum dihubungkan ke data master.
- **Perbaikan (commit/PR):** Dibuat endpoint `GET /api/v1/students/me/log-context` di backend, helper `fetchStudentLogContext` di `apps/web/src/lib/api.ts`, serta integrasi cache Dexie `db.refData` (`key: "student_log_context"`). Formulir `/student/log/new` kini memuat ID penempatan dan kartu pekerjaan UUID riil, menyimpan `jobCardTitle` lokal, serta mendukung fallback UUID valid saat offline total.

### BUG-006 — Typo instruksi PIN pada modal QR minta verifikasi (6 digit bukannya 4 digit)
- **Level:** P3 Low
- **Status:** Fixed
- **Fitur/Modul:** Student Log History (FR-005 / FR-007)
- **Pelapor / Pemilik:** Orang B / Orang B
- **Ditemukan:** 22 Okt 2026, peninjauan teks antarmuka
- **Langkah reproduksi:**
  1. Buka `/student/log/history`.
  2. Tekan tombol "Minta Verifikasi QR".
  3. Baca teks instruksi di bawah kode QR.
- **Hasil aktual:**
  Teks tertulis: *"lalu masukkan 6-digit PIN mentor yang terdaftar"*.
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Teks menyebutkan *"PIN 4 digit"* sesuai aturan bisnis BR-007 dan konstanta `PIN_LENGTH = 4`.
- **Catatan / dugaan penyebab:**
  Salah ketik (typo) teks penjelasan modal.
- **Perbaikan (commit/PR):** Direvisi pada `apps/web/src/app/student/log/history/page.tsx`: teks diperbarui menjadi *"masukkan 4 digit PIN mentor yang terdaftar (BR-007)"*. Logika resolusi judul riwayat offline juga dihubungkan dengan `ol.jobCardTitle` untuk rendering instan.

### BUG-007 — Global error handler ZodError dan registrasi sekolah mengembalikan status 400 bukannya 422
- **Level:** P3 Low
- **Status:** Fixed
- **Fitur/Modul:** API Error Handler / REST Standards (`DESIGN.md` §9.4)
- **Pelapor / Pemilik:** Orang C / Orang C
- **Ditemukan:** 22 Okt 2026, audit menyeluruh konsistensi kode
- **Langkah reproduksi:**
  1. Kirim request dengan format body salah ke endpoint yang mengandalkan global `ZodError` atau `POST /api/schools/register`.
  2. Periksa status HTTP kode pada respons.
- **Hasil aktual:**
  API mengembalikan status HTTP 400 Bad Request.
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Sesuai `docs/DESIGN.md` §9.4 baris 383 (`validation_failed 422`), error validasi semantik payload RFC 7807 mengembalikan HTTP 422 Unprocessable Entity dengan kode `VALIDATION_ERROR`.
- **Catatan / dugaan penyebab:**
  Scaffold awal di Hari 0 menggunakan default Express 400 Bad Request sebelum penyelarasan ke standar REST 422.
- **Perbaikan (commit/PR):** Direvisi pada `apps/api/src/middlewares/error-handler.ts` (mengembalikan 422 untuk instance `ZodError`), diselaraskan pada `apps/api/src/routes/schools.ts`, serta diperbarui ekspektasi di `apps/api/test/schools.test.ts`. 114 test lulus 100%.

### BUG-008 — On-demand drift evaluate memicu duplikasi alert OPEN jika dijalankan berkali-kali dan GET /drift-alerts belum query DB
- **Level:** P2 Medium
- **Status:** Fixed
- **Fitur/Modul:** Teacher Heatmap & Drift Alert Engine (FR-008)
- **Pelapor / Pemilik:** Orang C / Orang C
- **Ditemukan:** 22 Okt 2026, audit logika persistensi database
- **Langkah reproduksi:**
  1. Buka portal guru dan tekan tombol "Evaluasi Ulang Live" (`POST /api/v1/teachers/drift-alerts/evaluate`) beberapa kali pada database aktif.
  2. Buka endpoint `GET /api/v1/teachers/drift-alerts`.
- **Hasil aktual:**
  1. `POST /evaluate` memanggil `prisma.driftAlert.create()` setiap kali deteksi aktif tanpa memeriksa alert `OPEN` yang sudah ada, sehingga membuat baris duplikat.
  2. `GET /drift-alerts` hanya membaca fungsi pembantu mock `getMockHeatmapData()` tanpa melakukan query ke tabel `drift_alerts`.
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Evaluasi drift bersifat idempoten (meng-update snapshot anomali jika sudah ada status `OPEN`), dan `GET /drift-alerts` membaca relasi database saat database aktif dengan fallback mock aman.
- **Catatan / dugaan penyebab:**
  Implementasi awal fokus pada pengujian unit fallback sebelum penambahan layer query relasional Prisma.
- **Perbaikan (commit/PR):** Diperbarui pada `apps/api/src/routes/teachers.ts`: menambahkan pengecekan `prisma.driftAlert.findFirst` dan update snapshot untuk mencegah duplikasi, serta mengintegrasikan query `prisma.driftAlert.findMany` relasional dengan sorting tingkat urgensi anomali. Lolos typecheck dan 114 test lulus.

### BUG-009 — Pembagian alokasi durasi JP multi-kartu pada sync.ts dapat menghasilkan nilai <= 0 JP
- **Level:** P1 High
- **Status:** Fixed
- **Fitur/Modul:** Offline Sync Engine (FR-006 & PRD FR-005)
- **Pelapor / Pemilik:** Orang B / Orang B
- **Ditemukan:** 23 Okt 2026, audit logika sinkronisasi log multi-kartu
- **Langkah reproduksi:**
  1. Catat log harian dengan memilih 2 atau 3 Job Card dan durasi JP kecil (misal 1 JP).
  2. Engine sinkronisasi menghitung `baseJp = Math.max(1, Math.floor(1 / 2)) = 1` dan `remainder = 1 - 2 = -1`.
  3. Item pertama mendapatkan `durationJp = 1 + (-1) = 0 JP`.
- **Hasil aktual:**
  Backend menolak dengan HTTP 422 `VALIDATION_ERROR` karena skema Zod `dailyLogItemCreateSchema` mewajibkan `durationJp >= 1`. Log gagal tersinkron secara permanen.
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Setiap item selalu mendapatkan alokasi durasi integer minimal 1 JP melalui alokasi integer modulo yang aman.
- **Perbaikan (commit/PR):** Diperbarui pada `apps/web/src/lib/pwa/sync.ts` dengan pembagian modulo integer dan pembatasan kartu sejumlah durasi JP, serta slider minimum di `NewLogPage.tsx` disesuaikan dengan jumlah kartu yang dipilih.

### BUG-010 — Log sakit/izin (A2) dihitung sebagai non-kompetensi sehingga memicu false-positive NON_COMPETENCY_OVERLOAD
- **Level:** P1 High
- **Status:** Fixed
- **Fitur/Modul:** Drift Evaluator & Student Presensi (FR-005 A2 & FR-008)
- **Pelapor / Pemilik:** Orang B / Orang B
- **Ditemukan:** 23 Okt 2026, audit kepatuhan aturan bisnis PRD FR-005 A2
- **Langkah reproduksi:**
  1. Siswa mencatat presensi Sakit / Izin (A2).
  2. Formulir memberi tanda `isNonCompetency: true` dan `nonCompetencyCategory: 'ADMIN_UMUM'`.
  3. Mesin evaluasi drift membaca entri tersebut dan menambahkan durasi ke `nonCompJp14d`.
- **Hasil aktual:**
  Siswa yang sakit 3 hari berturut-turut terdeteksi mengalami penyimpangan kompetensi 100% dan memicu alert palsu `NON_COMPETENCY_OVERLOAD` ke guru pembimbing.
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Sesuai PRD FR-005 A2: presensi sakit/izin tidak memengaruhi rasio deviasi kompetensi.
- **Perbaikan (commit/PR):** Diperbarui pada `apps/api/src/services/drift-evaluator.ts` untuk mengecualikan log berstatus `SICK` dan `PERMIT` dari perhitungan deviasi non-kompetensi, serta form `NewLogPage.tsx` membersihkan flag non-kompetensi pada presensi sakit/izin.

### BUG-011 — Ketiadaan adaptive compression loop di photo.ts berpotensi memicu error permanen HTTP 413
- **Level:** P2 Medium
- **Status:** Fixed
- **Fitur/Modul:** Client-Side Photo Pipeline (FR-006 & DESIGN §7.1)
- **Pelapor / Pemilik:** Orang B / Orang B
- **Ditemukan:** 23 Okt 2026, audit batas ukuran biner server
- **Langkah reproduksi:**
  1. Unggah foto resolusi tinggi dengan noise frekuensi tinggi (misal foto mesin kompleks).
  2. Kompresi satu langkah pada kualitas 0.65 menghasilkan WebP 160 KB.
  3. Klien mencoba mengunggah biner ke server `PUT /logs/:uuid/evidence`.
- **Hasil aktual:**
  Server melempar HTTP 413 `FILE_TOO_LARGE` karena melebihi hard limit 150 KB. Antrean retry akan gagal tanpa batas.
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Pipeline kompresi menjamin ukuran foto selalu di bawah 150 KB (target 35–60 KB).
- **Perbaikan (commit/PR):** Diperbarui pada `apps/web/src/lib/pwa/photo.ts`: menambahkan adaptive compression loop yang menurunkan kualitas secara adaptif dan men-downscale kanvas bila ukuran biner melebihi 145 KB.

### BUG-012 — Tautan WhatsApp deep link pada verify.ts memakai nomor mentah tanpa normalisasi 628...
- **Level:** P2 Medium
- **Status:** Fixed
- **Fitur/Modul:** Dual-Mode Mentor Verification (FR-007 & FR-009)
- **Pelapor / Pemilik:** Orang C / Orang C
- **Ditemukan:** 23 Okt 2026, audit kepatuhan tautan WhatsApp
- **Langkah reproduksi:**
  1. Siswa meminta verifikasi jurnal via WhatsApp (`POST /api/v1/verify/links`).
  2. Nomor mentor terdaftar dengan format lokal Indonesia (misal `081234567890`).
  3. Klien membuka tautan `waShareUrl`.
- **Hasil aktual:**
  `waShareUrl` menghasilkan `https://wa.me/081234567890...` yang ditolak oleh WhatsApp Web dan Mobile API (WhatsApp mewajibkan format nomor internasional tanpa angka 0 di depan).
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Nomor telepon dinormalisasi ke format `628...` menggunakan fungsi inti `buildWhatsAppDeepLink` dari `@vokalink/core`.
- **Catatan / dugaan penyebab:**
  Regex pembersih karakter lama hanya menghapus non-angka tanpa mengubah awalan `0` menjadi kode negara `62`.
- **Perbaikan (commit/PR):** Diperbarui pada `apps/api/src/routes/verify.ts`: mengintegrasikan fungsi `buildWhatsAppDeepLink` dari `@vokalink/core` untuk memastikan tautan WhatsApp mengarah ke `https://wa.me/628...` secara baku.

### BUG-013 — Deteksi SKILL_MONOTONY tidak pernah aktif pada data database riil akibat ketiadaan elemen 0 JP
- **Level:** P1 High
- **Status:** Fixed
- **Fitur/Modul:** Algorithmic Drift Evaluator (FR-008 & BR-008)
- **Pelapor / Pemilik:** Orang C / Orang C
- **Ditemukan:** 23 Okt 2026, audit logika evaluasi drift pada database Prisma
- **Langkah reproduksi:**
  1. Siswa bekerja 100 JP pada 1 elemen CP dan 0 JP pada 3 elemen CP lainnya.
  2. Guru menjalankan evaluasi drift atau cron malam berjalan (`evaluateDriftForAllPlacements`).
  3. Mesin membaca log terverifikasi siswa dan mengisi `cpMap`.
- **Hasil aktual:**
  `cpMap` hanya menyimpan elemen CP yang pernah dikerjakan (`jp > 0`), sehingga `cpElementsJp` hanya memiliki panjang 1 dan `zeroCount` bernilai 0. Aturan `detectSkillMonotony` (`cpElementsJp.length >= 3` dan `zeroCount >= 2`) tidak pernah terpenuhi, sehingga anomali `SKILL_MONOTONY` tidak pernah terdeteksi pada database riil.
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Evaluator memetakan seluruh elemen CP kurikulum jurusan siswa (`student.schoolDepartment.cpElements`) sehingga elemen yang belum disentuh siswa tercatat dengan `jp: 0`.
- **Catatan / dugaan penyebab:**
  Query awal penempatan aktif belum menyertakan relasi `schoolDepartment.cpElements`.
- **Perbaikan (commit/PR):** Diperbarui pada `apps/api/src/services/drift-evaluator.ts`: menyertakan relasi `student.schoolDepartment.cpElements` pada query penempatan aktif dan memetakan seluruh elemen CP jurusan sehingga elemen berkategori 0 JP terhitung akurat.

### BUG-014 — Anomali DriftAlert yang telah terselesaikan tidak pernah di-resolve secara otomatis oleh sistem
- **Level:** P1 High
- **Status:** Fixed
- **Fitur/Modul:** Algorithmic Drift Evaluator & Auto-Resolution (FR-008 & PRD FR-008)
- **Pelapor / Pemilik:** Orang C / Orang C
- **Ditemukan:** 23 Okt 2026, audit kepatuhan siklus hidup anomali PRD FR-008
- **Langkah reproduksi:**
  1. Siswa memiliki anomali `APPROVAL_DORMANCY` karena mentor tidak merespons > 7 hari.
  2. Mentor kemudian menyetujui seluruh logbook siswa.
  3. Cron harian atau tombol evaluasi on-demand dijalankan.
- **Hasil aktual:**
  `drift-evaluator.ts` hanya membuat/memperbarui alert saat `detected === true`. Ketika `detected === false`, sistem membiarkan status `DriftAlert` tetap `OPEN` selamanya di dasbor guru.
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Sesuai PRD FR-008: jika kondisi pemicu sudah tidak terpenuhi lagi pada evaluasi harian berikutnya (misal: mentor telah memverifikasi seluruh log yang dorman), sistem secara otomatis memperbarui status DriftAlert dari `OPEN` menjadi `RESOLVED` dengan `resolvedAt = NOW()`.
- **Catatan / dugaan penyebab:**
  Ketiadaan blok `else` pada evaluasi ketiga tipe anomali di `drift-evaluator.ts`.
- **Perbaikan (commit/PR):** Diperbarui pada `apps/api/src/services/drift-evaluator.ts`: menambahkan auto-resolution (`status: "RESOLVED"`, `resolvedAt: now`) untuk ketiga jenis anomali saat kondisi pemicu tidak lagi terdeteksi, serta menambahkan penyelesaian langsung di `apps/api/src/routes/verify.ts` saat mentor mengeksekusi persetujuan seluruh logbook dorman.

### BUG-015 — Presensi Sakit/Izin (A2) ikut terhitung ke dalam total 14 hari di heatmap guru
- **Level:** P2 Medium
- **Status:** Fixed
- **Fitur/Modul:** Teacher Live Competency Heatmap (FR-008 & PRD FR-005 A2)
- **Pelapor / Pemilik:** Orang C / Orang C
- **Ditemukan:** 23 Okt 2026, sinkronisasi perhitungan deviasi guru
- **Langkah reproduksi:**
  1. Siswa mencatat presensi Sakit / Izin dalam 14 hari terakhir.
  2. Guru membuka matriks heatmap `/teacher/heatmap`.
- **Hasil aktual:**
  Perhitungan `totalJpLast14Days` di `apps/api/src/routes/teachers.ts` menjumlahkan seluruh entri tanpa mengecualikan presensi sakit/izin, sehingga angka total jam 14 hari siswa berbeda dengan perhitungan evaluator drift.
- **Hasil seharusnya (rujukan PRD/BR/TC):**
  Sesuai PRD FR-005 A2: presensi sakit/izin tidak memengaruhi perhitungan rasio deviasi kompetensi.
- **Catatan / dugaan penyebab:**
  Penyesuaian BUG-010 sebelumnya baru diterapkan pada `drift-evaluator.ts` dan belum disinkronkan ke route `teachers.ts`.
- **Perbaikan (commit/PR):** Diperbarui pada `apps/api/src/routes/teachers.ts`: menambahkan filter `log.attendanceType !== "SICK" && log.attendanceType !== "PERMIT"` pada agregasi jam 14 hari terakhir.

## 5. Catatan Dokumen (ketidaksinkronan yang diketahui)

Hasil review PRD dan DESIGN pada Hari 0. Bukan bug kode, tapi harus diingat saat implementasi. Keputusan akhir ada di `DESIGN.md`.

| ID | Temuan | Penanganan |
|---|---|---|
| D-001 | PRD menyebut stack Route Handlers Next.js, dan kontrak API Bab 12.3 berawalan `/api/...`. Keputusan tim: backend Express di Coolify | API dipindah ke Express (`/api/v1/...`), lihat `DESIGN.md` bagian 9 |
| D-002 | PRD TBD-01 merekomendasikan Drizzle atau Prisma. Keputusan tim: Prisma | Prisma lewat Supavisor pooler (`?pgbouncer=true` runtime, `DIRECT_URL` untuk migrasi) |
| D-003 | PRD menyebut "5 konsentrasi" tapi mendaftar 6, data demo hanya 4 jurusan | Seed 6 jurusan, demo mengaktifkan 4 (AKL, RPL, DKV, Kuliner) |
| D-004 | Roadmap PRD 4 minggu (21 Okt sampai sekitar 18 Nov), deadline lomba 30 Okt | `SPRINT.md` memadatkan jadi 10 hari dengan cut-line di Hari 7 |
| D-005 | TBD-03 (foto wajib atau tidak) belum diputuskan di PRD | Default: foto wajib untuk Mandiri dan Terbimbing, opsional untuk Observasi dan izin/sakit |
| D-006 | PRD NFR 11.1 meminta RLS berbasis klaim JWT, sementara Prisma terhubung sebagai role `postgres` yang melewati RLS | RLS deny-all untuk `anon`/`authenticated`, isolasi tenant dilakukan di Express (Prisma client extension) |
| D-007 | PRD 9.2 menyebut `pin_hash` SHA-256 + salt. PIN 4 digit mudah di-brute-force dengan hash cepat | Pakai scrypt + salt per mentor + `PIN_PEPPER` (`DESIGN.md` 4.1) |
| D-008 | PRD menyebut Ed25519 di Out-of-Scope, tapi seluruh alur memakai HMAC-SHA256 | Pakai HMAC-SHA256 saja (ADR-06) |
| D-009 | PRD 12.2 menyebut Next-PWA, yang sudah tidak dipelihara | Pakai Serwist (ADR-08) |
| D-010 | Aturan backdate BR-003 ambigu untuk log yang dibuat offline lalu sinkron terlambat | Validasi memakai `clientCreatedAt`, bukan waktu terima server (`DESIGN.md` 7.3) |
| D-011 | Praktik nyata SMK & DUDI membedakan Jam Kerja Riil (60 menit) vs Beban Belajar JP (45 menit, total 792 JP), serta penilaian e-Rapor 4 Elemen Resmi Mapel PKL Kurikulum Merdeka (Permendikbudristek No. 12/2024 & Panduan BSKAP PKL) | Implementasi Dual-Representation Facade: Database tetap memakai kolom `durationJp` untuk backward compatibility, UI siswa & mentor memakai Jam Kerja Riil + Shift Presets dan Level SOP (Observasi/Terbimbing/Mandiri). Engine penilaian e-Rapor mengadopsi 4 Elemen Resmi (Soft Skills 20%, Core Hard Skills 40%, Advanced Hard Skills 25%, Kewirausahaan 15%), dan CV ATS / Paspor Publik menonjolkan total jam kerja riil + frekuensi penugasan mandiri sesuai SOP. |
| D-012 | Penyederhanaan Scope & UI De-cluttering (Core Loop Refinement): Antarmuka awalnya terlalu padat karena menampilkan editor kurikulum manual `/school/curriculum`, kalkulator jarak GPS rumah siswa/Auto-Greedy Placement, tab terpisah Audit DUDI Quality Index, kuas blur kanvas foto, panel K3 overwork mingguan, tab rotasi tengah semester di modal guru, dan kotak regulasi ganda di halaman HRD | Kurikulum 792 JP & 89 Job Cards berjalan 100% otomatis (*Pre-loaded System Default*) tanpa halaman `/school/curriculum`. Penempatan siswa disederhanakan berbasis kecocokan jurusan & kuota DUDI. Form jurnal siswa dirampingkan (tanpa modal kuas blur & panel K3 overwork). Modal tindak lanjut guru fokus langsung ke koordinasi WhatsApp mentor. Halaman endorsement mentor (`/v/[token]/endorse`) dan verifikasi paspor HRD (`/verify/[slug]`) diselaraskan ke tema terang bersih tanpa jargon teknis dan teks birokrasi berlebih. |
