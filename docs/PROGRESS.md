# PROGRESS — VokaLink

> Papan status hidup. Perbarui setiap malam. Rencana ada di `SPRINT.md`, spesifikasi di `PRD.md`.
> **Terakhir diperbarui:** 22 Okt 2026 (Hari 2)
> **Hari sprint saat ini:** 2 dari 10 · **Deadline:** 30 Okt 2026 · **Code freeze:** 28 Okt

Legenda: `[ ]` belum · `[~]` sedang dikerjakan · `[x]` selesai · `[!]` terblokir

## 1. Ringkasan

| Metrik | Nilai |
|---|---|
| FR selesai | 0 / 12 |
| FR Must Have selesai | 0 / 11 |
| TC lulus | 0 / 10 |
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
| FR-001 | Onboarding multi-sekolah + demo | A | [ ] | [ ] | [ ] | [ ] | |
| FR-002 | Kurikulum & Job Card (6 jurusan) | A | [~] | [x] | [ ] | [ ] | Seed 6 jurusan 792 JP tuntas di DB |
| FR-003 | Onboarding DUDI + bind device | A / C | [ ] | [ ] | [ ] | [ ] | |
| FR-004 | Smart Placement | A | [ ] | [ ] | [ ] | [ ] | Rumus inti tuntas di packages/core |
| FR-005 | Logger zero-typing + Tombol Jujur | B | [~] | [ ] | [~] | [ ] | Form zero-typing, Tombol Jujur, & IndexedDB persistence aktif di feat/fr-006-serwist-dexie-pwa |
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
| `curriculum-seed.json` (6 jurusan, 792 JP, min. 12 Job Card) | A | [x] |
| Seeder v1 (sekolah demo, mentor terikat, penempatan) | A | [x] |
| Seeder v2 (riwayat 8 minggu, drift, endorsement, paspor) | A | [ ] |
| Auth middleware (JWT Supabase, role, tenant guard) | C | [x] |
| `packages/core` (haversine, skor, drift, rapor, canonical JSON, HMAC) | C | [x] |
| `packages/shared` (skema Zod, konstanta) | semua | [x] |
| PWA shell (Serwist, Dexie, banner konektivitas) | B | [x] (Service Worker Serwist, Web App Manifest, Dexie DB logs/photos/refData, & banner antrean tuntas) |
| Judge Demo Switcher | A | [x] (halaman depan siap dan terhubung ke portal siswa) |

## 5. Status Uji Penerimaan

| TC | Status | Tanggal | Catatan |
|---|---|---|---|
| TC-001 | [ ] | | |
| TC-002 | [ ] | | |
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
  - Inisialisasi PWA student shell responsif: optimal di mobile (360px) hingga tablet/desktop (max-w-6xl) (Orang B).
  - Desktop Navigation Bar terintegrasi pada StudentHeader (`hidden md:flex`) dan Bottom Navigation khusus mobile (`md:hidden`) dengan touch target >= 48px (Orang B).
  - Connectivity Banner 3-state (Offline, Syncing, Synced) dengan useOnlineStatus SSR-safe hook (Orang B).
  - 4 Halaman antarmuka siswa sepenuhnya responsif:
    - `/student/home`: Grid 12-kolom (Hero identitas siswa, progress bar 792 JP, 3 kartu aksi, & grid 2-kolom log terakhir).
    - `/student/log/new`: Grid 2-kolom desktop (Kiri: pemilih tanggal & katalog Job Cards mitra; Kanan: Tombol Jujur, slider JP 1-12, autonomy picker, & catatan singkat).
    - `/student/log/history`: Grid statistik 4 metrik, bilah pencarian & filter status, grid 3-kolom kartu logbook, serta modal interaktif Minta Verifikasi QR (BR-007).
    - `/student/career-cv`: Layout 12-kolom desktop (Kiri: pratinjau lembar kertas A4 ATS single-column; Kanan: checklist kepatuhan ATS 100%, editor bio profesional, info paspor publik).
  - Resolusi dependensi monorepo dan dev server Next.js aktif di port 3000 (Orang B).
  - Branch `feat/fr-005-student-shell` di-push ke GitHub remote.
  - Dataset kurikulum 6 jurusan tervalidasi 792 JP dan seeder v1 siap (Orang A).
- Sedang dikerjakan:
  - FR-005 (Logger zero-typing & Tombol Jujur) & integrasi offline storage.
- Blocker:
  - BUG-001 (P0 Critical): Trigger SQL immutability block_verified_log_update salah mereferensikan kolom mentor_id (menunggu migrasi baru oleh Orang A).
- Rencana besok (Hari 2):
  - Setup Serwist PWA (sw.ts, manifest.json) dan Dexie.js (db.ts) untuk tabel logs, photos, dan refData.
  - Hubungkan form logbook ke penyimpanan lokal IndexedDB.

### Hari 0 — Sel 20 Okt 2026
- Dokumen PRD, DESIGN (direvisi mengikuti PRD, Express, Prisma, Supabase), SPRINT, PROGRESS, BUGS, dan AGENTS dibuat.
- Target malam ini: inisialisasi repo dan infrastruktur (bagian 2).

<!-- Format entri berikutnya:
### Hari N — <hari> <tanggal>
- Selesai: ...
- Sedang dikerjakan: ...
- Blocker: ...
- Rencana besok: ...
-->
