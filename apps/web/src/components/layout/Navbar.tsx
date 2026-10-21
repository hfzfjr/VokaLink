import Link from "next/link";
import VokaLogo from "@/components/common/VokaLogo";

interface NavbarProps {
  /** Teks sub-label di samping logo (misal: "Panel Pengelola SMK") */
  subtitle?: string;
  /** Konten sisi kanan navbar */
  rightSlot?: React.ReactNode;
  /** Variant tampilan. "sticky" untuk halaman dalam (dashboard, dll) */
  variant?: "default" | "sticky";
}

/**
 * Navbar utama VokaLink.
 * - variant "default" → border bawah tipis, background putih.
 * - variant "sticky" → sticky top-0 dengan shadow, untuk halaman dalam.
 */
export default function Navbar({
  subtitle,
  rightSlot,
  variant = "default",
}: NavbarProps) {
  const isSticky = variant === "sticky";

  return (
    <header
      className={`border-b border-slate-200 bg-white ${
        isSticky ? "sticky top-0 z-30 shadow-xs" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Kiri: Logo + Subtitle */}
        <div className="flex items-center gap-3">
          <VokaLogo size="md" />
          {subtitle && (
            <>
              <div className="h-5 w-px bg-slate-200 hidden sm:block" />
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md hidden sm:inline">
                {subtitle}
              </span>
            </>
          )}
        </div>

        {/* Kanan: slot bebas */}
        {rightSlot && (
          <div className="flex items-center gap-2">{rightSlot}</div>
        )}
      </div>
    </header>
  );
}

/** Helper: CTA button kecil untuk rightSlot Navbar */
export function NavbarButton({
  href,
  label,
  variant = "outline",
}: {
  href: string;
  label: string;
  variant?: "primary" | "outline";
}) {
  const base = "text-xs font-semibold px-3 py-1.5 rounded-lg transition";
  const styles =
    variant === "primary"
      ? `${base} bg-blue-600 hover:bg-blue-700 text-white shadow-xs`
      : `${base} text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50`;

  return (
    <Link href={href} className={styles}>
      {label}
    </Link>
  );
}
