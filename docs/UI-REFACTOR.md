# UI-REFACTOR — Refactor Tampilan Bertahap

> Rencana kerja khusus refactor visual `apps/web`. Terpisah dari `SPRINT.md` (fitur) dan `PROGRESS.md` (status fitur) supaya tidak tercampur.
> Aturan visual: `docs/DESIGN.md` **Bab 13**. Aturan umum repo: `AGENTS.md`.
> Hanya mengubah **tampilan**. Perilaku, logika bisnis, dan data tidak boleh berubah.

## 0. Aturan Umum (berlaku di semua checkpoint)

1. Kerjakan **satu checkpoint (CP) per sesi**. Setelah selesai, **berhenti** dan kirim laporan (format di bagian 2). Jangan lanjut ke CP berikutnya sebelum ada persetujuan tertulis.
2. Satu CP = satu branch `refactor/ui-cpN-nama` dan commit `refactor(ui): cpN <ringkasan>`. PR kecil (idealnya < 400 baris, CP besar boleh dipecah dan dilaporkan).
3. **Boleh disentuh:** `apps/web/src/app/**` (hanya JSX/kelas), `apps/web/src/components/**`, `apps/web/tailwind.config.ts`, `apps/web/src/app/globals.css`, `apps/web/src/lib/cn.ts`, `apps/web/src/lib/mock/**`.
4. **Dilarang disentuh:** `apps/api/**`, `packages/**`, `apps/web/src/lib/pwa/**` (Dexie, foto, sync), `sw.ts`, `manifest.ts` (kecuali `themeColor`), nama field data, handler dan state yang ada.
5. Semua nilai visual (warna, font, ukuran, radius) hanya dari DESIGN.md Bab 13. Butuh yang belum ada: **berhenti dan laporkan**, jangan mengarang.
6. Teks UI Bahasa Indonesia sesuai aturan konten 13.8. Kalimat baku PRD tidak diubah.
7. Setiap halaman tetap menangani 5 kondisi UI (loading, empty, offline, error, unauthorized).
8. Jangan menambah dependensi baru. Pustaka yang boleh dipakai: yang sudah ada di `apps/web/package.json` (lucide-react, clsx, tailwind-merge).
9. Data contoh dipindah dari JSX ke `src/lib/mock/` tanpa mengubah nilainya.

## 1. Daftar Checkpoint

| CP | Nama | Cakupan | Status |
|---|---|---|---|
| CP0 | Fondasi | Token Tailwind, font, `globals.css`, `cn()` | ☐ |
| CP1 | Komponen inti | `components/ui/*` + halaman galeri `/dev/ui` | ☐ |
| CP2 | App shell | `AppShell` + sidebar (sekolah/guru), shell siswa, shell mentor, shell publik, `DemoBar` | ☐ |
| CP3 | Landing & Auth | `/`, `(auth)/login`, `(auth)/register-school` | ☐ |
| CP4 | Portal siswa | `student/home`, `student/log/new` (stepper), `student/log/history`, `student/career-cv` | ☐ |
| CP5 | Portal sekolah | `school/dashboard`, `curriculum`, `dudi-directory`, `placements`, `erapor` | ☐ |
| CP6 | Mentor & Publik | `v/[token]/activate`, `verify/[passportSlug]` | ☐ |
| CP7 | Audit akhir | Grep larangan, Lighthouse, tangkapan layar, perbarui PROGRESS.md | ☐ |

Catatan: rute `teacher/*` (heatmap) dan `v/[token]` (halaman utama, `endorse`) **belum ada** di repo saat ini. Jangan dibuat di refactor ini. Pemilik FR-007/008 akan memakai komponen dari CP1 dan shell dari CP2 saat membuatnya.

---

