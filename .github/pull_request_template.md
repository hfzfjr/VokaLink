## Ringkasan

<!-- Apa yang berubah dan kenapa. Sebut FR/BR/BUG terkait, contoh: FR-007, BR-007. -->

## Jenis perubahan

- [ ] Fitur (FR-___)
- [ ] Perbaikan bug (BUG-___)
- [ ] Skema Prisma / migrasi (beri tahu seluruh tim, seeder ikut diperbarui)
- [ ] Dokumen / chore

## Definition of Done

- [ ] Sesuai alur utama, alternatif alur, dan acceptance criteria di PRD
- [ ] Aturan bisnis (BR-xxx) ditegakkan di server, bukan hanya di UI
- [ ] Skema Zod dari `packages/shared` dipakai oleh API dan form
- [ ] Fungsi murni punya unit test, endpoint kritis punya tes integrasi
- [ ] 5 kondisi UI ditangani (loading, empty, offline/syncing, error, unauthorized)
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` hijau
- [ ] `docs/PROGRESS.md` diperbarui, bug baru dicatat di `docs/BUGS.md`

## Keamanan

- [ ] Tidak ada secret, token, PIN, atau `.env` di diff
- [ ] Query data sekolah lewat tenant guard (`schoolId`)
- [ ] Tidak melemahkan cek device token, PIN, immutability, atau segel HMAC

## Asumsi, dependensi baru, atau hal yang belum selesai

<!-- Kosongkan bila tidak ada. Sebut paket baru dan alasannya. -->
