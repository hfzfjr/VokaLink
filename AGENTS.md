# AGENTS.md — Panduan untuk Agent Coding & Kontributor VokaLink

> Baca file ini sebelum mengubah apa pun. Berlaku untuk semua agent coding (Claude Code, Cursor, dll.) dan manusia.

## 1. Proyek Singkat

VokaLink: platform multi-tenant (SaaS) offline-first PWA untuk PKL SMK. Siswa mencatat kegiatan lewat kartu pekerjaan, mentor industri memverifikasi tanpa akun (QR/WhatsApp + device token + PIN), guru memantau heatmap dan drift, hasilnya e-Rapor, CV ATS, dan paspor kompetensi publik ber-QR.
Untuk lomba UINIC 8.0 Web Development 2026. Deadline 30 Okt 2026. **Biaya infrastruktur wajib Rp0.**

## 2. Sumber Kebenaran (urutan prioritas)

1. `docs/PRD.md` — fitur (FR-001 sampai FR-012), aturan bisnis (BR-001 sampai BR-012), data, acceptance criteria, test case.
2. `docs/DESIGN.md` — cara membangun: arsitektur, skema tambahan, API, algoritma, keputusan ADR.
3. `docs/SPRINT.md` — rencana dan kepemilikan. `docs/PROGRESS.md` — status. `docs/BUGS.md` — bug.
4. Kode.

Jika DESIGN bertentangan dengan PRD pada fitur atau aturan bisnis, **PRD menang**. Jika PRD menyebut stack lama (Route Handlers, Drizzle, Next-PWA), **ikuti DESIGN** (lihat `docs/BUGS.md` bagian 5). Jika ragu atau dokumen ambigu, tanyakan, jangan menebak.

## 3. Stack (final)

| Lapisan | Teknologi |
|---|---|
| Web | Next.js (App Router, TypeScript strict), Tailwind CSS, Serwist (PWA), Dexie (IndexedDB), Leaflet + OSM, Recharts |
| API | Express 5 (TypeScript), Zod, Prisma, pino, helmet, express-rate-limit, node-cron, jose |
| Data | Supabase: PostgreSQL (lewat Supavisor pooler), Auth, Storage (bucket privat `evidence`) |
| Hosting | Web di Vercel, API di Coolify (home server) lewat Cloudflare Tunnel |
| Tes | Vitest, Supertest, Playwright, Lighthouse CI |
| Paket | pnpm workspaces |

Dilarang menambah layanan berbayar, API yang butuh kartu kredit, atau dependensi baru tanpa alasan jelas. Beri tahu di PR bila menambah paket.

## 4. Struktur Repo

```
apps/web         Next.js (rute sesuai PRD 7.1: /school, /teacher, /student, /v/[token], /verify/[passportSlug])
apps/api         Express + Prisma (prisma/{schema.prisma,migrations,seed}, src/modules/*)
packages/shared  Skema Zod, tipe, konstanta (792 JP, 12 JP/hari, 150 KB, dll.)
packages/core    Fungsi murni: haversine, skor penempatan, drift, e-Rapor, canonical JSON, token & HMAC
docs/            PRD, DESIGN, SPRINT, PROGRESS, BUGS
```

Logika bisnis ada di `apps/api` dan `packages/core`, **bukan** di Route Handlers atau komponen Next.js. Konstanta dan angka aturan bisnis hanya didefinisikan sekali di `packages/shared`.

## 5. Perintah

> Tersedia setelah scaffold Hari 0. Pengembangan di Windows: gunakan skrip pnpm lintas platform, hindari perintah khusus bash.

```
pnpm install
pnpm dev                       # web + api
pnpm lint && pnpm typecheck && pnpm test
pnpm --filter api prisma:validate
pnpm --filter api prisma migrate dev     # lokal
pnpm --filter api prisma migrate deploy  # produksi (memakai DIRECT_URL)
pnpm --filter api seed:v1                # seeder demo awal
```

## 6. Aturan Wajib

### Keamanan (tidak boleh dilanggar)
- **Tenant guard:** setiap query data sekolah wajib memfilter `schoolId` lewat Prisma client extension. Siswa hanya melihat datanya, guru hanya siswa binaannya. Satu-satunya pengecualian terfederasi: profil dasar `dudi_partners` (BR-011).
- **Verifikasi mentor (BR-007):** persetujuan sah hanya jika **device token valid DAN PIN benar**. `GET` tidak pernah mengubah state. Persetujuan hanya lewat `POST` dengan nonce. Tautan sekali pakai: set `used_at` dalam transaksi yang sama dengan perubahan status log.
- **PIN:** scrypt + salt per mentor + `PIN_PEPPER`. Salah 5 kali, kunci 15 menit. Jangan pernah menyimpan PIN atau device token mentah.
- **Immutability:** log `VERIFIED` tidak boleh diubah atau dihapus (trigger DB + pemeriksaan di API). Jangan buat jalan pintas untuk melewatinya.
- **Segel:** `signature_hash` = HMAC-SHA256 dengan `SERVER_CRYPTO_SECRET`, memakai fungsi canonical JSON tunggal di `packages/core`. Jangan membuat varian lain.
- **Secret:** `SUPABASE_SERVICE_ROLE_KEY`, `SERVER_CRYPTO_SECRET`, `PIN_PEPPER`, kunci HMAC hanya di server. Jangan commit `.env`. Jangan taruh di variabel `NEXT_PUBLIC_*`.
- **Log:** redaksi `authorization`, `token`, `pin`, `deviceToken`. Jangan pernah mencatat nilainya.
- **Auth:** Bearer JWT Supabase (tanpa cookie). CORS pakai allowlist eksak `APP_ORIGINS`.
- **RLS:** aktif deny-all untuk `anon`/`authenticated` di semua tabel `public`. Akses data lewat Express.

