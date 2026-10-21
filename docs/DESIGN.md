# DESIGN — VokaLink

> Dokumen desain teknis, pendamping `PRD.md`. UINIC 8.0 Web Development Competition 2026.
> **Hierarki kebenaran:** `PRD.md` (fitur, data, aturan bisnis) > `DESIGN.md` (cara membangun) > kode.
> Jika DESIGN bertentangan dengan PRD pada fitur/aturan bisnis, PRD menang dan DESIGN harus diperbaiki.
> Revisi ini menggantikan DESIGN lama (arsitektur Express + PostgreSQL mandiri) dan disesuaikan dengan PRD v1.0 (12 FR, 5 aktor).
> **Bab 13 (Design System & UI) wajib dibaca sebelum mengubah apa pun di `apps/web`.** Token visual hanya didefinisikan sekali di `apps/web/tailwind.config.ts`. Rencana refactor UI bertahap ada di `docs/UI-REFACTOR.md`.

## Daftar Isi
1. Prinsip & Keputusan Arsitektur
2. Arsitektur Sistem
3. Deployment & Environment
4. Model Data (Prisma + Supabase PostgreSQL)
5. Autentikasi & Otorisasi
6. Verifikasi Zero-Login & Kriptografi
7. Offline Sync & Pipeline Foto
8. Algoritma Inti
9. Spesifikasi API
10. Struktur Repo, CI/CD, Pengujian
11. Ketahanan & Observabilitas
12. Keputusan yang Sudah Final & Sisa Terbuka
13. Design System & UI

---

## 1. Prinsip & Keputusan Arsitektur

| # | Prinsip | Implikasi |
|---|---|---|
| P1 | Offline-first | Klien mencatat dulu ke IndexedDB; server menerima sinkron idempoten via `client_log_uuid` |
| P2 | Server authoritative | Status log, alert, nilai, dan keabsahan paspor hanya ditentukan server |
| P3 | Immutable setelah VERIFIED | Trigger DB memblokir UPDATE pada log terverifikasi; segel HMAC dapat diaudit |
| P4 | Zero-login bukan zero-security | Device token + PIN + token bertanda tangan sekali pakai + rate limit + audit flag |
| P5 | Kompresi di tepi | Foto dikecilkan di browser (WebP < 60 KB) sebelum menyentuh jaringan |
| P6 | Deterministik & dapat dijelaskan | Skor penempatan, drift, dan nilai berupa rumus transparan (fungsi murni di `packages/core`) |
| P7 | Rp0 | Vercel Hobby, Supabase Free, Coolify di home server, Cloudflare Tunnel, OSM, `wa.me` |

### Keputusan arsitektur (ADR ringkas, sudah final)

| ADR | Keputusan | Alasan / Konsekuensi |
|---|---|---|
| ADR-01 | Frontend **Next.js (App Router, TS) di Vercel**; backend **Express 5 (TS) di Coolify**; DB **Supabase PostgreSQL** | Sesuai keputusan tim. Logika bisnis ada di Express, bukan di Route Handlers Next.js |
| ADR-02 | ORM **Prisma** (bukan Drizzle). Runtime lewat Supavisor *transaction pooler*, migrasi lewat *session pooler* | Direct connection Supabase hanya IPv6, home server umumnya IPv4. Gunakan pooler |
| ADR-03 | Auth **Supabase Auth**; Express memverifikasi JWT (`Authorization: Bearer`) | Tanpa cookie, sehingga tidak ada masalah SameSite lintas situs Vercel ke home server |
| ADR-04 | Isolasi tenant di **lapisan aplikasi** (Prisma client extension menyuntik `schoolId`). RLS diaktifkan **deny-all** untuk `anon`/`authenticated` | Prisma terhubung sebagai role `postgres` (melewati RLS). RLS deny-all mencegah akses lewat PostgREST/anon key |
| ADR-05 | Foto di **Supabase Storage** (bucket privat `evidence`) lewat service role dari Express | 1 GB gratis. Akses tampil lewat signed URL berumur pendek |
| ADR-06 | Segel verifikasi **HMAC-SHA256** (server secret + hash device token). Tidak memakai Ed25519 | Cukup untuk PRD; verifikasi publik dihitung ulang server. Ed25519 hanya jika waktu longgar |
| ADR-07 | Haversine, Drift, Heatmap, e-Rapor dihitung di aplikasi (TS), bukan PostGIS/stored procedure | Mudah diuji (Vitest), tanpa ekstensi tambahan |
| ADR-08 | PWA memakai **Serwist** (`@serwist/next`, penerus next-pwa berbasis Workbox) + **Dexie** | next-pwa tidak lagi dipelihara |
| ADR-09 | PDF CV memakai **Print CSS A4** di browser; XLSX/CSV dibuat di klien | Sesuai TBD-02 PRD (teks PDF murni terbaca ATS, 0 KB bundel) |
| ADR-10 | Foto bukti wajib untuk level Mandiri dan Terbimbing; opsional untuk Observasi dan izin/sakit | Sesuai default TBD-03 PRD |
| ADR-11 | JSON API memakai **camelCase**; kolom DB memakai **snake_case** via `@map` Prisma | Padanan nama PRD: `client_log_uuid` jadi `clientLogUuid` di API |
| ADR-12 | Sinkron log **dua fase**: metadata `POST /logs/sync`, lalu foto `PUT /logs/:uuid/evidence` | Permintaan kecil, mudah dilanjutkan saat sinyal putus |
| ADR-13 | Satu design system (Bab 13): token warna dan font hanya di `tailwind.config.ts` (Tailwind v3), komponen bersama di `components/ui` | Konsistensi lintas halaman dan agent. Warna mentah Tailwind dan gaya ad-hoc per halaman dilarang |

---

## 2. Arsitektur Sistem

```mermaid
flowchart LR
    subgraph Browser["Perangkat Pengguna"]
        pwa["Next.js PWA<br/>Serwist + Dexie (IndexedDB)<br/>Canvas WebP + Blur"]
        mentor["Browser Mentor<br/>localStorage device_token"]
    end
    subgraph Vercel["Vercel Hobby"]
        web["Next.js (SSR/ISR)<br/>/verify/[slug] publik"]
    end
    subgraph Home["Home Server Debian - Coolify"]
        cfd["cloudflared (Tunnel)"]
        api["Express 5 API (TS)<br/>Prisma, node-cron"]
    end
    subgraph Supa["Supabase Free"]
        auth["Auth (JWT)"]
        pg[("PostgreSQL via Supavisor")]
        store[("Storage bucket evidence")]
    end
    osm["OpenStreetMap tiles"]
    wa["wa.me deep link"]

    pwa --> web
    pwa -->|"Bearer JWT"| cfd
    mentor -->|"signed link + device token + PIN"| cfd
    web -->|"SSR fetch publik"| cfd
    cfd --> api
    pwa -->|"login (supabase-js)"| auth
    api -->|"verifikasi JWT, Admin API"| auth
    api --> pg
    api --> store
    pwa -.-> osm
    pwa -.->|"dibuka dari perangkat siswa/guru"| wa
```

Alur umum: login dilakukan frontend langsung ke Supabase Auth. Frontend lalu memanggil Express dengan Bearer JWT. Mentor dan HRD tidak punya akun: mentor memakai tautan bertanda tangan, HRD membuka halaman publik read-only.

---

## 3. Deployment & Environment

