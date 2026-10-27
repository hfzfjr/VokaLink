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
      className={`border-b border-slate-100 bg-white/90 backdrop-blur-md transition-all duration-200 ${
        isSticky ? "sticky top-0 z-30 shadow-2xs" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
        {/* Kiri: Logo + Subtitle */}
        <div className="flex items-center gap-3">
          <VokaLogo size="md" />
          {subtitle && (
            <>
              <div className="h-5 w-px bg-slate-200 hidden sm:block" />
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full hidden sm:inline">
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
  const base = "text-xs font-bold px-4 py-2 rounded-full transition duration-150 inline-flex items-center justify-center";
  const styles =
    variant === "primary"
      ? `${base} bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20`
      : `${base} text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50`;

  return (
    <Link href={href} className={styles}>
      {label}
    </Link>
  );
}
