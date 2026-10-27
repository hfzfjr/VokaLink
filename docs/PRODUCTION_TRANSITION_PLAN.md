# VokaLink: Rencana Transisi Menuju 100% Real Database & Production-Ready Auth

> **Dokumen Perencanaan & Eksekusi**  
> Tanggal: 26 Oktober 2026  
> Versi: 1.0.0  
> Target: Penghapusan 100% Mock Data, Penguatan Autentikasi/Otorisasi (Role Guard & 403), Seeding Database ≥100 Data Riil, dan Pembersihan Mock Switcher Juri.

---

## 1. Hasil Audit Kode: Di Mana Saja Mock & Fallback Berada?

Berdasarkan pemeriksaan menyeluruh pada seluruh berkas `apps/web` dan `apps/api`:

| Lokasi Berkas | Status Saat Ini | Rincian Masalah yang Ditemukan |
|---|---|---|
| `apps/web/src/app/(auth)/login/page.tsx` | **Mock UI Aktif** | Masih terdapat komponen *Judge Demo Switcher* (5 tombol simulasi peran juri) di kolom kanan. |
| `apps/web/src/app/school/dashboard/page.tsx` | **Hardcoded Static** | Menggunakan `setTimeout` dengan data dummy statis (`stats`, `priorityStudents`). Belum memanggil API dashboard backend. |
| `apps/web/src/app/school/curriculum/page.tsx` | **Fallback Mock** | Menggunakan token statis `const [token] = useState("mock-token")` dan fungsi `mockFallbackCurriculum()`. |
| `apps/web/src/app/school/dudi-directory/page.tsx` | **Fallback Mock** | Menggunakan array statis `MOCK_PARTNERS` dan token statis `"mock-token"`. |
| `apps/web/src/app/school/placements/page.tsx` | **Fallback Mock** | Menggunakan objek statis `MOCK_DATA` jika API gagal/belum terhubung. |
| `apps/web/src/app/school/erapor/page.tsx` | **Fallback Mock** | Menggunakan objek statis `MOCK_ERAPOR_DATA`. |
| `apps/web/src/app/student/home/page.tsx` | **Fallback Mock** | Menggunakan `DEFAULT_KANBAN_TASKS` ketika IndexedDB lokal kosong. |
| `apps/web/src/app/student/career-cv/page.tsx` | **Fallback Mock** | Menggunakan `DEMO_FALLBACK_CV` jika data profil belum dimuat dari server. |
| `apps/web/src/app/teacher/heatmap/page.tsx` | **Semi-Real** | Sudah terhubung ke API backend, namun belum mengambil token dinamis dari sesi user login yang aktif. |
| `apps/web/src/middleware.ts` | **Belum Ada** | Belum ada middleware Next.js untuk mencegah akses langsung via URL tanpa login. URL seperti `/school/dashboard` masih bisa dibuka bebas di browser. |
| `apps/api/prisma/seed-v1.ts` | **Data Terbatas (<30)** | Baru memiliki 1 sekolah, 1 guru, 5 siswa, 6 DUDI. Belum memenuhi target ≥100 data riil. |

---

## 2. Kritisi & Masukan Konstruktif terhadap Rencana Anda

Rencana Anda sangat tepat untuk membawa VokaLink dari sekadar "demo hackathon" menjadi **platform SaaS siap produksi (Production-Grade)**. Namun, ada beberapa aspek arsitektural penting yang wajib diperhatikan agar aplikasi tidak error atau macet saat mock dihapus:

### Masukan 1: Penanganan Alur Sesi & Token Bearer di Frontend (Auth Context)
- **Kondisi:** Saat ini beberapa halaman menggunakan `useState("mock-token")`.
- **Kritisi & Solusi:** Kita harus menyediakan **`AuthProvider` / hook `useAuth()` terpusat** di frontend. Ketika user login via Google atau Email/NISN, token JWT Supabase disimpan dalam state sesi aman. Semua fungsi API (`fetchDudiPartners`, `fetchTeacherHeatmap`, dll.) otomatis menyuntikkan `Authorization: Bearer <token_nyata>` pengguna tersebut.