| Lapisan | Platform | Domain | Catatan |
|---|---|---|---|
| Web | Vercel Hobby | `vokalink.<domain-tim>` | Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| API | Coolify (Docker, Nixpacks/Dockerfile) | `api-vokalink.<domain-tim>` | Hanya via Cloudflare Tunnel, tanpa port forwarding |
| DB/Auth/Storage | Supabase Free | - | Region terdekat (Singapore). Pause setelah 7 hari tidak aktif |

**Env API (Coolify secrets):**
```env
NODE_ENV=production
PORT=3001
# Prisma: runtime (transaction pooler) dan migrasi (session pooler), keduanya IPv4
DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5
DIRECT_URL=postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=***        # hanya di server
SUPABASE_JWT_SECRET=***              # atau pakai JWKS bila project memakai signing key asimetris
APP_ORIGINS=https://vokalink.<domain>,http://localhost:3000
SERVER_CRYPTO_SECRET=***             # 32+ byte, HMAC segel log & paspor
MAGIC_LINK_HMAC_KEYS=k1:***          # rotasi: kunci pertama menandatangani, semua memverifikasi
PIN_PEPPER=***
STORAGE_BUCKET=evidence
```

**Aturan:**
- CORS: allowlist eksak `APP_ORIGINS` (tanpa wildcard). Tidak memakai cookie, jadi `credentials` tidak diperlukan.
- Cloudflare: *Always HTTPS*, TLS min 1.2, rate limiting dasar. Jalankan 2 replika `cloudflared` bila memungkinkan.
- Anti-pause Supabase (RSK-04): `node-cron` di API menjalankan `SELECT 1` tiap 6 jam, ditambah GitHub Actions ping `/readyz` tiap 3 hari.
- Prisma dengan pooler transaction: wajib `?pgbouncer=true`. Migrasi selalu memakai `DIRECT_URL`.
- Header keamanan: `helmet`, `Cache-Control: no-store` dan `Referrer-Policy: no-referrer` pada semua rute `/verify/*`, `X-Robots-Tag: noindex` pada halaman mentor dan paspor.

---

## 4. Model Data (Prisma + Supabase PostgreSQL)

**Sumber utama kamus data: PRD Bab 9.2.** Skema Prisma (`apps/api/prisma/schema.prisma`) dibuat dari PRD Bab 9, lalu ditambah penyesuaian di bawah. ERD relasi inti mengikuti PRD §9.1.

### 4.1 Tambahan dan penyesuaian terhadap PRD Bab 9

| Entitas | Perubahan | Alasan |
|---|---|---|
| `signed_links` (baru) | `id`, `purpose` (`DEVICE_ACTIVATION` / `LOG_VERIFY` / `ENDORSEMENT`), `token_hash` UNIQUE (SHA-256), `key_id`, `mentor_id`, `placement_id?`, `log_ids uuid[]`, `mode` (`QR` / `WA_BATCH`), `payload_hash`, `expires_at`, `used_at`, `revoked_at`, `created_by`, `created_at` | Menjamin tautan sekali pakai, dapat dicabut, token mentah tidak disimpan |
| `security_flags` (baru) | `id`, `placement_id`, `mentor_id`, `signed_link_id`, `kind` (`UNTRUSTED_DEVICE` / `PIN_LOCKOUT` / `TOKEN_REUSE`), `meta jsonb`, `created_at`, `acknowledged_at` | Implementasi "Security Audit Flag" FR-007 A2 untuk dasbor guru |
| `audit_logs` (baru) | `id bigserial`, `actor_type`, `actor_id`, `action`, `entity`, `entity_id`, `meta jsonb`, `ip_hash`, `created_at` | Jejak audit (verifikasi, rotasi, reset token, ekspor) |
| `dudi_mentors` | `pin_hash` memakai **scrypt + salt per mentor + `PIN_PEPPER`** (bukan SHA-256 polos); `device_token_hash` = SHA-256 dari token acak 256-bit; WA disimpan ternormalisasi `628...` | PIN 4 digit mudah di-brute-force bila hash cepat |
| `daily_logs` | + `client_created_at`, `server_received_at`, `clock_skew_flag`, `attendance_type` (`PRESENT`/`SICK`/`PERMIT`), `evidence_sha256`; `UNIQUE(placement_id, log_date)` | Idempotensi, validasi backdate, izin/sakit |
| `daily_log_items` | `duration_jp` integer 1 sampai 10; `non_competency_category` enum (`ADMIN_UMUM`, `KEBERSIHAN_GUDANG`, `KURIR`, `JAGA_TOKO`) | Sesuai FR-005 |
| `placements` | + `coverage_score`, `distance_km`, `requires_midterm_rotation boolean`, `rotated_from_id` | BR-005, BR-006, FR-009 |
| `school_departments` | + `master_department_id`, `is_locked`; template dari `curriculum-seed.json` | Penyalinan template per tenant |
| `skill_passports` | + `visibility_json`, `revoked_at`; slug acak 128-bit (base64url) | Paspor publik dan kontrol privasi |
| `dudi_partners` | + `created_by_school_id`; `quality_index_score` hanya cache | Direktori terfederasi lintas sekolah |
| Job Card non-kompetensi | Tiap `school_department` otomatis punya 1 kartu `is_non_competency = true` dengan nama "Bantuan Operasional Umum (Non-Jurusan)" | BR-004 |

### 4.2 Guard di database (migrasi SQL mentah, di luar `schema.prisma`)

```sql
-- 1) RLS deny-all pada semua tabel public (akses hanya lewat Express/service role)
ALTER TABLE public.<tabel> ENABLE ROW LEVEL SECURITY;   -- tanpa policy = anon/authenticated ditolak

-- 2) Immutability log terverifikasi (P3)
CREATE OR REPLACE FUNCTION block_verified_log_update() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'VERIFIED' AND (
       NEW.log_date IS DISTINCT FROM OLD.log_date OR
       NEW.signature_hash IS DISTINCT FROM OLD.signature_hash OR
       NEW.status IS DISTINCT FROM OLD.status ) THEN
    RAISE EXCEPTION 'verified log is immutable';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_daily_logs_immutable BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION block_verified_log_update();
-- Trigger serupa pada daily_log_items: tolak UPDATE/DELETE bila log induk VERIFIED.
-- Tolak DELETE daily_logs berstatus VERIFIED.

-- 3) CHECK
ALTER TABLE daily_logs ADD CONSTRAINT chk_evidence_size CHECK (evidence_size_bytes IS NULL OR evidence_size_bytes <= 153600);
ALTER TABLE daily_log_items ADD CONSTRAINT chk_jp CHECK (duration_jp BETWEEN 1 AND 10);

-- 4) Alert unik selama belum selesai
CREATE UNIQUE INDEX ux_alert_open ON drift_alerts (placement_id, alert_type) WHERE status <> 'RESOLVED';
```

### 4.3 Indeks minimum
`daily_logs(placement_id, status)`, `daily_logs(placement_id, log_date DESC)`, `daily_log_items(job_card_id)`, `drift_alerts(placement_id, status)`, `signed_links(expires_at) WHERE used_at IS NULL`, `dudi_partners(city, sector_category)`, `user_profiles(school_id, role)`, `placements(student_id)`, `placements(teacher_id)`.

### 4.4 Seed
- `apps/api/prisma/seed/curriculum-seed.json`: 6 jurusan (AKL, RPL/PPLG, DKV, Kuliner, Farmasi, TKR), minimal 4 elemen CP dengan total tepat 792 JP dan minimal 12 Job Card per jurusan, lengkap `skkni_unit_code`, `tools_and_software`, `action_verb_template`.
- **Seeder v1 (Hari 1 sampai 2, membuka blokir tim):** sekolah demo, 4 jurusan aktif, guru, siswa, 6 DUDI + mentor yang sudah terikat perangkat, penempatan.
- **Seeder v2 (Hari 8):** riwayat logbook 8 minggu, log terverifikasi, kasus drift buatan, endorsement, paspor.

