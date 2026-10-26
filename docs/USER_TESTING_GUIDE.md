# Panduan & Matriks Akun Uji Coba (User Testing Guide) — VokaLink

> Dokumen ini memuat daftar akun pengujian resmi (*demo/sandbox*) yang telah tersinkronisasi 100% dengan database PostgreSQL VokaLink untuk keperluan evaluasi juri lomba UINIC 8.0 dan pengujian internal tim.

---

## 1. Ikhtisar Kredensial Global

* **URL Aplikasi Web:** `http://localhost:3000`
* **Halaman Masuk (Login):** `http://localhost:3000/login`
* **Kata Sandi Default Pengujian:** **`VokaLink2026!`** *(opsi alternatif lokal: `123456` atau nomor identitas itu sendiri)*
* **Metode Masuk Ganda (Dual Login):** Pengguna dapat masuk menggunakan salah satu dari dua opsi kredensial berikut:
  1. **Email Resmi Sekolah** *(Format standar tanpa titik pemisah nama: `nama@domainsekolah.sch.id`)*.
  2. **Nomor Identitas Resmi** *(NISN untuk Siswa, NIP untuk Guru, NPSN untuk Admin Sekolah)*.

---

## 2. Matriks Akun Pengujian Berdasarkan Peran (*Role Matrix*)

### A. Peran Siswa (`STUDENT`)
Akun siswa digunakan untuk menguji pencatatan logbook kerja, sinkronisasi offline-first PWA, pembuatan CV Standar ATS, serta audit paspor kompetensi.

| No | Nama Siswa | Sekolah & Jurusan | Email Resmi (Opsi 1) | NISN (Opsi 2) | Kata Sandi | Dasbor Tujuan | Skenario Pengujian Utama |
|:--:|---|---|---|---|---|---|---|
| **1** | **Andi Pratama** *(Siswa Utama)* | SMK Telkom 1 Medan (RPL) | `andipratama@smktelkom1medan.sch.id` | `0078901234` | `VokaLink2026!` | `/student/home` | **Siswa Berprestasi (Tuntas):**<br>• 280 JP logbook terverifikasi.<br>• CV ATS terisi otomatis di `/student/career-cv`.<br>• Paspor kompetensi publik ber-QR aktif. |
| **2** | **Bintang Ramadhan** | SMK Telkom 1 Medan (RPL) | `bintangramadhan@smktelkom1medan.sch.id` | `0078901235` | `VokaLink2026!` | `/student/home` | **Uji Kasus Drift 1 (Non-Competency Overload):**<br>• Tugas umum non-kejuruan > 30%.<br>• Memicu peringatan deviasi kompetensi pada pantauan guru. |
| **3** | **Citra Maharani** | SMK Telkom 1 Medan (RPL) | `citramaharani@smktelkom1medan.sch.id` | `0078901236` | `VokaLink2026!` | `/student/home` | **Uji Kasus Drift 2 (Skill Monotony):**<br>• Terjebak pada 1 elemen kompetensi monoton.<br>• Memicu rekomendasi rotasi jenis pekerjaan oleh sistem. |
| **4** | **Dewi Anggraini** | SMK Telkom 1 Medan (RPL) | `dewianggraini@smktelkom1medan.sch.id` | `0078901237` | `VokaLink2026!` | `/student/home` | **Uji Kasus Drift 3 (Approval Dormancy):**<br>• Jurnal pending > 3 hari belum divalidasi mentor.<br>• Memicu reminder otomatis ke WhatsApp mentor industri. |
| **5** | **Siswa Contoh Bandung** | SMK Negeri 1 Bandung (AKL) | `siswa1@smkn1bandung.sch.id` | `0079100001` | `VokaLink2026!` | `/student/home` | **Uji Multi-Tenant Jawa Barat:**<br>• Memastikan siswa Bandung terisolasi dari tenant Medan. |
| **6** | **Siswa Contoh Jakarta** | SMK Negeri 26 Jakarta (SIJA) | `siswa1@smkn26jkt.sch.id` | `0079200001` | `VokaLink2026!` | `/student/home` | **Uji Multi-Tenant DKI Jakarta:**<br>• Memastikan siswa Jakarta terisolasi dari tenant Medan/Bandung. |

---

### B. Peran Guru Pembimbing (`TEACHER`)
Akun guru digunakan untuk memantau radar capaian kompetensi siswa, mendeteksi peringatan *drift*, dan melakukan aksi intervensi bimbingan.

