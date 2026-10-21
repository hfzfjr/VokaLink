"use client";

import {
  ClipboardList,
  Users,
  Inbox,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  Field,
  Input,
  Textarea,
  Select,
} from "@/components/ui/Field";
import { Stat } from "@/components/ui/Stat";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Banner } from "@/components/ui/Banner";
import { Disclosure } from "@/components/ui/Disclosure";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stepper } from "@/components/ui/Stepper";

// ─── Sample data ────────────────────────────────────────────────────────────────
interface SampleRow {
  id: string;
  siswa: string;
  tugas: string;
  jam: number;
  status: string;
}

const sampleRows: SampleRow[] = [
  { id: "1", siswa: "Rina Kartika", tugas: "Merakit PCB", jam: 6, status: "VERIFIED" },
  { id: "2", siswa: "Budi Santoso", tugas: "Soldering komponen", jam: 4, status: "PENDING_VERIFICATION" },
  { id: "3", siswa: "Siti Aminah", tugas: "Quality check", jam: 5, status: "REVISION_REQUIRED" },
];

const columns: Column<SampleRow>[] = [
  { key: "siswa", header: "Siswa" },
  { key: "tugas", header: "Tugas" },
  { key: "jam", header: "Jam", width: "5rem", render: (r) => `${r.jam} JP` },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <StatusPill statusKey={r.status as Parameters<typeof StatusPill>[0]["statusKey"]} />
    ),
  },
];