---

## 5. Autentikasi & Otorisasi

| Aktor | Mekanisme |
|---|---|
| `SCHOOL_ADMIN`, `TEACHER`, `STUDENT` | Supabase Auth (email + password). Frontend login via `supabase-js`, kirim `Authorization: Bearer <access_token>` ke Express |
| `STUDENT` | Login NISN + kode akses dari guru. Dipetakan ke email sintetis `<nisn>@siswa.vokalink.id`; kode akses = password awal. Akun dibuat Express lewat Supabase Admin API |
| `INDUSTRY_MENTOR` | Tanpa akun: signed link + `device_token` + PIN (Bab 6) |
| `PUBLIC_VERIFIER` | Tanpa akun: endpoint publik read-only, dibatasi rate limit |

- Middleware `requireAuth`: verifikasi JWT (`jose`), lalu muat `user_profiles` (role dan `school_id`) dari DB sebagai sumber otoritatif. Cache memori 60 detik.
- Middleware `requireRole(...roles)` pada tiap rute sesuai matriks hak akses PRD §3.2.
- **Tenant guard:** semua query lewat Prisma client extension yang menyuntik `schoolId` dari sesi. Siswa hanya dapat mengakses data miliknya sendiri. Guru hanya siswa binaannya. Pengecualian terfederasi: `dudi_partners` (profil dasar) sesuai BR-011.
- Provisioning akun (admin): `POST /users` dan `POST /users/import` memakai Supabase Admin API.
- Student tanpa email nyata: tombol "reset kode akses" oleh guru (rotasi password lewat Admin API).

---

## 6. Verifikasi Zero-Login & Kriptografi

### 6.1 Tiga jenis tautan bertanda tangan (`signed_links.purpose`)

| Purpose | Dibuat oleh | TTL | Dipakai untuk |
|---|---|---|---|
| `DEVICE_ACTIVATION` | Guru/Admin/Siswa fasilitator (FR-003) | 72 jam | `/v/[token]/activate`: ikat perangkat + buat PIN |
| `LOG_VERIFY` mode `QR` | Siswa | **5 menit** | Verifikasi tatap muka |
| `LOG_VERIFY` mode `WA_BATCH` | Siswa | **7 hari** | Verifikasi asinkron/rapelan |
| `ENDORSEMENT` | Sistem/guru (akhir PKL, FR-010) | 14 hari | `/v/[token]/endorse` |

**Format token:**
```
token   = "v1." + b64url(payload) + "." + b64url(mac)
payload = { rid: <signed_link.id>, mid: <mentor id>, p: <purpose>, iat, exp, n: <96-bit acak> }
mac     = HMAC-SHA256(key[kid], "vokalink.link.v1|" + b64url(payload))
```
Validasi (waktu-konstan): parse, cek versi, hitung ulang MAC (`timingSafeEqual`), cek `exp`, cari `SHA-256(token)` di `signed_links`, cek `used_at IS NULL AND revoked_at IS NULL`. Token mentah hanya muncul sekali di respons pembuatan. DB hanya menyimpan hash.

### 6.2 Alur verifikasi (BR-007: dua faktor wajib)

```mermaid
sequenceDiagram
    autonumber
    actor S as Siswa (PWA)
    participant API as Express API
    actor M as Mentor (browser HP)
    actor T as Guru

    S->>API: POST /verify/generate-link {placementId, logIds, mode}
    API-->>S: {url /v/<token>, waLink wa.me, expiresAt}
    S->>M: Tampilkan QR atau kirim WA dari perangkat siswa
    M->>API: GET /verify/<token> (read-only, aman dari prefetch WA)
    API-->>M: Ringkasan log + foto (signed URL) + nonce
    M->>M: Baca vokalink_mentor_device_token (localStorage + IndexedDB)
    M->>API: POST /verify/<token>/check-device {deviceToken|null}
    alt token perangkat tidak ada / tidak cocok
        API-->>M: 403 Perangkat Tidak Dikenali (tombol setuju diblokir)
        API->>T: security_flags UNTRUSTED_DEVICE
    else cocok
        M->>API: POST /verify/<token>/execute {nonce, deviceToken, pin, decision, items?, note?}
        API->>API: cek lock PIN, hash PIN, hash device token, cek used_at
        alt PIN salah
            API-->>M: 401 pin_invalid + sisa percobaan (5x lalu kunci 15 menit)
        else valid
            API->>API: TRANSAKSI: used_at, status log, signature_hash
            API-->>M: 200 tersegel
            API->>API: recompute drift untuk placement ini
        end
    end
```

**Aturan:**
- `GET` tidak pernah mengubah state. Persetujuan hanya lewat `POST` dengan `nonce` (anti prefetch/replay).
- Salah PIN 5 kali berturut-turut: `mentors.locked_until = now + 15 menit`, buat `security_flags PIN_LOCKOUT`. Hitung `failed_pin_attempts` per mentor, reset saat sukses.
- Tautan sekali pakai: `used_at` diisi dalam transaksi yang sama dengan perubahan status log (`UPDATE ... WHERE used_at IS NULL` dan cek `rowCount`).
- Keputusan: `APPROVE_ALL`, atau `PARTIAL` per log. `REJECT`/koreksi mengubah status menjadi `REVISION_REQUIRED` dengan alasan baku (`not_supervised`, `duration_mismatch`, `wrong_photo`, `other`) dan boleh mengoreksi jam.
- Reset perangkat (A2 FR-003): guru memanggil `POST /mentors/:id/reset-device`. Hash token lama dikosongkan, `DEVICE_ACTIVATION` baru dibuat.

### 6.3 Segel kriptografi

```
signature_hash (per log)  = HMAC-SHA256(SERVER_CRYPTO_SECRET,
    canonical{ logId, studentId, placementId, logDate,
               items: [ {jobCardId, durationJp, autonomyLevel} urut jobCardId ],
               evidenceSha256, verifiedAt, mentorId, deviceTokenHash })

master_signature_hash (paspor) = HMAC-SHA256(SERVER_CRYPTO_SECRET,
    canonical{ studentId, totalVerifiedJp, signatureHashes: [urut logId] })
```
`canonical` = JSON dengan kunci terurut dan tanpa spasi (fungsi tunggal di `packages/core`, diuji ketat). Endpoint publik paspor menghitung ulang HMAC tiap log `VERIFIED` dan master hash. Tanda "TERVERIFIKASI RESMI" hanya muncul bila semuanya cocok. Satu karakter berubah di DB menghasilkan "Tanda Tangan Digital Tidak Valid".

### 6.4 Pengikatan perangkat (FR-003)
Di `/v/[token]/activate` browser mentor membuat `device_token` = 32 byte acak (`crypto.getRandomValues`), menyimpannya di `localStorage` dan IndexedDB, lalu mengirim `{activationToken, deviceToken, pin}` ke `POST /mentors/bind-device`. Server menyimpan `SHA-256(deviceToken)` dan hash PIN (scrypt). Token mentah tidak pernah disimpan di server.

Risiko yang diterima (MVP): `localStorage` dapat disalin oleh pemilik perangkat. Mitigasi: PIN, rate limit, flag audit, dan prosedur reset oleh guru.

---

## 7. Offline Sync & Pipeline Foto