### Data & API
- Kolom DB `snake_case` (via `@map`), JSON API `camelCase`.
- Validasi semua input dengan Zod dari `packages/shared`. Error format RFC 7807 dengan field `code`.
- Prisma runtime lewat pooler transaction (`?pgbouncer=true`). Migrasi lewat `DIRECT_URL`. Perubahan skema selalu lewat migrasi, bukan edit manual di dashboard.
- Sinkron log idempoten berdasarkan `clientLogUuid`. Backdate (BR-003) dihitung terhadap `clientCreatedAt`.
- Server menolak foto > 150 KB, memeriksa magic bytes, dan mencocokkan `X-Content-SHA256`.

### Frontend & PWA
- Mobile-first (360 px). Area sentuh minimal 48 px (mentor 56 px untuk aksi utama).
- Tiap halaman asinkron menangani 5 kondisi: loading (skeleton), empty, offline/syncing, error (dengan tombol pulih), unauthorized.
- Warna status tidak boleh jadi satu-satunya penanda: sertakan angka dan ikon (WCAG AA).
- Data IndexedDB tidak boleh dihapus sebelum server membalas 200/201. Panggil `navigator.storage.persist()`.
- Jangan simpan token sesi sensitif di `localStorage` selain yang memang dirancang (device token mentor).
- Teks UI dalam Bahasa Indonesia, mengikuti redaksi di PRD bila PRD memberi kalimat baku.

### Logika inti
- Haversine, skor penempatan, drift, nilai e-Rapor, kualitas DUDI = **fungsi murni** di `packages/core`, deterministik, dengan unit test. Rumus mengikuti PRD (BR-005, BR-008, BR-009) dan `DESIGN.md` bagian 8.
- Item non-kompetensi tidak boleh masuk klaim keterampilan di CV/paspor (BR-004).
- Angka jam, nama DUDI, dan skill di CV/paspor hanya dari data `VERIFIED` (BR-010).

## 7. Alur Kerja

- Branch: `feat/fr-00x-nama`, `fix/bug-xxx-nama`, `chore/...`. Jangan commit langsung ke `main`.
- Commit: Conventional Commits (`feat(fr-007): ...`, `fix(bug-012): ...`).
- PR kecil (idealnya < 400 baris), satu fitur atau satu perbaikan, direview satu orang lain. CI harus hijau.
- Sebelum PR: `pnpm lint && pnpm typecheck && pnpm test`.
- Perubahan skema Prisma: beri tahu seluruh tim, migrasi dan seeder harus ikut diperbarui.
- Setelah selesai: perbarui `docs/PROGRESS.md`. Bug yang ditemukan dicatat di `docs/BUGS.md`.
- Mulai Hari 8 (28 Okt) **code freeze**: hanya perbaikan bug dan data seed.

## 8. Kepemilikan

| Area | Pemilik |
|---|---|
| FR-001, 002, 003, 004, 011, skema Prisma, seed | Orang A |
| FR-005, 006, 012, PWA, Dexie, kompresi foto | Orang B |
| FR-007, 008, 009, 010, kriptografi, `/verify/[slug]` | Orang C |

Menyentuh area orang lain boleh, tapi beri tahu pemiliknya di PR.

## 9. Larangan

- Jangan memangkas fitur, mengganti stack, atau mengubah aturan bisnis tanpa persetujuan tim. Pemangkasan hanya lewat cut-line di `docs/SPRINT.md`.
- Jangan melemahkan cek keamanan demi lolos tes atau demo (device token, PIN, tenant guard, immutability).
- Jangan membuat data atau hasil tes palsu. Jika tes gagal, laporkan dan catat di `docs/BUGS.md`.
- Jangan mengedit `PRD.md` untuk menyesuaikan kode. Jika PRD salah, catat di `docs/BUGS.md` bagian 5 dan minta keputusan.
- Jangan menambah dependensi berbayar atau yang membutuhkan kartu kredit.
- Jangan menjalankan perintah destruktif (`prisma migrate reset`, hapus data, force push) pada database atau branch bersama.

## 10. Definition of Done

Lihat `docs/SPRINT.md` bagian 3. Ringkasnya: sesuai PRD, aturan bisnis di server, Zod bersama, tes hijau, 5 kondisi UI, direview, `PROGRESS.md` terbarui.

## 11. Memulai Tugas (untuk agent)

1. Baca bagian PRD yang relevan (FR dan BR terkait) dan bagian DESIGN yang terkait.
2. Cek `docs/PROGRESS.md` dan `docs/SPRINT.md` untuk dependensi dan pemilik.
3. Tulis tes untuk logika murni dulu bila ada rumus.
4. Implementasi kecil, jalankan lint, typecheck, test.
5. Laporkan: apa yang selesai, apa yang belum, asumsi yang dibuat, bug yang ditemukan.