// ─── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg lg:text-xl font-semibold text-ink-900 border-b border-line pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ─── Gallery client content ─────────────────────────────────────────────────────
export function GalleryContent() {
  return (
    <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <PageHeader
        title="Galeri Komponen"
        description="Semua komponen design system VokaLink (hanya dev). Bukan halaman produksi."
      />

      {/* ── Button ─────────────────────────────────────────────────────── */}
      <Section title="Button">
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary">Catat hari ini</Button>
          <Button variant="secondary">Simpan</Button>
          <Button variant="outline">Batal</Button>
          <Button variant="ghost">Lihat detail</Button>
          <Button variant="link">Selengkapnya</Button>
          <Button variant="danger">Hapus data</Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary" size="sm">Kecil</Button>
          <Button variant="primary" size="default">Default</Button>
          <Button variant="primary" size="lg">Besar</Button>
          <Button variant="primary" size="mentor">Mentor (56px)</Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary" loading>Memuat…</Button>
          <Button variant="primary" disabled>Nonaktif</Button>
        </div>
      </Section>

      {/* ── StatusPill ─────────────────────────────────────────────────── */}
      <Section title="StatusPill">
        <div className="flex flex-wrap gap-2">
          <StatusPill statusKey="queued" />
          <StatusPill statusKey="synced" />
          <StatusPill statusKey="PENDING_VERIFICATION" />
          <StatusPill statusKey="VERIFIED" />
          <StatusPill statusKey="REVISION_REQUIRED" />
          <StatusPill statusKey="DRIFT_WARNING" />
          <StatusPill statusKey="NOT_STARTED" />
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill variant="info">Menyinkronkan 3 catatan…</StatusPill>
          <StatusPill variant="ok">Semua tersimpan</StatusPill>
          <StatusPill variant="neutral">Kustom</StatusPill>
        </div>
      </Section>

      {/* ── Stat ───────────────────────────────────────────────────────── */}
      <Section title="Stat">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Stat value="792" label="Total jam PKL" />
          <Stat value="87%" label="Rata-rata kehadiran" />
          <Stat value="34" label="Kartu tugas DUDI" />
          <Stat value="3" label="Siswa belum mulai" />
        </div>
      </Section>

      {/* ── ProgressBar ────────────────────────────────────────────────── */}
      <Section title="ProgressBar">
        <div className="space-y-4 max-w-sm">
          <ProgressBar value={72} label="Progres PKL" showLabel />
          <ProgressBar value={40} label="Kehadiran bulan ini" showLabel />
          <ProgressBar value={100} label="Selesai" showLabel />
          <ProgressBar value={0} label="Belum mulai" showLabel />
        </div>
      </Section>

      {/* ── Field ──────────────────────────────────────────────────────── */}
      <Section title="Field (Input, Textarea, Select)">
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
          <Field id="nama" label="Nama siswa" required hint="Sesuai kartu NISN">
            <Input id="nama" placeholder="Rina Kartika" />
          </Field>

          <Field id="tugas" label="Pilih tugas" required>
            <Select id="tugas">
              <option value="">— Pilih —</option>
              <option value="pcb">Merakit PCB</option>
              <option value="qc">Quality check</option>
            </Select>
          </Field>

          <Field
            id="catatan"
            label="Catatan kegiatan"
            error="Catatan wajib diisi sebelum dikirim."
            className="sm:col-span-2"
          >
            <Textarea id="catatan" placeholder="Tulis kegiatan hari ini…" />
          </Field>

          <Field id="readonly" label="Input nonaktif">
            <Input id="readonly" defaultValue="Nilai terkunci" disabled readOnly />
          </Field>
        </div>
      </Section>

      {/* ── Banner ─────────────────────────────────────────────────────── */}
      <Section title="Banner">
        <div className="space-y-3">
          <Banner variant="warn" message="Kamu sedang offline. Catatan aman di HP." />
          <Banner variant="info" message="Mengirim 3 catatan…" />
          <Banner variant="ok" message="Semua catatan sudah tersimpan." />
          <Banner variant="danger" message="Gagal mengirim. Periksa koneksi internet." />
          <Banner
            variant="warn"
            message="Sinkronisasi tertunda."
            action={
              <button className="text-xs font-semibold underline hover:no-underline">
                Coba lagi
              </button>
            }
          />
        </div>
      </Section>

      {/* ── Card ───────────────────────────────────────────────────────── */}
      <Section title="Card">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>Kartu Dasar</CardHeader>
            <CardContent>
              <p className="text-sm text-ink-700">
                Konten kartu tanpa gradien, bayangan, atau efek dekoratif.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>Progres PKL</CardHeader>
            <CardContent className="space-y-3">
              <Stat value="216 JP" label="dari 792 JP" />
              <ProgressBar value={27} showLabel />
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ── DataTable ──────────────────────────────────────────────────── */}
      <Section title="DataTable">
        <DataTable
          columns={columns}
          data={sampleRows}
          getRowKey={(r) => r.id}
          caption="Daftar log kegiatan siswa"
        />
        <DataTable
          columns={columns}
          data={[]}
          getRowKey={(r) => r.id}
          empty={
            <EmptyState
              icon={Inbox}
              title="Belum ada catatan"
              description="Tambahkan log kegiatan pertama kamu."
            />
          }
        />
        <DataTable columns={columns} data={[]} getRowKey={(r) => r.id} loading />
      </Section>

      {/* ── EmptyState ─────────────────────────────────────────────────── */}
      <Section title="EmptyState">
        <div className="grid sm:grid-cols-2 gap-4">
          <EmptyState
            icon={ClipboardList}
            title="Belum ada catatan PKL"
            description="Catat kegiatan pertama kamu hari ini."
            action={<Button variant="primary" size="sm">Catat hari ini</Button>}
          />
          <EmptyState
            icon={Users}
            title="Belum ada siswa terdaftar"
            description="Undang siswa untuk bergabung ke program PKL."
          />
        </div>
      </Section>

      {/* ── Disclosure ─────────────────────────────────────────────────── */}
      <Section title="Disclosure">
        <div className="max-w-prose space-y-0 rounded-xl border border-line bg-white px-4 py-1">
          <Disclosure trigger="Cara menghitung skor penempatan">
            <p className="text-sm text-ink-700">
              Skor penempatan dihitung dari rata-rata tertimbang: 70% kesesuaian kompetensi
              dan 30% kedekatan lokasi. Nilai di atas 70 dianggap sangat cocok.
            </p>
          </Disclosure>
          <Disclosure trigger="Detail teknis segel digital">
            <p className="font-mono text-xs text-ink-500 break-all">
              SHA-256: 3f4a9b2c1e8d7f6a5b4c3d2e1f0a9b8c…
            </p>
          </Disclosure>
        </div>
      </Section>

      {/* ── Skeleton ───────────────────────────────────────────────────── */}
      <Section title="Skeleton">
        <Skeleton variant="card" />
        <div className="flex gap-3 mt-4">
          <Skeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-2/3" />
          </div>
        </div>
        <Skeleton variant="stat-strip" className="mt-4" />
      </Section>

      {/* ── Stepper ────────────────────────────────────────────────────── */}
      <Section title="Stepper">
        <div className="space-y-8 max-w-lg">
          <Stepper
            steps={[
              { label: "Pilih tugas" },
              { label: "Durasi & kemandirian" },
              { label: "Bukti & kirim" },
            ]}
            currentStep={1}
          />
          <Stepper
            steps={[
              { label: "Pilih tugas" },
              { label: "Durasi & kemandirian" },
              { label: "Bukti & kirim" },
            ]}
            currentStep={2}
          />
          <Stepper
            steps={[
              { label: "Pilih tugas" },
              { label: "Durasi & kemandirian" },
              { label: "Bukti & kirim" },
            ]}
            currentStep={3}
          />
        </div>
      </Section>

      {/* ── PageHeader ─────────────────────────────────────────────────── */}
      <Section title="PageHeader">
        <div className="space-y-6">
          <PageHeader
            title="Dashboard Sekolah"
            description="Pantau progres PKL seluruh siswa."
            action={<Button variant="primary">Ekspor laporan</Button>}
          />
          <PageHeader
            title="Riwayat Catatan"
            backSlot={
              <a className="text-xs font-medium text-safety-700 hover:underline flex items-center gap-1" href="#">
                ← Beranda
              </a>
            }
          />
        </div>
      </Section>
    </div>
  );
}