### 7.1 Pipeline foto di klien (FR-006)
1. Baca file ke `<canvas>`, hormati orientasi EXIF.
2. Opsi Blur: kuas sentuh (pixelate/gaussian) di atas kanvas. Hasil tidak dapat dibatalkan setelah disimpan.
3. Resize sisi terpanjang 800 px, `canvas.toBlob('image/webp', 0.65)`. Bila tidak didukung, fallback `image/jpeg` 0.6.
4. Hitung `SHA-256` (`crypto.subtle.digest`). Re-encode canvas otomatis menghapus EXIF/geotag.
5. Tampilkan lencana "Hemat Kuota: 4.2 MB menjadi 48 KB". Target selesai kurang dari 1,5 detik pada HP kelas menengah-bawah.
6. Server menolak > 150 KB, memeriksa magic bytes (RIFF/WEBP atau JPEG), dan mencocokkan `X-Content-SHA256`.

### 7.2 Skema Dexie (ringkas)
```ts
logs:   "clientLogUuid, placementId, logDate, state, nextAttemptAt"   // state: queued | meta_synced | synced | verified | revision_required | failed
photos: "clientLogUuid"                                                // Blob WebP + sha256
refData:"key"                                                          // job cards, penempatan, matriks CP (cache offline)
```

### 7.3 Aturan sinkron
1. **Pemicu:** event `online`, `visibilitychange`, aplikasi dibuka, tombol "Kirim sekarang". iOS Safari tidak mendukung Background Sync, jadi sinkron hanya saat aplikasi terbuka dan jumlah antrean ditampilkan jelas.
2. **Fase 1:** `POST /logs/sync` (batch maks 20 log). Server `upsert` berdasarkan `clientLogUuid` dan mengembalikan per-item `accepted | duplicate | rejected(code)`.
3. **Fase 2:** `PUT /logs/:clientLogUuid/evidence` (biner) satu per satu. Idempoten berdasarkan SHA-256.
4. **Retry:** exponential backoff + jitter (2 s sampai maks 5 menit). Error permanen (`period_closed`, `validation_failed`) menghentikan retry. Data IndexedDB tidak boleh dihapus sebelum server membalas 200/201.
5. **Backdate (BR-003):** divalidasi terhadap `clientCreatedAt`, bukan waktu terima. `logDate` harus dalam rentang `[clientCreatedAt - 3 hari, clientCreatedAt]` (zona WIB), sehingga log yang dibuat offline tetap sah saat sinkron terlambat. `clientCreatedAt` yang melewati waktu server + 5 menit memberi `clock_skew_flag`.
6. **Validasi server:** total `duration_jp` per hari 1 sampai 12 (BR-002), satu log per tanggal per penempatan, penempatan harus `ACTIVE` dan milik siswa tersebut.
7. **Edit:** log berstatus `PENDING_VERIFICATION` atau `REVISION_REQUIRED` boleh diedit/dihapus siswa selama tidak termasuk dalam `signed_link` aktif. Log `VERIFIED` read-only.
8. **Persistensi:** `navigator.storage.persist()` saat init PWA (RSK-03). Peringatan mencolok bila > 3 log belum tersinkron.
9. **Pull status:** setelah sinkron, `GET /logs/me?since=` memperbarui status VERIFIED/REVISION_REQUIRED.

Banner UI (PRD §8.2): kuning offline, biru menyinkronkan, hijau berhasil.

### 7.4 Service Worker (Serwist)
Precache shell, JS/CSS, ikon. `StaleWhileRevalidate` untuk job cards dan matriks CP. `CacheFirst` terbatas untuk tiles OSM. Semua `POST/PUT` `NetworkOnly` (antrean ditangani aplikasi). `NetworkFirst` untuk `/verify/*` publik.

---

## 8. Algoritma Inti

Semua fungsi murni di `packages/core` dan diuji dengan Vitest (input sama menghasilkan output sama).

### 8.1 Smart Placement (FR-004, BR-005, BR-006)
- Elemen CP "didukung DUDI" bila minimal 1 Job Card miliknya ada di `dudi_capabilities`.
- `S_kompetensi = Σ target_jp(CP didukung) / Σ target_jp(semua CP jurusan) × 100`.
- `S_jarak`: Haversine (R = 6371.0088 km). `d ≤ 5` km skor 100, selebihnya `max(0, 100 - (d-5)/20 × 100)`.
- `S_total = 0.70·S_kompetensi + 0.30·S_jarak`. Hanya DUDI dengan kuota aktif tersisa (`max_quota` - penempatan `ACTIVE`).
- `S_kompetensi < 50` memberi `requires_midterm_rotation = true` dan lencana kuning.
- Koordinat siswa kosong: pakai koordinat sekolah, lalu tawarkan pemilih titik di peta.
- Penugasan massal: greedy dengan batas kuota (urut skor tertinggi). Tanpa algoritma Hungarian.

### 8.2 Heatmap (FR-008)
Progres per siswa per elemen CP = `Σ duration_jp` item log `VERIFIED` pada Job Card elemen itu / `target_jp` elemen. Status sel: 0% abu-abu (`NOT_STARTED`), 1 sampai 74% kuning, ≥ 75% hijau, siswa dengan alert terbuka memberi lencana `DRIFT_WARNING` merah. Setiap sel menampilkan angka dan ikon (aksesibilitas, bukan hanya warna). Satu kueri agregat `groupBy` dengan indeks `(placement_id, status)`, target < 800 ms untuk 35 siswa × 6 elemen.

### 8.3 Drift Alert (BR-008)
Dijalankan `node-cron` pukul **00:30 WIB** untuk semua penempatan `ACTIVE`, dan **on-demand** untuk satu penempatan setelah verifikasi atau sinkron besar. Jalur teruji, tanpa kueri liar:

| Alert | Kondisi | Data yang dipakai |
|---|---|---|
| `NON_COMPETENCY_OVERLOAD` | `Σ jp non-kompetensi / Σ jp total > 0.30` dalam 14 hari terakhir dan total ≥ 20 JP | Semua log non-`REVISION_REQUIRED` (tidak menunggu verifikasi) |
| `SKILL_MONOTONY` | Kumulatif ≥ 90 JP, > 80% terpusat pada 1 elemen CP, dan ≥ 2 elemen CP lain 0% | Log `PENDING_VERIFICATION` + `VERIFIED` |
| `APPROVAL_DORMANCY` | ≥ 5 log `PENDING_VERIFICATION` berumur > 7 hari kalender | `log_date` |

- Penempatan dengan kurang dari 5 hari kerja berlabel "Masa Orientasi Awal" dan tidak memicu `SKILL_MONOTONY`.
- Upsert idempoten (indeks unik parsial). Alert otomatis `RESOLVED` bila kondisi tidak lagi terpenuhi.
- Tingkat keparahan (pengurutan panel prioritas): `NON_COMPETENCY_OVERLOAD` > `SKILL_MONOTONY` > `APPROVAL_DORMANCY`, dan di dalam jenis yang sama diurutkan menurut rasio/jumlah.

### 8.4 Intervensi WhatsApp (FR-009)
Template teks diisi dari `metric_snapshot_json` alert: nama siswa, apresiasi, JP tuntas per kompetensi, elemen CP yang masih 0%, permintaan 2 minggu, dan tautan Batch Magic Link bila ada log tertunggak. Nomor dinormalisasi `08...` ke `628...`. Server menyimpan `intervention_logs` lalu mengembalikan `https://wa.me/<no>?text=<encoded>`. Guru dapat menyunting teks sebelum kirim.

**Rotasi:** transaksi tunggal. Penempatan lama menjadi `ROTATED_OUT`, penempatan baru `rotation_sequence = 2` dengan `rotated_from_id`. Log terverifikasi lama tetap dihitung (heatmap, e-Rapor, CV menampilkan kedua DUDI).

