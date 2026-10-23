# UI-REFACTOR — Refactor Tampilan Bertahap

> Rencana kerja khusus refactor visual `apps/web`. Terpisah dari `SPRINT.md` (fitur) dan `PROGRESS.md` (status fitur) supaya tidak tercampur.
> Aturan visual: `docs/DESIGN.md` **Bab 13** (Update UINIC 8.0). Aturan umum repo: `AGENTS.md`.
> **Acuan Desain Utama (Golden Standard):** Landing page di [`apps/web/src/app/page.tsx`](file:///d:/CODING/PROJECT/vokalink/apps/web/src/app/page.tsx) dengan tema **Electric Sky Blue (`sky-500`)**, kanvas **`#F8FAFD`**, permukaan kartu putih **`#FFFFFF`**, pola hero **`bg-grid-pattern`**, serta geometri **Pill (`rounded-full`)** dan sudut membulat elegan (**`rounded-3xl` / `rounded-2xl`**).
> Hanya mengubah **tampilan**. Perilaku, logika bisnis, dan data tidak boleh berubah.

## 0. Aturan Umum (berlaku di semua checkpoint)

1. Kerjakan **satu checkpoint (CP) per sesi**. Setelah selesai, **berhenti** dan kirim laporan (format di bagian 2). Jangan lanjut ke CP berikutnya sebelum ada persetujuan tertulis.
2. Satu CP = satu branch `refactor/ui-cpN-nama` dan commit `refactor(ui): cpN <ringkasan>`. PR kecil (idealnya < 400 baris, CP besar boleh dipecah dan dilaporkan).
3. **Boleh disentuh:** `apps/web/src/app/**` (hanya JSX/kelas), `apps/web/src/components/**`, `apps/web/tailwind.config.ts`, `apps/web/src/app/globals.css`, `apps/web/src/lib/cn.ts`, `apps/web/src/lib/mock/**`.
4. **Dilarang disentuh:** `apps/api/**`, `packages/**`, `apps/web/src/lib/pwa/**` (Dexie, foto, sync), `sw.ts`, `manifest.ts` (kecuali `themeColor`), nama field data, handler dan state yang ada.
5. Semua nilai visual (warna, font, ukuran, radius) mengikuti DESIGN.md Bab 13 dan standar acuan `apps/web/src/app/page.tsx`. Butuh yang belum ada: **berhenti dan laporkan**, jangan mengarang.
6. Teks UI Bahasa Indonesia sesuai aturan konten 13.8. Kalimat baku PRD tidak diubah.
7. Setiap halaman tetap menangani 5 kondisi UI (loading, empty, offline, error, unauthorized).
8. Jangan menambah dependensi baru. Pustaka yang boleh dipakai: yang sudah ada di `apps/web/package.json` (lucide-react, clsx, tailwind-merge).
9. Data contoh dipindah dari JSX ke `src/lib/mock/` tanpa mengubah nilainya.

## 1. Daftar Checkpoint

| CP | Nama | Cakupan | Status |
|---|---|---|---|
| CP0 | Fondasi | Token Tailwind (Sky Blue, Slate, Canvas `#F8FAFD`), font Plus Jakarta Sans, `globals.css` (`bg-grid-pattern`), `cn()` | ☑ |
| CP1 | Komponen inti | Standarisasi `components/ui/*` (Button pill, Card, Stat, Field, DataTable, dll.) + galeri `/dev/ui` | ☑ |
| CP2 | App shell | `AppShell` + sidebar (sekolah/guru), shell siswa (BottomNav pill), shell mentor, shell publik, `DemoBar` | ☑ |
| CP3 | Landing & Auth | **Landing page (`/`) SUDAH SELESAI & DISETUJUI**, sisa: `(auth)/login`, `(auth)/register-school` | ☑ |
| CP4 | Portal siswa | `student/home`, `student/log/new` (stepper), `student/log/history`, `student/career-cv` | ☑ |
| CP5 | Portal sekolah | `school/dashboard`, `curriculum`, `dudi-directory`, `placements`, `erapor` | ☑ |
| CP6 | Mentor & Publik | `v/[token]/activate`, `verify/[passportSlug]` | ☑ |
| CP7 | Audit akhir | Grep kepatuhan, Lighthouse, tangkapan layar, perbarui PROGRESS.md | ☑ |

Catatan: rute `teacher/*` (heatmap) dan `v/[token]` (halaman utama, `endorse`) memakai komponen dari CP1 dan shell dari CP2 saat dibangun.

---

### CP0 — Fondasi (Selesai)
**Tujuan:** token warna Electric Sky Blue (`sky-500` / `#0EA5E9`), kanvas `#F8FAFD`, font Plus Jakarta Sans, dan utilitas grid siap.
**Hasil:**
1. `tailwind.config.ts` memuat token `sky`, `canvas: '#F8FAFD'`, `surface: '#FFFFFF'`, radius `rounded-full`, `rounded-2xl`, `rounded-3xl`.
2. `layout.tsx` memuat font `Plus_Jakarta_Sans` dan `JetBrains_Mono`.
3. `globals.css` memuat utilitas `bg-grid-pattern`.

### CP1 — Komponen Inti (Selesai)
**Tujuan:** seluruh komponen UI di `src/components/ui/` mengadopsi tema Sky Blue dan bentuk Pill/Rounded.
**Komponen:** `Button` (pill `rounded-full`, varian primary sky-500, outline, ghost, destructive), `Card` (surface putih border-slate-100), `StatusPill`, `Field`, `Stat`, `ProgressBar`, `DataTable`, `Banner`, `Disclosure`, `EmptyState`, `Skeleton`, `PageHeader`, `Stepper`.

### CP2 — App Shell
**Tujuan:** kerangka navigasi tiap aktor sesuai standar visual VokaLink.
**Tugas:**
1. `components/shell/AppShell.tsx`: sidebar 248 px (≥ lg) dengan aksen brand Sky Blue, top bar, drawer (< lg). Menu sekolah maksimal 5 item.
2. Shell siswa: header atas, `BottomNav` 4 item (< lg) dengan ikon pill aktif `bg-sky-50 text-sky-600`, layout 2 kolom dengan panel ringkas sticky 320 px (≥ lg). Pertahankan `ConnectivityBanner` dan tampilkan lewat `Banner`.
3. Shell mentor (1 kolom `max-w-md`) dan shell publik (`max-w-3xl`).
4. `DemoBar`: strip tipis berisi tautan ganti peran/Judge Switcher, hanya tampil bila mode demo.
**Selesai bila:** `student/layout.tsx` dan `school/*` memakai shell baru, navigasi tetap berfungsi, tidak ada perubahan perilaku.
**Berhenti dan laporkan.**

### CP3 — Landing & Auth
**Status Landing Page:** Halaman depan (`apps/web/src/app/page.tsx`) **telah selesai 100% dan menjadi acuan utama**.
**Tugas Tersisa:**
1. `(auth)/login` dan `(auth)/register-school` diselaraskan dengan tema: kanvas `#F8FAFD`, kartu putih `rounded-3xl`, field input `rounded-full` / `rounded-xl`, tombol primer pill `sky-500`.
**Selesai bila:** halaman login dan registrasi sekolah tampil senada dengan landing page, typecheck lulus.
**Berhenti dan laporkan.**

### CP4 — Portal Siswa
**Tugas:**
1. `student/home`: kanvas `#F8FAFD`, kartu putih `rounded-3xl`. Susun: ringkasan progres 792 JP (`Stat` + `ProgressBar`), 1 tombol aksi utama pill "Catat hari ini" (`bg-sky-500`), daftar logbook terakhir (`StatusPill`).
2. `student/log/new`: ubah menjadi `Stepper` 3 langkah terstruktur. **Handler `handleSubmit`, `handlePhotoSelect`, pemanggilan `db.logs.add`/`db.photos.add`, dan semua state tidak diubah.** Hapus rujukan teknis internal "BR-003", "IndexedDB", "QUEUED" dari teks UI langsung.
3. `student/log/history` dan `student/career-cv` mengikuti tema yang sama. CV tetap ramah cetak A4.
**Selesai bila:** alur catat log berjalan sama seperti sebelumnya (simpan ke Dexie, modal konfirmasi), typecheck lulus.
**Berhenti dan laporkan.**

### CP5 — Portal Sekolah
**Tugas:**
1. `school/dashboard`: maksimal 4 `Stat` ringkas, 1 daftar prioritas siswa, tabel jurusan (`DataTable`).
2. `curriculum`, `dudi-directory`, `placements`, `erapor`: tabel bersih di desktop, daftar kartu di mobile. Satu aksi utama per halaman.
3. Hapus kode kasar "(FR-0xx)" dari judul. Penjelasan rumus (mis. 70/30 Smart Placement) masuk `Disclosure`.
**Selesai bila:** semua halaman memakai `AppShell`, tidak ada logika yang berubah.
**Berhenti dan laporkan.**

### CP6 — Mentor & Publik
**Tugas:**
1. `v/[token]/activate`: 1 kolom `max-w-md`, 1 keputusan per layar, tombol utama pill `h-14` `bg-sky-500`, area sentuh ≥ 56 px. Alur ikat perangkat dan PIN tidak diubah.
2. `verify/[passportSlug]`: tampilan dokumen `max-w-3xl`, status segel jelas (ikon + teks), hash di `Disclosure` "Detail teknis", Print CSS A4 tetap berfungsi.
**Selesai bila:** alur aktivasi dan verifikasi publik berperilaku sama.
**Berhenti dan laporkan.**

### CP7 — Audit Akhir
**Tugas:**
1. Jalankan audit konsistensi di seluruh `apps/web/src`.
2. Hapus komponen lama yang tidak terpakai setelah dipastikan tidak ada impor.
3. `pnpm lint && pnpm typecheck && pnpm --filter web build`.
4. Lighthouse (mobile) untuk `/`, `/student/home`, `/school/dashboard`: Performance dan Accessibility ≥ 90.
5. Tangkapan layar per area. Perbarui `docs/PROGRESS.md`.
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
TANGKAPAN LAYAR: <path atau catatan bila tidak bisa>
ASUMSI/KEPUTUSAN: <hal yang diputuskan sendiri>
BUTUH KEPUTUSAN: <warna/ukuran/varian di luar Bab 13, jika ada>
BUG DITEMUKAN: <catat juga di docs/BUGS.md>
BELUM DIKERJAKAN: <sisa>
```

## 3. Prompt Pembuka untuk Agent (salin per CP)

```
Baca AGENTS.md, docs/DESIGN.md Bab 13, dan docs/UI-REFACTOR.md.
Acuan visual utama adalah landing page di apps/web/src/app/page.tsx (Electric Sky Blue sky-500, kanvas #F8FAFD, pill rounded-full, kartu rounded-3xl/rounded-2xl).
Kerjakan HANYA CP<N> dari UI-REFACTOR.md. Jangan menyentuh file di luar daftar "boleh disentuh" (bagian 0).
Jangan mengubah logika, state, handler, Dexie, API, atau packages/*.
Setelah selesai, jalankan lint, typecheck, build, lalu berhenti dan kirim laporan dengan format bagian 2. Jangan lanjut ke CP berikutnya.
```
