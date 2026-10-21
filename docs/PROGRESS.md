# PROGRESS — VokaLink

> Papan status hidup. Perbarui setiap malam. Rencana ada di `SPRINT.md`, spesifikasi di `PRD.md`.
> **Terakhir diperbarui:** 20 Okt 2026 (Hari 0)
> **Hari sprint saat ini:** 0 dari 10 · **Deadline:** 30 Okt 2026 · **Code freeze:** 28 Okt

Legenda: `[ ]` belum · `[~]` sedang dikerjakan · `[x]` selesai · `[!]` terblokir

## 1. Ringkasan

| Metrik | Nilai |
|---|---|
| FR selesai | 2 / 12 |
| FR Must Have selesai | 2 / 11 |
| TC lulus | 2 / 10 |
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
| FR-003 | Onboarding DUDI + bind device | A / C | [ ] | [ ] | [ ] | [ ] | |
| FR-004 | Smart Placement | A | [ ] | [ ] | [ ] | [ ] | |
| FR-005 | Logger zero-typing + Tombol Jujur | B | [ ] | [ ] | [ ] | [ ] | |
| FR-006 | Kompres WebP, blur, offline sync | B | [ ] | [ ] | [ ] | [ ] | |
| FR-007 | Verifikasi zero-login (QR / WA) | C | [ ] | [ ] | [ ] | [ ] | |
| FR-008 | Heatmap & drift alert | C | [ ] | [ ] | [ ] | [ ] | |
| FR-009 | Intervensi WA & rotasi mitra | C | [ ] | [ ] | [ ] | [ ] | |
| FR-010 | Endorsement & quality index (Should) | C | [ ] | [ ] | [ ] | [ ] | Kandidat pertama cut-line |
| FR-011 | e-Rapor exporter | A | [ ] | [ ] | [ ] | [ ] | |
| FR-012 | CV ATS & paspor publik | B / C | [ ] | [ ] | [ ] | [ ] | |

## 4. Modul Bersama

| Modul | Pemilik | Status |
|---|---|---|
| Skema Prisma + migrasi + SQL guard (RLS, trigger immutability) | A | [x] (20 tabel RLS, triggers & check constraints aktif) |
| `curriculum-seed.json` (6 jurusan, 792 JP, min. 12 Job Card) | A | [x] (6 jurusan, 25 elemen CP, 89 Job Cards) |
| Seeder v1 (sekolah demo, mentor terikat, penempatan) | A | [x] (sekolah demo, guru, 5 siswa, 6 DUDI & penempatan aktif) |
| Seeder v2 (riwayat 8 minggu, drift, endorsement, paspor) | A | [ ] |
| Auth middleware (JWT Supabase, role, tenant guard) | C | [x] |
| `packages/core` (haversine, skor, drift, rapor, canonical JSON, HMAC) | C | [x] |
| `packages/shared` (skema Zod, konstanta) | semua | [x] |
| PWA shell (Serwist, Dexie, banner konektivitas) | B | [ ] |
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
| - | Belum ada | - | - |

Keputusan yang sudah final tercatat di `DESIGN.md` bagian 1 (ADR-01 sampai ADR-12) dan bagian 12.

## 8. Log Harian

### Hari 0 — Sel 20 Okt 2026
- Dokumen PRD, DESIGN (direvisi mengikuti PRD, Express, Prisma, Supabase), SPRINT, PROGRESS, BUGS, dan AGENTS dibuat.
- Inisialisasi repo, pnpm workspaces, Supabase, Prisma schema, Express Coolify setup, dan seeder v1 selesai.

### Hari 1 — Rab 21 Okt 2026
- Selesai:
  - FR-001 (Multi-tenant School Onboarding, master department seeding, sandbox loader).
  - FR-002 (Pre-loaded Multi-Sector Curriculum Engine, router kurikulum, update bobot JP dengan validasi sum === targetTotalJp 792 JP, lock matriks, katalog Job Cards praktis & kategori sistem non-kompetensi).
  - Halaman web `/school/curriculum` responsif mobile-first dengan slider proporsional, modal tambah Job Card, 5 kondisi UI (skeleton, empty, offline banner, error recovery, unauthenticated).
  - 12 unit & integration test untuk kurikulum (`apps/api/test/curriculum.test.ts`), TC-001 & TC-002 lulus 100%.
- Sedang dikerjakan: Persiapan FR-003 (Assisted DUDI Onboarding, Pemetaan Kapasitas & Device-Bound PIN).
- Blocker: Tidak ada.
- Rencana lanjut: Memulai implementasi FR-003.

