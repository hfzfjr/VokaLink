/**
 * Skeleton — komponen loading placeholder.
 *
 * Varian:
 * - "text"      → baris teks (default, tinggi ~1em)
 * - "title"     → judul besar (~1.5em)
 * - "rect"      → kotak persegi/custom (gunakan prop w & h)
 * - "rounded"   → persegi panjang dengan rounded-xl
 * - "circle"    → bulat (avatar / ikon)
 * - "card"      → kartu penuh dengan padding internal
 * - "button"    → placeholder tombol
 */

const BASE = "animate-pulse bg-slate-200";

// ─────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────

/** Baris teks pendek/penuh */
export function SkeletonText({
  width = "w-full",
  className = "",
}: {
  width?: string;
  className?: string;
}) {
  return (
    <div className={`${BASE} h-4 rounded-md ${width} ${className}`} />
  );
}

/** Judul / heading besar */
export function SkeletonTitle({
  width = "w-3/5",
  className = "",
}: {
  width?: string;
  className?: string;
}) {
  return (
    <div className={`${BASE} h-6 rounded-md ${width} ${className}`} />
  );
}

/** Kotak persegi panjang dengan rounded-xl — cocok untuk gambar / banner */
export function SkeletonRounded({
  height = "h-40",
  width = "w-full",
  className = "",
}: {
  height?: string;
  width?: string;
  className?: string;
}) {
  return (
    <div className={`${BASE} rounded-2xl ${height} ${width} ${className}`} />
  );
}

/** Kotak murni (gunakan className untuk ukuran) */
export function SkeletonRect({
  className = "",
}: {
  className?: string;
}) {
  return <div className={`${BASE} rounded-md ${className}`} />;
}

/** Lingkaran — untuk avatar atau ikon */
export function SkeletonCircle({
  size = "w-10 h-10",
  className = "",
}: {
  size?: string;
  className?: string;
}) {
  return (
    <div className={`${BASE} rounded-full ${size} ${className}`} />
  );
}

/** Placeholder tombol */
export function SkeletonButton({
  width = "w-28",
  className = "",
}: {
  width?: string;
  className?: string;
}) {
  return (
    <div className={`${BASE} h-10 rounded-xl ${width} ${className}`} />
  );
}

// ─────────────────────────────────────────────
// Preset Komposit
// ─────────────────────────────────────────────

/** Kartu KPI (StatCard) — icon + label + nilai */
export function SkeletonStatCard({ className = "" }: { className?: string }) {
  return (
    <div className={`p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 ${className}`}>
      <SkeletonCircle size="w-11 h-11" className="rounded-xl" />
      <div className="flex-1 space-y-2">
        <SkeletonText width="w-20" />
        <SkeletonTitle width="w-10" />
      </div>
    </div>
  );
}

/** Baris tabel atau list item — avatar + dua baris teks */
export function SkeletonListRow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 py-3 ${className}`}>
      <SkeletonCircle size="w-9 h-9" />
      <div className="flex-1 space-y-1.5">
        <SkeletonText width="w-2/5" />
        <SkeletonText width="w-1/4" />
      </div>
    </div>
  );
}

/** Kartu konten umum — ikon + judul + deskripsi + tombol */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`p-5 rounded-2xl bg-white border border-slate-200 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <SkeletonCircle size="w-10 h-10" className="rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonTitle width="w-2/3" />
          <SkeletonText width="w-1/2" />
        </div>
      </div>
      <SkeletonText />
      <SkeletonText width="w-4/5" />
      <SkeletonButton />
    </div>
  );
}

/** Grid KPI default dashboard — 4 StatCard */
export function SkeletonStatGrid({
  cols = 4,
  className = "",
}: {
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const colClass =
    cols === 2
      ? "grid-cols-2"
      : cols === 3
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-2 sm:grid-cols-4";
  return (
    <div className={`grid ${colClass} gap-4 ${className}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Default export: Skeleton generik fleksibel
// ─────────────────────────────────────────────

type SkeletonVariant =
  | "text"
  | "title"
  | "rounded"
  | "rect"
  | "circle"
  | "button"
  | "stat-card"
  | "list-row"
  | "card"
  | "stat-grid";

interface SkeletonProps {
  variant?: SkeletonVariant;
  /** Lebar (Tailwind class). Berlaku untuk: text, title, button */
  width?: string;
  /** Tinggi (Tailwind class). Berlaku untuk: rounded, rect */
  height?: string;
  /** Ukuran (Tailwind class w-x h-x). Berlaku untuk: circle */
  size?: string;
  /** Jumlah kolom. Berlaku untuk: stat-grid */
  cols?: 2 | 3 | 4;
  className?: string;
}

/**
 * Komponen Skeleton all-in-one.
 *
 * @example
 * <Skeleton variant="text" />
 * <Skeleton variant="stat-card" />
 * <Skeleton variant="stat-grid" cols={4} />
 * <Skeleton variant="circle" size="w-12 h-12" />
 */
export default function Skeleton({
  variant = "text",
  width,
  height,
  size,
  cols,
  className = "",
}: SkeletonProps) {
  switch (variant) {
    case "title":
      return <SkeletonTitle width={width} className={className} />;
    case "rounded":
      return <SkeletonRounded height={height} width={width} className={className} />;
    case "rect":
      return <SkeletonRect className={className} />;
    case "circle":
      return <SkeletonCircle size={size} className={className} />;
    case "button":
      return <SkeletonButton width={width} className={className} />;
    case "stat-card":
      return <SkeletonStatCard className={className} />;
    case "list-row":
      return <SkeletonListRow className={className} />;
    case "card":
      return <SkeletonCard className={className} />;
    case "stat-grid":
      return <SkeletonStatGrid cols={cols} className={className} />;
    default:
      return <SkeletonText width={width} className={className} />;
  }
}