### CP0 — Fondasi
**Tujuan:** token dan font siap, tampilan lama tidak rusak.
**Tugas:**
1. Ganti isi `tailwind.config.ts` sesuai snippet DESIGN 13.2 (jangan hapus `content` yang sudah mencakup `src/**`).
2. `layout.tsx`: pasang `Plus_Jakarta_Sans` dan `JetBrains_Mono` via `next/font/google` (13.3), ubah kelas `<html>`/`<body>`, `themeColor` menjadi `#0F2A43`.
3. `globals.css`: tiga direktif `@tailwind` + `-webkit-tap-highlight-color: transparent`. Hapus `:root` dan `font-family` lama.
4. Buat `src/lib/cn.ts` (`clsx` + `tailwind-merge`).
**Selesai bila:** `pnpm --filter web typecheck` dan `pnpm --filter web build` lulus. Halaman lama masih terbuka (boleh belum cantik). Font terlihat Plus Jakarta Sans.
**Berhenti dan laporkan.**

### CP1 — Komponen inti
**Tujuan:** seluruh komponen 13.5 tersedia dan terdokumentasi lewat satu halaman galeri.
**Tugas:**
1. Buat di `src/components/ui/`: `Button`, `Card`, `StatusPill`, `Field`, `Stat`, `ProgressBar`, `DataTable`, `Banner`, `Disclosure`, `EmptyState`, `Skeleton`, `PageHeader`, `Stepper`. Sesuai spesifikasi 13.5 dan pemetaan status 13.7.
2. Buat `src/app/dev/ui/page.tsx` yang menampilkan semua komponen dan variannya. Halaman memanggil `notFound()` bila `process.env.NODE_ENV === "production"`.
3. Komponen lama di `components/common` dan `components/layout` **belum dihapus** (dihapus di CP7 bila sudah tak dipakai).
**Selesai bila:** typecheck dan lint lulus, galeri tampil benar di 360/768/1280 px, tidak ada kelas terlarang (13.9) di `components/ui/**`.
**Berhenti dan laporkan** (lampirkan tangkapan layar galeri).

### CP2 — App shell
**Tujuan:** kerangka tiap aktor sesuai 13.6.
**Tugas:**
1. `components/shell/AppShell.tsx`: sidebar 248 px (≥ lg), top bar, drawer (< lg). Menu sekolah maksimal 5 item.
2. Shell siswa: header atas, `BottomNav` 4 item (< lg), layout 2 kolom dengan panel ringkas sticky 320 px (≥ lg). Pertahankan `ConnectivityBanner` dan tampilkan lewat `Banner`.
3. Shell mentor (1 kolom `max-w-md`) dan shell publik (`max-w-3xl`).
4. `DemoBar`: strip tipis berisi tautan ganti peran/Judge Switcher, hanya tampil bila mode demo.
**Selesai bila:** `student/layout.tsx` dan `school/*` memakai shell baru, navigasi tetap berfungsi, tidak ada perubahan perilaku.
**Berhenti dan laporkan.**

### CP3 — Landing & Auth
**Tujuan:** halaman depan baru sesuai struktur 13.10.
**Tugas:**
1. `app/page.tsx` mengikuti 13.10: nav, hero, strip bukti, alur 3 langkah, untuk siapa, kepercayaan, CTA, footer. Tautan Judge Demo pindah ke footer.
2. `(auth)/login` dan `(auth)/register-school` memakai `Field`, `Button`, `Card`. Satu aksi utama per layar.
**Selesai bila:** semua tautan lama tetap mengarah ke rute yang sama, grep larangan nol hasil di berkas yang diubah.
**Berhenti dan laporkan** (lampirkan tangkapan layar 360/768/1280).

### CP4 — Portal siswa
**Tugas:**
1. `student/home`: hapus kartu hero bergradien. Susun: ringkasan progres (`Stat` + `ProgressBar`), 1 tombol utama "Catat hari ini", daftar 3 log terakhir (`StatusPill`). Detail lain masuk `Disclosure`.
2. `student/log/new`: ubah menjadi `Stepper` 3 langkah (13.6). **Handler `handleSubmit`, `handlePhotoSelect`, pemanggilan `db.logs.add`/`db.photos.add`, dan semua state tidak diubah.** Hanya struktur tampilan dan penyembunyian bertahap. Hapus rujukan "BR-003", "BR-002", "IndexedDB", "QUEUED" dari teks UI (pindah ke `Disclosure` bila perlu).
3. `student/log/history` dan `student/career-cv` mengikuti pola yang sama. CV tetap ramah cetak A4.
**Selesai bila:** alur catat log berjalan sama seperti sebelumnya (simpan ke Dexie, modal konfirmasi), grep larangan nol hasil.
**Berhenti dan laporkan.**

