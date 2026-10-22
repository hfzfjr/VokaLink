# PROGRESS — VokaLink

> Papan status hidup. Perbarui setiap malam. Rencana ada di `SPRINT.md`, spesifikasi di `PRD.md`.
> **Terakhir diperbarui:** 21 Okt 2026 (Hari 2)
> **Hari sprint saat ini:** 2 dari 10 · **Deadline:** 30 Okt 2026 · **Code freeze:** 28 Okt

Legenda: `[ ]` belum · `[~]` sedang dikerjakan · `[x]` selesai · `[!]` terblokir

## 1. Ringkasan

| Metrik | Nilai |
|---|---|
| FR selesai | 10 / 12 |
| FR Must Have selesai | 10 / 11 |
| TC lulus | 8 / 10 |
| Bug terbuka (Critical / High) | 0 / 0 |
| Status cut-line | Belum dievaluasi (evaluasi di akhir Hari 7) |

## 2. Infrastruktur (Hari 0)

- [x] Repo GitHub + `main` terlindungi
- [x] Monorepo pnpm (`apps/web`, `apps/api`, `packages/shared`, `packages/core`)
- [x] TypeScript strict, ESLint, Prettier, Vitest
- [x] Project Supabase + URL pooler (6543 runtime, 5432 migrasi)
- [x] Prisma terhubung ke Supabase lewat pooler (migrasi `init_schema` sukses diterapkan)
- [x] Express di Coolify via Cloudflare Tunnel (`/healthz`, `/readyz`)
- [x] Project Vercel + env var
- [x] CI GitHub Actions (lint, typecheck, test, `prisma validate`, gitleaks)
- [x] Uptime monitor + cron anti-pause Supabase

## 3. Status per Fitur

| FR | Fitur | Pemilik | Status | Backend | Frontend | Tes | Catatan |
|---|---|---|---|---|---|---|---|
| FR-001 | Onboarding multi-sekolah + demo | A | [x] | [x] | [x] | [x] | Multi-step SaaS onboarding, clone kurikulum 792 JP, demo sandbox loader |
| FR-002 | Kurikulum & Job Card (6 jurusan) | A | [x] | [x] | [x] | [x] | Matriks CP, slider JP proporsional, lock kurikulum, katalog Job Card & non-kompetensi |
| FR-003 | Onboarding DUDI + bind device | A / C | [x] | [x] | [x] | [x] | Direktori terfederasi lintas sekolah, assisted DUDI onboarding, pemetaan Job Cards, QR & link aktivasi 72 jam, zero-login 4-digit PIN device-bound (scrypt + pepper) |
| FR-004 | Smart Placement | A | [x] | [x] | [x] | [x] | Haversine spasial murni, bobot multi-kriteria 70:30, kuota aktif, lencana rotasi tengah semester (<50%), penugasan auto-greedy massal & override manual |
| FR-005 | Logger zero-typing + Tombol Jujur | B | [x] | [x] | [x] | [x] | Form zero-typing, Tombol Jujur (BR-004), slider durasi (BR-002), autonomy level (BR-009) |
| FR-006 | Kompres WebP, blur, offline sync | B | [x] | [x] | [x] | [x] | Two-Phase Sync Engine (batch sync maks 20 log idempoten, biner WebP maks 150 KB SHA-256) |
| FR-007 | Verifikasi zero-login (QR / WA) | C | [x] | [x] | [x] | [x] | Dual-factor auth (device token + PIN scrypt), batch approve < 10 dtk, segel HMAC-SHA256, lockout 15 mnt, TC-005, TC-006, TC-007 lulus |
| FR-008 | Heatmap & drift alert | C | [x] | [x] | [x] | [x] | Matriks live CP siswa binaan, deteksi 3 anomali drift, modal workload 14 hari & draft WA mentor |
| FR-009 | Intervensi WA & rotasi mitra | C | [ ] | [ ] | [ ] | [ ] | |
| FR-010 | Endorsement & quality index (Should) | C | [ ] | [ ] | [ ] | [ ] | Kandidat pertama cut-line |
| FR-011 | e-Rapor exporter | A | [x] | [x] | [x] | [x] | Formula BR-009 (0.60×teknis+0.40×sikap), narratif Kurikulum Merdeka, export CSV |
| FR-012 | CV ATS & paspor publik | B / C | [x] | [x] | [x] | [x] | Pure CV generator Google XYZ, isolasi log VERIFIED (BR-010), filter Tombol Jujur (BR-004), layout A4 Print CSS, router /students/me/cv & /passports/:slug, publik /verify/[passportSlug] segel HMAC-SHA256 |

