interface DemoBadgeProps {
  label?: string;
  className?: string;
}

/**
 * Badge kecil untuk menandai data Demo Sandbox / UINIC 8.0.
 * Tampilkan di samping nama sekolah atau di header halaman.
 */
export default function DemoBadge({
  label = "Demo Sandbox (UINIC 8.0)",
  className = "",
}: DemoBadgeProps) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 ${className}`}
    >
      {label}
    </span>
  );
}