### CP5 — Portal sekolah
**Tugas:**
1. `school/dashboard`: maksimal 4 `Stat`, 1 daftar prioritas, tabel jurusan (`DataTable`). Kartu navigasi 4 besar diganti sidebar (CP2).
2. `curriculum`, `dudi-directory`, `placements`, `erapor`: ganti kartu dengan `DataTable` di desktop, daftar kartu di mobile. Satu aksi utama per halaman.
3. Hapus "(FR-0xx)" dari judul. Penjelasan rumus (mis. 70/30 Smart Placement) masuk `Disclosure`.
**Selesai bila:** semua halaman memakai `AppShell`, tidak ada logika yang berubah, grep larangan nol hasil.
**Berhenti dan laporkan.**

### CP6 — Mentor & Publik
**Tugas:**
1. `v/[token]/activate`: 1 kolom `max-w-md`, 1 keputusan per layar, tombol utama `h-14`, area sentuh ≥ 56 px. Alur ikat perangkat dan PIN tidak diubah.
2. `verify/[passportSlug]`: tampilan dokumen `max-w-3xl`, status segel jelas (ikon + teks), hash di `Disclosure` "Detail teknis", Print CSS A4 tetap berfungsi.
**Selesai bila:** alur aktivasi dan verifikasi publik berperilaku sama, grep larangan nol hasil.
**Berhenti dan laporkan.**

### CP7 — Audit akhir
**Tugas:**
1. Jalankan grep larangan DESIGN 13.9 di seluruh `apps/web/src`. Perbaiki semua temuan.
2. Hapus komponen lama yang tidak terpakai (`components/common`, `components/layout`) setelah dipastikan tidak ada impor.
3. `pnpm lint && pnpm typecheck && pnpm --filter web build`.
4. Lighthouse (mobile) untuk `/`, `/student/home`, `/school/dashboard`: Performance dan Accessibility ≥ 90.
5. Tangkapan layar 360/768/1280 px per area. Perbarui `docs/PROGRESS.md`.
**Berhenti dan laporkan.**

---

## 2. Format Laporan Checkpoint

Setiap CP diakhiri laporan berikut, lalu **berhenti** (stop-and-report gate):

```
CHECKPOINT: CPN — <nama>
STATUS: selesai | sebagian | terblokir
FILE DIUBAH: <daftar path>
FILE DIBUAT: <daftar path>
VERIFIKASI: lint <ok/gagal>, typecheck <ok/gagal>, build <ok/gagal>
GREP LARANGAN (13.9): <jumlah temuan per pola, harus 0>
TANGKAPAN LAYAR: <path atau catatan bila tidak bisa>
ASUMSI/KEPUTUSAN: <hal yang diputuskan sendiri>
BUTUH KEPUTUSAN: <warna/ukuran/varian di luar Bab 13, jika ada>
BUG DITEMUKAN: <catat juga di docs/BUGS.md>
BELUM DIKERJAKAN: <sisa>
```

## 3. Prompt Pembuka untuk Agent (salin per CP)

```
Baca AGENTS.md, docs/DESIGN.md Bab 13, dan docs/UI-REFACTOR.md.
Kerjakan HANYA CP<N> dari UI-REFACTOR.md. Jangan menyentuh file di luar daftar "boleh disentuh" (bagian 0).
Jangan mengubah logika, state, handler, Dexie, API, atau packages/*.
Jangan menambah warna/ukuran/varian di luar DESIGN Bab 13. Jika butuh, berhenti dan laporkan.
Setelah selesai, jalankan lint, typecheck, build, dan grep larangan 13.9, lalu berhenti dan kirim laporan dengan format bagian 2. Jangan lanjut ke CP berikutnya.
```