## 4. Modul Bersama

| Modul | Pemilik | Status |
|---|---|---|
| Skema Prisma + migrasi + SQL guard (RLS, trigger immutability) | A | [x] (BUG-001 fixed oleh Orang B) |
| `curriculum-seed.json` (6 jurusan, 792 JP, min. 12 Job Card) | A | [x] (6 jurusan, 25 elemen CP, 89 Job Cards) |
| Seeder v1 (sekolah demo, mentor terikat, penempatan) | A | [x] (sekolah demo, guru, 5 siswa, 6 DUDI & penempatan aktif) |
| Seeder v2 (riwayat 8 minggu, drift, endorsement, paspor) | A | [x] (40 hari log, segel HMAC, 3 kasus drift, rotasi 430 JP, endorsement & paspor publik) |
| Auth middleware (JWT Supabase, role, tenant guard) | C | [x] |
| `packages/core` (haversine, skor, drift, rapor, canonical JSON, HMAC) | C | [x] |
| `packages/shared` (skema Zod, konstanta) | semua | [x] |
| PWA shell (Serwist, Dexie, banner konektivitas) | B | [x] (Service Worker Serwist, Web App Manifest, Dexie DB logs/photos/refData, & banner antrean tuntas) |
| Judge Demo Switcher | A | [x] (Landing page, login switcher, sandbox loader & mock accounts) |

## 5. Status Uji Penerimaan

| TC | Status | Tanggal | Catatan |
|---|---|---|---|
| TC-001 | [x] | 21 Okt 2026 | Sandbox terbuat & 6 jurusan memuat Elemen CP tepat 792 JP & min. 12 Job Cards praktis |
| TC-002 | [x] | 21 Okt 2026 | Validasi alokasi != 792 JP memicu pesan error 422 JP_TOTAL_MISMATCH & tombol kunci nonaktif |
| TC-003 | [x] | 22 Okt 2026 | Form zero-typing tersimpan di Dexie IndexedDB offline, Two-Phase sync (batch maks 20 log idempoten + upload WebP SHA-256) lulus tes |
| TC-004 | [ ] | | |
| TC-005 | [x] | 22 Okt 2026 | Batch approve log siswa < 10 dtk dengan segel HMAC-SHA256 |
| TC-006 | [x] | 22 Okt 2026 | Tautan dibuka di HP tanpa device token mentor diblokir 403 DEVICE_MISMATCH + SecurityFlag UNTRUSTED_DEVICE |
| TC-007 | [x] | 22 Okt 2026 | Salah PIN 5x berturut-turut memicu penguncian akun verifikasi 15 menit + SecurityFlag PIN_LOCKOUT |
| TC-008 | [x] | 22 Okt 2026 | Deteksi anomali drift otomatis pada 3 pola: NON_COMPETENCY_OVERLOAD, SKILL_MONOTONY, APPROVAL_DORMANCY |
| TC-009 | [ ] | | |
| TC-010 | [x] | 22 Okt 2026 | CV ATS terkunci pada data VERIFIED (BR-010), non-kompetensi dikeluarkan dari klaim teknis (BR-004), QR membuka paspor terverifikasi publik ber-HMAC |

## 6. Metrik Non-Fungsional

| Metrik | Target | Terukur | Tanggal |
|---|---|---|---|
| Kompresi foto 5 MB | < 60 KB, < 1,5 dtk | - | - |
| FCP halaman siswa / `/v/[token]` | < 1,2 dtk (4G) | - | - |
| Heatmap 35 siswa × 6 elemen | < 800 ms | - | - |
| Lighthouse (Perf / A11y / Best Practices) | ≥ 90 | - | - |
| Verifikasi mentor (waktu total) | < 10 dtk | - | - |

