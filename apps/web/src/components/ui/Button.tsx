import { type LucideIcon } from "lucide-react";

/**
 * Button — komponen tombol reusable.
 *
 * Variant:
 * - "primary"   → biru solid (aksi utama)
 * - "secondary" → abu-abu gelap (aksi sekunder)
 * - "outline"   → border abu-abu (aksi tersier)
 * - "ghost"     → tanpa border, hover saja
 * - "danger"    → merah (hapus / destruktif)
 * - "success"   → hijau (konfirmasi / sukses)
 *
 * Size:
 * - "sm"  → teks xs, padding kecil
 * - "md"  → teks sm, padding sedang (default)
 * - "lg"  → teks base, padding besar
 */

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ikon Lucide di sisi kiri label */
  iconLeft?: LucideIcon;
  /** Ikon Lucide di sisi kanan label */
  iconRight?: LucideIcon;
  /** Tampilkan loading spinner dan nonaktifkan tombol */
  loading?: boolean;
  /** Teks label loading. Default: "Memproses..." */
  loadingText?: string;
  /** Render sebagai full-width block */
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus-visible:ring-blue-500",
  secondary:
    "bg-slate-900 hover:bg-slate-800 text-white shadow-xs focus-visible:ring-slate-700",
  outline:
    "border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 focus-visible:ring-slate-300",
  ghost:
    "text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-300",
  danger:
    "bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus-visible:ring-rose-500",
  success:
    "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus-visible:ring-emerald-500",
};

const sizeStyles: Record<ButtonSize, { btn: string; icon: string }> = {
  sm: { btn: "text-xs px-3 py-1.5 gap-1.5", icon: "w-3.5 h-3.5" },
  md: { btn: "text-sm px-4 py-2.5 gap-2", icon: "w-4 h-4" },
  lg: { btn: "text-base px-5 py-3 gap-2.5", icon: "w-5 h-5" },
};

/** Spinner SVG kecil untuk state loading */
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function Button({
  variant = "primary",
  size = "md",
  iconLeft: IconLeft,
  iconRight: IconRight,
  loading = false,
  loadingText = "Memproses...",
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const { btn, icon } = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center rounded-xl font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        variantStyles[variant],
        btn,
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-50 cursor-not-allowed" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <>
          <Spinner className={icon} />
          {loadingText}
        </>
      ) : (
        <>
          {IconLeft && <IconLeft className={icon} />}
          {children}
          {IconRight && <IconRight className={icon} />}
        </>
      )}
    </button>
  );
}