### Masukan 2: Mekanisme Proteksi Rute (Route Guard & Error 403)
- **Kondisi:** Anda menginginkan user yang mengganti URL tanpa login atau tanpa hak akses langsung ditolak dengan Error 403.
- **Kritisi & Solusi:**
  1. **Tingkat Frontend (Next.js):** Kita buat wrapper `AuthGuard` pada layout masing-masing peran:
     - `/school/*` -> Wajib login dengan peran `SCHOOL_ADMIN`. Jika tidak login -> lempar ke `/login`. Jika login tapi perannya `STUDENT` -> lempar ke halaman `403 Forbidden: Hak Akses Ditolak`.
     - `/teacher/*` -> Wajib login dengan peran `TEACHER`.
     - `/student/*` -> Wajib login dengan peran `STUDENT`.
  2. **Tingkat Backend (Express API):** Middleware `requireAuth` dan `requireRole` di `apps/api` menolak setiap request tanpa JWT valid dengan status `401 Unauthorized` atau `403 Forbidden` (RFC 7807 Problem Details).

### Masukan 3: Jangan Kunci Rute Mentor Industri dan Verifikator Publik!
- **Peringatan Kritis:** Sesuai aturan arsitektur PRD & BR-007:
  - **Mentor Industri:** Wajib **Zero-Login** (tidak boleh diminta akun Google / password). Mentor mengakses lewat URL bertanda tangan `/v/[token]` menggunakan Device Token + PIN 6 digit.
  - **Verifikator Publik / HRD:** Mengakses `/verify/[passportSlug]` tanpa login (read-only ber-QR).
  - *Kedua rute ini harus tetap bebas dari kewajiban login Google/Email sekolah.*

### Masukan 4: Strategi Seeding Database ≥100 Data Riil
- **Kritisi:** Menambah 100+ data acak rentan membuat grafik heatmap atau smart placement terlihat aneh jika datanya tidak realistis.
- **Solusi:** Kita buat seeder `seed-v2.ts` yang menghasilkan data berbobot realistis:
  - **1 Sekolah Menengah Kejuruan Induk** + 6 Konsentrasi Keahlian (RPL, DKV, TKJ, AKL, Kuliner, Otomotif).
  - **80+ Siswa Riil** dengan persebaran: 50% progres normal (300–600 JP), 20% hampir tuntas (>700 JP), 15% siswa bermasalah (terkena *Drift Alert*: dominan non-kompetensi atau dormansi persetujuan), dan 15% siswa baru.
  - **15+ Mitra DUDI & Mentor** dari berbagai sektor industri.
  - **300+ Catatan Log Harian (Daily Logs)** lengkap dengan item pekerjaan, bukti foto, dan status terverifikasi mentor.
  - **Data Endorsement Soft Skills & Paspor Kompetensi** ber-QR.

---

## 3. Matriks Hak Akses & Proteksi Rute (RBAC)

| Rute URL | Hak Akses (Role) | Perilaku Jika Tanpa Token / Salah Role |
|---|---|---|
| `/` (Landing Page) | Publik | Buka normal |
| `/login` & `/register-school` | Publik | Jika sudah login, redirect ke dashboard masing-masing |
| `/auth/callback` | Publik (OAuth redirect) | Verifikasi token dan tentukan routing peran |
| `/school/*` | `SCHOOL_ADMIN` | Tanpa token -> Redirect `/login`. Role lain -> Halaman `403 Forbidden` |
| `/teacher/*` | `TEACHER` | Tanpa token -> Redirect `/login`. Role lain -> Halaman `403 Forbidden` |
| `/student/*` | `STUDENT` | Tanpa token -> Redirect `/login`. Role lain -> Halaman `403 Forbidden` |
| `/v/[token]` | Mentor Industri (Zero-Login) | Validasi cryptographic HMAC token + PIN (bukan akun Supabase) |
| `/verify/[slug]` | Publik / HRD | Akses publik read-only dengan audit log |

---

## 4. Akun Uji Coba Resmi untuk Proposal Lomba

Informasi akun ini yang akan dicantumkan di buku panduan / proposal juri untuk login riil:

