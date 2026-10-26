# Panduan & Matriks Akun Uji Coba (User Testing Guide) — VokaLink

> Dokumen ini memuat daftar akun pengujian resmi (*demo/sandbox*) yang telah tersinkronisasi 100% dengan database PostgreSQL VokaLink untuk keperluan evaluasi juri lomba UINIC 8.0 dan pengujian internal tim.

---

## 1. Ikhtisar Kredensial Global

* **URL Aplikasi Web:** `http://localhost:3000`
* **Halaman Masuk (Login):** `http://localhost:3000/login`
* **Kata Sandi Default Pengujian:** **`VokaLink2026!`** *(opsi alternatif lokal: `123456` atau nomor identitas itu sendiri)*
* **Metode Masuk:** Menggunakan **Nomor Identitas Resmi (NISN / NIP / NPSN)** langsung pada kolom login *(Zero Dependency terhadap akun email pribadi)*.

---

## 2. Matriks Akun Pengujian Berdasarkan Peran (*Role Matrix*)

### A. Peran Siswa (`STUDENT`)
Akun siswa digunakan untuk menguji pencatatan logbook kerja, sinkronisasi offline-first PWA, pembuatan CV Standar ATS, serta audit paspor kompetensi.

| No | Nama Siswa | Sekolah | NISN (Identitas Login) | Kata Sandi | Dasbor Tujuan | Skenario Pengujian Utama |
|:--:|---|---|---|---|---|---|
| **1** | **Andi Pratama** *(Siswa Utama)* | SMK Telkom 1 Medan (RPL) | `0078901234` | `VokaLink2026!` | `/student/home` | **Siswa Berprestasi (Tuntas):**<br>• Memiliki 280 JP logbook terverifikasi.<br>• CV Standar ATS terisi otomatis di `/student/career-cv`.<br>• Paspor kompetensi publik ber-QR aktif. |
| **2** | **Bintang Ramadhan** | SMK Telkom 1 Medan (RPL) | `0078901235` | `VokaLink2026!` | `/student/home` | **Uji Kasus Drift 1 (Non-Competency Overload):**<br>• Riwayat log tugas umum non-kejuruan > 30%.<br>• Memicu peringatan deviasi kompetensi pada pantauan guru. |
| **3** | **Citra Maharani** | SMK Telkom 1 Medan (RPL) | `0078901236` | `VokaLink2026!` | `/student/home` | **Uji Kasus Drift 2 (Skill Monotony):**<br>• Terjebak pada 1 elemen kompetensi secara monoton.<br>• Memicu rekomendasi rotasi jenis pekerjaan oleh sistem. |
| **4** | **Dewi Anggraini** | SMK Telkom 1 Medan (RPL) | `0078901237` | `VokaLink2026!` | `/student/home` | **Uji Kasus Drift 3 (Approval Dormancy):**<br>• Jurnal pending > 3 hari belum divalidasi mentor.<br>• Memicu reminder otomatis ke WhatsApp mentor industri. |

---

### B. Peran Guru Pembimbing (`TEACHER`)
Akun guru digunakan untuk memantau radar capaian kompetensi siswa, mendeteksi peringatan *drift*, dan melakukan aksi intervensi bimbingan.

| No | Nama Guru | Sekolah & Jurusan Binaan | NIP (Identitas Login) | Kata Sandi | Dasbor Tujuan | Skenario Pengujian Utama |
|:--:|---|---|---|---|---|---|
| **1** | **Budi Santoso, S.Kom** | SMK Telkom 1 Medan (RPL) | `197501012000011001` | `VokaLink2026!` | `/teacher/heatmap` | **Dasbor Pantau & Radar Heatmap:**<br>• Memantau matriks heatmap 4 siswa bimbingan utama.<br>• Melihat visualisasi radar JP dan distribusi elemen CP.<br>• Menjalankan tombol intervensi cepat via WhatsApp resmi. |
| **2** | **Guru Pembimbing Bandung** | SMK Negeri 1 Bandung (AKL) | `198101152001011000` | `VokaLink2026!` | `/teacher/heatmap` | **Uji Isolasi Tenant (Tenant Guard):**<br>• Memastikan guru hanya melihat siswa dari sekolah binaannya. |

---

### C. Peran Admin / Pokja PKL Sekolah (`SCHOOL_ADMIN`)
Akun pengelola sekolah digunakan untuk memonitor dasbor analitik sekolah, mengunci kurikulum PKL 792 JP, mengelola direktori mitra DUDI, menjalankan *smart placement*, dan mengekspor nilai e-Rapor resmi.