## 7. Blocker & Keputusan Terbuka

| # | Hal | Pemilik | Status |
|---|---|---|---|
| BUG-001 | Trigger block_verified_log_update memakai mentor_id bukan verified_by_mentor_id | A | ✅ Resolved oleh Orang B |

Keputusan yang sudah final tercatat di `DESIGN.md` bagian 1 (ADR-01 sampai ADR-12) dan bagian 12.

## 8. Log Harian

### Hari 2 — Kam 22 Okt 2026
- Selesai:
  - FR-003: Assisted DUDI Onboarding, Pemetaan Kapasitas Lintas Sekolah & Pengikatan Token Kriptografi (Device-Bound PIN) (Orang A / C).
    - API router `/api/dudi` untuk federated directory (BR-011), pendaftaran DUDI baru & pemetaan Job Cards dalam transaksi database.
    - Token aktivasi perangkat kriptografis 72 jam (`SignedLink`) dengan HMAC signature & URL generator terintegrasi WhatsApp share.
    - Zero-login device binding endpoint (`/verify/:token/activate`) dengan pengikatan device token browser (SHA-256) & pengamanan PIN 4-digit dengan scrypt + per-mentor salt + PIN_PEPPER di server.
    - Mekanisme A2 reset token perangkat jika HP mentor hilang atau berganti (`/mentors/:mentorId/reset-device`).
    - Halaman direktori DUDI `/school/dudi-directory` dengan 5 state UI (loading, empty, offline, error recovery, unauth), GPS + input koordinat manual, seleksi Job Cards, pendaftaran mentor, dan modal QR code/WhatsApp share link.
    - Halaman aktivasi mentor mobile-first `/v/[token]/activate` khusus HP mentor dengan numpad PIN 4 digit, verifikasi device token, dan persistensi `navigator.storage.persist()`.
    - 11 unit & integration tests di `apps/api/test/dudi.test.ts` lulus 100%.
  - Inisialisasi Serwist Service Worker (`apps/web/src/app/sw.ts`) dengan strategi precache shell, `StaleWhileRevalidate` kurikulum/job cards, `CacheFirst` peta OSM, dan `NetworkOnly` untuk antrean mutasi log (Orang B).
  - Pembuatan Web App Manifest (`manifest.ts` dan `public/manifest.json`) dan aset ikon PWA (`/icons/icon.svg`) (Orang B).
  - Skema database Dexie.js (`apps/web/src/lib/pwa/db.ts`) dengan tabel `logs`, `photos`, dan `refData` sesuai DESIGN.md §7.2 (Orang B).
  - Helper persistensi penyimpanan `navigator.storage.persist()` (mitigasi RSK-03) pada `persistence.ts` (Orang B).
  - Client-side Photo Pipeline (`photo.ts`): kompresi Canvas WebP 0.65 proporsional maks 800px (< 60 KB, maks 150 KB), pembuangan EXIF/geotag privasi, dan perhitungan hash SHA-256 via SubtleCrypto (Orang B).
  - Integrasi Dexie ke form pencatatan `/student/log/new` (penyimpanan instan ke IndexedDB lokal saat offline) dan `ConnectivityBanner` reaktif (membaca antrean nyata dan warning jika antrean > 3 log) (Orang B).
  - Sinkronisasi live query IndexedDB pada riwayat `/student/log/history` dengan badge status sinkronisasi detail (`Antrean Lokal`, `Upload Foto`, `Menunggu Mentor`, `Terverifikasi`, `Gagal Sinkron`) (Orang B).
  - Backend Express Router Logbook (`apps/api/src/routes/logs.ts`) & Skema Zod Shared (`packages/shared/src/schemas/index.ts`):
    - `POST /api/v1/logs/sync` (Fase 1: Batch upsert maks 20 log, validasi status penempatan aktif, idempotensi `clientLogUuid`, validasi backdate WIB H-3 terhadap `clientCreatedAt` [BR-003], pembatasan 1-12 JP [BR-002]).
    - `PUT /api/v1/logs/:clientLogUuid/evidence` (Fase 2: Raw binary upload maks 150 KB, magic bytes WebP `RIFF...WEBP` / JPEG, header checksum `X-Content-SHA256`, immutability guard log `VERIFIED`).
    - `GET /api/v1/logs/me` (Fase 3: Pull status verifikasi mentor ke IndexedDB).
  - 15 Unit & Integration Tests (`apps/api/test/logs.test.ts`) mencakup seluruh kondisi lolos & tolak Fase 1 & Fase 2, lulus 100% (Orang B).
  - Client Engine `apps/web/src/lib/pwa/sync.ts` & React Hook `apps/web/src/lib/pwa/hooks/useSyncManager.ts` dengan auto-sync saat transisi online & visibilitychange, serta tombol manual "Sinkronkan Sekarang" pada `ConnectivityBanner` (Orang B).
  - FR-004: Smart Placement & Spatial Compatibility Scorer (Orang A).
    - Algoritma pencocokan multi-kriteria berbasis bobot kompetensi (70%) dan jarak Haversine (30%) di `packages/core` dengan batas kuota dan greedy massal.
    - API router `/api/schools/:schoolId/placements` (`/candidates`, `POST /`, `POST /batch`, `PATCH /students/:id/coordinates`) dengan tenant guard, validasi kuota penuh (422), deteksi rotasi tengah semester (<50%), dan A1 override manual.
    - Halaman web `/school/placements` dengan tab kandidat rekomendasi, visualisasi skor multi-kriteria, peringatan kuning rotasi tengah semester (WCAG AA), modal konfirmasi penempatan, update koordinat domisili via GPS/manual, dan pratinjau auto-greedy massal.
    - 8 unit & integration tests di `apps/api/test/placements.test.ts` dan 2 unit tests di `packages/core/test/core.test.ts` lulus 100%.
  - FR-011: e-Rapor SMK Grade & Narrative Exporter (Orang A).
    - Formula BR-009 murni di `packages/core/src/erapor.ts`: `calculateElementGrade`, `calculateFinalPklGrade`, `generateEraporNarratives`, `generateEraporCsv`.
    - Narratif Kurikulum Merdeka otomatis menyebut Job Card terbaik + nama DUDI, serta elemen terendah yang perlu bimbingan.
    - API endpoint `GET /api/schools/:schoolId/erapor` dengan `?format=json` dan `?format=csv` (tenant guard, hanya data `VERIFIED`, peringatan `PENDING_VERIFICATION`).
    - Frontend `/school/erapor` dengan tabel nilai per siswa, banner peringatan pending, tombol download CSV, modal override nilai guru (A1).
    - 4 integration tests di `apps/api/test/erapor.test.ts`, total 56 tests monorepo lulus 100%.
    - Resolusi BUG-001 (P0 Critical): Migrasi `20261021184500_fix_bug001_trigger_mentor_id` diterapkan ke Supabase (memperbaiki typo nama kolom `mentor_id` menjadi `verified_by_mentor_id` pada trigger immutability).
  - Seeder v2 (Riwayat 8 Minggu, Drift, Endorsement & Paspor) (Orang A):
    - `apps/api/prisma/seed-v2.ts` dan script `pnpm --filter api seed:v2`.
    - Riwayat 40 hari kerja (8 minggu) per siswa RPL dengan durasi 6-10 JP/hari (< 12 JP/hari BR-002), bukti foto WebP realistis (< 150 KB BR-006), dan segel HMAC-SHA256 (`signature_hash`).
    - Andi Pratama: 288 JP terverifikasi + 4 hari pending (siap uji batch approve < 10 dtk TC-005), endorsement sikap 95/100, paspor publik `/verify/andi-pratama-rpl-2026`.
    - Bintang Ramadhan: Skenario `NON_COMPETENCY_OVERLOAD` aktif (40% non-kompetensi dalam 14 hari terakhir) (TC-008).
    - Citra Maharani: Skenario `SKILL_MONOTONY` aktif (85% jam menumpuk di 1 Elemen CP, 2 elemen lain 0 JP).
    - Dewi Anggraini: Skenario `APPROVAL_DORMANCY` aktif (7 log pending > 7 hari tanpa validasi mentor).
    - Eko Saputra: Skenario rotasi mitra (380 JP DUDI A + 50 JP DUDI B = 430 JP total TC-009) dengan riwayat `DriftAlert` resolved dan `InterventionLog` guru, paspor publik `/verify/eko-saputra-rpl-2026`.
    - Seluruh 6 mentor DUDI diikat dengan kredensial demo (PIN: `1234`, token perangkat).
    - Demo token batch approve untuk mentor Rizky terbit dan siap dites pada `/v/[token]`.
  - FR-012: Data-Driven Smart ATS-CV Generator, Public Verifiable Skill Passport & Instant QR Verifier (Orang B / C):
    - Pure engine di `packages/core/src/cv.ts`: formulasi bullet points Google XYZ (`[Action] [Tools] untuk [Job Card] secara [Mandiri/Terbimbing] selama [X] JP [SKKNI]`), pemfilteran ketat log status `VERIFIED` saja (BR-010), pengecualian tugas non-kompetensi Tombol Jujur dari klaim teknis (BR-004) dengan tetap memperhitungkan total jam kehadiran magang, multi-DUDI placement grouping untuk kasus rotasi mitra (TC-009), dan ekstraksi tools unik terakumulasi JP.
    - 7 unit tests di `packages/core/test/cv.test.ts` lulus 100%.
    - Express Router di `apps/api/src/routes/passports.ts`:
      - `GET /api/v1/students/me/cv`: Ekstraksi relasional Prisma log terverifikasi siswa, endorsement industri, profil sekolah, dan bio vokasi.
      - `PATCH /api/v1/students/me/passport`: Penyuntingan ringkasan profil pribadi dan kegiatan ekstrakurikuler yang diizinkan siswa.
      - `GET /api/v1/passports/:slug`: Verifikasi publik tanpa login dengan audit segel master kriptografi HMAC-SHA256 (`SERVER_CRYPTO_SECRET`), data capaian CP, dan galeri bukti kerja WebP.
    - 4 integration tests di `apps/api/test/passports.test.ts` lulus 100%. Total 96 tests monorepo hijau 100%.
    - Halaman siswa `/student/career-cv`: Layout dokumen A4 Print CSS satu kolom bebas elemen non-print, 5 kondisi UI (skeleton, empty state jika belum ada log verified, offline banner, error recovery, verified), editor teks bio siswa langsung tersimpan ke paspor, dan QR Code audit stamp.
    - Halaman verifikasi publik `/verify/[passportSlug]`: Lencana hijau TERVERIFIKASI RESMI segel HMAC-SHA256, matriks capaian elemen CP, etos kerja mentor, galeri artefak foto, dan penanganan error dokumen tidak valid (TC-010).
  - Resolusi Bug Scope Orang B (BUG-003 s.d. BUG-006) (Orang B):
    - BUG-003 (P1 High): Restrukturisasi payload Fase 1 di `sync.ts` sesuai `dailyLogCreateSchema` Zod (array `items`, `attendanceType: "PRESENT"`, pembagian durasi JP multi-item proporsional, metadata foto SHA-256) dan pembacaan `resJson.results`.
    - BUG-004 (P1 High): Koreksi pembacaan respons Fase 3 Pull `pullJson.logs`, pencocokan enum status `REVISION_REQUIRED`, dan penyimpanan catatan penolakan/revisi mentor ke IndexedDB.
    - BUG-005 (P2 Medium): Endpoint `GET /api/v1/students/me/log-context`, integrasi cache Dexie `db.refData` (`key: "student_log_context"`), eliminasi ID mock dummy, penggunaan UUID riil penempatan dan Job Cards, serta fallback offline aman.
    - BUG-006 (P3 Low): Koreksi instruksi PIN mentor di modal QR menjadi 4 digit (BR-007), serta rendering judul kartu riwayat offline instan via `ol.jobCardTitle`.
    - Sensor Privasi / Privacy Blur (FR-006 & TC-003): Pipeline Canvas blur filter selektif pada dokumen/monitor rahasia DUDI dengan frosted-glass & watermark badge privasi permanen sebelum konversi WebP.
  - Implementasi Fitur Lanjutan Scope Orang B (FR-005 & FR-012) (Orang B):
    - Multi-Job Cards Selection (PRD FR-005 baris 428): Siswa dapat memilih 1 hingga 3 job cards per log harian di `/student/log/new` dengan indikator urutan `#1`, `#2`, `#3`, preview pembagian durasi JP proporsional, dan penguncian jika melebihi kuota 3 kartu.
    - Presensi Sakit / Izin (PRD FR-005 A2 baris 439): Kontrol segmen kehadiran (`Hadir Praktik`, `Sakit`, `Izin Resmi`), panduan unggah foto surat dokter/izin resmi, dan pemetaan otomatis ke kategori non-kompetensi `ADMIN_UMUM` agar tidak mendistorsi metrik drift teknis.
    - Live Student Dashboard & Pure SVG Radar CP Chart (PRD FR-005 baris 420 & 983): Integrasi live Dexie IndexedDB (`useLiveQuery`), penghitungan real-time JP terverifikasi vs pending, visualisasi 5 sumbu SKKNI dengan Spider Radar Chart SVG murni (0 KB external bundle) dan progress bar capaian tiap elemen CP.
    - Kontrol Privasi Paspor Keahlian Publik (PRD FR-012 A1 baris 841): Toggle switch `showPhotos` (Galeri Bukti) dan `showGrades` (Nilai Sikap Mentor) di sidebar `/student/career-cv`, integrasi mutasi API `PATCH /api/v1/students/me/passport` dengan fallback offline andal.
  - FR-007: Dual-Mode Zero-Login DUDI Verification & Batch Approval (Orang C):
    - Router Express `apps/api/src/routes/verify.ts`:
      - `GET /api/v1/verify/mentor/:token`: Validasi signed link, token kriptografi HMAC, ekstraksi siswa, penempatan, dan log pending.
      - `POST /api/v1/verify/mentor/:token/check-device`: Deteksi kecocokan `device_token_hash` mentor.
      - `POST /api/v1/verify/mentor/:token/execute`: Validasi 2-faktor simultan (device token + PIN scrypt + pepper), proteksi lockout gagal PIN 5x kunci 15 menit (TC-007), audit security flags (`UNTRUSTED_DEVICE` TC-006 & `PIN_LOCKOUT`), transaksi database penyegelan `signature_hash` HMAC-SHA256 (BR-007), pembaruan status `VERIFIED` / `REVISION_REQUIRED`.
      - `POST /api/v1/verify/links`: Pembangkitan signed link dinamis untuk QR (5 menit) dan WhatsApp (7 hari).
    - Halaman Mentor Mobile-First `/v/[token]` (`apps/web/src/app/v/[token]/page.tsx`): Area sentuh tombol aksi minimal 56px, kartu review kegiatan siswa beserta foto WebP, tombol batch approval < 10 detik (TC-005), numpad PIN pad 4 digit, modal revisi/penolakan, dan celebration screen resmi.
    - Integrasi modal riwayat siswa `/student/log/history` dengan generator tautan dinamis dan tombol langsung kirim WhatsApp (`wa.me`).
    - 9 integration tests di `apps/api/test/verify.test.ts` lulus 100%. Total 105 tests monorepo hijau 100%.
  - FR-008: Live Competency Heatmap & Algorithmic Drift Alert Engine (Orang C):
    - Shared Zod schemas & TypeScript types di `packages/shared/src/schemas/heatmap.ts` (`heatmapQuerySchema`, `HeatmapResponse`, `HeatmapStudentRow`, `StudentCpProgress`, `DriftAlertItem`, `CpElementSummary`).
    - Express Router di `apps/api/src/routes/teachers.ts`:
      - `GET /api/v1/teachers/heatmap` (dan `/api/schools/:schoolId/heatmap`): agregasi jam terverifikasi per elemen CP, perhitungan persentase capaian terhadap target JP kurikulum, status elemen (`NOT_STARTED`, `IN_PROGRESS`, `ACHIEVED`), penanda `hasDriftWarning`, dan fallback seed data deterministik.
      - `GET /api/v1/teachers/drift-alerts`: daftar anomali aktif diurutkan berdasarkan tingkat urgensi/severity (`NON_COMPETENCY_OVERLOAD` > `SKILL_MONOTONY` > `APPROVAL_DORMANCY`).
      - `POST /api/v1/teachers/drift-alerts/evaluate`: evaluasi on-demand mesin deteksi drift murni `evaluateStudentDrift` dari `packages/core`.
    - Halaman Guru Responsif `/teacher/heatmap` (`apps/web/src/app/teacher/heatmap/page.tsx`):
      - Kartu ringkasan metrik KPI (Total Siswa Binaan, Siswa Peringatan Drift, Rata-rata Capaian CP, Rincian 3 Jenis Anomali).
      - Panel Prioritas Intervensi interaktif dengan tombol langsung draft pesan WhatsApp ke mentor DUDI terkait.
      - Toolbar filter: pencarian siswa/DUDI, dropdown mitra DUDI, toggle "Hanya yang Bermasalah (Drift)", dan tombol evaluasi ulang live.
      - Matriks Responsif Desktop ($\ge$ lg) spreadsheet dengan kolom siswa beku (sticky), scroll horizontal elemen CP, persentase capaian berwarna + ikon WCAG AA, dan progress bar total JP.
      - Tampilan Mobile/Tablet (< lg) berupa kartu adaptif per siswa dengan badge mini CP.
      - Modal Detail Siswa: distribusi beban kerja 14 hari terakhir (Teknis vs Tombol Jujur Non-Kompetensi), rincian JP tiap elemen CP, dan tombol hubungi mentor DUDI.
    - 9 integration tests di `apps/api/test/heatmap.test.ts` lulus 100%. Total 114 tests monorepo hijau 100%.