### 8.5 e-Rapor (FR-011, BR-009)
- `N_elemen = min(100, 0.6 × JP_verified/JP_target × 100 + 0.4 × Ā)`, dengan Ā rata-rata skor kemandirian item terverifikasi (Observasi 75, Terbimbing 88, Mandiri 100).
- Nilai akhir PKL = 0.8 × rata-rata `N_elemen` terbobot `target_jp` + 0.2 × `attitude_score` mentor. **Bila endorsement belum ada, nilai akhir = 100% komponen teknis** dan diberi tanda di UI.
- Deskripsi capaian: template kalimat baku. Capaian tertinggi menyebut Job Card dengan JP mandiri terbanyak + nama DUDI. "Perlu ditingkatkan" menyebut elemen dengan persentase terendah.
- API mengembalikan JSON terstruktur. Klien membuat CSV/XLSX (SheetJS dari tarball resmi `cdn.sheetjs.com`, karena versi npm `xlsx` sudah usang). Teacher override nilai disimpan beserta catatan berita acara.
- Peringatan bila ada siswa kelas itu dengan log `PENDING_VERIFICATION`.

### 8.6 DUDI Quality Index (FR-010)
`0.50 × RasioJamRelevan + 0.30 × KecepatanValidasi + 0.20 × CakupanRealisasiCP` (skala 0 sampai 100). Definisi sub-metrik (PRD tidak merinci, ditetapkan di sini):
- *RasioJamRelevan* = JP kompetensi / JP total semua siswa di DUDI itu.
- *KecepatanValidasi* = `1 - min(1, rata-rata hari dari log_date ke verified_at / 7)`.
- *CakupanRealisasiCP* = rata-rata (elemen CP didukung DUDI yang mencapai ≥ 75% / elemen CP didukung).
Kategori: ≥ 80 Mitra Unggulan, 50 sampai 79 Perlu Evaluasi, < 50 Zona Merah. Dihitung on-demand per sekolah (hanya siswa sekolah tersebut), hasil di-cache.

### 8.7 CV ATS & Skill Passport (FR-012, BR-010)
- Rule-based: kelompokkan item `VERIFIED` per Job Card, isi `action_verb_template` (rumus XYZ) dengan jumlah jam dan jumlah penugasan. Item non-kompetensi **tidak** masuk klaim keterampilan (BR-004).
- Bagian terkunci (jam, DUDI, skill, endorsement) hanya dari DB. Siswa hanya mengedit ringkasan, kontak, ekstrakurikuler, dan visibilitas foto.
- Foto publik hanya yang `is_evidence_public = true`. NISN lengkap, alamat, dan telepon tidak tampil kecuali siswa mengizinkan.
- PDF: halaman `/student/career-cv` dengan Print CSS A4 satu kolom. QR (`qrcode`) mengarah ke `/verify/[slug]`.
- Halaman publik `/verify/[passportSlug]` (SSR, `revalidate: 30`): status, radar CP (SVG/Recharts), tabel jam per SKKNI/CP, nama DUDI dan sekolah, galeri foto publik, hash dan waktu pengesahan. Slug tidak ditemukan atau hash tidak cocok menampilkan peringatan merah sesuai PRD.

---

## 9. Spesifikasi API

**Base:** `/api/v1` · JSON UTF-8 (kecuali PUT foto biner) · Auth `Authorization: Bearer` kecuali ditandai publik/token.
**Error:** RFC 7807 `application/problem+json` dengan `code`. Kode umum: `validation_failed` 422, `unauthorized` 401, `forbidden` 403, `not_found` 404, `token_invalid` 400, `token_expired` 410, `token_used` 409, `device_untrusted` 403, `pin_invalid` 401, `pin_locked` 423, `rate_limited` 429, `payload_too_large` 413, `hash_mismatch` 422, `period_closed` 409, `quota_full` 409.
**Validasi:** semua body/query memakai skema Zod dari `packages/shared`, dipakai ulang oleh form frontend.
**Rate limit:** global `express-rate-limit`. Rute `/verify/*` dan `/public/*` diperketat per IP.

| FR | Metode & Path | Akses | Fungsi |
|---|---|---|---|
| - | `GET /healthz`, `GET /readyz` | publik | Liveness / readiness (cek DB) |
| - | `GET /me` | any | Profil, role, sekolah |
| 001 | `POST /schools/onboard` | publik | Buat tenant + admin (Supabase Admin API) |
| 001 | `POST /schools/demo` | publik | Muat tenant sandbox demo (seeder v1/v2) |
| 001 | `GET/PUT /schools/me/period` | admin | Periode PKL aktif (default 792 JP, rentang 300 sampai 1200) |
| 001 | `POST /users`, `POST /users/import`, `POST /users/:id/reset-access` | admin | Akun guru/siswa |
| 002 | `GET /departments/catalog`, `GET/POST /school/departments` | admin | Katalog master dan jurusan aktif |
| 002 | `GET/PUT /departments/:id/curriculum` | admin (guru baca) | Elemen CP, target JP, Job Card |
| 002 | `POST /departments/:id/curriculum/lock`, `.../import` | admin | Kunci matriks (validasi total JP) / impor CSV/JSON |
| 003 | `GET /dudi`, `POST /dudi/onboard-assist` | guru/admin/siswa | Cari direktori / onboarding dibantu + `activationUrl` |
| 003 | `POST /dudi/:id/capabilities` | guru/admin | Tambah kapabilitas (DUDI sudah ada, A1) |
| 003 | `POST /mentors/bind-device` | token aktivasi | Ikat perangkat + PIN |
| 003 | `POST /mentors/:id/reset-device` | guru/admin | Reset token (A2) |
| 004 | `GET /placements/recommend` | admin/guru | Peringkat DUDI per siswa |
| 004 | `POST /placements`, `GET /placements/me` | admin/guru, siswa | Konfirmasi / lihat penempatan |
| 005 | `GET /student/job-cards` | siswa | Job Card sesuai DUDI (di-cache offline) |
| 005/006 | `POST /logs/sync`, `PUT /logs/:clientLogUuid/evidence`, `GET /logs/me`, `PATCH/DELETE /logs/:id` | siswa | Log harian, foto, status |
| 007 | `POST /verify/generate-link` | siswa | URL `/v/<token>` + `waLink` (mode `QR`/`WA_BATCH`) |
| 007 | `GET /verify/:token` | token | Ringkasan read-only + nonce |
| 007 | `POST /verify/:token/check-device`, `POST /verify/:token/execute` | token + device + PIN | Cek perangkat, setujui/koreksi |
| 007 | `GET /security-flags`, `PATCH /security-flags/:id` | guru/admin | Audit flag |
| 008 | `GET /analytics/heatmap`, `GET /analytics/students/:id`, `GET /alerts`, `PATCH /alerts/:id` | guru/admin | Heatmap dan alert |
| 009 | `POST /interventions`, `POST /placements/:id/rotate` | guru/admin | Draf WA + log, rotasi mitra |
| 010 | `GET /endorsements/:token`, `POST /endorsements/:token` | token + PIN | Endorsement akhir |
| 010 | `GET /dudi/quality-index` | admin | Peringkat mutu mitra |
| 011 | `GET /exports/erapor` | guru/admin | JSON nilai + deskripsi (CSV/XLSX di klien) |
| 011 | `PUT /exports/erapor/override` | guru/admin | Teacher override + catatan |
| 012 | `GET/PUT /passport/me`, `POST /passport/me/photos/visibility` | siswa | Data CV dan visibilitas |
| 012 | `GET /public/passports/:slug` | publik | Data paspor + status segel |

