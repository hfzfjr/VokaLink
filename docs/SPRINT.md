# SPRINT — VokaLink

> Rencana eksekusi 10 hari untuk UINIC 8.0 Web Development 2026. Pendamping `PRD.md` dan `DESIGN.md`.
> **Deadline lomba: 30 Okt 2026.** Mulai: malam 20 Okt (Hari 0). Code freeze: 28 Okt. Target submit: 29 Okt (30 Okt = buffer).
> Scope: **ikuti PRD penuh (12 FR)**. Pemangkasan hanya lewat cut-line di bawah, bila terpaksa.

## 1. Catatan Realistis

PRD dirancang untuk 28 hari, sprint ini 10 hari. Syarat agar muat:

1. Implementasi dikerjakan dengan agent coding, mengikuti `AGENTS.md`.
2. Kurikulum 6 jurusan dibuat sebagai JSON (`curriculum-seed.json`), bukan kode.
3. Logika inti (haversine, skor, drift, rapor, HMAC) ditulis sebagai fungsi murni di `packages/core` dengan tes, supaya agent bisa dipakai dengan aman.
4. Seeder v1 tersedia di Hari 1 sampai 2 supaya tim tidak saling menunggu.

## 2. Tim & Kepemilikan Fitur

| Pemilik | Fokus | FR | Catatan |
|---|---|---|---|
| **Orang A** (isi nama) | Sekolah & Penempatan | FR-001, 002, 003, 004, 011 | Pemilik skema Prisma dan seed kurikulum |
| **Orang B** (isi nama) | Siswa | FR-005, 006, 012 | Pemilik PWA, Dexie, kompresi foto, CV |
| **Orang C** (isi nama) | Guru & Mentor | FR-007, 008, 009, 010 + halaman publik `/verify/[slug]` | Pemilik kriptografi, verifikasi, drift |

Fondasi bersama (repo, auth, skema awal, deploy) dikerjakan bersama di Hari 0 sampai 1.

## 3. Definition of Done (per fitur)

- [ ] Sesuai alur utama, alternatif alur, dan acceptance criteria di PRD.
- [ ] Aturan bisnis (BR-xxx) terkait terimplementasi di server, bukan hanya di UI.
- [ ] Skema Zod di `packages/shared` dipakai oleh API dan form.
- [ ] Fungsi murni punya unit test (Vitest). Endpoint kritis punya tes integrasi.
- [ ] 5 kondisi UI (loading, empty, offline/syncing, error, unauthorized) ditangani.
- [ ] `pnpm lint`, `typecheck`, `test` hijau. PR direview satu orang lain.
- [ ] `docs/PROGRESS.md` diperbarui. Bug ditemukan dicatat di `docs/BUGS.md`.

## 4. Hari 0 — Selasa 20 Okt (malam ini): Repo & Infrastruktur

| # | Tugas | Selesai bila |
|---|---|---|
| 0.1 | Repo GitHub, branch `main` terlindungi, monorepo pnpm (`apps/web`, `apps/api`, `packages/shared`, `packages/core`) | `pnpm install` jalan |
| 0.2 | TypeScript strict, ESLint, Prettier, Vitest, `.env.example` | `pnpm lint && pnpm typecheck` hijau |
| 0.3 | Project Supabase (region Singapore): catat URL, anon key, service role, URL pooler (6543 dan 5432) | Koneksi Prisma berhasil lewat pooler |
| 0.4 | App Express di Coolify lewat Cloudflare Tunnel dengan `/healthz` dan `/readyz` | `https://api-vokalink.<domain>/healthz` mengembalikan 200 |
| 0.5 | Project Vercel terhubung ke repo (root `apps/web`), env var terisi | Halaman awal Next.js tampil di domain Vercel |
| 0.6 | Env var Coolify dan Vercel sesuai `DESIGN.md` bagian 3 | Deploy API dan web hijau |
| 0.7 | CI GitHub Actions dasar (lint, typecheck, test, `prisma validate`, gitleaks) | PR pertama lolos CI |
| 0.8 | Monitoring uptime ke `/healthz`, dan cron GitHub Actions ping `/readyz` tiap 3 hari | Alert uji coba masuk |

## 5. Rencana Harian