- Sedang dikerjakan:
  - Persiapan FR-009 (Smart Intervention Dispatcher & Rotasi Mitra oleh Orang C).
- Blocker:
  - Tidak ada blocker aktif saat ini.
- Rencana besok (Hari 3):
  - FR-009: Smart Intervention Dispatcher (WhatsApp deep link generator & mid-term cross-DUDI rotation manager) (Orang C).

### Hari 1 — Rab 21 Okt 2026
- Selesai:
  - FR-001: Multi-tenant School Onboarding, master department seeding, sandbox loader (Orang A).
  - FR-002: Pre-loaded Multi-Sector Curriculum Engine, router kurikulum, update bobot JP dengan validasi sum === targetTotalJp 792 JP, lock matriks, katalog Job Cards praktis & kategori sistem non-kompetensi (Orang A).
  - Halaman web `/school/curriculum` responsif mobile-first dengan slider proporsional, modal tambah Job Card, 5 kondisi UI (skeleton, empty, offline banner, error recovery, unauthenticated) (Orang A).
  - 12 unit & integration test untuk kurikulum (`apps/api/test/curriculum.test.ts`), TC-001 & TC-002 lulus 100% (Orang A).
  - Inisialisasi PWA student shell responsif: optimal di mobile (360px) hingga tablet/desktop (max-w-6xl) (Orang B).
  - Desktop Navigation Bar terintegrasi pada StudentHeader (`hidden md:flex`) dan Bottom Navigation khusus mobile (`md:hidden`) dengan touch target >= 48px (Orang B).
  - Connectivity Banner 3-state (Offline, Syncing, Synced) dengan useOnlineStatus SSR-safe hook (Orang B).
  - 4 Halaman antarmuka siswa sepenuhnya responsif: `/student/home`, `/student/log/new`, `/student/log/history`, `/student/career-cv` (Orang B).
- Sedang dikerjakan:
  - Persiapan FR-003 (Assisted DUDI Onboarding, Pemetaan Kapasitas & Device-Bound PIN).
- Blocker:
  - BUG-001 (P0 Critical): Trigger SQL immutability block_verified_log_update salah mereferensikan kolom mentor_id (menunggu migrasi baru oleh Orang A).

### Hari 0 — Sel 20 Okt 2026
- Dokumen PRD, DESIGN (direvisi mengikuti PRD, Express, Prisma, Supabase), SPRINT, PROGRESS, BUGS, dan AGENTS dibuat.
- Inisialisasi repo, pnpm workspaces, Supabase, Prisma schema, Express Coolify setup, dan seeder v1 selesai.
