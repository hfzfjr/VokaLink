import Link from "next/link";

interface VokaLogoProps {
  /** Tampilkan teks "VokaLink" di samping ikon. Default: true */
  showText?: boolean;
  /** Ukuran kotak ikon. Default: "md" */
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: { box: "size-7 rounded-md text-sm", text: "text-sm" },
  md: { box: "size-8 rounded-lg text-base", text: "text-base" },
  lg: { box: "size-10 rounded-xl text-lg", text: "text-lg" },
};

export default function VokaLogo({
  showText = true,
  size = "md",
  href = "/",
  className = "",
}: VokaLogoProps) {
  const { box, text } = sizeMap[size];

  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`${box} bg-ink-900 border border-ink-700 flex items-center justify-center text-safety-500 font-extrabold shrink-0 tracking-tighter`}
      >
        V
      </span>
      {showText && (
        <span className={`font-extrabold text-ink-900 tracking-tight ${text}`}>
          VokaLink
        </span>
      )}
    </span>
  );

  if (!href) return inner;
  return <Link href={href}>{inner}</Link>;
}
