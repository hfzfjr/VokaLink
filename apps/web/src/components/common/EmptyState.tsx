interface EmptyStateProps {
  /** Teks utama */
  title: string;
  /** Teks deskripsi / sub-judul */
  description?: string;
  /** Tombol aksi opsional */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Komponen empty state generik — tampil ketika data kosong atau terjadi error.
 * Gunakan juga untuk kondisi "offline" atau "unauthorized" dengan action button.
 */
export default function EmptyState({
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}
    >
      <p className="text-base font-bold text-slate-700">{title}</p>
      {description && (
        <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