Contoh respons `POST /logs/sync`:
```json
{ "results": [ { "clientLogUuid": "…", "status": "accepted", "evidenceRequired": true } ], "serverTime": "…" }
```
Status per item: `accepted`, `duplicate` (aman), `rejected` (+ `code`). Batas 20 log per permintaan.

---

## 10. Struktur Repo, CI/CD, Pengujian

### 10.1 Monorepo (pnpm workspaces)
```
vokalink/
├─ apps/
│  ├─ web/                      # Next.js App Router, Tailwind, Serwist, Dexie
│  │  └─ src/app/
│  │     ├─ page.tsx                          # landing + judge demo switcher
│  │     ├─ auth/{login,register-school}/
│  │     ├─ school/{dashboard,curriculum,dudi-directory,placements,erapor-export}/
│  │     ├─ teacher/{heatmap,students/[studentId],dudi-onboarding}/
│  │     ├─ student/{home,log/new,log/verify-request,career-cv}/
│  │     ├─ v/[token]/{page,activate,endorse}/   # mentor zero-login
│  │     └─ verify/[passportSlug]/               # publik HRD
│  └─ api/                      # Express 5 + Prisma
│     ├─ prisma/{schema.prisma,migrations/,seed/}
│     └─ src/{modules/{auth,school,curriculum,dudi,placement,log,verify,drift,intervention,endorsement,export,passport},middleware,lib,jobs,server.ts}
├─ packages/
│  ├─ shared/                   # skema Zod, tipe, konstanta (792, 12, 150KB, dll.)
│  └─ core/                     # fungsi murni: haversine, placement score, drift, rapor, canonical JSON, token & HMAC
├─ docs/                        # PRD, DESIGN, SPRINT, PROGRESS, BUGS
├─ .github/workflows/
└─ AGENTS.md
```

### 10.2 CI/CD
- **PR:** `pnpm lint`, `typecheck`, `test`, `prisma validate`, `gitleaks`.
- **Merge `main`:** Vercel auto-deploy web. Coolify auto-deploy API dari GitHub (webhook). Migrasi: `prisma migrate deploy` dijalankan pada start container.
- **Pasca-deploy:** smoke `/readyz`.
- **Cron GitHub Actions:** ping `/readyz` tiap 3 hari (anti-pause Supabase).

### 10.3 Pengujian (dipetakan ke PRD §13)
| Level | Fokus | Alat |
|---|---|---|
| Unit (`packages/core`) | Haversine, skor penempatan, drift (TC-008), nilai e-Rapor, canonical JSON, HMAC/token | Vitest |
| Integrasi (API) | Idempotensi sinkron (TC-004), verifikasi atomik + PIN lockout (TC-005/007), tenant guard, immutability trigger | Vitest + Supertest, DB Supabase cabang uji / lokal |
| E2E | TC-001, 002, 003, 006, 009, 010 | Playwright (emulasi offline) |
| Non-fungsional | Lighthouse ≥ 90, kompresi foto < 60 KB / < 1,5 detik | Lighthouse CI, uji manual di HP |

---

## 11. Ketahanan & Observabilitas

| Skenario | Perilaku |
|---|---|
| Home server/API mati | PWA tetap mencatat, antrean berlanjut otomatis. Banner "data aman di HP" |
| Internet rumah putus | Sama seperti API mati. Opsi cadangan: tethering 4G dan tunnel tetap hidup |
| Supabase pause | Dicegah cron `SELECT 1` + ping GitHub Actions. Sebelum penjurian, cek manual dan "restore" bila perlu |
| Vercel turun | PWA terpasang tetap jalan dari cache |
| Token/secret bocor | Rotasi `key_id`, cabut `signed_links` aktif, audit log |

- **Log:** `pino` JSON dengan `requestId`, redaksi `authorization`, `token`, `pin`, `deviceToken`.
- **Backup:** backup harian Supabase bawaan (Free: terbatas). Tambahkan `pg_dump` terjadwal dari Coolify sebelum hari penjurian dan simpan salinan lokal.
- **Monitoring:** uptime gratis (UptimeRobot/Better Stack) ke `/healthz`, notifikasi ke Telegram/Discord.

---

## 12. Keputusan yang Sudah Final & Sisa Terbuka

**Final:** stack (ADR-01 sampai ADR-12), Prisma, Supabase Auth + Bearer, PDF Print CSS (TBD-02), foto wajib untuk Mandiri/Terbimbing (TBD-03), 6 jurusan di seed dan 4 aktif pada demo, ikuti PRD penuh tanpa pemangkasan scope (cut-line di `SPRINT.md` hanya dipakai bila terpaksa).

**Terbuka (putuskan bila perlu):**
| # | Pertanyaan | Default |
|---|---|---|
| Q1 | Domain produksi | Subdomain dari domain milik tim |
| Q2 | Radius/cek geografis untuk verifikasi tatap muka | Tidak dipakai di MVP (PRD tidak mensyaratkan) |
| Q3 | Penyimpanan backup foto di luar Supabase | Tidak, cukup bucket Supabase |
| Q4 | Notifikasi push | Out-of-scope (Post-MVP) |

---

## 13. Design System & UI

> Berlaku untuk seluruh `apps/web`. Sumber tunggal: token di `apps/web/tailwind.config.ts` dan komponen di `apps/web/src/components/ui/`. Halaman tidak boleh membuat gaya sendiri. Urutan refactor ada di `docs/UI-REFACTOR.md`. Bila bab ini bertentangan dengan PRD pada teks baku atau aturan bisnis, PRD menang.

### 13.1 Arah visual dan prinsip

Tema **"Bengkel & K3"**: tenang, tegas, praktis, seperti papan kerja di bengkel dan rambu keselamatan. Bukan SaaS biru-ungu bergradien.

| # | Prinsip | Artinya |
|---|---|---|
| U1 | Satu layar, satu tugas | Tiap layar punya 1 aksi utama (maksimal 1 tombol oranye terisi). Aksi lain berupa outline atau teks |
| U2 | Ringkas dulu, detail belakangan | Tampilkan hasil dan langkah berikutnya. Alasan, rumus, aturan, dan hash masuk ke "Detail" (disclosure) |
| U3 | Bahasa pengguna | Tanpa kode internal (FR-, BR-, ADR-) dan istilah teknis (IndexedDB, QUEUED, HMAC, SHA-256) di layar utama |
| U4 | Datar dan jelas | Tanpa gradien, blur, bayangan tebal, dan ikon dalam kotak pastel. Struktur dibangun dari garis, jarak, dan tipografi |
| U5 | Warna punya arti | Navy = struktur, oranye = aksi, hijau/kuning/merah/biru = status. Tidak ada warna dekoratif lain |
| U6 | Desktop punya layout sendiri | Bukan layout mobile yang dilebarkan (lihat 13.6) |
| U7 | Bisa dipakai di bawah matahari dan HP murah | Kontras WCAG AA, teks minimal 12 px, area sentuh sesuai AGENTS.md |

### 13.2 Warna (token)

Pakai hanya nama token di bawah. Kelas warna mentah Tailwind (`blue-600`, `slate-100`, `indigo-*`, dst.) dilarang.