| No | Nama Guru | Sekolah & Jurusan Binaan | Email Resmi (Opsi 1) | NIP (Opsi 2) | Kata Sandi | Dasbor Tujuan | Skenario Pengujian Utama |
|:--:|---|---|---|---|---|---|---|
| **1** | **Budi Santoso, S.Kom** | SMK Telkom 1 Medan (RPL) | `budisantoso@smktelkom1medan.sch.id` | `197501012000011001` | `VokaLink2026!` | `/teacher/heatmap` | **Dasbor Pantau & Radar Heatmap:**<br>• Memantau matriks heatmap 4 siswa bimbingan utama.<br>• Visualisasi radar JP dan distribusi elemen CP.<br>• Aksi intervensi cepat via WhatsApp resmi. |
| **2** | **Dewi Lestari, M.Kom** | SMK Telkom 1 Medan (TKJ) | `dewilestari@smktelkom1medan.sch.id` | `198002022005012002` | `VokaLink2026!` | `/teacher/heatmap` | **Pantauan Jurusan Teknik Jaringan:**<br>• Memantau siswa bimbingan TKJ di Telkom Regional 1. |
| **3** | **Dra. Hj. Sri Wahyuni** | SMK Negeri 1 Bandung (AKL) | `sriwahyuni@smkn1bandung.sch.id` | `198101152001011000` | `VokaLink2026!` | `/teacher/heatmap` | **Uji Isolasi Tenant Guru:**<br>• Memastikan guru hanya melihat siswa dari sekolah binaannya. |
| **4** | **Ahmad Fauzi, S.Pd** | SMK Negeri 26 Jakarta (SIJA) | `ahmadfauzi@smkn26jkt.sch.id` | `198205102008011003` | `VokaLink2026!` | `/teacher/heatmap` | **Uji Isolasi Tenant Jakarta:**<br>• Memantau siswa SIJA di PT Telkomsel & Bank Mandiri. |

---

### C. Peran Admin / Pokja PKL Sekolah (`SCHOOL_ADMIN`)
Akun pengelola sekolah digunakan untuk memonitor dasbor analitik sekolah, mengunci kurikulum PKL 792 JP, mengelola direktori mitra DUDI, menjalankan *smart placement*, dan mengekspor nilai e-Rapor resmi.

| No | Nama Admin / Sekolah | Wilayah | Email Resmi (Opsi 1) | NPSN / Kode (Opsi 2) | Kata Sandi | Dasbor Tujuan | Fitur Utama yang Diuji |
|:--:|---|---|---|---|---|---|---|
| **1** | **Pokja PKL SMK Telkom 1 Medan** | Medan, Sumatera Utara | `adminpkl@smktelkom1medan.sch.id`<br>*(atau `admin@smktelkom1medan.sch.id`)* | `99000001`<br>*(atau `10210852`)* | `VokaLink2026!` | `/school/dashboard` | **Dasbor Utama Sekolah:**<br>• Statistik siswa, penempatan, dan DUDI aktif.<br>• Kurikulum di `/school/curriculum`.<br>• Direktori DUDI di `/school/dudi-directory`.<br>• Smart Placement di `/school/placements`.<br>• Rekap e-Rapor di `/school/erapor`. |
| **2** | **Dr. Hj. Nina Herlina, M.Pd** *(SMK Negeri 1 Bandung)* | Bandung, Jawa Barat | `adminpkl@smkn1bandung.sch.id` | `20219141` | `VokaLink2026!` | `/school/dashboard` | **Multi-Tenant Sekolah 2:**<br>• Isolasi 100 siswa dan jurusan bisnis/manajemen. |
| **3** | **Ir. Bambang Widyatmoko, M.T** *(SMK Negeri 26 Jakarta)* | Rawamangun, DKI Jakarta | `adminpkl@smkn26jkt.sch.id` | `20102572` | `VokaLink2026!` | `/school/dashboard` | **Multi-Tenant Sekolah 3:**<br>• Greedy Smart Placement klaster Jakarta Timur. |

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

1. **Uji Masuk dengan Email Tanpa Titik:**
   * Kunjungi `http://localhost:3000/login`.
   * Masukkan email: `andipratama@smktelkom1medan.sch.id` dan kata sandi `VokaLink2026!`.
   * **Hasil yang Diharapkan:** Berhasil masuk langsung ke dasbor siswa `/student/home` dengan profil nama "Andi Pratama".
2. **Uji Akses Silang Antar-Peran (Role Mismatch):**
   * Masuk sebagai Siswa **Andi Pratama** (`0078901234` atau `andipratama@smktelkom1medan.sch.id`).
   * Akses URL admin sekolah secara sengaja di peramban: `http://localhost:3000/school/dashboard`.
   * **Hasil yang Diharapkan:** Akses langsung dicegat oleh `AuthGuard` dan pengguna diarahkan ke halaman **403 Forbidden** (*Akses Ditolak*).
3. **Uji Akses Langsung Tanpa Sesi (Unauthenticated Bypass):**
   * Buka jendela peramban penyamaran (*Incognito / Private Window*).
   * Ketikkan langsung rute privat: `http://localhost:3000/teacher/heatmap` atau `http://localhost:3000/school/dashboard`.
   * **Hasil yang Diharapkan:** Edge Middleware Next.js langsung mencegat permintaan dan mengalihkan halaman ke `/login?from=...`.
4. **Uji Keluar Sesi (Logout):**
   * Tekan tombol **Keluar** pada bilah navigasi atau sidebar.
   * **Hasil yang Diharapkan:** Seluruh sesi lokal dan cookie otentikasi dihapus tuntas, kemudian dialihkan kembali ke `/login`.
