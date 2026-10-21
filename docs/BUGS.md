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
| BUG-001 | P0 Critical | Open | Database / BR-007 | Trigger immutability block_verified_log_update memakai nama kolom salah mentor_id | Orang A |

### BUG-001 — Trigger block_verified_log_update memakai nama kolom salah mentor_id
- **Level:** P0 Critical
- **Status:** Open
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
- **Perbaikan (commit/PR):** - (Memerlukan migration baru oleh Orang A untuk merevisi function trigger).

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