| Token | Hex | Pakai untuk |
|---|---|---|
| `paper` | `#FAF8F5` | Latar halaman |
| `white` | `#FFFFFF` | Permukaan kartu, input |
| `line` | `#E7E1D8` | Garis dan border kartu (hangat) |
| `ink-950` | `#081827` | Footer gelap, teks di atas oranye bila perlu kontras tinggi |
| `ink-900` | `#0F2A43` | **Warna utama**: teks utama, judul, tombol sekunder, sidebar |
| `ink-700` | `#1E4468` | Hover elemen navy, ikon |
| `ink-500` | `#4A6A8A` | Teks sekunder, label (kontras 5,3:1 di atas `paper`) |
| `ink-300` | `#A9BBCD` | Placeholder, garis nonaktif |
| `ink-200` | `#D3DEE9` | Border input |
| `ink-100` | `#E8EEF4` | Track progress, skeleton, hover baris |
| `ink-50` | `#F3F6F9` | Latar blok sekunder |
| `safety-500` | `#F97316` | **Aksen aksi**: tombol utama (teks `ink-900`, kontras 5,2:1), penanda fokus |
| `safety-400` | `#FB923C` | Hover tombol utama |
| `safety-700` | `#C2410C` | Teks tautan aksen di atas terang (kontras 5,2:1) |
| `safety-100` / `safety-50` | `#FFEDD5` / `#FFF7ED` | Latar sorotan lembut |
| `ok-700` / `ok-100` | `#15803D` / `#DCFCE7` | Terverifikasi, berhasil, heatmap ≥ 75% |
| `warn-700` / `warn-100` | `#A16207` / `#FEF3C7` | Menunggu, offline, heatmap 1 sampai 74% |
| `danger-700` / `danger-100` | `#B91C1C` / `#FEE2E2` | Perlu diperbaiki, drift, tanda tangan tidak valid |
| `info-700` / `info-100` | `#1D4ED8` / `#DBEAFE` | Menyinkronkan (banner PRD §8.2) |

Aturan pakai:
- Teks `-700` selalu di atas latar `-100` atau putih. Jangan memakai `safety-500` sebagai warna teks kecil di atas putih.
- Status wajib berisi **ikon + teks**, bukan hanya warna (WCAG AA, AGENTS.md).
- Heatmap: 0% `ink-100`, 1 sampai 74% `warn-100`, ≥ 75% `ok-100`, lencana `DRIFT_WARNING` memakai `danger`. Tiap sel tetap menampilkan angka dan ikon.
- Tidak ada mode gelap pada MVP.

`apps/web/tailwind.config.ts` (Tailwind **v3.4**, jangan dimigrasi ke v4):
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF8F5",
        line: "#E7E1D8",
        ink: { 50: "#F3F6F9", 100: "#E8EEF4", 200: "#D3DEE9", 300: "#A9BBCD", 500: "#4A6A8A", 700: "#1E4468", 900: "#0F2A43", 950: "#081827" },
        safety: { 50: "#FFF7ED", 100: "#FFEDD5", 400: "#FB923C", 500: "#F97316", 700: "#C2410C" },
        ok: { 100: "#DCFCE7", 700: "#15803D" },
        warn: { 100: "#FEF3C7", 700: "#A16207" },
        danger: { 100: "#FEE2E2", 700: "#B91C1C" },
        info: { 100: "#DBEAFE", 700: "#1D4ED8" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: { page: "80rem" },
    },
  },
  plugins: [],
};
export default config;
```

### 13.3 Tipografi

- **Plus Jakarta Sans** untuk semua teks (judul dan isi). **JetBrains Mono** hanya untuk NISN, kode SKKNI, dan hash.
- Dimuat dengan `next/font/google` (self-host saat build, ikut ter-precache Serwist sehingga aman offline). Dilarang memuat font lewat `<link>` ke Google Fonts.

`apps/web/src/app/layout.tsx`:
```tsx
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
// <html lang="id" className={`${sans.variable} ${mono.variable}`}>
// <body className="min-h-screen bg-paper font-sans text-ink-900 antialiased selection:bg-safety-500 selection:text-ink-900">
// viewport.themeColor = "#0F2A43"
```
`globals.css` cukup berisi tiga direktif `@tailwind` dan `-webkit-tap-highlight-color: transparent`. Variabel `--background`/`--foreground` dan `font-family: system-ui` dihapus.

| Peran | Kelas | Catatan |
|---|---|---|
| Display (hero landing) | `text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]` | Hanya di landing |
| H1 halaman | `text-2xl lg:text-3xl font-bold tracking-tight` | 1 per halaman |
| H2 seksi | `text-lg lg:text-xl font-semibold` | |
| H3 judul kartu | `text-base font-semibold` | |
| Isi | `text-sm lg:text-base` | 14 px mobile, 16 px desktop. Paragraf `max-w-prose` |
| Label/keterangan | `text-xs font-medium text-ink-500` | **Ukuran terkecil yang diizinkan: 12 px** |
| Angka besar | `text-3xl font-bold tabular-nums` | Semua angka tabel dan statistik `tabular-nums` |
| Kode/NISN/hash | `font-mono text-xs` | |

### 13.4 Bentuk, jarak, ikon, gerak

- **Jarak:** skala 4 px. Antar seksi `space-y-6 lg:space-y-8`. Padding kartu `p-4 lg:p-5`. Wadah halaman: `mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8`.
- **Bentuk:** kartu `rounded-xl border border-line bg-white` tanpa bayangan. Input dan tombol `rounded-lg`. Pill status `rounded-full`. Radius maksimum `rounded-2xl` (hanya modal/sheet). `shadow-sm` hanya untuk popover dan modal.
- **Ikon:** `lucide-react`, `size-5` (20 px), `strokeWidth` 1.75, mewarisi warna teks. Tidak ditaruh dalam kotak berwarna sebagai hiasan kartu.
- **Gerak:** `transition-colors duration-150`. Hormati `motion-reduce`. Tanpa `hover:scale`/`active:scale`.
- **Fokus:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safety-500 focus-visible:ring-offset-2`.

### 13.5 Komponen bersama (`apps/web/src/components/ui/`)

Halaman hanya menyusun komponen ini. Butuh varian baru: tambahkan ke komponen, jangan menyalin kelas ke halaman. Util `cn()` (clsx + tailwind-merge) di `src/lib/cn.ts`.

| Komponen | Spesifikasi |
|---|---|
| `Button` | `primary`: `bg-safety-500 text-ink-900 hover:bg-safety-400 font-semibold` (maks 1 per layar). `secondary`: `bg-ink-900 text-white hover:bg-ink-700`. `outline`: `border border-ink-200 bg-white hover:bg-ink-50`. `ghost`, `link` (`text-safety-700 hover:underline`), `danger` (`bg-danger-700 text-white`). Tinggi `h-12` (< lg), `lg:h-10` untuk antarmuka padat desktop, `h-14` aksi utama mentor. Status loading menampilkan spinner dan teks |
| `Card` | `rounded-xl border border-line bg-white p-4 lg:p-5`. Judul H3 + isi. Tanpa gradien |
| `StatusPill` | Ikon + teks, `rounded-full px-2.5 py-1 text-xs font-semibold`, warna `-700` di atas `-100`. Pemetaan di 13.7 |
| `Field` | Label di atas, `h-12 rounded-lg border-ink-200`, bantuan `text-xs text-ink-500`, error `text-danger-700` dengan ikon |
| `Stat` | Angka `text-3xl font-bold tabular-nums`, label `text-xs text-ink-500`, tanpa kotak ikon. Maksimal 4 per baris |
| `ProgressBar` | Track `ink-100`, isi `ink-900`, tinggi 8 px, `role="progressbar"` lengkap |
| `DataTable` | Tabel di ≥ md, daftar kartu bertumpuk di < md. Header `text-xs font-medium text-ink-500`, hover baris `ink-50` |
| `Banner` | Varian `warn` (offline), `info` (menyinkronkan), `ok` (berhasil). Ikon + 1 kalimat |
| `Disclosure` | "Lihat detail" untuk rumus, aturan, hash. Dasar prinsip U2 |
| `EmptyState` | 1 kalimat + 1 aksi |
| `Skeleton` | Blok `bg-ink-100 animate-pulse`. Satu-satunya tempat `animate-pulse` |
| `PageHeader` | H1 + 1 kalimat + maksimal 1 aksi |
| `Stepper` | Penanda langkah "Langkah 2 dari 3" untuk form panjang |

