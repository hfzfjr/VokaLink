# PROGRESS — VokaLink

> Papan status hidup. Perbarui setiap malam. Rencana ada di `SPRINT.md`, spesifikasi di `PRD.md`.
> **Terakhir diperbarui:** 22 Okt 2026 (Hari 2)
> **Hari sprint saat ini:** 2 dari 10 · **Deadline:** 30 Okt 2026 · **Code freeze:** 28 Okt

Legenda: `[ ]` belum · `[~]` sedang dikerjakan · `[x]` selesai · `[!]` terblokir

## 1. Ringkasan

| Metrik | Nilai |
|---|---|
| FR selesai | 2 / 12 |
| FR Must Have selesai | 2 / 11 |
| TC lulus | 2 / 10 |
| Bug terbuka (Critical / High) | 1 / 0 |
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
| FR-003 | Onboarding DUDI + bind device | A / C | [ ] | [ ] | [ ] | [ ] | |
| FR-004 | Smart Placement | A | [ ] | [ ] | [ ] | [ ] | Rumus inti tuntas di packages/core |
| FR-005 | Logger zero-typing + Tombol Jujur | B | [~] | [ ] | [~] | [ ] | Form zero-typing, Tombol Jujur, & IndexedDB persistence aktif |
| FR-006 | Kompres WebP, blur, offline sync | B | [~] | [ ] | [~] | [ ] | Pipeline Canvas WebP < 60 KB, SHA-256 subtle crypto, dan skema Dexie selesai |
| FR-007 | Verifikasi zero-login (QR / WA) | C | [ ] | [ ] | [ ] | [ ] | Kriptografi HMAC tuntas di packages/core |
| FR-008 | Heatmap & drift alert | C | [ ] | [ ] | [ ] | [ ] | Algoritma drift tuntas di packages/core |
| FR-009 | Intervensi WA & rotasi mitra | C | [ ] | [ ] | [ ] | [ ] | |
| FR-010 | Endorsement & quality index (Should) | C | [ ] | [ ] | [ ] | [ ] | Kandidat pertama cut-line |
| FR-011 | e-Rapor exporter | A | [ ] | [ ] | [ ] | [ ] | Rumus nilai tuntas di packages/core |
| FR-012 | CV ATS & paspor publik | B / C | [ ] | [ ] | [~] | [ ] | Layout CV A4 Print CSS siap di sisi klien |

## 4. Modul Bersama

| Modul | Pemilik | Status |
|---|---|---|
| Skema Prisma + migrasi + SQL guard (RLS, trigger immutability) | A | [~] (skema 20 model tuntas & tervalidasi; menunggu fix BUG-001) |
| `curriculum-seed.json` (6 jurusan, 792 JP, min. 12 Job Card) | A | [x] (6 jurusan, 25 elemen CP, 89 Job Cards) |
| Seeder v1 (sekolah demo, mentor terikat, penempatan) | A | [x] (sekolah demo, guru, 5 siswa, 6 DUDI & penempatan aktif) |
| Seeder v2 (riwayat 8 minggu, drift, endorsement, paspor) | A | [ ] |
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
| TC-003 | [ ] | | |
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
| BUG-001 | Trigger block_verified_log_update memakai mentor_id bukan verified_by_mentor_id | A | Open (P0 Critical) |

Keputusan yang sudah final tercatat di `DESIGN.md` bagian 1 (ADR-01 sampai ADR-12) dan bagian 12.

## 8. Log Harian

### Hari 2 — Kam 22 Okt 2026
- Selesai:
  - Inisialisasi Serwist Service Worker (`apps/web/src/app/sw.ts`) dengan strategi precache shell, `StaleWhileRevalidate` kurikulum/job cards, `CacheFirst` peta OSM, dan `NetworkOnly` untuk antrean mutasi log (Orang B).
  - Pembuatan Web App Manifest (`manifest.ts` dan `public/manifest.json`) dan aset ikon PWA (`/icons/icon.svg`) (Orang B).
  - Skema database Dexie.js (`apps/web/src/lib/pwa/db.ts`) dengan tabel `logs`, `photos`, dan `refData` sesuai DESIGN.md §7.2 (Orang B).
  - Helper persistensi penyimpanan `navigator.storage.persist()` (mitigasi RSK-03) pada `persistence.ts` (Orang B).
  - Client-side Photo Pipeline (`photo.ts`): kompresi Canvas WebP 0.65 proporsional maks 800px (< 60 KB, maks 150 KB), pembuangan EXIF/geotag privasi, dan perhitungan hash SHA-256 via SubtleCrypto (Orang B).
  - Integrasi Dexie ke form pencatatan `/student/log/new` (penyimpanan instan ke IndexedDB lokal saat offline) dan `ConnectivityBanner` reaktif (membaca antrean nyata dan warning jika antrean > 3 log) (Orang B).
  - Sinkronisasi live query IndexedDB pada riwayat `/student/log/history` (Orang B).
  - Branch `feat/fr-006-serwist-dexie-pwa` aktif dan lolos typecheck & test monorepo (Orang B).
- Sedang dikerjakan:
  - FR-006 (Integrasi sinkronisasi batch `/api/v1/logs/sync` dengan backend Express).
- Blocker:
  - BUG-001 (P0 Critical): Menunggu migrasi database baru oleh Orang A.
- Rencana besok (Hari 3):
  - Implementasi sinkronisasi idempoten otomatis saat online (`useSyncManager`): POST batch logs (maks 20) dan upload biner bukti WebP satu per satu ke backend.

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
