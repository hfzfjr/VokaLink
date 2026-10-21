# PROGRESS — VokaLink

> Papan status hidup. Perbarui setiap malam. Rencana ada di `SPRINT.md`, spesifikasi di `PRD.md`.
> **Terakhir diperbarui:** 21 Okt 2026 (Hari 2)
> **Hari sprint saat ini:** 2 dari 10 · **Deadline:** 30 Okt 2026 · **Code freeze:** 28 Okt

Legenda: `[ ]` belum · `[~]` sedang dikerjakan · `[x]` selesai · `[!]` terblokir

## 1. Ringkasan

| Metrik | Nilai |
|---|---|
| FR selesai | 7 / 12 |
| FR Must Have selesai | 7 / 11 |
| TC lulus | 3 / 10 |
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
| FR-007 | Verifikasi zero-login (QR / WA) | C | [ ] | [ ] | [ ] | [ ] | Kriptografi HMAC tuntas di packages/core |
| FR-008 | Heatmap & drift alert | C | [ ] | [ ] | [ ] | [ ] | Algoritma drift tuntas di packages/core |
| FR-009 | Intervensi WA & rotasi mitra | C | [ ] | [ ] | [ ] | [ ] | |
| FR-010 | Endorsement & quality index (Should) | C | [ ] | [ ] | [ ] | [ ] | Kandidat pertama cut-line |
| FR-011 | e-Rapor exporter | A | [x] | [x] | [x] | [x] | Formula BR-009 (0.60×teknis+0.40×sikap), narratif Kurikulum Merdeka, export CSV |
| FR-012 | CV ATS & paspor publik | B / C | [ ] | [ ] | [~] | [ ] | Layout CV A4 Print CSS siap di sisi klien |

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
| TC-005 | [ ] | | |
| TC-006 | [ ] | | |
| TC-007 | [ ] | | |
| TC-008 | [ ] | | |
| TC-009 | [ ] | | |
| TC-010 | [ ] | | |

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
- Sedang dikerjakan:
  - Persiapan FR-012 (CV ATS generator & Paspor Keterampilan ber-QR terhubung ke log VERIFIED).
- Blocker:
  - Tidak ada blocker aktif saat ini.
- Rencana besok (Hari 3):
  - Integrasi QR code dinamis token mentor (`/v/[token]`) dari portal siswa untuk diverifikasi oleh Orang C (FR-007).
  - Frontend Heatmap & Drift Alert dasbor guru (`/teacher/heatmap`) (FR-008).

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