| Peran | Sekolah | Identitas (Email / NIP / NISN) | Kata Sandi | Tujuan Simulasi Halaman |
|---|---|---|---|---|
| **Admin Pokja PKL** | SMK Telkom 1 Medan | `admin.telkommedan@vokalink.id` | `VokaLink2026!` | Dasbor Sekolah Medan, Kurikulum, Smart Placement |
| **Admin Pokja PKL** | SMK Negeri 1 Bandung | `admin.smkn1bdg@vokalink.id` | `VokaLink2026!` | Dasbor Sekolah Bandung, Kurikulum, Smart Placement |
| **Admin Pokja PKL** | SMK Negeri 26 Jakarta | `admin.smkn26jkt@vokalink.id` | `VokaLink2026!` | Dasbor Sekolah Jakarta, Kurikulum, Smart Placement |
| **Guru Pembimbing** | SMK Telkom 1 Medan | `197501012000011001` *(atau `budi.telkommedan@vokalink.id`)* | `VokaLink2026!` | Live Heatmap 2D, Deteksi Drift, Intervensi WhatsApp |
| **Siswa RPL (Andi Pratama)** | SMK Telkom 1 Medan | `0078901234` | `VokaLink2026!` | Jurnal Harian Offline PWA, Paspor Kompetensi, CV ATS Ber-QR |
| **Siswa DKV (Bintang)** | SMK Telkom 1 Medan | `0078901235` | `VokaLink2026!` | Simulasi Siswa dengan Peringatan Non-Kompetensi Overload |
| **Siswa TKJ (Citra)** | SMK Telkom 1 Medan | `0078901236` | `VokaLink2026!` | Simulasi Siswa dengan Peringatan Skill Monotony |
| **Siswa AKL (Dewi)** | SMK Telkom 1 Medan | `0078901237` | `VokaLink2026!` | Simulasi Siswa dengan Peringatan Approval Dormancy |

*(Pengguna juga dapat menautkan akun Google resmi mereka sendiri apabila emailnya didaftarkan ke sekolah).*

---

## 5. Rencana Kerja & Pelacakan Tugas (Task Tracker)