| Hari | Tanggal | Orang A | Orang B | Orang C |
|---|---|---|---|---|
| **1** | Rab 21 Okt | Skema Prisma lengkap (PRD Bab 9 + DESIGN 4.1), migrasi, SQL guard (RLS deny-all, trigger immutability). **Merge sebelum siang.** Mulai `curriculum-seed.json` | Shell Next.js, Tailwind, login Supabase, layout siswa (bottom nav, banner konektivitas) | Middleware Express: `requireAuth` (JWT), `requireRole`, error RFC 7807, pino, rate limit. `packages/core`: canonical JSON, token HMAC, tes |
| **2** | Kam 22 Okt | FR-001 API + UI onboarding, seeder v1 (sekolah demo, 4 jurusan, guru, siswa, 6 DUDI + mentor terikat, penempatan) | Serwist + Dexie (skema `logs`, `photos`, `refData`), cache Job Card offline | Modul `signed_links` (buat, validasi, sekali pakai, cabut), tes kriptografi. Skeleton `/verify/*` |
| **3** | Jum 23 Okt | FR-002 UI kurikulum (slider JP, kunci matriks, impor CSV/JSON), seed 6 jurusan rampung | FR-005 UI logger (kartu, slider JP, kemandirian, Tombol Jujur) | `bind-device` + halaman `/v/[token]/activate` (bareng A untuk FR-003) |
| **4** | Sab 24 Okt | FR-003 UI onboarding DUDI (peta Leaflet, checklist, QR aktivasi), FR-004 inti skor (Haversine) | FR-006 pipeline foto (canvas, blur, WebP, SHA-256) | FR-007 API: `generate-link`, `check-device`, `execute`, segel HMAC, PIN lockout |
| **5** | Min 25 Okt | FR-004 UI peringkat + konfirmasi penempatan, rekomendasi rotasi | FR-006 sinkron dua fase, backoff, idempotensi `clientLogUuid`, banner status | FR-007 UI mentor (`/v/[token]`, keypad PIN, sticky bar), `security_flags` |
| **6** | Sen 26 Okt | FR-011 e-Rapor (nilai, deskripsi, CSV; XLSX bila sempat) | FR-012 editor CV (terkunci), CV A4 Print CSS, XYZ rule-based | FR-008 heatmap + engine drift (cron 00:30 + on-demand), panel alert |
| **7** | Sel 27 Okt | **CUT-LINE.** FR-011 override + peringatan log pending, bantu integrasi | FR-012 paspor (visibilitas foto, QR) | FR-009 intervensi WA + rotasi mitra. Lalu FR-010 + `/verify/[slug]` publik |
| **8** | Rab 28 Okt | **CODE FREEZE.** Seeder v2 (riwayat 8 minggu, drift, endorsement, paspor). Hanya bug fix | E2E TC-003/004/010, perbaikan bug | E2E TC-005/006/007/008/009, perbaikan bug |
| **9** | Kam 29 Okt | Demo Judge Switcher, Lighthouse, cek Supabase tidak pause. **Submit proposal/video bila siap** | Uji di HP asli, uji offline/Airplane Mode | Uji keamanan dasar (token, PIN, tenant guard) |
| **10** | Jum 30 Okt | **Buffer.** Hanya perbaikan kritis dan submit | | |

### Cut-line (bila tertinggal di akhir Hari 7)

Korbankan berurutan, hentikan begitu cukup waktu:

1. FR-010 Endorsement + DUDI Quality Index (Should Have). Nilai akhir memakai 100% komponen teknis (BR-009 sudah mengizinkan).
2. Rotasi mitra FR-009 A1 (tetap kerjakan draf pesan WA).
3. XLSX di FR-011 (cukup CSV).
4. Polesan kuas blur (tetap sediakan blur dasar).
5. Impor kurikulum CSV/JSON FR-002 A1 (seed bawaan tetap ada).

**Tidak boleh dipangkas:** idempotensi sinkron, verifikasi dua faktor (device + PIN), immutability log, tenant guard, segel HMAC. Ini inti penilaian juri.

## 6. Backlog per FR

| FR | Pemilik | Prioritas | Dependensi | Estimasi (hari-orang) | Status |
|---|---|---|---|---|---|
| FR-001 Onboarding multi-sekolah + demo | A | Must | - | 1.5 | Belum |
| FR-002 Kurikulum & Job Card | A | Must | FR-001 | 2.5 | Belum |
| FR-003 Onboarding DUDI + bind device | A (+C untuk bind) | Must | FR-002 | 2.5 | Belum |
| FR-004 Smart Placement | A | Must | FR-002, 003 | 2 | Belum |
| FR-005 Logger zero-typing | B | Must | FR-002, 004, 006 | 1.5 | Belum |
| FR-006 Kompres foto, blur, offline sync | B | Must | FR-005 | 3 | Belum |
| FR-007 Verifikasi zero-login | C | Must | FR-003, 005 | 3.5 | Belum |
| FR-008 Heatmap & drift | C | Must | FR-002, 005, 007 | 2.5 | Belum |
| FR-009 Intervensi WA & rotasi | C | Must | FR-004, 008 | 1.5 | Belum |
| FR-010 Endorsement & quality index | C | Should | FR-007, 008 | 1.5 | Belum |
| FR-011 e-Rapor | A | Must | FR-007, 010 | 2 | Belum |
| FR-012 CV ATS & paspor publik | B (+C untuk `/verify`) | Must | FR-002, 007, 010 | 3 | Belum |

Ketergantungan lintas orang yang paling berisiko: **C menunggu A (FR-003) dan B (FR-005)** untuk FR-007. Solusi: seeder v1 sudah menyediakan mentor terikat dan log contoh sejak Hari 2, sehingga C bisa jalan paralel.

## 7. Checklist Demo (dipetakan ke QA PRD Bab 13)

| TC | Skenario | Pemilik | Status |
|---|---|---|---|
| TC-001 | Muat data demo, 4 jurusan total 792 JP | A | [ ] |
| TC-002 | Total JP 750 ditolak | A | [ ] |
| TC-003 | Foto 5,2 MB menjadi < 60 KB dalam < 1,5 dtk, blur permanen | B | [ ] |
| TC-004 | Offline, tutup browser, sinkron tepat 1 kali | B | [ ] |
| TC-005 | Batch approve 4 hari < 10 dtk | C | [ ] |
| TC-006 | Link dibuka di HP siswa diblokir + flag audit | C | [ ] |
| TC-007 | PIN salah 5x, kunci 15 menit | C | [ ] |
| TC-008 | 40% non-kompetensi memicu alert + draf WA | C | [ ] |
| TC-009 | Rotasi, 380 + 50 = 430 JP, dua DUDI di CV | C | [ ] |
| TC-010 | CV terkunci, QR membuka paspor terverifikasi | B + C | [ ] |

## 8. Ritual Harian

- **Pagi (10 menit):** tiap orang menyebut target hari ini dan blocker.
- **Malam (10 menit):** update `PROGRESS.md`, merge PR, catat bug ke `BUGS.md`.
- Merge kecil dan sering. Jangan menahan PR lebih dari setengah hari.