| No | Nama Admin / Sekolah | NPSN (Identitas Login) | Kata Sandi | Dasbor Tujuan | Fitur Utama yang Diuji |
|:--:|---|---|---|---|---|
| **1** | **Pokja PKL SMK Telkom 1 Medan** *(Sumatera Utara)* | `99000001`<br>*(atau `10210852`)* | `VokaLink2026!` | `/school/dashboard` | **Dasbor Utama Sekolah:**<br>• Statistik siswa, penempatan, dan DUDI aktif.<br>• Matriks Kurikulum di `/school/curriculum`.<br>• Direktori DUDI di `/school/dudi-directory`.<br>• Smart Placement di `/school/placements`.<br>• Rekap e-Rapor di `/school/erapor`. |
| **2** | **Dr. Hj. Nina Herlina, M.Pd** *(SMK Negeri 1 Bandung, Jawa Barat)* | `20219141` | `VokaLink2026!` | `/school/dashboard` | **Multi-Tenant Sekolah 2:**<br>• Menguji pemisahan data 100 siswa dan jurusan akuntansi/bisnis. |
| **3** | **Ir. Bambang Widyatmoko, M.T** *(SMK Negeri 26 Jakarta, DKI Jakarta)* | `20102572` | `VokaLink2026!` | `/school/dashboard` | **Multi-Tenant Sekolah 3:**<br>• Menguji algoritma Greedy Smart Placement pada klaster industri Jakarta Timur. |

---

## 3. Peran Tanpa Akun (*Zero-Login Roles*)

Sesuai aturan bisnis **BR-007** (Verifikasi Mentor Tanpa Akun) dan **FR-012** (Paspor Kompetensi Publik):

### A. Mentor Industri (Verifikator Lapangan)
* **Mekanisme:** Menggunakan *Signed Magic Link* bertanda tangan HMAC-SHA256 yang dikirimkan ke WhatsApp mentor atau QR Code perangkat.
* **Keamanan Tambahan:**
  * **Device Token Binding:** Perangkat smartphone mentor terikat secara unik.
  * **PIN Mentor:** `123456` *(salah 5 kali otomatis terkunci 15 menit)*.
  * **Immutability:** Log yang telah berstatus `VERIFIED` terkunci secara permanen di database.

### B. Publik & HRD Rekrutmen Industri
* **Mekanisme:** Pemindaian QR Code pada lembar CV ATS fisik siswa atau akses URL slug terbuka.
* **Tautan Langsung Uji Coba:**
  * [http://localhost:3000/verify/andi-pratama](http://localhost:3000/verify/andi-pratama)
* **Karakteristik:**
  * Bersifat *Read-Only* publik tanpa butuh login.
  * Hanya menampilkan data jam kerja dan keterampilan yang telah `VERIFIED` resmi (BR-010).
  * Dilengkapi segel kriptografis anti-pemalsuan *Master Signature Hash*.

---

## 4. Skenario Uji Coba Proteksi Keamanan (*AuthGuard & 403 Forbidden*)

Untuk menguji keandalan sistem keamanan otentikasi dan otorisasi:

1. **Uji Akses Silang Antar-Peran (Role Mismatch):**
   * Masuk sebagai Siswa **Andi Pratama** (`0078901234`).
   * Akses URL admin sekolah secara sengaja di peramban: `http://localhost:3000/school/dashboard`.
   * **Hasil yang Diharapkan:** Akses langsung dicegat oleh `AuthGuard` dan pengguna diarahkan ke halaman **403 Forbidden** (*Akses Ditolak*).
2. **Uji Akses Langsung Tanpa Sesi (Unauthenticated Bypass):**
   * Buka jendela peramban penyamaran (*Incognito / Private Window*).
   * Ketikkan langsung rute privat: `http://localhost:3000/teacher/heatmap` atau `http://localhost:3000/school/dashboard`.
   * **Hasil yang Diharapkan:** Edge Middleware Next.js langsung mencegat permintaan dan mengalihkan halaman ke `/login?from=...`.
3. **Uji Keluar Sesi (Logout):**
   * Tekan tombol **Keluar** pada bilah navigasi atau sidebar.
   * **Hasil yang Diharapkan:** Seluruh sesi lokal dan cookie otentikasi dihapus tuntas, kemudian dialihkan kembali ke `/login`.