### 13.6 Layout per aktor

| Area | Mobile (< lg) | Desktop (≥ lg) |
|---|---|---|
| Landing `/` | 1 kolom, nav atas ringkas | Hero 2 kolom (teks + contoh produk), `max-w-page` |
| Siswa `/student/*` | 1 kolom + `BottomNav` maksimal 4 item (Beranda, Catat, Riwayat, CV) | Header atas + 2 kolom: konten utama fleksibel dan panel ringkas 320 px (sticky). `BottomNav` disembunyikan. Lebar maksimal `max-w-5xl` |
| Form catat `/student/log/new` | `Stepper` 3 langkah: (1) pilih tugas, (2) durasi dan kemandirian, (3) bukti dan kirim. Satu langkah per layar | Langkah di kiri, ringkasan log di kanan. Isi sama, tanpa menambah informasi |
| Sekolah `/school/*` dan Guru `/teacher/*` | Top bar + drawer menu | `AppShell`: sidebar 248 px (`ink-900`, teks putih) + top bar + konten `max-w-page`. Daftar berupa tabel. Heatmap memakai lebar penuh |
| Mentor `/v/[token]/*` | 1 kolom `max-w-md`, tanpa navigasi, 1 keputusan per layar, aksi utama `h-14` | Tetap 1 kolom `max-w-md` di tengah |
| Publik `/verify/[slug]` | Dokumen 1 kolom | Dokumen `max-w-3xl`, ramah cetak (Print CSS A4, ADR-09) |

Titik uji tetap: **360, 768, 1280 px**. Lebar 1920 px tidak boleh meregangkan konten (batasi dengan `max-w-page`).

### 13.7 Status dan kondisi UI

Tiap halaman asinkron menangani 5 kondisi (AGENTS.md): loading (`Skeleton`), empty (`EmptyState`), offline/syncing (`Banner`), error (pesan + tombol pulih), unauthorized.

| Kode internal | Label di UI | Warna | Ikon (lucide) |
|---|---|---|---|
| `queued`, `meta_synced` | Belum terkirim | `warn` | `Clock` |
| `synced`, `PENDING_VERIFICATION` | Menunggu mentor | `warn` | `Hourglass` |
| `VERIFIED` | Terverifikasi | `ok` | `ShieldCheck` |
| `REVISION_REQUIRED` | Perlu diperbaiki | `danger` | `RotateCcw` |
| `DRIFT_WARNING` | Perlu perhatian | `danger` | `TriangleAlert` |
| `NOT_STARTED` | Belum mulai | `ink` | `Circle` |

Banner sinkron (PRD §8.2): offline `warn` "Kamu sedang offline. Catatan aman di HP."; menyinkronkan `info` "Mengirim n catatan…"; berhasil `ok` "Semua catatan sudah tersimpan."

### 13.8 Aturan konten

- **Batas informasi:** maksimal 3 kelompok informasi di atas lipatan, 4 KPI per dasbor, 5 item menu.
- **Judul** maksimal 6 kata. **Deskripsi** maksimal 1 kalimat (sekitar 100 karakter). Penjelasan aturan lewat `Disclosure`, bukan paragraf.
- **Tombol** diawali kata kerja: "Catat hari ini", "Minta verifikasi", "Daftarkan sekolah".
- **Sapaan:** siswa memakai "kamu"; guru, sekolah, mentor, dan HRD memakai "Anda". Kalimat baku dari PRD tetap dipakai apa adanya.
- **Tanggal** "21 Okt 2026". Angka memakai `tabular-nums`.
- **Kamus istilah** (jangan tampilkan → tampilkan):

| Jangan tampilkan | Tampilkan |
|---|---|
| IndexedDB, Dexie, QUEUED | "Tersimpan di HP", "Belum terkirim" |
| SHA-256, HMAC, `signature_hash` | "Segel digital" (hash penuh hanya di `Disclosure` "Detail teknis" pada `/verify/[slug]`) |
| Job Card | "Kartu tugas" |
| `FR-xxx`, `BR-xxx`, `ADR-xxx` | Dihapus dari UI |
| Sandbox, Judge Switcher | Hanya di `DemoBar` tipis (atas halaman) dan footer landing, tidak di judul |

- Data contoh tidak ditanam di JSX halaman. Taruh di `src/lib/mock/` sampai API tersambung.

### 13.9 Larangan (dapat diperiksa dengan grep)

Hasil grep berikut di `apps/web/src` harus **nol** (kecuali di `DemoBar` dan `Disclosure` detail teknis untuk istilah teknis):

| Pola | Alasan |
|---|---|
| `bg-gradient`, `from-`, `via-`, `to-` pada kelas warna | Tanpa gradien |
| `blur-`, `backdrop-blur` | Tanpa efek kaca/blob |
| `rounded-3xl`, `rounded-[` | Radius maksimum `rounded-2xl` |
| `text-[9px]`, `text-[10px]`, `text-[11px]` | Minimal 12 px |
| `blue-`, `indigo-`, `purple-`, `emerald-`, `amber-`, `slate-`, `rose-`, `sky-`, `violet-` | Pakai token 13.2 |
| `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl` pada kartu | Datar |
| `hover:scale-`, `active:scale-`, `group-hover:scale-` | Tanpa gerak dekoratif |
| `animate-pulse` di luar `Skeleton` | Konsisten |
| String UI berisi `FR-`, `BR-`, `ADR-`, `IndexedDB`, `QUEUED`, `HMAC` | Aturan konten 13.8 |

### 13.10 Struktur landing page

1. **Nav:** logo, "Masuk", "Daftarkan sekolah" (primary).
2. **Hero:** 1 judul (maks 2 baris), 1 paragraf, CTA utama "Daftarkan sekolah", CTA sekunder "Coba demo".
3. **Strip bukti:** 3 angka (mis. 792 JP, kurang dari 10 detik verifikasi, 100% bisa offline).
4. **Alur 3 langkah:** Catat → Verifikasi → Paspor kompetensi.
5. **Untuk siapa:** siswa, guru, sekolah, mentor dan HRD sebagai baris berselang-seling, bukan 4 kartu identik.
6. **Kepercayaan:** satu blok tentang verifikasi dua faktor dan segel digital.
7. **CTA penutup + footer** ringkas. Tautan "Judge Demo" pindah ke footer.

### 13.11 Aturan kerja agent untuk UI

1. Baca bab ini dan `docs/UI-REFACTOR.md` sebelum menyentuh `apps/web`.
2. Refactor UI hanya mengubah tampilan: jangan ubah logika bisnis, state, handler, Dexie, panggilan API, atau `packages/*`.
3. Jangan menambah warna, ukuran font, atau varian di luar bab ini. Butuh yang baru: berhenti dan laporkan.
4. Sebelum PR UI: `pnpm lint && pnpm typecheck`, grep larangan 13.9 nol hasil, tangkapan layar 360/768/1280 px dilampirkan.
