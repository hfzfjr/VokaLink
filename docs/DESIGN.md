# DESIGN — VokaLink

> Dokumen desain teknis, pendamping `PRD.md`. UINIC 8.0 Web Development Competition 2026.
> **Hierarki kebenaran:** `PRD.md` (fitur, data, aturan bisnis) > `DESIGN.md` (cara membangun) > kode.
> Jika DESIGN bertentangan dengan PRD pada fitur/aturan bisnis, PRD menang dan DESIGN harus diperbaiki.
> Revisi ini menggantikan DESIGN lama (arsitektur Express + PostgreSQL mandiri) dan disesuaikan dengan PRD v1.0 (12 FR, 5 aktor).

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