### Fase 1: Pembersihan Mock UI & Desain Login Opsi B (Selesai ✅)
- [x] **Task 1.1:** Hapus panel *Judge Demo Switcher* (5 tombol simulasi) di [`apps/web/src/app/(auth)/login/page.tsx`](file:///d:/CODING/PROJECT/vokalink/apps/web/src/app/(auth)/login/page.tsx). Ubah layout menjadi 2 kolom (Opsi B): Sisi kiri banner visual fitur grafis VokaLink yang elegan & modern, sisi kanan formulir login autentikasi terpadu.
- [x] **Task 1.2:** Tombol "Masuk dengan Google" terpasang di bawah tombol biru "Masuk ke Sistem" dengan penanganan notifikasi "⚠️ Akun Belum Terhubung dengan Sekolah".
- [x] **Task 1.3:** Bersihkan komponen `DemoBar` dari halaman login.

### Fase 2: Implementasi Auth Guard & Proteksi Rute (Role-Based Access Control)
- [ ] **Task 2.1:** Buat hook terpusat `useAuth` di `apps/web/src/lib/use-auth.ts` yang membaca sesi aktif Supabase, mengekstrak token Bearer, dan menyimpan data user/role.
- [ ] **Task 2.2:** Buat komponen `AuthGuard` di `apps/web/src/components/auth/AuthGuard.tsx` yang memverifikasi sesi dan hak akses peran.
- [ ] **Task 2.3:** Buat halaman responsif `403 Forbidden` di `apps/web/src/app/forbidden/page.tsx` dengan desain profesional dan tombol kembali ke dashboard yang sah.
- [ ] **Task 2.4:** Pasang `AuthGuard` pada:
  - `apps/web/src/app/school/layout.tsx` (khusus `SCHOOL_ADMIN`)
  - `apps/web/src/app/teacher/layout.tsx` (khusus `TEACHER`)
  - `apps/web/src/app/student/layout.tsx` (khusus `STUDENT`)
- [ ] **Task 2.5:** Buat `apps/web/src/middleware.ts` untuk memblokir akses rute privat jika cookie/sesi kosong.

### Fase 3: Migrasi Halaman Web ke 100% Real API (Hapus Data Mock)
- [ ] **Task 3.1:** **School Dashboard** (`apps/web/src/app/school/dashboard/page.tsx`): Buat endpoint `GET /api/v1/schools/:schoolId/dashboard-summary` di Express dan hubungkan frontend secara dinamis. Hapus static `setTimeout`.
- [ ] **Task 3.2:** **School Curriculum** (`apps/web/src/app/school/curriculum/page.tsx`): Ganti `mock-token` dengan token user aktif, hapus `mockFallbackCurriculum()`.
- [ ] **Task 3.3:** **School DUDI Directory** (`apps/web/src/app/school/dudi-directory/page.tsx`): Ganti `MOCK_PARTNERS` dengan response riil dari `GET /api/v1/dudi`.
- [ ] **Task 3.4:** **School Smart Placement** (`apps/web/src/app/school/placements/page.tsx`): Hapus `MOCK_DATA`, hubungkan ke endpoint scorer spasial riil.
- [ ] **Task 3.5:** **School e-Rapor** (`apps/web/src/app/school/erapor/page.tsx`): Hapus `MOCK_ERAPOR_DATA`, hubungkan ke generator e-Rapor riil.
- [ ] **Task 3.6:** **Student Home & CV** (`apps/web/src/app/student/home/page.tsx` & `career-cv/page.tsx`): Hapus `DEFAULT_KANBAN_TASKS` dan `DEMO_FALLBACK_CV`. Gunakan data IndexedDB tersinkronisasi server dan API Paspor Kompetensi riil.
- [ ] **Task 3.7:** **Teacher Heatmap** (`apps/web/src/app/teacher/heatmap/page.tsx`): Pastikan seluruh fetch menggunakan token autentikasi guru yang sedang aktif.

### Fase 4: Seeding Database Komprehensif (3 SMK, 36 Guru, 300 Siswa Riil) (Selesai ✅)
- [x] **Task 4.1:** Buat file seeder produksi `apps/api/prisma/seed-v2.ts` yang menghasilkan:
  - 3 Sekolah Resmi: **SMK Telkom 1 Medan**, **SMK Negeri 1 Bandung**, **SMK Negeri 26 Jakarta**.
  - 18 Jurusan / Konsentrasi Keahlian (6 jurusan per sekolah).
  - 36 Akun Guru Pembimbing (12 guru per sekolah).
  - 300 Akun Siswa Riil (100 siswa per sekolah) beserta penempatan industri.
  - 18 Mitra DUDI & Mentor Industri terikat.
  - 104 Log Harian terverifikasi & terenkripsi HMAC-SHA256.
  - Kasus Drift Alert nyata & Paspor Kompetensi publik ber-QR.
- [x] **Task 4.2:** Buat endpoint autentikasi terpadu di backend (`GET /api/v1/auth/me` dan `POST /api/v1/auth/login-identifier`) untuk mendukung login multi-metode (Google OAuth & Email/NISN).
- [x] **Task 4.3:** Jalankan `pnpm --filter api seed:v2` dan verifikasi seluruh data di Supabase menggunakan Supabase MCP tools.

### Fase 5: Pengujian Menyeluruh (End-to-End & Security Verification)
- [ ] **Task 5.1:** Uji coba login dengan Google OAuth dan verifikasi bahwa pengguna baru non-sekolah mendapatkan notifikasi akun belum terdaftar, sedangkan pengguna terdaftar langsung masuk.
- [ ] **Task 5.2:** Uji coba pembobolan URL manual (misal siswa mencoba membuka `/school/dashboard` atau `/teacher/heatmap`) dan pastikan terlempar ke `403 Forbidden`.
- [ ] **Task 5.3:** Uji alur CRUD riil pada dashboard sekolah, logbook siswa, dan evaluasi drift.
- [x] **Task 5.4:** Jalankan `pnpm --filter web typecheck`, `pnpm --filter api typecheck`, dan unit test auth.

---

## 6. Pertanyaan Klarifikasi untuk Anda

Sebelum kita mulai mengeksekusi Fase 1:
1. **Tampilan Halaman Login:** Apakah kolom kanan yang sebelumnya berisi *Judge Demo Switcher* ingin dijadikan ilustrasi grafis/banner fitur VokaLink yang elegan (seperti umumnya halaman login SaaS profesional), atau ingin dibuat satu kolom ramping di tengah (*centered card*)?
2. **Identitas Sekolah Utama di Seeder:** Apakah Anda ingin menggunakan nama sekolah tertentu (misal: *SMK Negeri 1 Surabaya* atau nama SMK lain pilihan Anda) untuk data ≥100 siswa tersebut?
3. **Konfirmasi Mulai:** Apakah dokumen perencanaan di atas sudah sesuai dengan visi Anda, dan apakah kita bisa langsung mulai dengan **Fase 1 (Pembersihan Mock UI)** dan **Fase 2 (Auth Guard & Proteksi Rute)**?
